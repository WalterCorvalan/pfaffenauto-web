import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { chatJsonV2 } from "@/lib/ai/indexV2";
import { buildSystemPromptV2, menuBienvenidaV2, SEPARADOR_MENSAJES, type ResultadoStockV2, type SucursalInfo } from "@/lib/ai/promptsV2";

// Agente de ventas panel-v2 — lo usan tanto WhatsApp como Rodi (comparten el
// mismo prompt base, cada uno con su propio historial). Fork de
// lib/ai/agente.ts adaptado al schema de la base nova. Solo razona con el
// texto — nunca escribe la conversación, eso lo hace el webhook que lo llama.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export const AgentReplySchemaV2 = z.object({
  reply: z.string(),
  handoff: z.boolean(),
  resumen_handoff: z.string().nullable(),
  intencion: z.enum(["COMPRA", "VENTA", "CONSIGNACION", "COMPRA_CON_PERMUTA", "HABLAR_CON_ASESOR", "OTRA_CONSULTA"]).nullable(),
  calificacion: z.enum(["caliente", "tibio", "frio"]).nullable(),
  datos_detectados: z.object({
    timing: z.string().nullable(),
    forma_pago: z.string().nullable(),
    tiene_permuta: z.boolean().nullable(),
    nombre: z.string().nullable(),
    email: z.string().nullable(),
    telefono: z.string().nullable(),
    cuil: z.string().nullable().optional(),
    precio_pedido: z.string().nullable().optional(),
    zona: z.enum(["casa-central", "don-torcuato"]).nullable().optional(),
  }),
  vehiculo_mencionado: z.object({
    marca: z.string().nullable(),
    modelo: z.string().nullable(),
    categoria: z.enum(["Auto", "Pickup/Camioneta", "SUV", "Utilitario"]).nullable(),
    puertas: z.number().nullable().optional(),
  }).nullable(),
  presupuesto_mencionado: z.object({
    monto: z.number().positive(),
    moneda: z.enum(["USD", "ARS"]),
  }).nullable(),
  pedir_stock_general: z.boolean(),
  pedir_fotos: z.boolean().optional(),
  pedido_stock: z.object({
    marca: z.string().nullable(),
    modelo: z.string().nullable(),
    presupuesto_max: z.number().nullable(),
    moneda: z.enum(["USD", "ARS"]).nullable(),
    puertas: z.number().nullable(),
  }).nullable().optional(),
});

export type AgentReplyV2 = z.infer<typeof AgentReplySchemaV2>;
export type HistorialMensaje = { role: "user" | "assistant"; content: string };

// Tope de mensajes por conversación — evita charlas eternas (costo de API y
// vendedores esperando el handoff) cuando hay muchas consultas a la vez.
// SUAVE: a partir de este mensaje del cliente, el prompt empieza a
// sugerirle cerrar rápido con lo que necesita. DURO: a partir de acá se
// corta directo, sin llamar a la IA — se deriva con un mensaje fijo.
const LIMITE_MENSAJES_SUAVE = 25;
const LIMITE_MENSAJES_DURO = 70;

function respuestaLimiteAlcanzado(): AgentReplyV2 {
  return {
    reply: "Veo que ya llevamos bastante conversación — para no hacerte esperar más, en este momento te comunico con un asesor que sigue en persona con todo esto.",
    handoff: true,
    resumen_handoff: "Charla larga (tope de mensajes) — revisar historial del chat para el contexto completo.",
    pedir_stock_general: false,
    intencion: null,
    calificacion: null,
    datos_detectados: { timing: null, forma_pago: null, tiene_permuta: null, nombre: null, email: null, telefono: null },
    vehiculo_mencionado: null,
    presupuesto_mencionado: null,
  };
}

// El prompt separa "reply" en varias burbujas con SEPARADOR_MENSAJES cuando
// muestra opciones de stock (lista + pregunta corta abajo, como mandaría una
// persona) — los canales (WhatsApp, Rodi) usan esto para mandar cada parte
// como un mensaje separado en vez de un solo bloque de texto largo.
export function dividirRespuestaEnMensajes(reply: string): string[] {
  return reply.split(SEPARADOR_MENSAJES).map((s) => s.trim()).filter(Boolean);
}

// Devuelve además el total real de coincidencias (sin el limit) — el prompt
// necesita ese número para no inventar un "en total tengo N" a partir de
// cuántas filas le tocó ver, que es solo el tope de la query, no el total
// real de stock (bug detectado: dijo "en total tengo 6 pickups" habiendo 11).
async function ejecutarBusquedaStock(
  marca: string | null,
  modelo: string | null,
  categoria?: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null,
  puertas?: number | null
): Promise<{ resultados: ResultadoStockV2[]; total: number }> {
  const aplicarFiltros = (q: any) => {
    if (marca) q = q.ilike("marca", `%${marca}%`);
    if (modelo) q = q.ilike("modelo", `%${modelo}%`);
    // Categoría (Auto/Camioneta/SUV/Moto/Otro) — el cliente puede acotar por
    // tipo de vehículo sin dar marca ("busco auto, no camioneta"). Es un
    // filtro duro: una vez que lo pidió, ninguna alternativa de otra
    // categoría se le vuelve a mostrar en esta búsqueda.
    if (categoria) q = q.eq("categoria", categoria);
    if (puertas) q = q.eq("puertas", puertas);
    // Sin conversor de dólar propio en v2 todavía — filtramos solo por la
    // moneda que mencionó el cliente, sin intentar convertir la otra.
    if (presupuesto) q = q.eq("moneda_venta", presupuesto.moneda).lte("precio_venta", presupuesto.monto);
    return q;
  };

  const query = aplicarFiltros(
    supabase
      .from("vehiculos")
      .select("id, marca, modelo, anio, precio_venta, moneda_venta, precio_publicado_ars, precio_publicado_usd, patente, color, km, version, transmision, combustible, categoria, puertas, fotos, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
      .in("estado", ["disponible", "reservado"])
  ).limit(modelo ? 3 : 6);

  const queryTotal = aplicarFiltros(
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).in("estado", ["disponible", "reservado"])
  );

  const [{ data }, { count }] = await Promise.all([query, queryTotal]);
  // El bot tiene que cotizar el mismo precio que el cliente ya vio en la
  // web (precio_publicado_ars/usd), no el precio_venta interno — son campos
  // distintos y pueden diferir, mostrar dos precios distintos para el mismo
  // auto entre el sitio y el chat confunde al cliente.
  const resultados = (data ?? []).map((v: any) => {
    const precioVenta = v.precio_publicado_ars ?? v.precio_publicado_usd ?? v.precio_venta;
    const monedaVenta = v.precio_publicado_ars ? "ARS" : v.precio_publicado_usd ? "USD" : v.moneda_venta;
    return { ...v, precio_venta: precioVenta, moneda_venta: monedaVenta, sucursal: v.sucursales?.nombre ?? null };
  }) as ResultadoStockV2[];
  return { resultados, total: count ?? resultados.length };
}

// Red de seguridad: el modelo (Haiku) a veces no completa "vehiculo_mencionado"
// cuando la mención viene en frase indirecta ("buscaba un Toyota", "no tienen
// Hilux?", pasado en vez de presente) aunque la regla del prompt lo pida
// explícito -- en vez de perder el mensaje, se busca por texto plano la
// marca/modelo real (de stock actual) que aparezca en el último mensaje del
// cliente. Solo se usa cuando el modelo no encontró nada por su cuenta.
async function extraerVehiculoFallback(ultimoMensaje: string): Promise<{ marca: string | null; modelo: string | null } | null> {
  const texto = ultimoMensaje.toLowerCase();
  const { data } = await supabase.from("vehiculos").select("marca, modelo").in("estado", ["disponible", "reservado"]);
  if (!data) return null;

  const marcas = Array.from(new Set(data.map((v) => v.marca).filter(Boolean)));
  const modelos = Array.from(new Set(data.map((v) => v.modelo).filter(Boolean)));

  // Modelo primero (más específico) -- si el cliente nombra el modelo, la
  // marca no hace falta para buscar bien. Se compara solo la PRIMERA palabra
  // del modelo real ("RANGER" de "RANGER XL 3.0 TDI S/C 4X2 PLUS"), no el
  // nombre completo -- un mensaje corto tipo "la Ranger" nunca iba a
  // contener la ficha técnica entera, así nunca matcheaba nada.
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const modeloMatch = modelos.find((m) => {
    const primeraPalabra = m.split(/\s+/)[0];
    if (primeraPalabra.length < 3) return false;
    return new RegExp(`\\b${escapeRegex(primeraPalabra.toLowerCase())}\\b`).test(texto);
  });
  const marcaMatch = marcas.find((m) => texto.includes(m.toLowerCase()));

  if (!modeloMatch && !marcaMatch) return null;
  return { marca: marcaMatch ?? null, modelo: modeloMatch ?? null };
}

// Buscar exacto (marca+modelo+categoría) primero; si no hay nada, no le
// devolvemos al cliente una lista vacía sin salida — probamos combinaciones
// cada vez menos específicas hasta encontrar stock real. La categoría es la
// señal MÁS débil de las tres: si el cliente pidió "Ford" pensando en un
// auto pero la Ford que hay es una pickup, mostrar esa pickup es mejor que
// decir "no tenemos Ford" — por eso se relaja antes que marca/modelo.
export async function buscarStockRealV2(
  marca: string | null,
  modelo: string | null,
  categoria?: string | null,
  presupuesto?: { monto: number; moneda: "USD" | "ARS" } | null,
  puertas?: number | null
): Promise<{ resultados: ResultadoStockV2[]; esAlternativa: boolean; total: number }> {
  const cat = categoria ?? null;
  const intentos: [string | null, string | null, string | null][] = [
    [marca, modelo, cat],
    [marca, modelo, null],
    [marca, null, cat],
    [marca, null, null],
    [null, null, cat],
    [null, null, null],
  ];

  // Puertas es el filtro más débil de todos -- hoy no todo el stock tiene
  // ese dato cargado, así que se prueba primero CON el filtro y, si no
  // aparece nada en ninguna combinación, se repite toda la secuencia SIN
  // puertas antes de rendirse (evita decir "no hay" solo porque falta cargar
  // ese campo en un auto que sí está disponible).
  for (const puertasIntento of puertas ? [puertas, null] : [null]) {
    const probados = new Set<string>();
    for (let i = 0; i < intentos.length; i++) {
      const [m, mo, c] = intentos[i];
      const clave = `${m}|${mo}|${c}`;
      if (probados.has(clave)) continue;
      probados.add(clave);
      const { resultados, total } = await ejecutarBusquedaStock(m, mo, c, presupuesto, puertasIntento);
      if (resultados.length > 0) return { resultados, esAlternativa: i > 0 || puertasIntento === null, total };
    }
  }
  return { resultados: [], esAlternativa: true, total: 0 };
}

// Red de seguridad anti-alucinación: el prompt ya prohíbe inventar stock,
// pero un modelo chico (Haiku) a veces igual fabrica un auto "más lindo" en
// vez de mostrar los resultados reales que se le pasaron — visto en pruebas
// reales (pidió "Chevrolet Tracker" sin stock, el modelo inventó dos
// unidades con precio y año de la nada). No confiamos en el prompt solo:
// si la respuesta menciona un precio/año/km de 4+ dígitos que no aparece en
// los resultados reales, la descartamos y mostramos el stock real armado
// por código en su lugar.
function extraerNumerosRelevantes(texto: string): number[] {
  return Array.from(texto.matchAll(/\d[\d.,]*\d|\d/g))
    .map((m) => Number(m[0].replace(/[.,]/g, "")))
    .filter((n) => n >= 1900);
}

// Los números "reales" no son solo precio/año del stock: si la respuesta
// también menciona una dirección de sucursal (ej: "el Vento está en Av. del
// Libertador 2067"), esos números vienen del prompt (dato real), no son una
// alucinación — sin esta lista, "2067" no matchea contra ningún precio/año
// y toda la respuesta se descarta por error, incluida la dirección real.
function respuestaMencionaStockInventado(reply: string, resultados: ResultadoStockV2[], sucursales: SucursalInfo[] = []): boolean {
  const numerosReply = extraerNumerosRelevantes(reply);
  if (numerosReply.length === 0) return false;

  const numerosReales = new Set<number>();
  for (const v of resultados) {
    numerosReales.add(v.precio_venta);
    numerosReales.add(v.anio);
    if (v.km != null) numerosReales.add(v.km);
  }
  for (const s of sucursales) {
    if (s.direccion) extraerNumerosRelevantes(s.direccion).forEach((n) => numerosReales.add(n));
    if (s.telefono_encargado) extraerNumerosRelevantes(s.telefono_encargado).forEach((n) => numerosReales.add(n));
  }

  return numerosReply.some((n) => !numerosReales.has(n));
}

function respuestaSeguraConStockReal(resultados: ResultadoStockV2[], esAlternativa: boolean): string {
  if (resultados.length === 0) {
    return "Por ahora no tengo esa unidad en stock. ¿Querés que te avise apenas entre una, o te muestro otras opciones que sí tengo?";
  }
  const lista = resultados.slice(0, 3)
    .map((v) => `🚗 ${v.marca} ${v.modelo} ${v.anio} — 💰 ${v.moneda_venta} ${v.precio_venta.toLocaleString("es-AR")}`)
    .join("\n");
  const intro = esAlternativa ? "Ese modelo puntual no lo tengo ahora, pero estas son opciones que sí tengo disponibles:" : "Estas son las opciones disponibles:";
  const cierre = resultados.length === 1 ? "Contame si te interesa y seguimos con los detalles." : "Si te interesa alguna, seguimos con los detalles.";
  return `${intro}\n\n${lista}\n\n${cierre}`;
}

// El prompt prohíbe estos cierres genéricos y abiertos (regla en
// promptsV2.ts, sección de listado de stock), pero un modelo chico los
// repite igual a veces — se detecta y se corta la oración completa que los
// contiene, dejando el resto de la respuesta intacto.
const FRASES_CIERRE_PROHIBIDAS = [
  /¿?alguna te interesa,?\s*o buscás un año o versión en particular\??/i,
  /¿?alguna (de estas )?te (late|gusta),?\s*o preferís seguir viendo más opciones\??/i,
  // Catch-all: cualquier variante de "¿te late/interesa/gusta ESTO, o preferís/querés VER/SEGUIR/EXPLORAR otra cosa?"
  // -- el modelo reformula la frase prohibida en vez de repetirla igual, así que se banea la estructura completa, no el texto exacto.
  /¿?te (late|interesa|gusta)\b[^?]*\b(o\s+(preferís|querés))\b[^?]*\?/i,
  /¿?te interesa conocer más[^?]*\?/i,
  /¿?(preferís|querés) explorar otras marcas\??/i,
  /¿?hay algo más que quieras (saber|preguntar)[^?]*\?/i,
];

function sacarCierreGenericoProhibido(reply: string): string {
  let limpio = reply;
  for (const patron of FRASES_CIERRE_PROHIBIDAS) {
    limpio = limpio.replace(patron, "").trim();
  }
  return limpio;
}

async function fetchSucursalesInfo(): Promise<SucursalInfo[]> {
  const { data } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url, encargado_nombre").order("nombre");
  return (data ?? []) as SucursalInfo[];
}

export async function generarRespuestaAgenteV2(historial: HistorialMensaje[], canal: string = "whatsapp-v2", nombreBot?: string, vehiculoEnFocoId?: string | null): Promise<
  | { ok: true; data: AgentReplyV2; fotosParaEnviar: string[]; vehiculoFocoId: string | null; pedidoStock: AgentReplyV2["pedido_stock"] }
  | { ok: false; error: string }
> {
  const mensajesCliente = historial.filter((h) => h.role === "user").length;
  if (mensajesCliente > LIMITE_MENSAJES_DURO) {
    return { ok: true, data: respuestaLimiteAlcanzado(), fotosParaEnviar: [], vehiculoFocoId: null, pedidoStock: null };
  }
  const sugerirCierre = mensajesCliente >= LIMITE_MENSAJES_SUAVE;

  const sucursales = await fetchSucursalesInfo();

  const result = await chatJsonV2(AgentReplySchemaV2, [
    { role: "system", content: buildSystemPromptV2(undefined, undefined, nombreBot, undefined, sucursales, sugerirCierre) },
    ...historial,
  ], { origen: canal });

  if (!result.ok) return { ok: false, error: result.error };

  let respuesta = result.data;
  let resultadosBusqueda: ResultadoStockV2[] = [];

  // El vehículo que el cliente menciona cuando quiere VENDER o CONSIGNAR el
  // suyo NO es una búsqueda de stock para comprar — es el auto que él
  // ofrece. Sin este filtro, "quiero vender mi Corolla 2019" disparaba una
  // búsqueda de Corollas en stock y el bot terminaba mostrándole autos para
  // comprar en respuesta a que quería vender el propio.
  const esIntencionDeCompra = respuesta.intencion !== "VENTA" && respuesta.intencion !== "CONSIGNACION";

  const noEncontroNadaParaBuscar = esIntencionDeCompra && !respuesta.vehiculo_mencionado?.modelo && !respuesta.vehiculo_mencionado?.marca && !respuesta.vehiculo_mencionado?.categoria && !respuesta.vehiculo_mencionado?.puertas && !respuesta.presupuesto_mencionado && !respuesta.pedir_stock_general;
  if (noEncontroNadaParaBuscar) {
    const ultimoMensajeCliente = [...historial].reverse().find((h) => h.role === "user")?.content;
    const fallback = ultimoMensajeCliente ? await extraerVehiculoFallback(ultimoMensajeCliente) : null;
    if (fallback) {
      respuesta = { ...respuesta, vehiculo_mencionado: { marca: fallback.marca, modelo: fallback.modelo, categoria: respuesta.vehiculo_mencionado?.categoria ?? null } };
    }
  }

  if (esIntencionDeCompra && (respuesta.vehiculo_mencionado?.modelo || respuesta.vehiculo_mencionado?.marca || respuesta.vehiculo_mencionado?.categoria || respuesta.vehiculo_mencionado?.puertas || respuesta.presupuesto_mencionado || respuesta.pedir_stock_general)) {
    const categoriaSolicitada = respuesta.vehiculo_mencionado?.categoria ?? null;
    const { resultados, esAlternativa, total } = await buscarStockRealV2(
      respuesta.vehiculo_mencionado?.marca ?? null,
      respuesta.vehiculo_mencionado?.modelo ?? null,
      categoriaSolicitada,
      respuesta.presupuesto_mencionado,
      respuesta.vehiculo_mencionado?.puertas ?? null
    );
    resultadosBusqueda = resultados;

    const result2 = await chatJsonV2(AgentReplySchemaV2, [
      { role: "system", content: buildSystemPromptV2(undefined, resultados, nombreBot, esAlternativa, sucursales, sugerirCierre, categoriaSolicitada, total) },
      ...historial,
    ], { origen: canal });

    if (result2.ok) {
      const reply = respuestaMencionaStockInventado(result2.data.reply, resultados, sucursales)
        ? respuestaSeguraConStockReal(resultados, esAlternativa)
        : result2.data.reply;
      // La segunda pasada es la que tiene el dato correcto post-reglas
      // (permuta, confirmación, etc.) — si algo lee estos campos más
      // adelante (hoy nada los persiste, pero por las dudas), que refleje
      // la versión final, no la de la primera pasada sin stock inyectado.
      respuesta = {
        ...respuesta,
        reply,
        handoff: result2.data.handoff,
        resumen_handoff: result2.data.resumen_handoff,
        calificacion: result2.data.calificacion,
        vehiculo_mencionado: result2.data.vehiculo_mencionado,
        pedir_stock_general: result2.data.pedir_stock_general,
        pedir_fotos: result2.data.pedir_fotos,
        presupuesto_mencionado: result2.data.presupuesto_mencionado,
        datos_detectados: result2.data.datos_detectados,
        intencion: result2.data.intencion,
        pedido_stock: result2.data.pedido_stock,
      };
    } else {
      console.error("[agenteV2] error en 2da pasada (stock):", result2.error);
    }
  }

  // El prompt prohíbe explícitamente estos cierres genéricos y abiertos
  // ("¿alguna te interesa, o buscás un año o versión en particular?", "¿te
  // late...?"), pero un modelo chico (Haiku) los repite igual de vez en
  // cuando — se cortan del final de la respuesta como red de seguridad, en
  // vez de confiar solo en la instrucción.
  respuesta = { ...respuesta, reply: sacarCierreGenericoProhibido(respuesta.reply) };

  // El modelo a veces devuelve el menú de bienvenida parafraseado (mismo
  // contenido, texto distinto) — si detectamos que ESTO es el menú
  // (numerado 1-4, arranca con saludo), pisamos con el texto exacto en vez
  // de confiar en que lo haya copiado bien.
  if (/^\s*¡?hola/i.test(respuesta.reply) && /comprar/i.test(respuesta.reply) && /vender/i.test(respuesta.reply) && /consignar/i.test(respuesta.reply) && /permutar/i.test(respuesta.reply)) {
    respuesta = { ...respuesta, reply: menuBienvenidaV2(nombreBot) };
  }

  // Auto en foco de la charla: si esta búsqueda trajo un solo resultado
  // claro, ese pasa a ser el foco (se persiste en la conversación) — así un
  // pedido de fotos SIN volver a nombrar marca/modelo ("pásame fotos") sigue
  // sabiendo de qué auto se trata.
  let vehiculoFocoId: string | null = resultadosBusqueda.length === 1 ? resultadosBusqueda[0].id : null;

  let fotosParaEnviar: string[] = [];
  if (respuesta.pedir_fotos) {
    if (resultadosBusqueda.length >= 1) {
      // Si esta misma búsqueda trajo varios, preferimos el que matchea el
      // nombre que el cliente dijo; si no hay match claro, el primero.
      const nombreBuscado = `${respuesta.vehiculo_mencionado?.marca ?? ""} ${respuesta.vehiculo_mencionado?.modelo ?? ""}`.trim().toLowerCase();
      const match = resultadosBusqueda.find((v) => nombreBuscado && `${v.marca} ${v.modelo}`.toLowerCase().includes(nombreBuscado)) ?? resultadosBusqueda[0];
      fotosParaEnviar = (match.fotos ?? []).slice(0, 3);
      vehiculoFocoId = match.id;
    } else if (vehiculoEnFocoId) {
      // Pidió fotos sin repetir marca/modelo — usamos el auto que ya
      // estaba en foco de charlas anteriores.
      const { data: vehiculoFoco } = await supabase.from("vehiculos").select("id, fotos").eq("id", vehiculoEnFocoId).maybeSingle();
      if (vehiculoFoco) {
        fotosParaEnviar = (vehiculoFoco.fotos ?? []).slice(0, 3);
        vehiculoFocoId = vehiculoFoco.id;
      }
    }
  }

  // Link al cotizador con el auto de compra ya en foco: si hay permuta en
  // juego y ya sabemos qué auto quiere comprar, el link debe pre-cargar esa
  // referencia (?permuta=<id>, mismo parámetro que usa el botón "¿tenés un
  // usado para entregar?" del detalle de auto) -- sin esto el cliente entra
  // al cotizador a ciegas aunque el bot ya sabía perfectamente qué auto buscaba.
  if (vehiculoFocoId && respuesta.datos_detectados?.tiene_permuta && respuesta.reply.includes("/cotizador")) {
    respuesta = { ...respuesta, reply: respuesta.reply.replace(/\/cotizador(?!\?)/g, `/cotizador?permuta=${vehiculoFocoId}`) };
  }

  return { ok: true, data: respuesta, fotosParaEnviar, vehiculoFocoId, pedidoStock: respuesta.pedido_stock ?? null };
}

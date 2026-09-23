// Panel v2 — prompt del agente compartido por WhatsApp y Rodi (chat del
// sitio). Fork de lib/ai/prompts.ts adaptado al schema de vehiculos de la
// base nueva (precio_venta + moneda_venta únicos, sin slug/sucursal
// todavía). El bot de WhatsApp no usa nombre propio; a Rodi se le pasa
// nombreBot="Rodi" para que se presente así.
//
// buildSystemPromptV2 se armó en un solo bloque de texto gigante durante mucho
// tiempo -- se partió en piezas por tema bajo ./promptV2/ (mismo criterio que ya
// usaban formatearResultadosStock/formatearSucursales acá abajo) para que sea
// más fácil ubicar y tocar una regla puntual sin escrollear 270 líneas. Cada
// pieza mantiene el texto exacto que tenía acá -- este split no cambia una sola
// palabra del prompt, solo la organización del archivo.
import { bloqueEstiloYTono } from "./promptV2/estiloYTono";
import { INTENCIONES_LINEA } from "./promptV2/intenciones";
import { bloqueSitioWeb } from "./promptV2/sitioWeb";
import { bloqueCierreSugerido } from "./promptV2/cierreSugerido";
import { REGLAS_STOCK_Y_TEMAS } from "./promptV2/reglasStock";
import { bloqueReglasGenerales } from "./promptV2/reglasGenerales";
import { SCHEMA_SALIDA } from "./promptV2/schemaSalida";

export type ResultadoStockV2 = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio_venta: number;
  moneda_venta: "USD" | "ARS";
  patente: string | null;
  color: string | null;
  km: number | null;
  version: string | null;
  transmision: string | null;
  combustible: string | null;
  sucursal: string | null;
  categoria: string | null;
  puertas: number | null;
  fotos: string[];
};

export type PresupuestoMencionado = { monto: number; moneda: "USD" | "ARS" } | null;

// Se mantiene por compatibilidad con dividirRespuestaEnMensajes (agenteV2.ts)
// pero el prompt ya NO instruye a partir la respuesta en dos burbujas — todo
// va en un solo mensaje prolijo. Si algún día una respuesta trae el
// separador igual se va a partir bien, pero no debería pasar.
export const SEPARADOR_MENSAJES = "|||";

function formatearResultadosStock(resultados: ResultadoStockV2[], esAlternativa: boolean, categoriaSolicitada?: string | null, totalReal?: number): string {
  if (resultados.length === 0) {
    return `\nBúsqueda en stock: NO hay ninguna unidad disponible ahora mismo, ni siquiera de la misma marca. Decíselo con honestidad al cliente — no inventes alternativas — y preguntale si le interesa ver otras marcas.`;
  }
  // La lista de abajo puede venir recortada (tope de la búsqueda) — el total
  // real de coincidencias es este número, no "cuántas filas ves en la
  // lista". Sin esto el modelo asumía que la cantidad mostrada ERA el total
  // y dijo "en total tengo 6 pickups" habiendo 11 en stock real.
  const hayMasQueLasMostradas = totalReal != null && totalReal > resultados.length;
  const avisoTotal = totalReal != null
    ? hayMasQueLasMostradas
      ? `\nTotal real de coincidencias en stock: ${totalReal} (acá abajo se te muestran solo ${resultados.length}). Si el cliente pregunta "son todas?" o "cuántas tienen", la respuesta correcta es ${totalReal}, no ${resultados.length} — y ofrecele ver el resto en el catálogo: https://www.pfaffencars.com/catalogo. NUNCA digas "en total tengo ${resultados.length}" — sería falso.`
      : `\nTotal real de coincidencias en stock: ${totalReal} (son todas, ya te las mostraron todas acá abajo).`
    : "";
  const lista = resultados
    .map((v) => {
      const extra = [v.categoria, v.version, v.color, v.km != null ? `${v.km.toLocaleString("es-AR")} km` : null, v.transmision, v.combustible, v.puertas != null ? `${v.puertas} puertas` : null].filter(Boolean).join(" · ");
      const sucursalTxt = v.sucursal ? `\n📍 ${v.sucursal}` : "";
      const simbolo = v.moneda_venta === "USD" ? "US$" : "$";
      const precioTxt = v.precio_venta > 0 ? `${simbolo} ${v.precio_venta.toLocaleString("es-AR")}` : "Consultar precio";
      return `🚗 *${v.marca} ${v.modelo} ${v.anio}*\n💰 ${precioTxt}${extra ? `\n${extra}` : ""}${sucursalTxt}`;
    })
    .join("\n\n");

  // Si el cliente pidió una categoría puntual (ej: SUV) pero ninguno de los
  // resultados que trajo la búsqueda es de esa categoría (se relajó el
  // filtro porque no había stock de esa categoría), hay que decirlo con
  // todas las letras — sin esto el modelo llegó a presentar un hatchback y
  // una pickup como si fueran "las SUV que tenemos", una mentira flagrante
  // sobre datos que él mismo tiene en la fila (columna categoría, arriba).
  const ningunoCumpleCategoria = categoriaSolicitada && !resultados.some((v) => v.categoria === categoriaSolicitada);
  let encabezado: string;
  if (ningunoCumpleCategoria) {
    encabezado = `Búsqueda en stock — IMPORTANTE: no hay ninguna unidad de categoría "${categoriaSolicitada}" disponible ahora mismo (revisá el campo categoría de cada auto de abajo, ninguno es "${categoriaSolicitada}"). Estos son otros vehículos disponibles, de otras categorías, por si le sirven como alternativa — tenés que aclararle explícitamente al cliente que NO son ${categoriaSolicitada}, mencionando qué categoría es cada uno, antes de preguntarle si igual le interesa ver algo. Nunca digas ni des a entender que estos son ${categoriaSolicitada} — sería mentirle con un dato que tenés confirmado que es falso`;
  } else if (esAlternativa) {
    encabezado = "Búsqueda en stock — el modelo exacto que pidió no está, pero estas son alternativas REALES disponibles ahora mismo (misma marca u otra similar). Mostraselas directo, no seguís preguntando año/presupuesto";
  } else {
    encabezado = "Búsqueda en stock — estas son las unidades REALES disponibles ahora mismo, podés usar estos datos con confianza (mostrá como máximo 3, salvo que el cliente pida ver más)";
  }
  return `\n${encabezado}:\n${lista}\n${avisoTotal}`;
}

export type SucursalInfo = { nombre: string; direccion: string | null; telefono_encargado: string | null; google_maps_url: string | null; encargado_nombre?: string | null };

// Arma un link directo a WhatsApp a partir del teléfono cargado — evita
// mostrar el número pelado y que el cliente tenga que copiarlo a mano.
// wa.me solo necesita dígitos (sin +, espacios ni guiones).
function formatearSucursales(sucursales: SucursalInfo[]): string {
  const conDatos = sucursales.filter((s) => s.direccion || s.telefono_encargado || s.google_maps_url);
  if (conDatos.length === 0) return "";
  const lista = conDatos
    .map((s) => {
      // wa.me necesita formato completo 549 + área + número, sin el 0 de
      // troncal -- el dato real en sucursales.telefono_encargado viene con
      // el 0 ("011 5799-8065"), sacarle solo los no-dígitos dejaba un link
      // roto ("wa.me/01157998065", no redirige a nadie real).
      const digitos = s.telefono_encargado?.replace(/\D/g, "").replace(/^0/, "");
      const waLink = digitos ? `https://wa.me/549${digitos}` : null;
      const contacto = s.encargado_nombre && waLink
        ? `${s.encargado_nombre} (encargado) → ${waLink}`
        : waLink;
      // Si no hay google_maps_url cargado en la sucursal, se arma uno con la
      // dirección -- siempre hay un link real para mandar, nunca solo texto.
      const mapsUrl = s.google_maps_url || (s.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.direccion} ${s.nombre}`)}` : null);
      const partes = [s.direccion, contacto, mapsUrl].filter(Boolean);
      return `- ${s.nombre}${partes.length ? `: ${partes.join(" — ")}` : ""}`;
    })
    .join("\n");
  return `\nSUCURSALES (datos reales — usalos con confianza si preguntan dirección, contacto, o cuál les queda más cerca. Cuando des la dirección de una sucursal, mandá SIEMPRE también el link de Google Maps de esa sucursal tal cual está acá, como texto plano en su propia línea — no lo describas, no digas "buscalo en Maps", pegá la URL entera para que WhatsApp la muestre clickeable):\n${lista}`;
}

// Info fija del equipo — no cambia seguido, no amerita ida y vuelta a la
// base. Es solo para que el bot pueda responder con confianza si preguntan
// "quién me atiende" o "quién es el dueño" — nunca para prometer que ESA
// persona puntual va a responder (la asignación real de vendedor es
// automática y separada de esto).
const EQUIPO_PFAFFEN = `\nEQUIPO PFAFFEN AUTOS (dato real, usalo si preguntan quién los atiende o info del equipo — no prometas que te va a atender una persona específica, la asignación de vendedor es automática):
- Vendedores: Julián y Federico.
- Encargado Casa Central: Gabriel Pfaffen.
- Encargado Don Torcuato: Lucas Gatti.
- Dueño: Sergio Pfaffen.`;

// Texto exacto del menú de bienvenida — el LLM a veces lo parafrasea (por
// ejemplo devuelve "4) Hablar con un asesor" en vez de "4) Seguros", un
// menú típico de otros templates que vio en su entrenamiento). Se usa para
// pisar la respuesta del modelo cuando detecta que está mostrando el menú,
// así el texto es siempre exacto sin depender de que el modelo lo copie
// bien. Texto y formato pedidos por el usuario -- reemplaza "Permutar" por
// "Seguros" como 4ta opción (la permuta se sigue entendiendo igual si el
// cliente la pide por texto directo, solo deja de estar en el menú).
export function menuBienvenidaV2(): string {
  return `✨ BIENVENIDO A PFAFFEN CARS

LA FORMA MÁS CONFIABLE DE COMPRAR O VENDER TU AUTO.

¿Qué querés hacer hoy?

Elegí una opción y comenzamos ⬇️

01 · 🚘 COMPRAR
0KM · Usados · Financiación

02 · 💰 VENDER
Cotizá tu vehículo de forma rápida y simple.

03 · 🔑 CONSIGNAR
Nosotros nos encargamos de venderlo.
Vos recibís el dinero.

04 · 🛡️ SEGUROS
Protegé tu vehículo.`;
}

export function buildSystemPromptV2(vehiculoInfo?: string, resultadosStock?: ResultadoStockV2[], nombreBot?: string, resultadosSonAlternativa?: boolean, sucursales?: SucursalInfo[], sugerirCierre?: boolean, categoriaSolicitada?: string | null, totalRealStock?: number, tono?: string | null, esInstagram?: boolean): string {
  return `${nombreBot ? `Te llamás ${nombreBot}, el` : "Sos el"} asistente virtual oficial de Pfaffen Autos, concesionaria de vehículos 0km y usados.

${bloqueEstiloYTono(tono)}
MENSAJE DE BIENVENIDA
Si el cliente solo saluda o no expresa una intención concreta, respondé exactamente con este menú (mismo texto, mismos emojis, no lo parafrasees):
"${menuBienvenidaV2()}"
Si ya dijo lo que necesita, NO repitas el menú — entrá directo al tema.
El saludo ("Bienvenido a Pfaffen Cars") va UNA sola vez, en el primerísimo mensaje de toda la charla — nunca lo repitas en respuestas posteriores, sea cual sea el tema (stock, repuestos, handoff, lo que sea). Si ya saludaste antes en esta misma charla, andá directo al contenido de la respuesta.

${INTENCIONES_LINEA}
${vehiculoInfo ? `El cliente está consultando sobre: ${vehiculoInfo}` : ""}
${resultadosStock ? formatearResultadosStock(resultadosStock, !!resultadosSonAlternativa, categoriaSolicitada, totalRealStock) : ""}
${sucursales ? formatearSucursales(sucursales) : ""}
${EQUIPO_PFAFFEN}
${bloqueSitioWeb(nombreBot)}
${bloqueCierreSugerido(sugerirCierre)}

${REGLAS_STOCK_Y_TEMAS}
${bloqueReglasGenerales(nombreBot, esInstagram)}
${SCHEMA_SALIDA}`;
}

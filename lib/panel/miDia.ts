import type { SupabaseClient } from "@supabase/supabase-js";

// "Para hoy" de Mi Espacio -- un resumen de lectura por rol sobre datos
// operativos de la empresa (Gestoría/Finanzas/Recepción/Ventas), pensado
// para que cada uno vea de un vistazo qué le urge sin tener que entrar a
// cada módulo. TODO ACÁ ES SOLO LECTURA: ninguna de estas funciones hace
// insert/update/delete -- Mi Espacio es una vista personal, no un lugar
// para editar ni cerrar nada de esos módulos (eso sigue viviendo en cada
// módulo real). Mismos umbrales/criterios que ya usa cada módulo (ver
// comentarios en cada función) para no inventar una segunda definición de
// "demorado"/"sin contestar" que quede desincronizada de la real.

const DIAS_SIN_RESPUESTA = 2; // mismo criterio que app/panel/leads/LeadsUnificadosClient.tsx
const DIAS_SIN_CONTACTO_CARTERA = 14; // "más de dos semanas" (paso 5 de la doc del módulo)
const DIAS_DEMORADO_EXPEDIENTE = 15; // mismo criterio que app/panel/gestoria/GestoriaClient.tsx

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
}

export async function paraHoyGestoria(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("expedientes")
    .select("id, titulo, fecha_apertura, created_at")
    .eq("archivado", false)
    .neq("estado", "cerrado")
    .order("fecha_apertura", { ascending: true })
    .limit(80);
  return (data || [])
    .map((e: any) => ({ id: e.id, titulo: e.titulo, dias: diasDesde(e.fecha_apertura || e.created_at) }))
    .filter((e) => e.dias > DIAS_DEMORADO_EXPEDIENTE)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5);
}

export async function paraHoyFinanzas(supabase: SupabaseClient) {
  const hoy = new Date();
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}-01`;
  const [{ data: cierre }, { data: cuentas }] = await Promise.all([
    supabase.from("cierres_mensuales").select("mes, reabierto_en").eq("mes", mesAnteriorStr).maybeSingle(),
    supabase.from("cuentas").select("id, nombre, moneda, saldo").eq("activa", true).lt("saldo", 0),
  ]);
  return {
    mesAnteriorLabel: mesAnterior.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
    mesAnteriorCerrado: !!cierre && !cierre.reabierto_en,
    cuentasEnRojo: (cuentas || []).map((c: any) => ({ id: c.id, nombre: c.nombre, moneda: c.moneda, saldo: Number(c.saldo) })),
  };
}

// Última dirección real (in=cliente, out=nosotros/IA) de cada conversación
// -- mismo enfoque que app/panel/leads/page.tsx, pero acotado a las
// conversaciones ya traídas (no a las 3000 filas más recientes de mensajes
// de todo el sistema) para no repetir esa consulta pesada acá.
async function ultimaDireccion(supabase: SupabaseClient, tabla: string, conversacionIds: string[]) {
  if (conversacionIds.length === 0) return {} as Record<string, { direccion: string; created_at: string }>;
  const { data } = await supabase.from(tabla).select("conversacion_id, direccion, created_at").in("conversacion_id", conversacionIds).order("created_at", { ascending: false });
  const mapa: Record<string, { direccion: string; created_at: string }> = {};
  for (const m of data || []) if (!mapa[m.conversacion_id]) mapa[m.conversacion_id] = { direccion: m.direccion, created_at: m.created_at };
  return mapa;
}

interface LeadSinContestar { id: string; origen: "whatsapp" | "instagram" | "rodi"; nombre: string; telefono: string | null; vendedorId: string | null }

async function leadsSinContestar(supabase: SupabaseClient, soloVendedorId?: string): Promise<LeadSinContestar[]> {
  let qWa = supabase.from("whatsapp_conversaciones").select("id, vendedor_id, last_message_at, whatsapp_contactos(nombre_perfil, telefono)").eq("es_basura", false).order("last_message_at", { ascending: false }).limit(40);
  let qIg = supabase.from("instagram_conversaciones").select("id, vendedor_id, last_message_at, instagram_contactos(username)").eq("es_basura", false).order("last_message_at", { ascending: false }).limit(40);
  let qRodi = supabase.from("rodi_conversaciones").select("id, vendedor_id, last_message_at, nombre_contacto, telefono_contacto").eq("es_basura", false).order("last_message_at", { ascending: false }).limit(40);
  if (soloVendedorId) {
    qWa = qWa.eq("vendedor_id", soloVendedorId);
    qIg = qIg.eq("vendedor_id", soloVendedorId);
    qRodi = qRodi.eq("vendedor_id", soloVendedorId);
  }
  const [{ data: wa }, { data: ig }, { data: rodi }] = await Promise.all([qWa, qIg, qRodi]);

  const [dirWa, dirIg, dirRodi] = await Promise.all([
    ultimaDireccion(supabase, "whatsapp_mensajes", (wa || []).map((c: any) => c.id)),
    ultimaDireccion(supabase, "instagram_mensajes", (ig || []).map((c: any) => c.id)),
    ultimaDireccion(supabase, "rodi_mensajes", (rodi || []).map((c: any) => c.id)),
  ]);

  const esSinContestar = (dir: { direccion: string; created_at: string } | undefined) => dir?.direccion === "in" && diasDesde(dir.created_at) >= DIAS_SIN_RESPUESTA;

  const lista: LeadSinContestar[] = [
    ...(wa || []).filter((c: any) => esSinContestar(dirWa[c.id])).map((c: any) => ({ id: c.id, origen: "whatsapp" as const, nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre", telefono: c.whatsapp_contactos?.telefono || null, vendedorId: c.vendedor_id })),
    ...(ig || []).filter((c: any) => esSinContestar(dirIg[c.id])).map((c: any) => ({ id: c.id, origen: "instagram" as const, nombre: c.instagram_contactos?.username ? `@${c.instagram_contactos.username}` : "Sin nombre", telefono: null, vendedorId: c.vendedor_id })),
    ...(rodi || []).filter((c: any) => esSinContestar(dirRodi[c.id])).map((c: any) => ({ id: c.id, origen: "rodi" as const, nombre: c.nombre_contacto || c.telefono_contacto || "Sin nombre", telefono: c.telefono_contacto || null, vendedorId: c.vendedor_id })),
  ];
  return lista.sort((a, b) => (a.vendedorId ? 1 : 0) - (b.vendedorId ? 1 : 0));
}

export async function paraHoyRecepcion(supabase: SupabaseClient) {
  const [sinContestar, { data: visitas }] = await Promise.all([
    leadsSinContestar(supabase),
    (async () => {
      const hoyStr = new Date().toISOString().slice(0, 10);
      return supabase.from("visitas").select("id, nombre_cliente, fecha_visita, sucursal").lt("fecha_visita", hoyStr).in("estado", ["Pendiente", "Confirmada"]).order("fecha_visita", { ascending: true }).limit(6);
    })(),
  ]);
  return { sinContestar: sinContestar.slice(0, 6), visitasSinRegistrar: visitas || [] };
}

export async function colaVendedor(supabase: SupabaseClient, vendedorId: string) {
  const [leads, { data: reservas }] = await Promise.all([
    leadsSinContestar(supabase, vendedorId),
    // "reserva sin seña" -- una venta en estado "reserva" del vendedor sin
    // ninguna fila en venta_senas todavía (distinto de "señado", que ya
    // implica que la seña se registró).
    supabase.from("ventas").select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo, created_at, venta_senas(id)").eq("vendedor_id", vendedorId).eq("estado", "reserva").order("created_at", { ascending: true }).limit(20),
  ]);
  const reservasSinSena = (reservas || []).filter((v: any) => !v.venta_senas || v.venta_senas.length === 0).slice(0, 5);
  return { leadsSinContestar: leads.slice(0, 6), reservasSinSena };
}

export async function carteraVendedor(supabase: SupabaseClient, vendedorId: string) {
  const { data } = await supabase.from("clientes").select("id, ultimo_contacto, created_at").eq("vendedor_id", vendedorId);
  const lista = data || [];
  const sinContactoHaceRato = lista.filter((c: any) => diasDesde(c.ultimo_contacto || c.created_at) > DIAS_SIN_CONTACTO_CARTERA).length;
  return { total: lista.length, sinContactoHaceRato };
}

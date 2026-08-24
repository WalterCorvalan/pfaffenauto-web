import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import LeadDetailClient from "./LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // El lead puede venir de una cotización (tasación/permuta) o de un contacto
  // directo (WhatsApp/Web Chat) — cada uno vive en su propia tabla, probamos
  // en orden hasta encontrarlo.
  const { data: leadCotizacion } = await supabase
    .from("cotizaciones")
    .select("*, perfiles:perfiles!cotizaciones_vendedor_id_fkey ( id, nombre ), vehiculos ( id, marca, modelo, patente )")
    .eq("id", id)
    .maybeSingle();

  let lead: any = leadCotizacion ? { ...leadCotizacion, origen: "cotizacion" } : null;

  if (!lead) {
    const { data: leadWa } = await supabase
      .from("whatsapp_conversaciones")
      .select("*, perfiles ( id, nombre ), vehiculos ( id, marca, modelo, patente ), whatsapp_contactos ( nombre_perfil, telefono )")
      .eq("id", id)
      .maybeSingle();
    if (leadWa) {
      lead = {
        ...leadWa,
        origen: "whatsapp",
        nombre: leadWa.whatsapp_contactos?.nombre_perfil || leadWa.whatsapp_contactos?.telefono || "Consulta WhatsApp",
        telefono: leadWa.whatsapp_contactos?.telefono || "",
        estado: leadWa.estado_pipeline || "Nuevo",
        marca: leadWa.vehiculos?.marca || "",
        modelo: leadWa.vehiculos?.modelo || "Consulta por WhatsApp",
      };
    }
  }

  if (!lead) {
    const { data: leadWeb } = await supabase
      .from("web_chat_conversaciones")
      .select("*, perfiles ( id, nombre ), vehiculos ( id, marca, modelo, patente )")
      .eq("id", id)
      .maybeSingle();
    if (leadWeb) {
      lead = {
        ...leadWeb,
        origen: "webchat",
        nombre: leadWeb.nombre || "Consulta Web Chat",
        estado: leadWeb.estado_pipeline || "Nuevo",
        marca: leadWeb.vehiculos?.marca || "",
        modelo: leadWeb.vehiculos?.modelo || "Consulta por Web Chat",
      };
    }
  }

  if (!lead) notFound();

  const campoFk = lead.origen === "whatsapp" ? "whatsapp_conversacion_id" : lead.origen === "webchat" ? "web_chat_conversacion_id" : "cotizacion_id";

  const [{ data: vendedores }, { data: vehiculosStock }, { data: motivosCierre }, { data: tareas }, { data: testDrives }, { data: eventos }, { data: miPerfil }, { data: presupuestos }, { data: senas }, { data: boletos }, { data: peritajes }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, sucursales ( nombre )").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, patente").in("estado", ["Disponible", "Reservado"]).order("marca"),
    supabase.from("motivos_cierre").select("*").eq("activo", true).order("nombre"),
    supabase.from("tareas_lead").select("*").eq(campoFk, id).order("fecha_vencimiento", { ascending: true }),
    supabase.from("test_drives").select("*").eq(campoFk, id).order("fecha_hora", { ascending: false }),
    supabase.from("eventos_lead").select("*, perfiles ( nombre )").eq(campoFk, id).order("created_at", { ascending: false }),
    user ? supabase.from("perfiles").select("id, rol").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("presupuestos").select("id, numero, fecha, precio_venta_ars, precio_venta_usd").eq(campoFk, id).order("created_at", { ascending: false }),
    supabase.from("senas").select("id, numero, fecha, estado, venta_ars, venta_usd").eq(campoFk, id).order("created_at", { ascending: false }),
    supabase.from("boletos_venta").select("id, numero, fecha, venta_ars, venta_usd, documentacion_ventas ( id, tipo_documento, estado )").eq(campoFk, id).order("created_at", { ascending: false }),
    supabase.from("peritajes").select("id, estado, puntaje, created_at").eq(campoFk, id).order("created_at", { ascending: false }),
  ]);

  return (
    <LeadDetailClient
      lead={lead}
      vendedores={vendedores || []}
      vehiculosStock={vehiculosStock || []}
      motivosCierre={motivosCierre || []}
      tareasIniciales={tareas || []}
      testDrivesIniciales={testDrives || []}
      eventos={eventos || []}
      usuarioActual={miPerfil || { id: user?.id, rol: "vendedor" }}
      presupuestos={presupuestos || []}
      senas={senas || []}
      boletos={boletos || []}
      peritajes={peritajes || []}
    />
  );
}

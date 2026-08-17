import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import KanbanBoard from "./KanbanBoard";

export default async function CRMPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  let miRol = "vendedor";
  if (user) {
    const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
    miRol = perfil?.rol || "vendedor";
  }

  const [{ data: cotizaciones }, { data: motivosCierre }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, perfiles:perfiles!cotizaciones_vendedor_id_fkey ( nombre ), vehiculos ( marca, modelo, sucursales!vehiculos_sucursal_id_fkey ( nombre ) )") // incluye asistencia_solicitada/atendida vía *
      .order("created_at", { ascending: false }),
    supabase.from("motivos_cierre").select("*").eq("activo", true).order("nombre"),
  ]);

  const { data: vendedores } = await supabase.from("perfiles").select("id, nombre").eq("rol", "vendedor").eq("activo", true).order("nombre");
  const { data: sucursales } = await supabase.from("sucursales").select("id, nombre").order("nombre");

  const { data: conversacionesWa } = await supabase
    .from("whatsapp_conversaciones")
    .select(`
      id, estado_pipeline, created_at, calificacion, vendedor_id, origen_ads,
      whatsapp_contactos ( nombre_perfil, telefono ),
      perfiles ( nombre ),
      vehiculos ( marca, modelo, sucursales!vehiculos_sucursal_id_fkey ( nombre ) )
    `)
    .order("created_at", { ascending: false });

  const leadsWa = (conversacionesWa || []).map((c: any) => ({
    id: c.id,
    origen: "whatsapp",
    nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Consulta WhatsApp",
    telefono: c.whatsapp_contactos?.telefono || "",
    marca: c.vehiculos?.marca || "",
    modelo: c.vehiculos?.modelo || "Consulta por WhatsApp",
    tipo_peritaje: "whatsapp",
    precio_sugerido: null,
    estado: c.estado_pipeline || "Nuevo",
    created_at: c.created_at,
    vendedor_id: c.vendedor_id,
    perfiles: c.perfiles,
    vehiculos: c.vehiculos,
    origen_ads: c.origen_ads,
  }));

  const leadsCotizaciones = (cotizaciones || []).map((c: any) => ({ ...c, origen: "cotizacion" }));

  let leadsUnificados = [...leadsCotizaciones, ...leadsWa];

  // Vendedor: solo ve sus leads asignados + los sin asignar (para poder tomarlos). Nunca los de otro vendedor.
  // Admin siempre ve todo. Encargado ve todo por default, con toggle "Mis leads" en el Kanban (client-side).
  if (miRol === "vendedor" && user) {
    leadsUnificados = leadsUnificados.filter((l: any) => !l.vendedor_id || l.vendedor_id === user.id);
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <KanbanBoard leadsIniciales={leadsUnificados} motivosCierre={motivosCierre || []} miRol={miRol} miId={user?.id || ""} vendedores={vendedores || []} sucursales={sucursales || []} />
    </div>
  );
}
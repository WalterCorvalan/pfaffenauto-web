import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import EquipoClient from "./EquipoClient";

export default async function EquipoPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: miPerfil } = await supabase.from("perfiles").select("rol, sucursal_id, nombre").eq("id", user.id).single();
  if (!miPerfil || (miPerfil.rol !== "admin" && miPerfil.rol !== "encargado")) redirect("/panel");

  // Encargado: solo ve vendedores de su propia sucursal. Admin/dueño: ve todo el equipo.
  let vendedoresQuery = supabase
    .from("perfiles")
    .select("id, nombre, sucursal_id, sucursales ( nombre )")
    .eq("rol", "vendedor")
    .eq("activo", true);
  if (miPerfil.rol === "encargado") vendedoresQuery = vendedoresQuery.eq("sucursal_id", miPerfil.sucursal_id);

  const [{ data: vendedores }, { data: tareasNoCompletadas }, { data: leadsAbiertos }] = await Promise.all([
    vendedoresQuery.order("nombre"),
    supabase.from("tareas_lead").select("id, cotizacion_id, fecha_vencimiento, completada, cotizaciones ( vendedor_id )").eq("completada", false),
    // Mismo criterio que /panel/crm/tareas: "sin contactar" = lead activo sin ninguna tarea cargada todavía.
    supabase.from("cotizaciones").select("id, vendedor_id, sucursal_preferida").in("estado", ["Nuevo", "Pendiente"]),
  ]);

  const idsConTarea = new Set((tareasNoCompletadas || []).map((t: any) => t.cotizacion_id));
  const leadsSinContactar = (leadsAbiertos || []).filter((l) => !idsConTarea.has(l.id));

  const ahora = new Date();
  const vendedoresIds = new Set((vendedores || []).map((v) => v.id));

  const equipo = (vendedores || []).map((v) => ({
    id: v.id,
    nombre: v.nombre,
    sucursal: (v as any).sucursales?.nombre || "Sin sucursal",
    sinContactar: leadsSinContactar.filter((l) => l.vendedor_id === v.id).length,
    tareasVencidas: (tareasNoCompletadas || []).filter((t: any) => t.cotizaciones?.vendedor_id === v.id && new Date(t.fecha_vencimiento) < ahora).length,
  }));

  // Leads sin contactar que además no tienen vendedor asignado — "huérfanos" que
  // nadie en el equipo va a ver reflejados en su propio contador.
  const sinAsignar = leadsSinContactar.filter((l) => !l.vendedor_id || !vendedoresIds.has(l.vendedor_id)).length;

  return <EquipoClient equipo={equipo} sinAsignar={sinAsignar} esAdmin={miPerfil.rol === "admin"} />;
}

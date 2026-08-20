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

  const [{ data: lead }, { data: vendedores }, { data: vehiculosStock }, { data: motivosCierre }, { data: tareas }, { data: testDrives }, { data: eventos }, { data: miPerfil }, { data: presupuestos }, { data: senas }, { data: boletos }, { data: peritajes }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, perfiles:perfiles!cotizaciones_vendedor_id_fkey ( id, nombre ), vehiculos ( id, marca, modelo, patente )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("perfiles").select("id, nombre, sucursales ( nombre )").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, patente").in("estado", ["Disponible", "Reservado"]).order("marca"),
    supabase.from("motivos_cierre").select("*").eq("activo", true).order("nombre"),
    supabase.from("tareas_lead").select("*").eq("cotizacion_id", id).order("fecha_vencimiento", { ascending: true }),
    supabase.from("test_drives").select("*").eq("cotizacion_id", id).order("fecha_hora", { ascending: false }),
    supabase.from("eventos_lead").select("*, perfiles ( nombre )").eq("cotizacion_id", id).order("created_at", { ascending: false }),
    user ? supabase.from("perfiles").select("id, rol").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("presupuestos").select("id, numero, fecha, precio_venta_ars, precio_venta_usd").eq("cotizacion_id", id).order("created_at", { ascending: false }),
    supabase.from("senas").select("id, numero, fecha, estado, venta_ars, venta_usd").eq("cotizacion_id", id).order("created_at", { ascending: false }),
    supabase.from("boletos_venta").select("id, numero, fecha, venta_ars, venta_usd, documentacion_ventas ( id, tipo_documento, estado )").eq("cotizacion_id", id).order("created_at", { ascending: false }),
    supabase.from("peritajes").select("id, estado, puntaje, created_at").eq("cotizacion_id", id).order("created_at", { ascending: false }),
  ]);

  if (!lead) notFound();

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

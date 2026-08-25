import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import BoletoVentaForm from "./BoletoVentaForm";

export default async function NuevoBoletoPage({ searchParams }: { searchParams: Promise<{ cotizacion_id?: string; whatsapp_conversacion_id?: string; instagram_conversacion_id?: string }> }) {
  const { cotizacion_id, whatsapp_conversacion_id, instagram_conversacion_id } = await searchParams;
  const campoFk = whatsapp_conversacion_id ? "whatsapp_conversacion_id" : instagram_conversacion_id ? "instagram_conversacion_id" : cotizacion_id ? "cotizacion_id" : null;
  const idLead = whatsapp_conversacion_id || instagram_conversacion_id || cotizacion_id || null;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: clientes }, { data: vehiculos }, { data: vendedores }, { data: sucursales }, { data: senas }] = await Promise.all([
    supabase.from("clientes").select("*").order("apellido"),
    supabase.from("vehiculos").select("*").in("estado", ["Disponible", "Reservado"]).order("marca"),
    supabase.from("perfiles").select("id, nombre").order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("senas").select("*").eq("estado", "Activa").order("numero", { ascending: false }),
  ]);

  return (
    <BoletoVentaForm
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      vendedores={vendedores || []}
      sucursales={sucursales || []}
      senas={senas || []}
      vinculoLead={campoFk && idLead ? { campo: campoFk, id: idLead } : null}
    />
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CasoDetailClient from "./CasoDetailClient";

export default async function CasoPostventaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: caso }, { data: eventos }, { data: adjuntos }, { data: vendedores }, { data: config }] = await Promise.all([
    supabase
      .from("postventa_casos")
      .select("*, vehiculos ( marca, modelo, patente ), venta:boletos_venta ( id, numero, fecha, marca, modelo, apellido, nombre )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("postventa_eventos").select("*, perfiles ( nombre )").eq("caso_id", id).order("created_at", { ascending: true }),
    supabase.from("postventa_adjuntos").select("*").eq("caso_id", id).order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("configuracion").select("valor").eq("clave", "meses_garantia_postventa").maybeSingle(),
  ]);

  if (!caso) notFound();

  const mesesGarantia = Number(config?.valor) || 3;

  return (
    <CasoDetailClient
      caso={caso as any}
      eventosIniciales={eventos || []}
      adjuntosIniciales={adjuntos || []}
      vendedores={vendedores || []}
      mesesGarantia={mesesGarantia}
    />
  );
}

import { createClient } from "@/lib/supabase2/server";
import { notFound } from "next/navigation";
import ImprimirSena from "./ImprimirSena";

export default async function ImprimirSenaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: sena }, { data: config }] = await Promise.all([
    supabase
      .from("senas")
      .select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre ), permuta_vehiculo:permuta_vehiculo_id ( marca, modelo, patente )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("configuracion_empresa").select("branding_nombre, branding_domicilio, branding_telefono, branding_cuit, branding_logo_url, branding_email, branding_web, branding_ingresos_brutos").eq("id", true).maybeSingle(),
  ]);

  if (!sena) notFound();

  return <ImprimirSena sena={sena} branding={config} />;
}

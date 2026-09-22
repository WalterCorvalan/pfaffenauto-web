import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImprimirMandato from "./ImprimirMandato";

export default async function ImprimirMandatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: mandato }, { data: config }] = await Promise.all([
    supabase.from("mandatos").select("*").eq("id", id).maybeSingle(),
    supabase.from("configuracion_empresa").select("branding_nombre, branding_domicilio, branding_telefono, branding_cuit, branding_logo_url, branding_email, branding_web, branding_ingresos_brutos").eq("id", true).maybeSingle(),
  ]);

  if (!mandato) notFound();

  return <ImprimirMandato mandato={mandato} branding={config} />;
}

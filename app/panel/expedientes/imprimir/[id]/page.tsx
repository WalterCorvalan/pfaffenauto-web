import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImprimirExpediente from "./ImprimirExpediente";

export default async function ImprimirExpedientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: expediente }, { data: config }] = await Promise.all([
    supabase.from("expedientes").select("*, venta:ventas(*)").eq("id", id).maybeSingle(),
    supabase.from("configuracion_empresa").select("branding_nombre, branding_domicilio, branding_telefono, branding_cuit, branding_logo_url, branding_email, branding_web, branding_ingresos_brutos").eq("id", true).maybeSingle(),
  ]);

  if (!expediente) notFound();

  const [{ data: hitos }, { data: checklist }, { data: gastos }, { data: perfiles }] = await Promise.all([
    supabase.from("expediente_hitos").select("*").eq("expediente_id", id).order("orden"),
    supabase.from("expediente_checklist").select("*").eq("expediente_id", id).order("parte,orden"),
    supabase.from("expediente_gastos").select("*").eq("expediente_id", id),
    supabase.from("perfiles").select("id, nombre"),
  ]);

  const perfilMap = Object.fromEntries((perfiles || []).map((p) => [p.id, p.nombre]));
  const dias = Math.floor((Date.now() - new Date(expediente.fecha_apertura || expediente.created_at).getTime()) / 86400000);

  return (
    <ImprimirExpediente
      expediente={expediente}
      branding={config}
      hitos={hitos || []}
      checklist={checklist || []}
      gastos={gastos || []}
      perfilMap={perfilMap}
      dias={dias}
    />
  );
}

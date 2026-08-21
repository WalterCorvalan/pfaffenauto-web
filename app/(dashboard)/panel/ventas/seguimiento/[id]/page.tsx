import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import SeguimientoClient from "./SeguimientoClient";

export default async function SeguimientoVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: venta } = await supabase
    .from("boletos_venta")
    .select("id, numero, codigo_seguimiento, etapa_seguimiento, fecha, nombre, apellido, telefono_celular, correo_electronico, marca, modelo, dominio, venta_ars, observaciones, comision_ars, porcentaje_comision")
    .eq("id", id)
    .single();

  if (!venta) notFound();

  const { data: documentos } = await supabase
    .from("documentacion_ventas")
    .select("id, tipo_documento, estado, fecha_recibido, archivo_url, etapa, verificado_por, documentacion_ventas_archivos ( id, url, nombre_archivo, created_at )")
    .eq("venta_id", id)
    .order("created_at", { ascending: true });

  return <SeguimientoClient venta={venta as any} documentosIniciales={documentos || []} />;
}

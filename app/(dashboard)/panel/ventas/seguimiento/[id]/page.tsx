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
    .select("id, codigo_seguimiento, etapa_seguimiento, fecha, nombre, apellido, telefono_celular, marca, modelo, dominio")
    .eq("id", id)
    .single();

  if (!venta) notFound();

  const { data: documentos } = await supabase
    .from("documentacion_ventas")
    .select("id, tipo_documento, estado, fecha_recibido, archivo_url, etapa")
    .eq("venta_id", id)
    .order("created_at", { ascending: true });

  return <SeguimientoClient venta={venta as any} documentosIniciales={documentos || []} />;
}

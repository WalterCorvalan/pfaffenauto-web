import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import TramiteDetailClient from "./TramiteDetailClient";

export default async function TramiteDetailPage({
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

  const [{ data: tramite }, { data: responsables }] = await Promise.all([
    supabase
      .from("tramites_gestoria")
      .select(
        "id, tipo_tramite, estado, fecha_ingreso, fecha_estimada_fin, responsable_id, modalidad, realizado_por, observaciones, proxima_tarea, proxima_fecha, vehiculo_id, venta_id, " +
        "vehiculos(id, marca, modelo, patente, anio, sucursales:sucursal_id(nombre)), " +
        "boletos_venta(id, numero, nombre, apellido, dni, telefono_celular, codigo_seguimiento, cliente_id)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("perfiles").select("id, nombre, rol").in("rol", ["admin", "encargado", "gestoria"]).eq("activo", true).order("nombre"),
  ]);

  if (!tramite) notFound();

  const [{ data: historial }, { data: movimientos }] = await Promise.all([
    supabase
      .from("tramites_gestoria_historial")
      .select("id, estado_anterior, estado_nuevo, created_at, perfiles:responsable_id(nombre)")
      .eq("tramite_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("movimientos_caja")
      .select("id, tipo, concepto, monto, medio_pago, comprobante_url, observaciones, fecha, aprobado")
      .eq("tramite_id", id)
      .order("fecha", { ascending: false }),
  ]);

  return (
    <TramiteDetailClient
      tramite={tramite as any}
      historialInicial={(historial || []) as any}
      responsables={responsables || []}
      movimientosIniciales={(movimientos || []) as any}
    />
  );
}

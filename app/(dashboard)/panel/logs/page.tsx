import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import LogsClient from "./LogsClient";

export default async function LogsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: cambios } = await supabase
    .from("historial_cambios")
    .select("id, tabla, registro_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id, fecha_cambio, perfiles ( nombre )")
    .order("fecha_cambio", { ascending: false })
    .limit(300);

  // "registro_id" es genérico (puede ser un vehículo, un boletos_venta, etc.) —
  // para los de tabla "vehiculos" resolvemos marca/modelo/patente aparte para
  // que el log diga "Ford EcoSport" en vez de un UUID pelado.
  const idsVehiculos = [...new Set((cambios || []).filter((c) => c.tabla === "vehiculos").map((c) => c.registro_id).filter(Boolean))];
  const { data: vehiculos } = idsVehiculos.length
    ? await supabase.from("vehiculos").select("id, marca, modelo, patente").in("id", idsVehiculos)
    : { data: [] as any[] };
  const vehiculosPorId = new Map((vehiculos || []).map((v) => [v.id, v]));

  const cambiosConContexto = (cambios || []).map((c) => ({
    ...c,
    vehiculo: c.tabla === "vehiculos" ? vehiculosPorId.get(c.registro_id) || null : null,
  }));

  return <LogsClient cambios={cambiosConContexto as any} />;
}

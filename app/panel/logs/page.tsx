import { createClient } from "@/lib/supabase/server";
import LogsClient from "./LogsClient";

export const metadata = { title: "Registro de Cambios | Pfaffen Autos" };

// Calcado de v1 (app/(panel-v1)/panel/logs) -- arranca con Ventas y Señas
// (las 2 tablas que ya tienen el trigger registrar_historial_cambios).
export default async function LogsPage() {
  const supabase = await createClient();

  const { data: cambios } = await supabase
    .from("historial_cambios")
    .select("id, tabla, registro_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id, fecha_cambio, perfiles ( nombre )")
    .order("fecha_cambio", { ascending: false })
    .limit(300);

  // "registro_id" es genérico -- para ventas/señas resolvemos el auto y el
  // cliente aparte para que el log diga "Toyota Corolla — Juan Pérez" en
  // vez de un UUID pelado.
  const idsVentas = [...new Set((cambios || []).filter((c) => c.tabla === "ventas").map((c) => c.registro_id).filter(Boolean))];
  const idsSenas = [...new Set((cambios || []).filter((c) => c.tabla === "senas").map((c) => c.registro_id).filter(Boolean))];

  const [{ data: ventas }, { data: senas }] = await Promise.all([
    idsVentas.length ? supabase.from("ventas").select("id, vehiculo_marca, vehiculo_modelo, comprador_nombre").in("id", idsVentas) : Promise.resolve({ data: [] as any[] }),
    idsSenas.length ? supabase.from("senas").select("id, marca, modelo, cliente_nombre, apellido, nombre").in("id", idsSenas) : Promise.resolve({ data: [] as any[] }),
  ]);
  const ventasPorId = new Map((ventas || []).map((v) => [v.id, v]));
  const senasPorId = new Map((senas || []).map((s) => [s.id, s]));

  const cambiosConContexto = (cambios || []).map((c) => {
    if (c.tabla === "ventas") {
      const v = ventasPorId.get(c.registro_id);
      return { ...c, contexto: v ? { descripcion: `${v.vehiculo_marca || ""} ${v.vehiculo_modelo || ""}`.trim(), persona: v.comprador_nombre } : null };
    }
    if (c.tabla === "senas") {
      const s = senasPorId.get(c.registro_id);
      return { ...c, contexto: s ? { descripcion: `${s.marca || ""} ${s.modelo || ""}`.trim(), persona: s.apellido ? `${s.apellido}, ${s.nombre || ""}` : s.cliente_nombre } : null };
    }
    return { ...c, contexto: null };
  });

  return <LogsClient cambios={cambiosConContexto as any} />;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetricaCampana } from "./types";

// Un row por campaña por día — correr el cron varias veces en el mismo día
// solo actualiza (upsert) ese mismo row con los totales más frescos, no
// duplica. El índice único vive en sql_pautas_automaticas.sql
// (plataforma, campana_externa_id, periodo).
export async function guardarMetricas(
  supabase: SupabaseClient,
  plataforma: string,
  periodo: string, // YYYY-MM-DD
  metricas: MetricaCampana[]
) {
  if (metricas.length === 0) return;
  const rows = metricas.map((m) => ({
    plataforma,
    periodo,
    nombre_campana: m.nombreCampana,
    campana_externa_id: m.campanaExternaId,
    gasto: m.gasto,
    clics: m.clics,
    leads: m.leads,
    origen: "automatico",
  }));
  const { error } = await supabase
    .from("campanas_marketing")
    .upsert(rows, { onConflict: "plataforma,campana_externa_id,periodo" });
  if (error) throw error;
}

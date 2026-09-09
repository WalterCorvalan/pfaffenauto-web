import { createClient } from "@supabase/supabase-js";

// Mismo patrón que lib/logger.ts (v1), apuntando a nova. Best-effort: si el
// insert falla no rompe el flujo que lo llamó.
const supabaseLogs = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export function registrarError(origen: string, error: unknown, contexto?: Record<string, unknown>) {
  console.error(`[${origen}]`, error);

  const mensaje = error instanceof Error ? error.message : String(error);
  const detalle = {
    ...(contexto || {}),
    stack: error instanceof Error ? error.stack : undefined,
  };

  supabaseLogs
    .from("logs_errores")
    .insert({ origen, mensaje: mensaje.slice(0, 2000), detalle })
    .then(({ error: insertError }) => {
      if (insertError) console.error("[logger] no se pudo guardar el log:", insertError.message);
    });
}

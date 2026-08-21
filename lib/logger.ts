import { createClient } from "@supabase/supabase-js";

// Logging simple y gratis: siempre loguea a consola (dev/logs del hosting), y
// además intenta guardar en la tabla logs_errores para poder verlos desde
// /panel/errores sin tener que ir a leer la consola del servidor. Si la tabla
// no existe todavía o el insert falla, no rompe el flujo — es best-effort.
const supabaseLogs = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

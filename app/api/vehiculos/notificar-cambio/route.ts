import { createClient } from "@supabase/supabase-js";
import { notificarCambioVehiculo } from "@/lib/notificaciones";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Notificar desde el cliente con la llave anónima puede chocar con las políticas
// RLS de "notificaciones" (un usuario no tiene por qué poder escribirle una
// notificación a otro). Esta ruta corre con la service role, así que siempre
// puede insertar sin importar quién esté mirando la pantalla.
export async function POST(req: Request) {
  try {
    const { autoId, vendedorAsignadoId, actorId, mensaje, tipo, seccion, link } = await req.json();
    if (!autoId || !mensaje || !tipo) {
      return Response.json({ error: "Faltan datos." }, { status: 400 });
    }

    await notificarCambioVehiculo(supabase, {
      autoId,
      vendedorAsignadoId: vendedorAsignadoId || null,
      actorId: actorId || null,
      mensaje,
      tipo,
      seccion,
      link,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[notificar-cambio] error:", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

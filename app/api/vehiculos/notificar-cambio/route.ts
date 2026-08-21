import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notificarCambioVehiculo, type SeccionNotificacion } from "@/lib/notificaciones";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NotificarCambioSchema = z.object({
  autoId: z.string().uuid(),
  vendedorAsignadoId: z.string().uuid().optional().nullable(),
  actorId: z.string().uuid().optional().nullable(),
  mensaje: z.string().trim().min(1).max(300),
  tipo: z.string().trim().min(1).max(50),
  seccion: z.enum([
    "senas", "presupuestos", "boletos", "tareas", "pedidos", "chat",
    "cotizaciones", "consignaciones", "crm", "postventa", "financiacion", "stock", "postulaciones",
  ] satisfies readonly SeccionNotificacion[]).optional().nullable(),
  link: z.string().trim().max(200).optional().nullable(),
});

// Notificar desde el cliente con la llave anónima puede chocar con las políticas
// RLS de "notificaciones" (un usuario no tiene por qué poder escribirle una
// notificación a otro). Esta ruta corre con la service role, así que siempre
// puede insertar sin importar quién esté mirando la pantalla — pero sigue
// requiriendo sesión de staff, la service role no es un cheque en blanco.
export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 30, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });

    const parsed = NotificarCambioSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos o tienen formato inválido." }, { status: 400 });
    }
    const { autoId, vendedorAsignadoId, actorId, mensaje, tipo, seccion, link } = parsed.data;

    await notificarCambioVehiculo(supabase, {
      autoId,
      vendedorAsignadoId: vendedorAsignadoId || null,
      actorId: actorId || null,
      mensaje,
      tipo,
      seccion: seccion ?? undefined,
      link: link ?? undefined,
    });

    return Response.json({ ok: true });
  } catch (err) {
    registrarError("api/vehiculos/notificar-cambio", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

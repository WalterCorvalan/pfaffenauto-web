import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import type { SeccionNotificacion } from "@/lib/notificaciones";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NotificarPersonaSchema = z.object({
  perfilId: z.string().uuid(),
  tipo: z.string().trim().min(1).max(50),
  mensaje: z.string().trim().min(1).max(300),
  link: z.string().trim().max(200),
  seccion: z.enum([
    "senas", "presupuestos", "boletos", "tareas", "pedidos", "chat",
    "cotizaciones", "consignaciones", "comprar", "crm", "postventa", "financiacion", "stock", "postulaciones",
  ] satisfies readonly SeccionNotificacion[]),
});

// Un usuario no puede insertarle una notificación a OTRO vía RLS (por diseño:
// nadie debería poder mandarse notificaciones falsas a nombre de otro). Esta
// ruta corre con service role para los casos legítimos — reasignar un lead,
// pedir asistencia — pero sigue exigiendo sesión de staff.
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

    const parsed = NotificarPersonaSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos o tienen formato inválido." }, { status: 400 });
    }
    const { perfilId, tipo, mensaje, link, seccion } = parsed.data;

    const { error } = await supabase.from("notificaciones").insert({ perfil_id: perfilId, tipo, mensaje, link, seccion });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    registrarError("api/notificaciones/persona", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

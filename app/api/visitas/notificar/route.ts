import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VisitaNotifSchema = z.object({
  nombreCliente: z.string().trim().min(1).max(100),
  fecha: z.string().trim().min(1).max(20),
  horario: z.string().trim().max(20).optional().nullable(),
  sucursal: z.string().trim().max(60).optional().nullable(),
  vendedorId: z.string().uuid().optional().nullable(),
});

// AgendarCitaForm inserta la visita directo desde el cliente (RLS pública).
// Notificar a otro usuario necesita service role, así que eso pasa por acá.
export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 10, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const parsed = VisitaNotifSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Faltan datos." }, { status: 400 });
    const { nombreCliente, fecha, horario, sucursal, vendedorId } = parsed.data;

    const mensaje = `Nueva visita agendada: ${nombreCliente} — ${fecha} ${horario} (${sucursal})`;
    const link = "/panel/citas";
    if (vendedorId) {
      await notificarPersona(supabase, vendedorId, "nueva_visita", mensaje, link, "crm");
    } else {
      await notificarEncargados(supabase, mensaje, link, "crm", "nueva_visita");
    }

    return Response.json({ ok: true });
  } catch (err) {
    registrarError("api/visitas/notificar", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

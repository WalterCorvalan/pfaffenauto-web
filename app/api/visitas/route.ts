import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VisitaSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  vehiculo_id: z.string().uuid().optional().nullable(),
  nombre_cliente: z.string().trim().min(1).max(100),
  telefono_cliente: z.string().trim().min(6).max(20),
  fecha_visita: z.string().trim().min(1).max(20),
  horario_visita: z.string().trim().min(1).max(20),
  sucursal: z.string().trim().min(1).max(60),
  vendedor_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const payload = await req.json();
    const parsed = VisitaSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const {
      turnstileToken,
      vehiculo_id,
      nombre_cliente,
      telefono_cliente,
      fecha_visita,
      horario_visita,
      sucursal,
      vendedor_id,
    } = parsed.data;

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    const { data, error } = await supabase.from("visitas_agendadas").insert({
      vehiculo_id: vehiculo_id || null,
      nombre_cliente: String(nombre_cliente).trim(),
      telefono_cliente: String(telefono_cliente).trim(),
      fecha_visita,
      horario_visita,
      sucursal,
      estado: "Pendiente",
      vendedor_id: vendedor_id || null,
    }).select("id").single();

    if (error) throw error;

    const mensajeNoti = `Nueva visita agendada: ${nombre_cliente} — ${fecha_visita} ${horario_visita} (${sucursal})`;
    const linkNoti = "/panel/citas";
    if (vendedor_id) {
      notificarPersona(supabase, vendedor_id, "nueva_visita", mensajeNoti, linkNoti, "citas").catch((err) => console.error("[visitas] error notificando vendedor:", err));
    } else {
      notificarEncargados(supabase, mensajeNoti, linkNoti, "citas", "nueva_visita").catch((err) => console.error("[visitas] error notificando encargados:", err));
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    registrarError("api/visitas", err);
    return Response.json({ error: "Hubo un problema al agendar la visita." }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const payload = await req.json();
    const {
      turnstileToken,
      vehiculo_id,
      nombre_cliente,
      telefono_cliente,
      fecha_visita,
      horario_visita,
      sucursal,
      vendedor_id,
    } = payload;

    if (!turnstileToken) {
      return Response.json({ error: "Falta verificación anti-spam." }, { status: 400 });
    }

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    if (!nombre_cliente || !telefono_cliente || !fecha_visita || !horario_visita || !sucursal) {
      return Response.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    const { error } = await supabase.from("visitas_agendadas").insert({
      vehiculo_id: vehiculo_id || null,
      nombre_cliente: String(nombre_cliente).trim(),
      telefono_cliente: String(telefono_cliente).trim(),
      fecha_visita,
      horario_visita,
      sucursal,
      estado: "Pendiente",
      vendedor_id: vendedor_id || null,
    });

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[visitas] error:", err);
    return Response.json({ error: "Hubo un problema al agendar la visita." }, { status: 500 });
  }
}

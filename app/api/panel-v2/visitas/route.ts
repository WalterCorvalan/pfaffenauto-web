import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panelV2/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const VisitaSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  vehiculo_id: z.string().optional().nullable(),
  vehiculo_marca: z.string().trim().max(60).optional().nullable(),
  vehiculo_modelo: z.string().trim().max(60).optional().nullable(),
  vehiculo_patente: z.string().trim().max(20).optional().nullable(),
  nombre_cliente: z.string().trim().min(1).max(100),
  telefono_cliente: z.string().trim().min(6).max(20),
  fecha_visita: z.string().trim().min(1).max(20),
  horario_visita: z.string().trim().min(1).max(20),
  sucursal: z.string().trim().min(1).max(60),
  vendedor_id: z.string().uuid().optional().nullable(),
});

// Fork de app/api/visitas/route.ts (v1) apuntando a la base nova — el sitio
// público se está migrando a v2, que es el panel que se lanza.
export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = VisitaSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const { turnstileToken, vehiculo_id, vehiculo_marca, vehiculo_modelo, vehiculo_patente, nombre_cliente, telefono_cliente, fecha_visita, horario_visita, sucursal, vendedor_id } = parsed.data;

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    const { data, error } = await supabase.from("visitas").insert({
      vehiculo_id: vehiculo_id || null,
      vehiculo_marca: vehiculo_marca || null,
      vehiculo_modelo: vehiculo_modelo || null,
      vehiculo_patente: vehiculo_patente || null,
      nombre_cliente: nombre_cliente.trim(),
      telefono_cliente: telefono_cliente.trim(),
      fecha_visita,
      horario_visita,
      sucursal,
      estado: "Pendiente",
      vendedor_id: vendedor_id || null,
    }).select("id").single();

    if (error) throw error;

    const vehiculoTxt = [vehiculo_marca, vehiculo_modelo].filter(Boolean).join(" ");
    const titulo = `Nueva visita agendada — ${nombre_cliente}${vehiculoTxt ? ` (${vehiculoTxt})` : ""}`;
    const link = `/panel-v2/visitas`;
    if (vendedor_id) {
      await supabase.from("alertas").insert({ destinatario_id: vendedor_id, tipo: "visita_nueva", prioridad: "media", titulo, link });
    } else {
      const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
      for (const d of destinatarios || []) {
        await supabase.from("alertas").insert({ destinatario_id: d.id, tipo: "visita_nueva", prioridad: "media", titulo, link });
      }
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    registrarError("api/panel-v2/visitas", err);
    return Response.json({ error: "Hubo un problema al agendar la visita." }, { status: 500 });
  }
}

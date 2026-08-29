import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const PostulacionSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  telefono: z.string().trim().min(6).max(30),
  puesto: z.string().trim().min(1).max(100),
  cv_url: z.string().url(),
});

// Fork de app/api/postulaciones/route.ts (v1) apuntando a la base nova — el
// sitio público se está migrando a v2, que es el panel que se lanza.
export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = PostulacionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const { turnstileToken, ...postulacion } = parsed.data;

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("postulaciones")
      .insert(postulacion)
      .select("id")
      .single();

    if (error) throw error;

    const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
    const titulo = `Nueva postulación: ${postulacion.nombre} ${postulacion.apellido} — ${postulacion.puesto}.`;
    for (const d of destinatarios || []) {
      await supabase.from("alertas").insert({ destinatario_id: d.id, tipo: "postulacion", prioridad: "novedad", titulo, link: "/panel-v2/postulaciones" });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[api/panel-v2/postulaciones]", err);
    return Response.json({ error: "Hubo un problema al enviar tu postulación." }, { status: 500 });
  }
}

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const ConsignacionSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  nombre: z.string().trim().min(1).max(150),
  telefono: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(150).optional().nullable(),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().max(60).optional().nullable(),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  version: z.string().trim().max(150).optional().nullable(),
  kilometraje: z.coerce.number().min(0).max(2_000_000).optional().nullable(),
});

// Conecta el formulario público /consignacion a la base nova (antes iba a
// v1 vía /api/cotizaciones, tabla que además no aplica acá: la
// "cotizaciones" de nova es un presupuesto interno del vendedor, no un lead
// público). "consignaciones" de nova ya tenía la forma justa para esto.
export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = ConsignacionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const { turnstileToken, nombre, telefono, email, marca, modelo, anio, version, kilometraje } = parsed.data;

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    const vehiculoDescripcion = [marca, modelo, anio, version, kilometraje ? `${kilometraje} km` : null]
      .filter(Boolean)
      .join(" ");

    const { data, error } = await supabase
      .from("consignaciones")
      .insert({
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        cliente_email: email || null,
        vehiculo_descripcion: vehiculoDescripcion,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
    for (const d of destinatarios || []) {
      await supabase.from("alertas").insert({
        destinatario_id: d.id,
        tipo: "consignacion_nueva",
        prioridad: "novedad",
        titulo: `Nueva consignación desde la web — ${nombre}`,
        mensaje: vehiculoDescripcion,
        link: `/panel-v2/consignaciones?consignacion=${data.id}`,
      });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[api/panel-v2/consignaciones]", err);
    return Response.json({ error: "Hubo un problema al enviar tu solicitud." }, { status: 500 });
  }
}

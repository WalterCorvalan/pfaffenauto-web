import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const LeadTasacionSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  nombre: z.string().trim().min(1).max(150),
  telefono: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(150).optional().nullable(),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().max(60).optional().nullable(),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  version: z.string().trim().max(150).optional().nullable(),
  kilometraje: z.coerce.number().min(0).max(2_000_000).optional().nullable(),
  gnc: z.string().trim().max(50).optional().nullable(),
  precioEsperado: z.coerce.number().min(0).optional().nullable(),
  descuentoPct: z.coerce.number().min(0).max(100).optional().nullable(),
  ofertaCalculada: z.coerce.number().min(0).optional().nullable(),
  aceptaOferta: z.boolean().optional().nullable(),
  fotosYVideos: z.array(z.string().url()).max(30).optional(),
  canalOrigen: z.string().trim().max(60).optional().nullable(),
  tipo: z.enum(["tasacion", "permuta", "financiacion"]).optional(),
  vehiculoObjetivoId: z.string().uuid().optional().nullable(),
  // Si el cliente eligió venir a sucursal, reserva una visita real en el
  // mismo request (misma lógica que /api/panel-v2/visitas).
  visita: z.object({
    sucursal: z.string().trim().min(1).max(60),
    fecha: z.string().trim().min(1).max(20),
    horario: z.string().trim().min(1).max(20),
  }).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = LeadTasacionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const data = parsed.data;

    const humano = await verificarTurnstile(data.turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    let visitaId: string | null = null;
    if (data.visita) {
      const { data: visita, error: errVisita } = await supabase
        .from("visitas")
        .insert({
          nombre_cliente: data.nombre,
          telefono_cliente: data.telefono,
          fecha_visita: data.visita.fecha,
          horario_visita: data.visita.horario,
          sucursal: data.visita.sucursal,
          estado: "Pendiente",
        })
        .select("id")
        .single();
      if (errVisita) throw errVisita;
      visitaId = visita.id;
    }

    const { data: lead, error } = await supabase
      .from("leads_tasacion")
      .insert({
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || null,
        marca: data.marca,
        modelo: data.modelo || null,
        anio: data.anio || null,
        version: data.version || null,
        kilometraje: data.kilometraje ?? null,
        gnc: data.gnc || null,
        precio_esperado_cliente: data.precioEsperado ?? null,
        descuento_pct: data.descuentoPct ?? null,
        oferta_calculada: data.ofertaCalculada ?? null,
        acepta_oferta: data.aceptaOferta ?? null,
        quiere_venir_sucursal: !!data.visita,
        sucursal_preferida: data.visita?.sucursal || null,
        visita_id: visitaId,
        fotos_y_videos: data.fotosYVideos || [],
        tipo: data.tipo || "tasacion",
        vehiculo_objetivo_id: data.vehiculoObjetivoId || null,
        canal_origen: data.canalOrigen || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
    for (const d of destinatarios || []) {
      await supabase.from("alertas").insert({
        destinatario_id: d.id,
        tipo: "lead_tasacion_nuevo",
        prioridad: "novedad",
        titulo: `Nueva tasación desde la web — ${data.nombre}`,
        mensaje: `${data.marca} ${data.modelo || ""} ${data.anio || ""}`.trim(),
        link: `/panel-v2/peritajes`,
      });
    }

    return Response.json({ ok: true, id: lead.id });
  } catch (err) {
    console.error("[api/panel-v2/leads-tasacion]", err);
    return Response.json({ error: "Hubo un problema al enviar tu solicitud." }, { status: 500 });
  }
}

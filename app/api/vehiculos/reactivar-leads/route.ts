import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import { z } from "zod";

const ReactivarLeadsSchema = z.object({
  vehiculoId: z.string().uuid(),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LIMITE_LEADS = 20;

// Cuando entra un vehículo nuevo al stock, avisa por WhatsApp a los leads que
// habían quedado "fríos"/perdidos preguntando por la misma marca y modelo —
// reactiva leads que de otra forma quedan muertos en la base para siempre.
export async function POST(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 10, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const parsed = ReactivarLeadsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Falta vehiculoId." }, { status: 400 });
  const { vehiculoId } = parsed.data;

  const { data: vehiculo } = await supabaseAdmin
    .from("vehiculos")
    .select("marca, modelo, anio, estado")
    .eq("id", vehiculoId)
    .single();

  if (!vehiculo || vehiculo.estado !== "Disponible") {
    return NextResponse.json({ ok: true, notificados: 0, motivo: "vehículo no disponible aún" });
  }

  if (!process.env.META_WHATSAPP_TOKEN || !process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    return NextResponse.json({ ok: true, notificados: 0, motivo: "WhatsApp no configurado" });
  }

  const hace90dias = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();

  const { data: conversaciones } = await supabaseAdmin
    .from("whatsapp_conversaciones")
    .select("id, calificacion, estado_pipeline, last_message_at, whatsapp_contactos(telefono, nombre_perfil), vehiculos(marca, modelo)")
    .not("vehiculo_id", "is", null)
    .gte("last_message_at", hace90dias)
    .or("calificacion.eq.frio,estado_pipeline.eq.Perdido");

  const tipoAutomatizacion = `reactivacion_stock:${vehiculoId}`;
  const marcaLower = vehiculo.marca.toLowerCase();
  const modeloLower = vehiculo.modelo.toLowerCase();

  const candidatos = (conversaciones || []).filter((c: any) => {
    const v = c.vehiculos;
    return v && v.marca?.toLowerCase() === marcaLower && v.modelo?.toLowerCase() === modeloLower && c.whatsapp_contactos?.telefono;
  }).slice(0, LIMITE_LEADS);

  let notificados = 0;
  for (const c of candidatos) {
    const { data: existente } = await supabaseAdmin
      .from("automatizaciones_wa")
      .select("id")
      .eq("tipo", tipoAutomatizacion)
      .eq("referencia_id", c.id)
      .maybeSingle();
    if (existente) continue;

    const contacto = c.whatsapp_contactos as any;
    const texto = `¡Hola ${contacto.nombre_perfil || ""}! Te escribimos de Pfaffen Autos: llegó un ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio || ""} — justo lo que habías consultado antes. ¿Querés que te pasemos fotos y precio?`;

    try {
      await sendTextMessage(process.env.META_WHATSAPP_PHONE_NUMBER_ID!, process.env.META_WHATSAPP_TOKEN!, contacto.telefono, texto);
      await supabaseAdmin.from("whatsapp_mensajes").insert({
        conversacion_id: c.id, direccion: "out", tipo: "text", texto, status: "sent", ai_generado: true,
      });
      await supabaseAdmin.from("automatizaciones_wa").insert({ tipo: tipoAutomatizacion, referencia_id: c.id });
      notificados++;
    } catch (err) {
      registrarError("api/vehiculos/reactivar-leads", err);
    }
  }

  return NextResponse.json({ ok: true, notificados });
}

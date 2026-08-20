import { createClient } from "@supabase/supabase-js";
import { notificarEncargados } from "@/lib/notificaciones";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// El formulario de "Trabajá con nosotros" inserta la postulación directo desde
// el cliente (RLS pública). Notificar a otros usuarios sí necesita service
// role, así que eso pasa por acá.
export async function POST(req: Request) {
  try {
    const { nombre, apellido, puesto } = await req.json();
    if (!nombre) return Response.json({ error: "Falta el nombre." }, { status: 400 });

    await notificarEncargados(
      supabase,
      `Nueva postulación: ${nombre} ${apellido || ""} — ${puesto || "sin puesto especificado"}.`,
      "/panel/postulaciones",
      "postulaciones",
      "nueva_postulacion"
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[postulaciones/notificar] error:", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

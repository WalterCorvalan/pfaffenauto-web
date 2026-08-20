import { createClient } from "@supabase/supabase-js";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AgendarCitaForm inserta la visita directo desde el cliente (RLS pública).
// Notificar a otro usuario necesita service role, así que eso pasa por acá.
export async function POST(req: Request) {
  try {
    const { nombreCliente, fecha, horario, sucursal, vendedorId } = await req.json();
    if (!nombreCliente || !fecha) return Response.json({ error: "Faltan datos." }, { status: 400 });

    const mensaje = `Nueva visita agendada: ${nombreCliente} — ${fecha} ${horario} (${sucursal})`;
    const link = "/panel/citas";
    if (vendedorId) {
      await notificarPersona(supabase, vendedorId, "nueva_visita", mensaje, link, "crm");
    } else {
      await notificarEncargados(supabase, mensaje, link, "crm", "nueva_visita");
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[visitas/notificar] error:", err);
    return Response.json({ error: "Error al notificar." }, { status: 500 });
  }
}

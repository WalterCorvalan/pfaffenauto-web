import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const PedidoSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  telefono: z.string().trim().min(6).max(30),
  busqueda: z.string().trim().min(1).max(1000),
  // De dónde viene el pedido -- define el texto de las notas. Sin tipo = buscador del catálogo.
  tipo: z.enum(["buscador", "favoritos", "reserva"]).optional(),
});

// Conecta el buscador del catálogo público (BuscadorFallBack.tsx — "no
// encontramos resultados") a nova. Antes insertaba directo en
// "pedidos_especiales" de v1, huérfano del panel-v2 nuevo.
export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = await rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000, proyecto: "v2" });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = PedidoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const { nombre, telefono, busqueda, tipo } = parsed.data;
    const notas =
      tipo === "favoritos" ? `Consultó desde su lista de Favoritos: ${busqueda}`
      : tipo === "reserva" ? `Reserva desde la landing: ${busqueda}`
      : `Buscó "${busqueda}" en el catálogo y no encontró resultados.`;

    const { data, error } = await supabase
      .from("pedidos")
      .insert({
        nombre_cliente: nombre,
        telefono,
        marca: tipo === "favoritos" ? "Favoritos web" : busqueda.slice(0, 60),
        notas,
        origen: "web",
      })
      .select("id")
      .single();

    if (error) throw error;

    const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
    for (const d of destinatarios || []) {
      await supabase.from("alertas").insert({
        destinatario_id: d.id,
        tipo: "pedido_nuevo",
        prioridad: "novedad",
        titulo: `Nuevo pedido desde la web — ${nombre}`,
        mensaje: busqueda,
        link: `/panel/pedidos?pedido=${data.id}`,
      });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    registrarError("api/panel/pedidos", err);
    return Response.json({ error: "Hubo un problema al enviar tu solicitud." }, { status: 500 });
  }
}

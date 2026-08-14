import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isWhatsappEnvioConfigurado(): boolean {
  return !!process.env.META_WHATSAPP_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

// Se llama después de confirmar una venta real (no seña/presupuesto). Manda un
// agradecimiento por WhatsApp si la integración de Meta está configurada; si no,
// no rompe el flujo de venta, simplemente no envía nada (igual que el resto del bot).
export async function POST(req: Request) {
  try {
    const { venta_id, boleto_id } = await req.json();
    if (!venta_id && !boleto_id) {
      return Response.json({ error: "Falta venta_id o boleto_id." }, { status: 400 });
    }

    let nombreCliente: string | undefined;
    let telefono: string | undefined;
    let marca: string | undefined;
    let modelo: string | undefined;

    if (boleto_id) {
      const { data: boleto, error } = await supabase
        .from("boletos_venta")
        .select("nombre, apellido, telefono_celular, marca, modelo")
        .eq("id", boleto_id)
        .single();
      if (error || !boleto) {
        return Response.json({ error: "Venta no encontrada." }, { status: 404 });
      }
      nombreCliente = boleto.nombre;
      telefono = boleto.telefono_celular;
      marca = boleto.marca;
      modelo = boleto.modelo;
    } else {
      const { data: venta, error } = await supabase
        .from("ventas")
        .select(`
          clientes ( nombre, telefono_celular ),
          vehiculos ( marca, modelo )
        `)
        .eq("id", venta_id)
        .single();

      if (error || !venta) {
        return Response.json({ error: "Venta no encontrada." }, { status: 404 });
      }

      const cliente = venta.clientes as any;
      const vehiculo = venta.vehiculos as any;
      nombreCliente = cliente?.nombre;
      telefono = cliente?.telefono_celular;
      marca = vehiculo?.marca;
      modelo = vehiculo?.modelo;
    }

    if (!telefono) {
      return Response.json({ enviado: false, motivo: "Sin teléfono del cliente." });
    }

    if (!isWhatsappEnvioConfigurado()) {
      return Response.json({ enviado: false, motivo: "WhatsApp no configurado." });
    }

    const mensaje = `¡Hola ${nombreCliente || ""}! Gracias por confiar en Pfaffen Autos para tu ${marca || ""} ${modelo || ""}. Cualquier consulta o cuando necesites turno de service, escribinos por acá. ¡Que lo disfrutes!`;

    let numeroLimpio = String(telefono).replace(/\D/g, "");
    if (!numeroLimpio.startsWith("54")) numeroLimpio = "549" + numeroLimpio;
    else if (!numeroLimpio.startsWith("549")) numeroLimpio = numeroLimpio.replace(/^54/, "549");

    await sendTextMessage(
      process.env.META_WHATSAPP_PHONE_NUMBER_ID!,
      process.env.META_WHATSAPP_TOKEN!,
      numeroLimpio,
      mensaje
    );

    return Response.json({ enviado: true });
  } catch (err) {
    console.error("[ventas/agradecimiento] error:", err);
    return Response.json({ enviado: false, motivo: "Error interno." }, { status: 500 });
  }
}

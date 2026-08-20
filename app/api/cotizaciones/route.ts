import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { notificarEncargados, notificarPersona } from "@/lib/notificaciones";

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
    const { turnstileToken, ...cotizacion } = payload;

    if (!turnstileToken) {
      return Response.json({ error: "Falta verificación anti-spam." }, { status: 400 });
    }

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    if (!cotizacion.marca || !cotizacion.modelo || !cotizacion.telefono || !cotizacion.nombre) {
      return Response.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    const puedeVenirSucursal = cotizacion.puede_venir_sucursal === true;

    // =====================================================================
    // CORRECCIÓN AUDITORÍA: Respetar el tipo de operación si el frontend 
    // lo envía explícitamente (Ej: "venta" o "consignacion").
    // Si no lo envía (Cotizador normal), mantiene la lógica anterior.
    // =====================================================================
    const tipoPeritajeFinal = cotizacion.tipo_peritaje 
      ? cotizacion.tipo_peritaje 
      : (puedeVenirSucursal ? "presencial" : "online");

    const { data, error } = await supabase
      .from("cotizaciones")
      .insert({
        marca: cotizacion.marca,
        modelo: cotizacion.modelo,
        anio: Number(cotizacion.anio),
        version: cotizacion.version,
        kilometraje: Number(cotizacion.kilometraje),
        gnc: cotizacion.gnc ?? null,
        nombre: cotizacion.nombre,
        email: cotizacion.email,
        telefono: cotizacion.telefono,
        telefono_verificado: false,
        puede_venir_sucursal: puedeVenirSucursal,
        tipo_peritaje: tipoPeritajeFinal, // <- Ahora guarda exactamente lo que corresponde
        sucursal_preferida: cotizacion.sucursal_preferida ?? "Casa Central",
        fotos_y_videos: Array.isArray(cotizacion.fotos_y_videos) ? cotizacion.fotos_y_videos : [],
        vehiculo_id: cotizacion.vehiculo_id ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const esConsignacion = tipoPeritajeFinal === "consignacion";
    const esFinanciacion = tipoPeritajeFinal === "financiacion";
    const nombreVehiculo = `${cotizacion.marca} ${cotizacion.modelo}`;
    const sucursalTexto = esFinanciacion ? ` — ${cotizacion.sucursal_preferida ?? "Casa Central"}` : "";
    notificarEncargados(
      supabase,
      `Nuevo lead: ${cotizacion.nombre} — ${nombreVehiculo}`,
      `/panel/crm/${data.id}`,
      "crm",
      "nuevo_lead"
    ).catch((err) => console.error("[cotizaciones] error notificando crm:", err));
    notificarEncargados(
      supabase,
      esConsignacion
        ? `Nueva consignación: ${cotizacion.nombre} — ${nombreVehiculo}`
        : esFinanciacion
        ? `Nueva solicitud de crédito: ${cotizacion.nombre} — ${nombreVehiculo}${sucursalTexto}`
        : `Nueva cotización: ${cotizacion.nombre} — ${nombreVehiculo}`,
      esConsignacion ? "/panel/consignaciones" : esFinanciacion ? "/panel/ventas/financiaciones" : "/panel/cotizaciones",
      esConsignacion ? "consignaciones" : esFinanciacion ? "financiacion" : "cotizaciones",
      "nuevo_lead"
    ).catch((err) => console.error("[cotizaciones] error notificando sección:", err));

    // Si el auto ya tiene un vendedor asignado, que se entere directo — no solo
    // los encargados. Es justo el caso de financiación: el auto ya tiene dueño
    // de venta y la solicitud le corresponde a él/ella.
    if (cotizacion.vehiculo_id) {
      supabase
        .from("vehiculos")
        .select("vendedor_asignado_id")
        .eq("id", cotizacion.vehiculo_id)
        .maybeSingle()
        .then(({ data: vehiculo }) => {
          if (!vehiculo?.vendedor_asignado_id) return;
          notificarPersona(
            supabase,
            vehiculo.vendedor_asignado_id,
            "nuevo_lead",
            esFinanciacion
              ? `Nueva solicitud de crédito para tu ${nombreVehiculo}: ${cotizacion.nombre}.`
              : `Nuevo lead para tu ${nombreVehiculo}: ${cotizacion.nombre}.`,
            esFinanciacion ? "/panel/ventas/financiaciones" : `/panel/crm/${data.id}`,
            esFinanciacion ? "financiacion" : "crm"
          ).catch((err) => console.error("[cotizaciones] error notificando vendedor asignado:", err));
        });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[cotizaciones] error:", err);
    return Response.json({ error: "Hubo un problema al procesar tu solicitud." }, { status: 500 });
  }
}
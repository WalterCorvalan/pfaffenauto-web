import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { verificarTurnstile } from "@/lib/turnstile";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { notificarEncargados, notificarPersona } from "@/lib/notificaciones";
import { registrarError } from "@/lib/logger";
import { calcularPrecioSugerido } from "@/lib/tasadorIA";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CotizacionSchema = z.object({
  turnstileToken: z.string().min(1, "Falta verificación anti-spam."),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(60),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  version: z.string().trim().max(100).optional().nullable(),
  kilometraje: z.coerce.number().min(0).max(2_000_000),
  gnc: z.string().trim().max(50).optional().nullable(),
  nombre: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  telefono: z.string().trim().min(6).max(20),
  puede_venir_sucursal: z.boolean().optional(),
  tipo_peritaje: z.string().trim().max(30).optional().nullable(),
  sucursal_preferida: z.string().trim().max(60).optional().nullable(),
  fotos_y_videos: z.array(z.string().url()).max(30).optional(),
  vehiculo_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const payload = await req.json();
    const parsed = CotizacionSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const { turnstileToken, ...cotizacion } = parsed.data;

    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
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

    // Permuta: el cliente cotiza SU auto con la intención de usarlo como parte
    // de pago para comprar vehiculo_id. Tasamos automático con el mismo
    // tasador IA que usa el panel, así el vendedor ya ve el precio sugerido
    // (y por lo tanto cuánto resta pagar) apenas entra a la cotización, sin
    // tener que dispararlo a mano.
    let precioSugerido: number | null = null;
    let monedaSugerida: string | null = null;
    if (tipoPeritajeFinal === "permuta" && cotizacion.vehiculo_id) {
      const tasacion = await calcularPrecioSugerido(
        {
          marca: cotizacion.marca,
          modelo: cotizacion.modelo,
          version: cotizacion.version,
          anio: Number(cotizacion.anio),
          kilometraje: Number(cotizacion.kilometraje),
        },
        "api/cotizaciones (permuta automática)"
      );
      if (tasacion.ok) {
        precioSugerido = tasacion.data.precio_sugerido;
        monedaSugerida = "ARS";
      } else {
        // No bloqueamos la cotización si la IA falla (rate limit de OpenAI,
        // sin comparables, etc.) — el vendedor siempre puede tasarla a mano
        // después desde el panel, igual que cualquier otra cotización.
        registrarError("api/cotizaciones tasación automática de permuta", new Error(tasacion.error));
      }
    }

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
        precio_sugerido: precioSugerido,
        moneda_sugerida: monedaSugerida,
      })
      .select("id")
      .single();

    if (error) throw error;

    const esConsignacion = tipoPeritajeFinal === "consignacion";
    const esFinanciacion = tipoPeritajeFinal === "financiacion";
    const esPermuta = tipoPeritajeFinal === "permuta";
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
        : esPermuta
        ? `Nueva permuta: ${cotizacion.nombre} ofrece su ${nombreVehiculo}`
        : `Nueva cotización: ${cotizacion.nombre} — ${nombreVehiculo}`,
      esConsignacion ? "/panel/consignaciones" : esFinanciacion ? "/panel/ventas/financiaciones" : "/panel/cotizaciones",
      esConsignacion ? "consignaciones" : esFinanciacion ? "financiacion" : "cotizaciones",
      "nuevo_lead"
    ).catch((err) => console.error("[cotizaciones] error notificando sección:", err));

    // Si el auto ya tiene un vendedor asignado, que se entere directo — no solo
    // los encargados. Es el caso de financiación (el auto ya tiene dueño de
    // venta) y ahora también permuta, donde además le mostramos cuánto le
    // resta pagar al cliente después de la tasación automática.
    if (cotizacion.vehiculo_id) {
      supabase
        .from("vehiculos")
        .select("marca, modelo, vendedor_asignado_id, precio_publicado_ars, precio_publicado_usd")
        .eq("id", cotizacion.vehiculo_id)
        .maybeSingle()
        .then(({ data: vehiculo }) => {
          if (!vehiculo?.vendedor_asignado_id) return;
          const nombreVehiculoObjetivo = `${vehiculo.marca} ${vehiculo.modelo}`;
          let mensajePermuta = `Nueva permuta para tu ${nombreVehiculoObjetivo}: ${cotizacion.nombre} ofrece su ${nombreVehiculo}.`;
          if (esPermuta && precioSugerido != null && vehiculo.precio_publicado_ars) {
            const resta = vehiculo.precio_publicado_ars - precioSugerido;
            mensajePermuta += ` Tasación IA: $${precioSugerido.toLocaleString("es-AR")} — resta $${resta.toLocaleString("es-AR")}.`;
          }
          notificarPersona(
            supabase,
            vehiculo.vendedor_asignado_id,
            "nuevo_lead",
            esFinanciacion
              ? `Nueva solicitud de crédito para tu ${nombreVehiculoObjetivo}: ${cotizacion.nombre}.`
              : esPermuta
              ? mensajePermuta
              : `Nuevo lead para tu ${nombreVehiculoObjetivo}: ${cotizacion.nombre}.`,
            esFinanciacion ? "/panel/ventas/financiaciones" : `/panel/crm/${data.id}`,
            esFinanciacion ? "financiacion" : "crm"
          ).catch((err) => console.error("[cotizaciones] error notificando vendedor asignado:", err));
        });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    registrarError("api/cotizaciones", err);
    return Response.json({ error: "Hubo un problema al procesar tu solicitud." }, { status: 500 });
  }
}
import { z } from "zod";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { crearAlerta } from "@/lib/panel/alertas";
import { estimarPrecioMercado } from "@/lib/ai/estimarPrecioMercado";
import { descuentoPctPorKm } from "@/lib/panel/descuentoPorKm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const LeadTasacionSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  telefono: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(150).optional().nullable(),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().max(60).optional().nullable(),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  version: z.string().trim().max(150).optional().nullable(),
  kilometraje: z.coerce.number().min(0).max(2_000_000).optional().nullable(),
  combustible: z.string().trim().max(30).optional().nullable(),
  gnc: z.string().trim().max(50).optional().nullable(),
  precioEsperado: z.coerce.number().min(0).optional().nullable(),
  descuentoPct: z.coerce.number().min(0).max(100).optional().nullable(),
  ofertaCalculada: z.coerce.number().min(0).optional().nullable(),
  aceptaOferta: z.boolean().optional().nullable(),
  fotosYVideos: z.array(z.string().url()).max(30).optional(),
  canalOrigen: z.string().trim().max(60).optional().nullable(),
  utmSource: z.string().trim().max(100).optional().nullable(),
  utmMedium: z.string().trim().max(100).optional().nullable(),
  utmCampaign: z.string().trim().max(150).optional().nullable(),
  tipo: z.enum(["tasacion", "permuta", "financiacion"]).optional(),
  vehiculoObjetivoId: z.string().uuid().optional().nullable(),
  // Datos estructurados de una solicitud de financiación -- ver
  // migraciones/sql_leads_tasacion_financiacion.sql.
  precioVehiculo: z.coerce.number().min(0).optional().nullable(),
  pctFinanciado: z.coerce.number().min(0).max(100).optional().nullable(),
  montoFinanciar: z.coerce.number().min(0).optional().nullable(),
  anticipoMonto: z.coerce.number().min(0).optional().nullable(),
  plazoMeses: z.coerce.number().int().min(1).optional().nullable(),
  cuotaEstimada: z.coerce.number().min(0).optional().nullable(),
  creditoPreaprobado: z.boolean().optional().nullable(),
  cuil: z.string().trim().max(20).optional().nullable(),
  // Si el cliente eligió venir a sucursal, reserva una visita real en el
  // mismo request (misma lógica que /api/panel/visitas).
  visita: z.object({
    sucursal: z.string().trim().min(1).max(60),
    fecha: z.string().trim().min(1).max(20),
    horario: z.string().trim().min(1).max(20),
  }).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = await rateLimit(ip, { limite: 5, ventanaMs: 10 * 60 * 1000, proyecto: "v2" });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = LeadTasacionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos obligatorios o tienen un formato inválido." }, { status: 400 });
    }
    const data = parsed.data;

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
        .maybeSingle();
      if (errVisita) throw errVisita;
      if (!visita) throw new Error("No se pudo confirmar la reserva de la visita.");
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
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
      })
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!lead) throw new Error("No se pudo confirmar el envío de la solicitud.");

    // Combustible en un update aparte: si migraciones/sql_leads_tasacion_combustible.sql
    // todavía no corrió en la base, la solicitud se sigue guardando igual
    // (mismo patrón resiliente que los campos de financiación más abajo).
    if (data.combustible) {
      const { error: errCombustible } = await supabase.from("leads_tasacion").update({ combustible: data.combustible }).eq("id", lead.id);
      if (errCombustible) registrarError("api/panel/leads-tasacion:combustible", errCombustible, { leadId: lead.id });
    }

    // Precio de mercado real (pedido del 26/9, ver lib/ai/estimarPrecioMercado.ts)
    // -- solo para tasación/permuta, no tiene sentido para una solicitud de
    // financiación (ahí el vehículo ya es del stock propio, con precio real).
    // Con after() (Next 15.1+, soportado en Vercel vía waitUntil) esto corre
    // DESPUÉS de que el cliente ya recibió la respuesta -- antes iba en el
    // mismo request porque un fire-and-forget "a mano" se cortaba apenas
    // Vercel devolvía la respuesta, pero eso hacía esperar al cliente en el
    // form público hasta 25s (ahora más, con un modelo más grande y más
    // búsquedas para mejorar la precisión) solo para un dato que ni siquiera
    // se le muestra a él.
    if (data.tipo !== "financiacion") {
      after(async () => {
        const estimado = await estimarPrecioMercado({
          marca: data.marca, modelo: data.modelo, anio: data.anio, km: data.kilometraje, version: data.version, combustible: data.combustible,
        });
        if (estimado) {
          // Pedido del 26/9: precio_mercado_estimado no es la media cruda de
          // mercado (precio de venta particular/publicación) -- es la oferta
          // real que le conviene hacer a la agencia, aplicando la misma
          // escala de descuento por km que antes calculaba la oferta
          // instantánea del cotizador (lib/panel/descuentoPorKm.ts). Media
          // de mercado y % de descuento quedan igual en el registro por si
          // el asesor quiere ver el desglose.
          const descuentoPct = data.kilometraje != null ? descuentoPctPorKm(data.kilometraje) : 0;
          const precioConDescuento = Math.round(estimado.precio * (1 - descuentoPct / 100));
          const { error: errPrecioMercado } = await supabase.from("leads_tasacion").update({
            precio_mercado_estimado: precioConDescuento,
            precio_mercado_medio_web: estimado.precio,
            precio_mercado_descuento_pct: descuentoPct,
            precio_mercado_fuentes: estimado.fuentes,
          }).eq("id", lead.id);
          if (errPrecioMercado) registrarError("api/panel/leads-tasacion:precio-mercado", errPrecioMercado, { leadId: lead.id });
        }
      });
    }

    let vendedorFinanciacionId: string | null = null;

    // Campos estructurados de financiación en un update aparte: si
    // migraciones/sql_leads_tasacion_financiacion.sql todavía no corrió en
    // la base, la solicitud se sigue guardando igual (con el resumen en
    // "version" como respaldo) en vez de que el envío entero falle.
    if (data.tipo === "financiacion") {
      const { error: errCamposFinanciacion } = await supabase
        .from("leads_tasacion")
        .update({
          precio_vehiculo: data.precioVehiculo ?? null,
          pct_financiado: data.pctFinanciado ?? null,
          monto_financiar: data.montoFinanciar ?? null,
          anticipo_monto: data.anticipoMonto ?? null,
          plazo_meses: data.plazoMeses ?? null,
          cuota_estimada: data.cuotaEstimada ?? null,
          credito_preaprobado: data.creditoPreaprobado ?? null,
          cuil: data.cuil || null,
        })
        .eq("id", lead.id);
      if (errCamposFinanciacion) registrarError("api/panel/leads-tasacion:campos-financiacion", errCamposFinanciacion, { leadId: lead.id });

      // Pedido de la reunión del 22/9: una solicitud de financiación le
      // llega solo al vendedor que tiene asignado ese auto en el stock. Si
      // el auto no tiene vendedor asignado, se reparte al azar entre los
      // vendedores activos (mismo criterio que los leads de WhatsApp sin
      // asignar). admin/encargado siguen viendo todas igual.
      if (data.vehiculoObjetivoId) {
        const { data: vehiculo } = await supabase.from("vehiculos").select("vendedor_asignado_id").eq("id", data.vehiculoObjetivoId).maybeSingle();
        vendedorFinanciacionId = vehiculo?.vendedor_asignado_id || null;
      }
      if (!vendedorFinanciacionId) {
        const { data: vendedores } = await supabase.from("perfiles").select("id").contains("roles", ["ventas"]).eq("activo", true);
        if (vendedores?.length) vendedorFinanciacionId = vendedores[Math.floor(Math.random() * vendedores.length)].id;
      }
      if (vendedorFinanciacionId) {
        const { error: errVendedor } = await supabase.from("leads_tasacion").update({ vendedor_id: vendedorFinanciacionId }).eq("id", lead.id);
        if (errVendedor) registrarError("api/panel/leads-tasacion:asignar-vendedor", errVendedor, { leadId: lead.id });
      }
    }

    // El link/módulo dependían de suponer siempre "tasación" -- una
    // solicitud de financiación (tipo: "financiacion") mandaba igual a
    // /panel/cotizaciones, una pantalla que no tiene nada que ver, y la
    // alerta se insertaba directo en "alertas" salteándose crearAlerta():
    // ni respetaba el módulo apagado por rol (visibilidad_sector) ni la
    // categoría de notificación que el destinatario haya silenciado en Mi
    // Espacio → Notificaciones.
    const esFinanciacion = data.tipo === "financiacion";
    const modulo = esFinanciacion ? "financiaciones" : "cotizaciones";
    const link = esFinanciacion ? "/panel/financiaciones" : "/panel/cotizaciones";
    const titulo = esFinanciacion ? `Nueva solicitud de financiación — ${data.nombre}` : `Nueva tasación desde la web — ${data.nombre}`;

    const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
    // El vendedor asignado a la financiación (o el sorteado al azar) recibe
    // la misma alerta además de admin/encargado -- se deduplica por si
    // también tiene rol admin/encargado, para no mandarle dos veces.
    const idsDestinatarios = new Set((destinatarios || []).map((d) => d.id));
    if (vendedorFinanciacionId) idsDestinatarios.add(vendedorFinanciacionId);
    for (const idDestinatario of idsDestinatarios) {
      await crearAlerta(supabase, idDestinatario, titulo, {
        mensaje: `${data.marca} ${data.modelo || ""} ${data.anio || ""}`.trim(),
        link,
        tipo: "lead_tasacion_nuevo",
        prioridad: "novedad",
        modulo,
        categoriaNotif: esFinanciacion ? undefined : "cotizaciones",
      });
    }

    return Response.json({ ok: true, id: lead.id });
  } catch (err) {
    registrarError("api/panel/leads-tasacion", err);
    return Response.json({ error: "Hubo un problema al enviar tu solicitud." }, { status: 500 });
  }
}

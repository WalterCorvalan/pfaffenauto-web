import { z } from "zod";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import { calcularPrecioSugerido } from "@/lib/tasadorIA";

// Paso previo del cotizador público: la IA busca comparables reales de mercado
// y ofrecemos el 80% de esa media (20% de margen para nosotros) — el cliente
// puede aceptar esa oferta o pedir un peritaje presencial para una tasación
// más precisa. Nunca bloqueamos el flujo: si la IA no encuentra comparables,
// el frontend simplemente salta este paso y sigue con el cotizador normal.

const BodySchema = z.object({
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(60),
  version: z.string().trim().max(100).optional().nullable(),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  kilometraje: z.coerce.number().min(0).max(2_000_000),
});

export async function POST(req: Request) {
  try {
    const ip = ipDesdeRequest(req);
    const limite = rateLimit(ip, { limite: 8, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ ok: false, error: "Demasiadas solicitudes. Reintentá en unos minutos." }, { status: 429 });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }

    const tasacion = await calcularPrecioSugerido(parsed.data, "api/cotizaciones/estimar-precio (público)");
    if (!tasacion.ok) {
      return Response.json({ ok: false, error: tasacion.error });
    }

    const oferta = Math.round(tasacion.data.precio_medio_mercado * 0.8);

    return Response.json({
      ok: true,
      precio_medio_mercado: tasacion.data.precio_medio_mercado,
      oferta,
    });
  } catch (err) {
    registrarError("api/cotizaciones/estimar-precio", err);
    return Response.json({ ok: false, error: "No se pudo estimar el precio." }, { status: 500 });
  }
}

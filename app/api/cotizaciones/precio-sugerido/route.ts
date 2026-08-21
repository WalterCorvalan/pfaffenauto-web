import { z } from "zod";
import { NextResponse } from "next/server";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import { calcularPrecioSugerido } from "@/lib/tasadorIA";

const PrecioSugeridoSchema = z.object({
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(60),
  version: z.string().trim().max(100).optional().nullable(),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  kilometraje: z.coerce.number().min(0).max(2_000_000),
});

// Botón manual "Sugerir con IA" del panel (PrecioSugeridoEditor.tsx). La
// tasación automática del cotizador de permuta vive en api/cotizaciones/route.ts
// y comparte la misma lógica vía lib/tasadorIA.ts.
export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 10, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas consultas. Esperá un momento." }, { status: 429 });
    }

    const parsed = PrecioSugeridoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Faltan datos del vehículo o tienen un formato inválido." }, { status: 400 });
    }

    const resultado = await calcularPrecioSugerido(parsed.data, "api/cotizaciones/precio-sugerido");
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    return NextResponse.json(resultado.data);
  } catch (err) {
    registrarError("api/cotizaciones/precio-sugerido", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

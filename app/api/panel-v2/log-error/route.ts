import { NextRequest, NextResponse } from "next/server";
import { registrarError } from "@/lib/panel/logger";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// Recibe errores del cliente (global-error.tsx) — no se puede llamar al
// logger directo desde el browser porque usa la service role. Sin sesión a
// propósito (un crash puede pasar en una página pública, sin login), pero
// con límite -- estaba público y sin tope, cualquiera podía floodear
// logs_errores con POSTs directos.
export async function POST(req: NextRequest) {
  const ip = ipDesdeRequest(req);
  const limite = await rateLimit(ip, { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ ok: false }, { status: 429 });

  try {
    const { mensaje, stack, url } = await req.json();
    registrarError("cliente", new Error(String(mensaje || "Error desconocido").slice(0, 500)), {
      stack_cliente: String(stack || "").slice(0, 2000),
      url: String(url || "").slice(0, 500),
    });
  } catch {
    // best-effort, no hace falta responder error acá
  }
  return NextResponse.json({ ok: true });
}

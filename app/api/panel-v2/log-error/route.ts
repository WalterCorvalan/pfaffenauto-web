import { NextRequest, NextResponse } from "next/server";
import { registrarError } from "@/lib/panelV2/logger";

// Recibe errores del cliente (global-error.tsx) — no se puede llamar al
// logger directo desde el browser porque usa la service role.
export async function POST(req: NextRequest) {
  try {
    const { mensaje, stack, url } = await req.json();
    registrarError("cliente", new Error(String(mensaje || "Error desconocido")), { stack_cliente: stack, url });
  } catch {
    // best-effort, no hace falta responder error acá
  }
  return NextResponse.json({ ok: true });
}

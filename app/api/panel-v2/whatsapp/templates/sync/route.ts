import { NextResponse } from "next/server";
import { sincronizarPlantillas, TemplateError } from "@/lib/panel/whatsappTemplates";

export async function POST() {
  try {
    const actualizadas = await sincronizarPlantillas();
    return NextResponse.json({ ok: true, actualizadas });
  } catch (err) {
    if (err instanceof TemplateError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "not_connected" ? 409 : 422 });
    }
    return NextResponse.json({ error: "Error sincronizando plantillas." }, { status: 500 });
  }
}

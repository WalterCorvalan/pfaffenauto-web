import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panelV2/logger";

const MAX_MB = 8;

// Igual a /api/ocr-dni (v1) pero autenticando contra nova. No guardamos la
// imagen — solo pasa por memoria, se procesa y se descarta.
const RespuestaOCRSchema = z.object({
  nombre: z.string().trim().max(100).nullable(),
  apellido: z.string().trim().max(100).nullable(),
  dni: z.string().trim().max(20).nullable(),
  fecha_nacimiento: z.string().trim().max(10).nullable(),
  domicilio_calle: z.string().trim().max(150).nullable(),
  domicilio_numero: z.string().trim().max(20).nullable(),
  localidad: z.string().trim().max(100).nullable(),
  provincia: z.string().trim().max(100).nullable(),
  codigo_postal: z.string().trim().max(20).nullable(),
});

export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 15, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiados escaneos. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE2_URL!,
      process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se encontró ninguna imagen." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `La imagen pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 500 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5",
        max_output_tokens: 500,
        input: [
          {
            role: "system",
            content:
              "Sos un sistema de OCR para DNI argentinos (frente o dorso). Extraé los datos visibles y respondé ÚNICA Y EXCLUSIVAMENTE un JSON válido, sin texto adicional, sin markdown, con esta forma exacta: " +
              '{"nombre": string|null, "apellido": string|null, "dni": string|null, "fecha_nacimiento": string|null, "domicilio_calle": string|null, "domicilio_numero": string|null, "localidad": string|null, "provincia": string|null, "codigo_postal": string|null}. ' +
              "fecha_nacimiento en formato YYYY-MM-DD. dni solo números, sin puntos. Si un campo no está visible en la imagen, va en null — no inventes nada.",
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: "Extraé los datos de este DNI." },
              { type: "input_image", image_url: dataUrl },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[panel-v2/ocr-dni] error OpenAI:", errText);
      return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 502 });
    }

    const data = await response.json();
    const textoSalida: string =
      data.output_text ??
      data.output?.flatMap((o: any) => o.content?.map((c: any) => c.text) || []).join("") ??
      "";

    const match = textoSalida.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "No se pudieron leer datos del DNI en la imagen." }, { status: 422 });
    }

    let jsonCrudo: unknown;
    try {
      jsonCrudo = JSON.parse(match[0]);
    } catch {
      return NextResponse.json({ error: "Respuesta inesperada de la IA." }, { status: 502 });
    }

    const parsed = RespuestaOCRSchema.safeParse(jsonCrudo);
    if (!parsed.success) {
      return NextResponse.json({ error: "Respuesta inesperada de la IA." }, { status: 502 });
    }

    if (!parsed.data.dni && !parsed.data.nombre && !parsed.data.apellido) {
      return NextResponse.json({ error: "No se pudieron leer datos del DNI en la imagen. Probá con otra foto." }, { status: 422 });
    }

    return NextResponse.json(parsed.data);
  } catch (err) {
    registrarError("api/panel-v2/ocr-dni", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { registrarCostoIA } from "./costoTracker";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Haiku: el modelo de Anthropic más barato que sirve bien para JSON estructurado
// (clasificar, calificar lead, responder corto). Nada de Sonnet acá.
const MODELO_ANTHROPIC = "claude-haiku-4-5-20251001";

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY || !!process.env.OPENROUTER_API_TOKEN;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

async function intentarAnthropic(
  systemMsg: string,
  conversationMsgs: { role: "user" | "assistant"; content: string }[],
  intentoCorreccion: boolean
): Promise<string> {
  const finalMsgs = !intentoCorreccion
    ? conversationMsgs
    : [
        ...conversationMsgs,
        {
          role: "user" as const,
          content: "IMPORTANTE: tu respuesta anterior no era JSON válido. Respondé ÚNICAMENTE con el JSON, sin texto extra ni backticks.",
        },
      ];

  // timeout corto + sin reintentos propios del SDK: si Anthropic no contesta
  // rápido (sin crédito, colgado, lo que sea), cae al fallback de OpenRouter
  // en vez de dejar la respuesta esperando varios minutos.
  const response = await anthropic.messages.create(
    {
      model: MODELO_ANTHROPIC,
      max_tokens: 1000,
      system: systemMsg,
      messages: finalMsgs,
    },
    { timeout: 8000, maxRetries: 0 }
  );

  let content = "";
  for (const block of response.content) {
    if (block.type === "text") content += block.text;
  }
  return content;
}

// Respaldo gratis (OPENROUTER_API_TOKEN, modelo :free en .env.local) — entra solo
// cuando Anthropic falla (sin crédito, error, lo que sea). Compatible con la API
// de OpenAI, misma idea de mensajes system/user.
async function intentarOpenRouter(
  systemMsg: string,
  conversationMsgs: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const res = await fetch(`${process.env.OPENROUTER_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [{ role: "system", content: systemMsg }, ...conversationMsgs],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`OpenRouter respondió ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  registrarCostoIA(data.usage?.cost).catch(() => {});
  return data.choices?.[0]?.message?.content ?? "";
}

export async function chatJson<T>(
  schema: z.ZodType<T>,
  messages: ChatMessage[],
  opts?: { maxRetries?: number }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!isAiConfigured()) return { ok: false, error: "No hay ninguna IA configurada (ni ANTHROPIC_API_KEY ni OPENROUTER_API_TOKEN)" };

  const maxRetries = opts?.maxRetries ?? 2;
  let lastError = "";

  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const conversationMsgs = messages.filter((m) => m.role !== "system") as {
    role: "user" | "assistant";
    content: string;
  }[];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Primero Anthropic (Haiku, barato); si falla, cae a OpenRouter gratis.
    for (const proveedor of ["anthropic", "openrouter"] as const) {
      if (proveedor === "anthropic" && !process.env.ANTHROPIC_API_KEY) continue;
      if (proveedor === "openrouter" && !process.env.OPENROUTER_API_TOKEN) continue;
      try {
        const content =
          proveedor === "anthropic"
            ? await intentarAnthropic(systemMsg, conversationMsgs, attempt > 0)
            : await intentarOpenRouter(systemMsg, conversationMsgs);

        const jsonStr = extractJson(content);
        const parsed = JSON.parse(jsonStr);
        const validated = schema.parse(parsed);
        return { ok: true, data: validated };
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Error desconocido";
      }
    }
  }

  return { ok: false, error: lastError };
}

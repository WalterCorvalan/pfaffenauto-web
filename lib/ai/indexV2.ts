import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { registrarUsoAnthropicV2 } from "./usageLoggerV2";

// Fork de lib/ai/index.ts para panel-v2 — mismo motor (Claude Haiku, con
// respaldo OpenRouter), pero el conteo de uso va a la base nova, no a v1.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const MODELO_ANTHROPIC = "claude-haiku-4-5-20251001";

export function isAiConfiguredV2(): boolean {
  return !!process.env.ANTHROPIC_API_KEY || !!process.env.OPENROUTER_API_TOKEN;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

async function intentarAnthropic(
  systemMsg: string,
  conversationMsgs: { role: "user" | "assistant"; content: string }[],
  intentoCorreccion: boolean,
  origen: string
): Promise<string> {
  const finalMsgs = !intentoCorreccion
    ? conversationMsgs
    : [...conversationMsgs, { role: "user" as const, content: "IMPORTANTE: tu respuesta anterior no era JSON válido. Respondé ÚNICAMENTE con el JSON, sin texto extra ni backticks." }];

  const response = await anthropic.messages.create(
    { model: MODELO_ANTHROPIC, max_tokens: 1000, system: systemMsg, messages: finalMsgs },
    { timeout: 8000, maxRetries: 0 }
  );

  registrarUsoAnthropicV2(origen, { inputTokens: response.usage?.input_tokens || 0, outputTokens: response.usage?.output_tokens || 0 });

  let content = "";
  for (const block of response.content) if (block.type === "text") content += block.text;
  return content;
}

async function intentarOpenRouter(systemMsg: string, conversationMsgs: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const res = await fetch(`${process.env.OPENROUTER_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL, messages: [{ role: "system", content: systemMsg }, ...conversationMsgs] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`OpenRouter respondió ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function chatJsonV2<T>(
  schema: z.ZodType<T>,
  messages: ChatMessage[],
  opts?: { maxRetries?: number; origen?: string }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const origen = opts?.origen ?? "desconocido";
  if (!isAiConfiguredV2()) return { ok: false, error: "No hay ninguna IA configurada (ni ANTHROPIC_API_KEY ni OPENROUTER_API_TOKEN)" };

  const maxRetries = opts?.maxRetries ?? 2;
  let lastError = "";
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const conversationMsgs = messages.filter((m) => m.role !== "system") as { role: "user" | "assistant"; content: string }[];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const proveedor of ["anthropic", "openrouter"] as const) {
      if (proveedor === "anthropic" && !process.env.ANTHROPIC_API_KEY) continue;
      if (proveedor === "openrouter" && !process.env.OPENROUTER_API_TOKEN) continue;
      try {
        const content = proveedor === "anthropic" ? await intentarAnthropic(systemMsg, conversationMsgs, attempt > 0, origen) : await intentarOpenRouter(systemMsg, conversationMsgs);
        const parsed = JSON.parse(extractJson(content));
        const validated = schema.parse(parsed);
        return { ok: true, data: validated };
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Error desconocido";
      }
    }
  }
  return { ok: false, error: lastError };
}

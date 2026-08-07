import { z } from "zod";

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api";
const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.5";

export function isAiConfigured(): boolean {
  return !!process.env.OPENROUTER_API_TOKEN;
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

export async function chatJson<T>(
  schema: z.ZodType<T>,
  messages: ChatMessage[],
  opts?: { maxRetries?: number }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const token = process.env.OPENROUTER_API_TOKEN;
  if (!token) return { ok: false, error: "OPENROUTER_API_TOKEN no configurado" };

  const maxRetries = opts?.maxRetries ?? 2;
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const finalMessages =
        attempt === 0
          ? messages
          : [
              ...messages,
              {
                role: "user" as const,
                content: "IMPORTANTE: tu respuesta anterior no era JSON válido. Respondé ÚNICAMENTE con el JSON, sin texto extra ni backticks.",
              },
            ];

      const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, messages: finalMessages }),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const jsonStr = extractJson(content);
      const parsed = JSON.parse(jsonStr);
      const validated = schema.parse(parsed);
      return { ok: true, data: validated };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Error desconocido";
    }
  }

  return { ok: false, error: lastError };
}
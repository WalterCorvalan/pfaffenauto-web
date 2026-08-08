import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
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
  if (!isAiConfigured()) return { ok: false, error: "ANTHROPIC_API_KEY no configurado" };

  const maxRetries = opts?.maxRetries ?? 2;
  let lastError = "";

  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const conversationMsgs = messages.filter((m) => m.role !== "system") as {
    role: "user" | "assistant";
    content: string;
  }[];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const finalMsgs =
        attempt === 0
          ? conversationMsgs
          : [
              ...conversationMsgs,
              {
                role: "user" as const,
                content: "IMPORTANTE: tu respuesta anterior no era JSON válido. Respondé ÚNICAMENTE con el JSON, sin texto extra ni backticks.",
              },
            ];

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: systemMsg,
        messages: finalMsgs,
      });

      let content = "";
      for (const block of response.content) {
        if (block.type === "text") content += block.text;
      }

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
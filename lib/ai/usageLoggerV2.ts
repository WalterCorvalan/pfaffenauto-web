import { createClient } from "@supabase/supabase-js";

// Igual que lib/ai/usageLogger.ts pero escribiendo en la base nueva (nova) —
// panel-v2 tiene su propio uso_ia_anthropic, separado del de v1.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export function registrarUsoAnthropicV2(
  origen: string,
  uso: { inputTokens: number; outputTokens: number }
) {
  supabaseAdmin
    .from("uso_ia_anthropic")
    .insert({ origen, input_tokens: uso.inputTokens, output_tokens: uso.outputTokens })
    .then(({ error }) => {
      if (error) console.error("[usageLoggerV2] no se pudo registrar el uso de IA:", error.message);
    });
}

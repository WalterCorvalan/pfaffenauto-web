import { createClient } from "@supabase/supabase-js";

// OpenAI no devuelve el costo en USD de la llamada (a diferencia de
// OpenRouter, que sí lo trae y alimenta registrarCostoIA). Acá guardamos lo
// que la API sí reporta — tokens y cantidad de búsquedas web — para poder
// cruzarlo después contra el pricing vigente en vez de inventar un número.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function registrarUsoIA(
  origen: string,
  uso: { inputTokens: number; outputTokens: number; webSearchCalls: number }
) {
  supabaseAdmin
    .from("uso_ia_openai")
    .insert({
      origen,
      input_tokens: uso.inputTokens,
      output_tokens: uso.outputTokens,
      web_search_calls: uso.webSearchCalls,
    })
    .then(({ error }) => {
      if (error) console.error("[usageLogger] no se pudo registrar el uso de IA (openai):", error.message);
    });
}

export function registrarUsoAnthropic(
  origen: string,
  uso: { inputTokens: number; outputTokens: number }
) {
  supabaseAdmin
    .from("uso_ia_anthropic")
    .insert({
      origen,
      input_tokens: uso.inputTokens,
      output_tokens: uso.outputTokens,
    })
    .then(({ error }) => {
      if (error) console.error("[usageLogger] no se pudo registrar el uso de IA (anthropic):", error.message);
    });
}

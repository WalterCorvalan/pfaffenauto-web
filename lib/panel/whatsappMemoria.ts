import { SupabaseClient } from "@supabase/supabase-js";

// "Memoria" del bot: respuestas fijas por palabra clave, sin llamar a la IA
// (mismo criterio que /api/buscar-ia: DB/memoria primero, IA solo si no
// matchea nada). Categorías configurables desde Configuración → WhatsApp →
// Memoria del bot.

const REGEX_DIACRITICOS = new RegExp("[̀-ͯ]", "g");

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(REGEX_DIACRITICOS, ""); // saca tildes: "cómo llego" -> "como llego"
}

export async function buscarRespuestaMemoria(supabase: SupabaseClient, textoCliente: string): Promise<string | null> {
  const texto = normalizar(textoCliente);
  const { data } = await supabase
    .from("whatsapp_memoria")
    .select("respuesta, palabras_clave")
    .eq("activo", true)
    .neq("categoria", "fuera_horario")
    .order("orden", { ascending: true });

  for (const fila of data ?? []) {
    const match = (fila.palabras_clave as string[]).some((p) => texto.includes(normalizar(p)));
    if (match) return fila.respuesta;
  }
  return null;
}

export async function buscarRespuestaFueraHorario(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("whatsapp_memoria")
    .select("respuesta")
    .eq("categoria", "fuera_horario")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.respuesta ?? null;
}

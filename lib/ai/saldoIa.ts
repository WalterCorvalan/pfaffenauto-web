import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Saldo estimado de la API de Anthropic y aviso cuando queda poco.
//
// Anthropic no ofrece ninguna forma de consultar el saldo restante por API, así que se ESTIMA: el admin carga cuánto
// cargó en la Consola de Anthropic y desde cuándo (Configuración > Empresa > IA), y acá se le resta el gasto estimado
// de todo lo que registra uso_ia_anthropic desde esa fecha (tokens x tarifa). Es una estimación: conviene recalibrarla
// de vez en cuando cargando el saldo real que muestra la Consola.
// Server-only (usa la service role): no importar desde componentes "use client".

const supabaseAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);

// USD por millón de tokens (entrada / salida). Haiku 4.5 es lo que usa el bot, el buscador y el gerente; la
// cotización de mercado usa un modelo Sonnet (más caro), por eso tiene su propia tarifa.
const TARIFA_HAIKU = { entrada: 1, salida: 5 };
const TARIFA_SONNET = { entrada: 3, salida: 15 };
const ORIGENES_SONNET = new Set(["panel-v2/cotizacion-mercado"]);

export interface EstimacionSaldoIa {
  configurado: boolean;
  saldoInicialUsd: number | null;
  desde: string | null;
  umbralUsd: number;
  gastadoUsd: number;
  restanteUsd: number | null;
  porOrigen: { origen: string; usd: number }[];
}

export async function estimarSaldoIa(): Promise<EstimacionSaldoIa> {
  const supabase = supabaseAdmin();
  const { data: cfg } = await supabase.from("configuracion_empresa").select("ia_saldo_inicial_usd, ia_saldo_desde, ia_alerta_saldo_usd").eq("id", true).maybeSingle();
  const umbralUsd = Number(cfg?.ia_alerta_saldo_usd ?? 5);
  const saldoInicial = cfg?.ia_saldo_inicial_usd != null ? Number(cfg.ia_saldo_inicial_usd) : null;
  const desde: string | null = cfg?.ia_saldo_desde ?? null;
  if (saldoInicial == null || !desde) return { configurado: false, saldoInicialUsd: saldoInicial, desde, umbralUsd, gastadoUsd: 0, restanteUsd: null, porOrigen: [] };

  // Se suma por páginas (PostgREST corta en 1000 filas).
  const gastoPorOrigen: Record<string, number> = {};
  for (let pagina = 0; pagina < 200; pagina++) {
    const { data, error } = await supabase.from("uso_ia_anthropic").select("origen, input_tokens, output_tokens").gte("created_at", desde).order("created_at").range(pagina * 1000, pagina * 1000 + 999);
    if (error || !data) break;
    data.forEach((r) => {
      const t = ORIGENES_SONNET.has(r.origen) ? TARIFA_SONNET : TARIFA_HAIKU;
      const usd = ((r.input_tokens || 0) / 1_000_000) * t.entrada + ((r.output_tokens || 0) / 1_000_000) * t.salida;
      gastoPorOrigen[r.origen || "desconocido"] = (gastoPorOrigen[r.origen || "desconocido"] || 0) + usd;
    });
    if (data.length < 1000) break;
  }
  const gastadoUsd = Object.values(gastoPorOrigen).reduce((a, b) => a + b, 0);
  return {
    configurado: true, saldoInicialUsd: saldoInicial, desde, umbralUsd, gastadoUsd,
    restanteUsd: saldoInicial - gastadoUsd,
    porOrigen: Object.entries(gastoPorOrigen).map(([origen, usd]) => ({ origen, usd })).sort((a, b) => b.usd - a.usd),
  };
}

// Avisa a los admin (alerta en el panel). No repite el aviso dentro de `minHoras`.
export async function avisarSaldoIa(titulo: string, mensaje: string, minHoras: number): Promise<{ avisado: boolean }> {
  const supabase = supabaseAdmin();
  const { data: cfg } = await supabase.from("configuracion_empresa").select("ia_alerta_enviada_en").eq("id", true).maybeSingle();
  if (cfg?.ia_alerta_enviada_en && Date.now() - new Date(cfg.ia_alerta_enviada_en).getTime() < minHoras * 3600000) return { avisado: false };

  const { data: admins } = await supabase.from("perfiles").select("id").contains("roles", ["admin"]).eq("activo", true);
  for (const a of admins || []) {
    await crearAlerta(supabase, a.id, titulo, { mensaje, link: "/panel/configuracion/empresa", tipo: "ia_saldo", prioridad: "alta" });
  }
  await supabase.from("configuracion_empresa").update({ ia_alerta_enviada_en: new Date().toISOString() }).eq("id", true);
  return { avisado: true };
}

// Se llama cuando Anthropic rechaza una consulta por falta de crédito (aviso real, no estimado).
export function avisarSaldoAgotado() {
  avisarSaldoIa(
    "Se quedó sin crédito la API de Anthropic",
    "Anthropic rechazó una consulta por falta de saldo. El bot, el buscador y el gerente dejan de responder con IA hasta que cargues crédito en console.anthropic.com.",
    6
  ).catch(() => {});
}

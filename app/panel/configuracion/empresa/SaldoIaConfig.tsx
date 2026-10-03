"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";

// Configuración > Empresa > IA: cuánto crédito tiene la API de Anthropic (el motor del bot, el buscador y el gerente) y
// cuándo avisar. Anthropic no permite consultar el saldo por API, así que acá se carga lo que se cargó en
// console.anthropic.com y el panel estima lo que queda restando el gasto registrado desde esa fecha.

interface Estimacion {
  configurado: boolean; saldoInicialUsd: number | null; desde: string | null; umbralUsd: number;
  gastadoUsd: number; restanteUsd: number | null; porOrigen: { origen: string; usd: number }[];
}

const NOMBRE_ORIGEN: Record<string, string> = {
  "api/buscar-ia": "Buscador del sitio", "gerente_dashboard": "Gerente", "panel-v2/cotizacion-mercado": "Cotización de mercado",
};
const usd = (n: number) => `US$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0145F2]";

export default function SaldoIaConfig() {
  const [est, setEst] = useState<Estimacion | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [saldo, setSaldo] = useState("");
  const [umbral, setUmbral] = useState("5");

  const cargar = async () => {
    const res = await fetch("/api/panel/ia-saldo");
    const data = await res.json();
    if (!res.ok) { setError(data.error || "No se pudo cargar."); return; }
    setEst(data);
    setUmbral(String(data.umbralUsd ?? 5));
  };
  useEffect(() => { cargar(); }, []);

  const guardar = async (patch: Record<string, unknown>, ok: string) => {
    setGuardando(true); setMensaje("");
    const res = await fetch("/api/panel/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? ok : data.error || "No se pudo guardar. ¿Ya corriste el SQL de IA?");
    setGuardando(false);
    if (res.ok) cargar();
    setTimeout(() => setMensaje(""), 3000);
  };

  // Al cargar un saldo nuevo, el cálculo arranca de cero desde AHORA: el saldo que se ingresa es el real de la Consola hoy.
  const guardarSaldo = () => {
    const n = Number(saldo.replace(",", "."));
    if (!isFinite(n) || n < 0) { setMensaje("Ingresá un monto válido en dólares."); return; }
    guardar({ ia_saldo_inicial_usd: n, ia_saldo_desde: new Date().toISOString() }, "Saldo guardado. Desde ahora se descuenta el gasto.");
    setSaldo("");
  };

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!est) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const restante = est.restanteUsd;
  const bajo = restante != null && restante <= est.umbralUsd;
  const pct = est.saldoInicialUsd && restante != null ? Math.max(0, Math.min(100, (restante / est.saldoInicialUsd) * 100)) : 0;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-indigo-500" /> Crédito de la IA (Anthropic)</p>
          <p className="text-xs text-slate-400 mt-1">Es el motor del bot de WhatsApp, el buscador del sitio, el gerente y la cotización de mercado. Si se acaba el crédito, dejan de responder con IA.</p>
        </div>

        {est.configurado && restante != null ? (
          <div className={`rounded-xl p-4 border ${bajo ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"}`}>
            <p className="text-[10px] font-bold uppercase text-slate-500">Saldo estimado</p>
            <p className={`text-3xl font-black font-mono ${bajo ? "text-rose-600 dark:text-rose-300" : "text-slate-900 dark:text-white"}`}>{usd(Math.max(0, restante))}</p>
            <div className="h-1.5 rounded-full bg-white/70 dark:bg-white/10 overflow-hidden mt-2"><div className={`h-full rounded-full ${bajo ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Cargaste {usd(est.saldoInicialUsd || 0)} el {est.desde ? new Date(est.desde).toLocaleDateString("es-AR") : "—"} · gasto estimado desde entonces: {usd(est.gastadoUsd)}
            </p>
            {bajo && <p className="text-xs font-bold text-rose-600 dark:text-rose-300 mt-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Quedan {usd(Math.max(0, restante))}: cargá crédito en console.anthropic.com.</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50 dark:bg-white/5 rounded-xl p-4">Todavía no cargaste el saldo, así que no se puede avisar. Ingresá abajo cuánto crédito tenés hoy en la Consola de Anthropic.</p>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Saldo que tenés hoy en la Consola de Anthropic (US$)</label>
          <div className="flex gap-2">
            <input value={saldo} onChange={(e) => setSaldo(e.target.value)} inputMode="decimal" placeholder="ej: 25" className={inputClass} />
            <button onClick={guardarSaldo} disabled={guardando || !saldo.trim()} className="px-4 py-2 rounded-lg bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold disabled:opacity-50 shrink-0">Guardar</button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Volvé a cargarlo cada vez que sumes crédito, o de vez en cuando para ajustar la estimación con el número real.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Avisarme cuando queden (US$)</label>
          <div className="flex gap-2">
            <input value={umbral} onChange={(e) => setUmbral(e.target.value)} inputMode="decimal" className={inputClass} />
            <button onClick={() => { const n = Number(umbral.replace(",", ".")); if (isFinite(n) && n >= 0) guardar({ ia_alerta_saldo_usd: n }, "Aviso guardado."); }} disabled={guardando} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-bold disabled:opacity-50 shrink-0">Guardar</button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Llega una alerta en el panel a los administradores, una vez por día, mientras el saldo esté por debajo de ese monto. Además, si Anthropic llega a rechazar una consulta por falta de crédito, el aviso llega al instante.</p>
        </div>

        {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
      </div>

      {est.porOrigen.length > 0 && (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">En qué se fue el gasto desde esa fecha</p>
          <div className="space-y-1.5">
            {est.porOrigen.map((o) => (
              <div key={o.origen} className="flex items-center justify-between text-xs"><span className="text-slate-600 dark:text-slate-300">{NOMBRE_ORIGEN[o.origen] || o.origen}</span><span className="font-mono font-bold text-slate-500">{usd(o.usd)}</span></div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3">Es una estimación: se calcula con la cantidad de texto procesado y las tarifas de Anthropic (el bot, el buscador y el gerente usan el modelo económico; la cotización de mercado usa uno más caro). Puede diferir un poco de lo que muestra la Consola.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, Trophy, TrendingUp, Handshake, DollarSign } from "lucide-react";

interface RankingFila { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }
interface Props {
  miNombre: string; ocultarMontos: boolean;
  diaDelMes: number; diasEnElMes: number;
  ventasDelMes: number; ventasMesAnterior: number;
  gananciaPorMoneda: Record<string, number>;
  consignacionesDelMes: number;
  ranking: RankingFila[];
}

const PREGUNTAS_RAPIDAS = ["¿Qué debería atacar hoy?", "¿Cómo venimos con el stock parado?", "¿Hay leads calientes sin contactar?", "¿Qué comisiones están trabadas?"];

function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}
function fmtPorMoneda(map: Record<string, number>) {
  const entradas = Object.entries(map).filter(([, v]) => v !== 0);
  if (entradas.length === 0) return "—";
  return entradas.map(([m, v]) => fmtMoneda(v, m)).join(" · ");
}

export default function CockpitCeoTab({ miNombre, ocultarMontos, diaDelMes, diasEnElMes, ventasDelMes, ventasMesAnterior, gananciaPorMoneda, consignacionesDelMes, ranking }: Props) {
  const [mensajes, setMensajes] = useState<{ role: "user" | "assistant"; content: string; link?: string | null }[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  const enviar = async (texto: string) => {
    if (!texto.trim() || cargando) return;
    const nuevoHistorial = [...mensajes, { role: "user" as const, content: texto }];
    setMensajes(nuevoHistorial);
    setPregunta("");
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/panel-v2/gerente/preguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: texto, historial: nuevoHistorial }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo responder.");
      setMensajes((prev) => [...prev, { role: "assistant", content: data.reply, link: data.link }]);
    } catch (e: any) {
      setError(e.message || "Error al preguntar.");
    } finally {
      setCargando(false);
    }
  };

  const avancePct = Math.round((diaDelMes / diasEnElMes) * 100);
  const variacionAnual = ventasMesAnterior > 0 ? Math.round(((ventasDelMes - ventasMesAnterior) / ventasMesAnterior) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-900 text-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
          <div>
            <p className="font-black">Preguntale al gerente</p>
            <p className="text-xs text-indigo-200">Mira los números de hoy y te dice qué conviene hacer. (Sin búsqueda de mercado todavía — solo datos del CRM.)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {PREGUNTAS_RAPIDAS.map((p) => (
            <button key={p} onClick={() => enviar(p)} disabled={cargando} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold disabled:opacity-50">{p}</button>
          ))}
        </div>

        {mensajes.length > 0 && (
          <div className="bg-white/10 rounded-xl p-3 mb-3 max-h-72 overflow-y-auto space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div className={`inline-block max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-white text-indigo-900" : "bg-indigo-950/40 text-white"}`}>
                  {m.content}
                  {m.link && <Link href={m.link} className="block mt-1.5 text-xs font-bold underline">Ir ahora →</Link>}
                </div>
              </div>
            ))}
            <div ref={finRef} />
          </div>
        )}

        {error && <p className="text-xs text-rose-200 mb-2">{error}</p>}

        <div className="flex gap-2">
          <textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(pregunta); } }}
            placeholder="Escribí tu pregunta... (ej: ¿qué autos bajo de precio?)"
            rows={2}
            className="flex-1 rounded-xl bg-white text-slate-900 px-3 py-2.5 text-sm outline-none resize-none"
          />
          <button onClick={() => enviar(pregunta)} disabled={cargando || !pregunta.trim()} className="px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0">
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Cockpit CEO</p>
          <p className="text-lg font-black">Buen día, {miNombre}</p>
          <p className="text-xs text-indigo-200">Día {diaDelMes} de {diasEnElMes}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Avance del mes</p>
          <p className="text-3xl font-black">{avancePct}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5" /> Autos vendidos</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{ventasDelMes}</p>
          {variacionAnual !== null && <p className={`text-[11px] mt-1 font-bold ${variacionAnual >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{variacionAnual >= 0 ? "+" : ""}{variacionAnual}% vs mismo mes año anterior</p>}
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5" /> Ganancia del mes</p>
          <p className={`text-2xl font-black text-slate-900 dark:text-white ${ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(gananciaPorMoneda)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Precio venta − precio propietario (expedientes)</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><Handshake className="w-3.5 h-3.5" /> Consignaciones del mes</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{consignacionesDelMes}</p>
          <p className="text-[11px] text-slate-400 mt-1">Autos de terceros que ingresaron</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><Trophy className="w-3.5 h-3.5" /> Mejor vendedor</p>
          <p className="text-lg font-black text-slate-900 dark:text-white truncate">{ranking[0]?.nombre || "—"}</p>
          <p className="text-[11px] text-slate-400 mt-1">{ranking[0] ? `${ranking[0].ventas_equivalentes} venta${ranking[0].ventas_equivalentes === 1 ? "" : "s"}` : "Sin datos todavía"}</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-indigo-500" /> Ranking del mes</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
              <th className="py-1.5">Vendedor</th>
              <th className="py-1.5 text-right">Ventas</th>
              <th className="py-1.5 text-right">Consignaciones</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.vendedor_id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                <td className="py-1.5 font-bold text-slate-700 dark:text-slate-200">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"} {r.nombre}</td>
                <td className="py-1.5 text-right font-mono">{r.ventas_equivalentes}</td>
                <td className="py-1.5 text-right font-mono">{r.consignaciones}</td>
              </tr>
            ))}
            {ranking.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs">Sin vendedores activos este mes.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">Comparativo con "cierre del mes anterior" completo y objetivos configurables quedan para una próxima tanda.</p>
    </div>
  );
}

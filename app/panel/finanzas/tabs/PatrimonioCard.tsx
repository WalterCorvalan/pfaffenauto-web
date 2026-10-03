"use client";

import { useEffect, useState } from "react";
import { Landmark, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";
import { fmt } from "./shared";

// Patrimonio de la agencia comparado contra ayer / semana / mes / año.
// Las fotos las guarda todas las noches la función tomar_foto_patrimonio()
// (migraciones/sql_patrimonio_fotos.sql): una fila por día y por moneda, así que
// una comparación recién aparece cuando existe una foto de esa fecha o anterior.
// Pesos y dólares nunca se mezclan.

interface Foto {
  fecha: string; moneda: string; cuentas: number; stock_costo: number; stock_venta: number;
  a_cobrar: number; a_pagar: number; patrimonio_costo: number; patrimonio_venta: number;
  autos_en_stock: number; autos_sin_costo: number;
}

function restarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}
function restarMeses(fecha: string, meses: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - meses);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimoDia));
  return d.toISOString().slice(0, 10);
}
function fechaCorta(f: string) {
  const [a, m, d] = f.split("-");
  return `${d}/${m}/${a}`;
}

const PERIODOS = [
  { key: "ayer", label: "vs. ayer", objetivo: (f: string) => restarDias(f, 1) },
  { key: "semana", label: "vs. semana anterior", objetivo: (f: string) => restarDias(f, 7) },
  { key: "mes", label: "vs. mes anterior", objetivo: (f: string) => restarMeses(f, 1) },
  { key: "anio", label: "vs. año anterior", objetivo: (f: string) => restarMeses(f, 12) },
] as const;

export default function PatrimonioCard() {
  const [fotos, setFotos] = useState<Foto[] | null>(null);
  const [error, setError] = useState(false);
  const [base, setBase] = useState<"costo" | "venta">("costo");

  useEffect(() => {
    let vivo = true;
    supabase2.from("patrimonio_fotos").select("*").order("fecha", { ascending: false }).limit(800).then(({ data, error: dbError }) => {
      if (!vivo) return;
      if (dbError) { setError(true); return; }
      setFotos((data || []) as Foto[]);
    });
    return () => { vivo = false; };
  }, []);

  if (error) return null; // la tabla todavía no existe en la base: no se muestra nada
  if (fotos === null) return null;

  const campo = base === "costo" ? "patrimonio_costo" : "patrimonio_venta";
  const stockCampo = base === "costo" ? "stock_costo" : "stock_venta";

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Landmark className="w-4 h-4 text-[#0145F2]" /> Patrimonio de la agencia</p>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 rounded-lg p-0.5">
          {([["costo", "Stock a costo"], ["venta", "Stock a precio de venta"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setBase(k)} className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${base === k ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}>{label}</button>
          ))}
        </div>
      </div>

      {fotos.length === 0 ? (
        <p className="text-xs text-slate-400">Todavía no hay fotos guardadas. Se toma una por noche; mañana va a aparecer la primera comparación.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {["ARS", "USD"].map((moneda) => {
            const deMoneda = fotos.filter((f) => f.moneda === moneda);
            const actual = deMoneda[0];
            if (!actual) return null;
            return (
              <div key={moneda} className="rounded-xl border border-slate-100 dark:border-white/10 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">{moneda === "USD" ? "Dólares" : "Pesos"} · foto del {fechaCorta(actual.fecha)}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{fmt(Number(actual[campo]), moneda)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cuentas {fmt(Number(actual.cuentas), moneda)} + stock {fmt(Number(actual[stockCampo]), moneda)} ({actual.autos_en_stock} autos) + a cobrar {fmt(Number(actual.a_cobrar), moneda)} − a pagar {fmt(Number(actual.a_pagar), moneda)}
                </p>
                {base === "costo" && actual.autos_sin_costo > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{actual.autos_sin_costo} auto{actual.autos_sin_costo === 1 ? "" : "s"} sin precio de compra cargado: el stock a costo está subestimado.</p>
                )}
                <div className="mt-2 space-y-1">
                  {PERIODOS.map((p) => {
                    const objetivo = p.objetivo(actual.fecha);
                    const previa = deMoneda.find((f) => f.fecha <= objetivo && f.fecha < actual.fecha);
                    if (!previa) return (
                      <div key={p.key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{p.label}</span><span className="text-slate-400">sin datos todavía</span>
                      </div>
                    );
                    const dif = Number(actual[campo]) - Number(previa[campo]);
                    const pct = Number(previa[campo]) !== 0 ? (dif / Math.abs(Number(previa[campo]))) * 100 : null;
                    const Icono = dif > 0 ? TrendingUp : dif < 0 ? TrendingDown : Minus;
                    const color = dif > 0 ? "text-emerald-600 dark:text-emerald-400" : dif < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500";
                    return (
                      <div key={p.key} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{p.label} <span className="text-slate-400">({fechaCorta(previa.fecha)})</span></span>
                        <span className={`font-bold font-mono flex items-center gap-1 ${color}`}>
                          <Icono className="w-3.5 h-3.5" /> {dif > 0 ? "+" : dif < 0 ? "−" : ""}{fmt(Math.abs(dif), moneda)}{pct !== null && ` (${dif > 0 ? "+" : dif < 0 ? "−" : ""}${Math.abs(pct).toFixed(1)}%)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

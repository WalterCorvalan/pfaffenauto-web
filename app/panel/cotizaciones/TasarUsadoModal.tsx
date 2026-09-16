"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Calculator, Loader2 } from "lucide-react";

interface Props {
  marcaInicial: string;
  modeloInicial: string;
  anioInicial: string;
  kmInicial: string;
  onClose: () => void;
  onTasado: (valor: number) => void;
}

// Tramos de descuento por kilometraje sobre el promedio de similares --
// valores dados por el dueño de la agencia, no inventar/ajustar sin
// confirmar. Se evalúan en orden, el primero que matchea gana.
const TRAMOS_DESCUENTO_KM: { hasta: number; pct: number }[] = [
  { hasta: 50_000, pct: 8 },
  { hasta: 80_000, pct: 10 },
  { hasta: 100_000, pct: 12 },
  { hasta: 120_000, pct: 14 },
  { hasta: 180_000, pct: 16 },
  { hasta: Infinity, pct: 20 },
];
function descuentoPorKm(km: number): number {
  return (TRAMOS_DESCUENTO_KM.find((t) => km <= t.hasta) || TRAMOS_DESCUENTO_KM[TRAMOS_DESCUENTO_KM.length - 1]).pct;
}

export default function TasarUsadoModal({ marcaInicial, modeloInicial, anioInicial, kmInicial, onClose, onTasado }: Props) {
  const [marca, setMarca] = useState(marcaInicial);
  const [modelo, setModelo] = useState(modeloInicial);
  const [anio, setAnio] = useState(anioInicial);
  const [km, setKm] = useState(kmInicial);
  const [tasando, setTasando] = useState(false);
  const [resultado, setResultado] = useState<{ promedio: number; ajustado: number; moneda: string; n: number; descuentoPct: number } | null>(null);
  const [sinDatos, setSinDatos] = useState(false);

  const tasar = async () => {
    if (!marca.trim() && !modelo.trim()) return;
    setTasando(true);
    setResultado(null);
    setSinDatos(false);
    try {
      let q = supabase2.from("vehiculos").select("precio_venta, moneda_venta, anio, km");
      if (marca.trim()) q = q.ilike("marca", `%${marca.trim()}%`);
      if (modelo.trim()) q = q.ilike("modelo", `%${modelo.trim()}%`);
      // Año ±2: con el stock propio como única fuente, exigir el año exacto
      // deja la muestra casi siempre vacía -- una franja angosta alrededor
      // del año declarado es un compromiso razonable entre precisión y
      // tener algo para promediar.
      const anioNum = Number(anio);
      if (anioNum) q = q.gte("anio", anioNum - 2).lte("anio", anioNum + 2);
      const { data } = await q.limit(50);
      const similares = (data || []).filter((v) => v.precio_venta);
      if (similares.length === 0) {
        setSinDatos(true);
        return;
      }
      const monedaMasComun = similares.filter((v) => v.moneda_venta === "USD").length >= similares.length / 2 ? "USD" : "ARS";
      const enMoneda = similares.filter((v) => v.moneda_venta === monedaMasComun);
      const promedio = enMoneda.reduce((acc, v) => acc + Number(v.precio_venta), 0) / enMoneda.length;
      const kmNum = Number(km) || 0;
      const descuentoPct = descuentoPorKm(kmNum);
      const ajustado = promedio * (1 - descuentoPct / 100);
      setResultado({ promedio: Math.round(promedio), ajustado: Math.round(ajustado), moneda: monedaMasComun, n: enMoneda.length, descuentoPct });
    } finally {
      setTasando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Sugerencia basada en autos similares de tu historial</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className={labelClass}>Marca</label><input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Modelo</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Año</label><input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Kilómetros</label><input type="text" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} className={inputClass} /></div>
        </div>

        <button type="button" onClick={tasar} disabled={tasando || (!marca.trim() && !modelo.trim())} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold disabled:opacity-50">
          {tasando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calculator className="w-4 h-4" /> Tasar</>}
        </button>

        {resultado && (
          <div className="mt-4 text-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{resultado.moneda} {resultado.ajustado.toLocaleString("es-AR")}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Promedio {resultado.moneda} {resultado.promedio.toLocaleString("es-AR")} de {resultado.n} vehículo{resultado.n === 1 ? "" : "s"} similar{resultado.n === 1 ? "" : "es"} (±2 años) − {resultado.descuentoPct}% por kilometraje
            </p>
            <button type="button" onClick={() => onTasado(resultado.ajustado)} className="mt-3 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">Usar este valor</button>
          </div>
        )}
        {sinDatos && <p className="mt-4 text-xs text-center text-slate-400">Todavía no hay vehículos similares en tu stock para comparar.</p>}

        <p className="text-[10px] text-slate-400 text-center mt-3">Es una referencia — la decisión final es tuya.</p>
      </div>
    </div>
  );
}

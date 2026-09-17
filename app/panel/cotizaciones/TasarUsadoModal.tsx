"use client";

import { useEffect, useState } from "react";
import { X, Calculator, Loader2 } from "lucide-react";

interface Props {
  marcaInicial: string;
  modeloInicial: string;
  versionInicial?: string;
  anioInicial: string;
  kmInicial: string;
  onClose: () => void;
  // Sin destino real donde guardar el valor (ej. lead de tasación pedida
  // desde la web, de solo lectura) -- se omite y el modal queda en modo
  // "solo consulta", sin el botón "Usar este valor".
  onTasado?: (valor: number) => void;
  // Cuando los datos ya vienen completos y confiables (ej. desde un lead
  // que el cliente mismo cargó), tasar apenas se abre el modal ahorra el
  // click extra de "Calcular" -- en el flujo de permuta manual no conviene
  // (el vendedor recién está completando/corrigiendo los campos).
  autoTasar?: boolean;
}

interface Resultado {
  media: number;
  ajustado: number;
  descuentoPct: number;
  n: number;
}

export default function TasarUsadoModal({ marcaInicial, modeloInicial, versionInicial, anioInicial, kmInicial, onClose, onTasado, autoTasar }: Props) {
  const [marca, setMarca] = useState(marcaInicial);
  const [modelo, setModelo] = useState(modeloInicial);
  const [version, setVersion] = useState(versionInicial || "");
  const [anio, setAnio] = useState(anioInicial);
  const [km, setKm] = useState(kmInicial);
  const [tasando, setTasando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tasar = async () => {
    if (!marca.trim() || !modelo.trim() || !anio || !km) return;
    setTasando(true);
    setResultado(null);
    setError(null);
    try {
      const res = await fetch("/api/panel/tasador-mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marca: marca.trim(), modelo: modelo.trim(), version: version.trim() || undefined, anio: Number(anio), km: Number(km) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo tasar."); return; }
      setResultado({ media: data.estadisticas.media, ajustado: data.ajustado, descuentoPct: data.descuentoPct, n: data.estadisticas.n });
    } catch {
      setError("No se pudo consultar MercadoLibre. Probá de nuevo en un rato.");
    } finally {
      setTasando(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al montar, no sincronización de estado externo
    if (autoTasar) tasar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Sugerencia basada en publicaciones comparables de MercadoLibre</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className={labelClass}>Marca *</label><input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Modelo *</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass} /></div>
          <div className="col-span-2"><label className={labelClass}>Versión (opcional)</label><input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Ej: SE, Trend, XLS" className={inputClass} /></div>
          <div><label className={labelClass}>Año *</label><input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Kilómetros *</label><input type="text" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} className={inputClass} /></div>
        </div>

        <button type="button" onClick={tasar} disabled={tasando || !marca.trim() || !modelo.trim() || !anio || !km} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold disabled:opacity-50">
          {tasando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calculator className="w-4 h-4" /> Calcular precio de mercado</>}
        </button>

        {resultado && (
          <div className="mt-4 text-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">$ {resultado.ajustado.toLocaleString("es-AR")}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Media $ {resultado.media.toLocaleString("es-AR")} de {resultado.n} publicaci{resultado.n === 1 ? "ón" : "ones"} comparable{resultado.n === 1 ? "" : "s"} − {resultado.descuentoPct}% por kilometraje
            </p>
            {onTasado && <button type="button" onClick={() => onTasado(resultado.ajustado)} className="mt-3 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">Usar este valor</button>}
          </div>
        )}
        {error && <p className="mt-4 text-xs text-center text-rose-500">{error}</p>}

        <p className="text-[10px] text-slate-400 text-center mt-3">Precios de publicación, no de venta final — es una referencia, la decisión final es tuya.</p>
      </div>
    </div>
  );
}

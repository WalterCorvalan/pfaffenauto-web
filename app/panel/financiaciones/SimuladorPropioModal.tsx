"use client";

import { useEffect, useState } from "react";
import { X, CreditCard, Check } from "lucide-react";
import VehiculoSelector, { type VehiculoDatos } from "@/components/panel/VehiculoSelector";
import {
  TOPES_FINANCIACION_DEFAULT, TOPE_0KM_DEFAULT, TNA_POR_PLAZO_DEFAULT, GASTOS_PCT_DEFAULT,
  PLAZOS_DISPONIBLES, UVA_DESCUENTO_PCT_DEFAULT, PLAZOS_CON_UVA, topePctPorAnio, calcularCuotaFrances, type TopeFinanciacion,
} from "@/lib/financiacion";

function fmt(n: number) {
  return Math.round(n).toLocaleString("es-AR");
}

export default function SimuladorPropioModal({ onClose }: { onClose: () => void }) {
  const [topes, setTopes] = useState<TopeFinanciacion[]>(TOPES_FINANCIACION_DEFAULT);
  const [tope0km, setTope0km] = useState(TOPE_0KM_DEFAULT);
  const [tna, setTna] = useState<Record<string, number>>(TNA_POR_PLAZO_DEFAULT);
  const [uvaDescuento, setUvaDescuento] = useState<Record<string, number>>(UVA_DESCUENTO_PCT_DEFAULT);
  const [gastosPct, setGastosPct] = useState(GASTOS_PCT_DEFAULT);
  const [dolarVenta, setDolarVenta] = useState<number | null>(null);

  const [datos, setDatos] = useState<VehiculoDatos | null>(null);
  const [esOkm, setEsOkm] = useState(false);

  useEffect(() => {
    fetch("/api/panel/configuracion-empresa").then((r) => r.json()).then((data) => {
      if (data?.config) {
        if (data.config.financiacion_topes?.length) setTopes(data.config.financiacion_topes);
        if (data.config.financiacion_tope_0km) setTope0km(data.config.financiacion_tope_0km);
        if (Object.keys(data.config.financiacion_tna || {}).length) setTna(data.config.financiacion_tna);
        if (data.config.financiacion_gastos_pct != null) setGastosPct(data.config.financiacion_gastos_pct);
        if (Object.keys(data.config.financiacion_uva_descuento || {}).length) setUvaDescuento(data.config.financiacion_uva_descuento);
      }
    }).catch(() => {});
    fetch("/api/dolar-blue").then((r) => r.json()).then((d) => { if (d.venta) setDolarVenta(d.venta); }).catch(() => {});
  }, []);

  const anio = datos?.modelo_anio ? Number(datos.modelo_anio) : null;
  const moneda = datos?.moneda_venta || "ARS";
  const precioBase = datos?.precio_venta ?? 0;
  const precioArs = moneda === "USD" ? (dolarVenta ? precioBase * dolarVenta : 0) : precioBase;

  const pct = anio ? topePctPorAnio(anio, esOkm, topes, tope0km) : 0;
  const capitalMaximo = precioArs * (pct / 100);
  const gastos = precioArs * (gastosPct / 100);
  const totalNecesario = precioArs + gastos;
  const anticipoEfectivo = Math.max(0, totalNecesario - capitalMaximo);

  const handleCambiarVehiculo = (d: VehiculoDatos | null) => {
    setDatos(d);
    setEsOkm(d ? Number(d.kilometros || 0) === 0 : false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start px-5 py-4 sticky top-0 bg-white dark:bg-[#111] z-10 border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#0145F2]" /> Simulador propio (aproximado)</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Número de referencia — no reemplaza la aprobación real de decreditos.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Vehículo (del stock)</label>
            <VehiculoSelector vehiculos={[]} datos={datos} onCambiar={handleCambiarVehiculo} />
          </div>

          {datos && anio && precioBase > 0 && (
            <>
              <label className="flex items-center gap-2 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl px-3 py-2.5">
                <input type="checkbox" checked={esOkm} onChange={(e) => setEsOkm(e.target.checked)} className="w-4 h-4 accent-[#0145F2]" />
                <span className="text-sm font-semibold text-sky-800 dark:text-sky-200">Es 0km (tope más alto)</span>
              </label>

              {moneda === "USD" && !dolarVenta && (
                <p className="text-xs text-rose-500">No se pudo obtener la cotización del dólar — no se puede calcular.</p>
              )}

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Precio de venta</span><span className="font-bold text-slate-900 dark:text-white">$ {fmt(precioArs)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">+ Gastos ({gastosPct}%)</span><span className="font-bold text-slate-900 dark:text-white">$ {fmt(gastos)}</span></div>
                <div className="flex justify-between text-sm border-t border-slate-200 dark:border-white/10 pt-2"><span className="text-slate-500 dark:text-slate-400">Total necesario</span><span className="font-bold text-slate-900 dark:text-white">$ {fmt(totalNecesario)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">− Financiado ({pct}% del auto)</span><span className="font-bold text-emerald-600 dark:text-emerald-400">$ {fmt(capitalMaximo)}</span></div>
                <div className="flex justify-between text-base border-t border-slate-200 dark:border-white/10 pt-2"><span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Anticipo en efectivo</span><span className="font-black text-slate-900 dark:text-white">$ {fmt(anticipoEfectivo)}</span></div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Cuota estimada según plazo (sistema francés, TNA aproximada)</p>
                <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  {PLAZOS_DISPONIBLES.map((p) => {
                    const tasaPlazo = tna[String(p)];
                    if (!tasaPlazo) return null;
                    const cuota = calcularCuotaFrances(capitalMaximo, tasaPlazo, p);
                    const descuentoUva = PLAZOS_CON_UVA.includes(p) ? uvaDescuento[String(p)] : null;
                    const cuotaUva = descuentoUva ? Math.round(cuota * (1 - descuentoUva / 100)) : null;
                    return (
                      <div key={p} className="px-3 py-2.5 bg-white dark:bg-transparent">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{p} cuotas</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">$ {fmt(cuota)} / mes</span>
                        </div>
                        {cuotaUva != null && (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[11px] text-indigo-500 dark:text-indigo-300">UVA (1ª cuota, sube con inflación)</span>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">$ {fmt(cuotaUva)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {datos && !(anio && precioBase > 0) && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">Este vehículo no tiene año o precio de venta cargado — no se puede simular.</p>
          )}
        </div>
      </div>
    </div>
  );
}

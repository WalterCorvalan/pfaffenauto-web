"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
import { TOPES_FINANCIACION_DEFAULT, TOPE_0KM_DEFAULT, TNA_POR_ANIO_Y_PLAZO_DEFAULT, GASTOS_PCT_DEFAULT, PLAZOS_DISPONIBLES, type TopeFinanciacion, type TnaGrupo } from "@/lib/financiacion";

interface ConfigFinanciacion {
  financiacion_topes: TopeFinanciacion[];
  financiacion_tope_0km: number;
  financiacion_tna: TnaGrupo[];
  financiacion_gastos_pct: number;
  dolar_manual_activo: boolean;
  dolar_manual_compra: number | null;
  dolar_manual_venta: number | null;
}

// Movido desde Configuración → Empresa: esta pantalla la ven admin/finanzas
// desde Financiaciones (page.tsx la gatea por rol), no tiene sentido que
// viva en Configuración -- pedido explícito para no tener que ir a otro
// módulo a tocar algo que afecta directamente lo que se ve acá. Usa
// /api/financiacion-config (GET público + PATCH admin/finanzas) en vez de
// /api/panel/configuracion-empresa (ese endpoint es admin-only en bloque,
// cubre branding/comisiones/SLAs -- no correspondía abrirlo a finanzas
// entero solo para esto).
export default function FinanciacionConfigTab() {
  const [config, setConfig] = useState<ConfigFinanciacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [dolarBlueVivo, setDolarBlueVivo] = useState<{ compra: number; venta: number } | null>(null);

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/financiacion-config");
    const data = await res.json();
    if (res.ok) {
      setConfig({
        financiacion_topes: data.financiacion_topes?.length ? data.financiacion_topes : TOPES_FINANCIACION_DEFAULT,
        financiacion_tope_0km: data.financiacion_tope_0km ?? TOPE_0KM_DEFAULT,
        financiacion_tna: data.financiacion_tna?.length ? data.financiacion_tna : TNA_POR_ANIO_Y_PLAZO_DEFAULT,
        financiacion_gastos_pct: data.financiacion_gastos_pct ?? GASTOS_PCT_DEFAULT,
        dolar_manual_activo: data.dolar_manual_activo ?? false,
        dolar_manual_compra: data.dolar_manual_compra ?? null,
        dolar_manual_venta: data.dolar_manual_venta ?? null,
      });
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);
  // Solo de referencia (para saber qué está devolviendo dolarapi.com ahora
  // mismo) -- si el manual está activo, este número NO es el que se usa en
  // el resto de la app, pero sirve para decidir a qué actualizarlo.
  useEffect(() => { fetch("https://dolarapi.com/v1/dolares/blue").then((r) => r.json()).then((d) => setDolarBlueVivo({ compra: Number(d.compra), venta: Number(d.venta) })).catch(() => {}); }, []);

  const guardar = async (patch: Partial<ConfigFinanciacion>) => {
    if (!config) return;
    const actualizado = { ...config, ...patch };
    setConfig(actualizado);
    setMensaje("");
    const res = await fetch("/api/financiacion-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  const actualizarTope = (idx: number, patch: Partial<TopeFinanciacion>) => {
    if (!config) return;
    const topes = config.financiacion_topes.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    guardar({ financiacion_topes: topes });
  };

  const actualizarTnaGrupo = (idx: number, patch: Partial<TnaGrupo>) => {
    if (!config) return;
    const grupos = config.financiacion_tna.map((g, i) => (i === idx ? { ...g, ...patch } : g));
    guardar({ financiacion_tna: grupos });
  };

  const actualizarTna = (idx: number, plazo: number, valor: number) => {
    if (!config) return;
    actualizarTnaGrupo(idx, { tna: { ...config.financiacion_tna[idx].tna, [String(plazo)]: valor } });
  };

  const agregarGrupoTna = () => {
    if (!config) return;
    const ultimo = config.financiacion_tna[config.financiacion_tna.length - 1];
    guardar({ financiacion_tna: [...config.financiacion_tna, { anioDesde: (ultimo?.anioHasta ?? 0) + 1, anioHasta: 9999, tna: { ...(ultimo?.tna || {}) } }] });
  };

  const borrarGrupoTna = (idx: number) => {
    if (!config || config.financiacion_tna.length <= 1) return;
    guardar({ financiacion_tna: config.financiacion_tna.filter((_, i) => i !== idx) });
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4 p-6">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /> Precio del dólar</p>
        <p className="text-xs text-slate-400 mb-2">Por defecto se usa el dólar blue en vivo (dolarapi.com) en toda la app: catálogo público, simuladores de financiación y el ticker del panel. Activá esto para fijar un precio propio en su lugar.</p>
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={config.dolar_manual_activo} onChange={(e) => guardar({ dolar_manual_activo: e.target.checked })} className="w-4 h-4 accent-[#0145F2]" />
          <span className="text-sm font-semibold">Usar precio manual en vez del dólar blue automático</span>
        </label>
        {config.dolar_manual_activo && (
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Compra</label>
              <input type="number" defaultValue={config.dolar_manual_compra ?? ""} onBlur={(e) => guardar({ dolar_manual_compra: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Venta</label>
              <input type="number" defaultValue={config.dolar_manual_venta ?? ""} onBlur={(e) => guardar({ dolar_manual_venta: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
            </div>
          </div>
        )}
        {dolarBlueVivo && <p className="text-[11px] text-slate-400">Referencia: dólar blue ahora mismo — compra {dolarBlueVivo.compra.toLocaleString("es-AR")} · venta {dolarBlueVivo.venta.toLocaleString("es-AR")}</p>}
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
        <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">Esto arma un simulador propio APROXIMADO en Financiaciones. No reemplaza al simulador real de decreditos (que depende del perfil crediticio de cada cliente) — sirve solo como número de referencia para la charla inicial.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Tope de financiación por año del vehículo</p>
        <p className="text-xs text-slate-400 mb-2">% del valor del auto que se puede financiar como máximo, según antigüedad. Confirmado probando el simulador real de decreditos.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {config.financiacion_topes.map((t, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
              <input type="number" defaultValue={t.anioDesde} onBlur={(e) => actualizarTope(idx, { anioDesde: Number(e.target.value) })} className="w-16 bg-transparent text-sm outline-none" />
              <span className="text-xs text-slate-400">a</span>
              <input type="number" defaultValue={t.anioHasta ?? ""} placeholder="∞" onBlur={(e) => actualizarTope(idx, { anioHasta: e.target.value ? Number(e.target.value) : null })} className="w-16 bg-transparent text-sm outline-none" />
              <span className="text-xs text-slate-400 flex-1 text-right">tope</span>
              <input type="number" defaultValue={t.pct} onBlur={(e) => actualizarTope(idx, { pct: Number(e.target.value) })} className="w-14 bg-transparent text-sm font-bold text-right outline-none" />
              <span className="text-xs text-slate-400">%</span>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg px-3 py-2">
            <span className="text-sm font-bold text-sky-700 dark:text-sky-300 flex-1">0km</span>
            <input type="number" defaultValue={config.financiacion_tope_0km} onBlur={(e) => guardar({ financiacion_tope_0km: Number(e.target.value) })} className="w-14 bg-transparent text-sm font-bold text-right outline-none" />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 dark:text-white">TNA estimada por año del vehículo y plazo</p>
          <button type="button" onClick={agregarGrupoTna} className="text-[11px] font-bold text-[#0145F2] shrink-0">+ Agregar rango de años</button>
        </div>
        <p className="text-xs text-slate-400 mb-2">La tasa real depende del perfil crediticio del cliente — esto es un promedio de referencia. Separá por rango de años si decreditos cobra distinto según antigüedad (ej: 2021 en adelante).</p>
        <div className="space-y-3">
          {config.financiacion_tna.map((grupo, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Años</span>
                <input type="number" defaultValue={grupo.anioDesde} onBlur={(e) => actualizarTnaGrupo(idx, { anioDesde: Number(e.target.value) })} className="w-20 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm outline-none" />
                <span className="text-xs text-slate-400">a</span>
                <input type="number" defaultValue={grupo.anioHasta ?? ""} placeholder="∞" onBlur={(e) => actualizarTnaGrupo(idx, { anioHasta: e.target.value ? Number(e.target.value) : null })} className="w-20 bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm outline-none" />
                {config.financiacion_tna.length > 1 && (
                  <button type="button" onClick={() => borrarGrupoTna(idx)} className="text-[11px] font-bold text-rose-500 ml-auto">Quitar</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PLAZOS_DISPONIBLES.map((p) => (
                  <div key={p}>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{p} cuotas</label>
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.1" defaultValue={grupo.tna[String(p)] ?? ""} onBlur={(e) => actualizarTna(idx, p, Number(e.target.value))} className={inputClass} />
                      <span className="text-xs text-slate-400 shrink-0">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5">
        <label className="text-xs font-semibold text-slate-500 block mb-1">Gastos estimados (transferencia + prenda)</label>
        <div className="flex items-center gap-1 max-w-[160px]">
          <input type="number" step="0.1" defaultValue={config.financiacion_gastos_pct} onBlur={(e) => guardar({ financiacion_gastos_pct: Number(e.target.value) })} className={inputClass} />
          <span className="text-xs text-slate-400 shrink-0">%</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">% sobre el precio de venta que se suma para calcular cuánto anticipo en efectivo le queda al cliente.</p>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

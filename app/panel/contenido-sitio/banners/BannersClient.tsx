"use client";

import { useEffect, useState } from "react";
import { Loader2, LayoutGrid } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

interface Config {
  servicios_b1_titulo: string | null;
  servicios_b1_texto: string | null;
  servicios_b1_imagen_url: string | null;
  servicios_b2_titulo: string | null;
  servicios_b2_texto: string | null;
  servicios_b2_boton_texto: string | null;
  servicios_b2_link_url: string | null;
  servicios_b2_imagen_url: string | null;
  servicios_b3_titulo: string | null;
  servicios_b3_texto: string | null;
  servicios_b3_imagen_url: string | null;
}

const DEFAULTS: Record<string, string> = {
  servicios_b1_titulo: "Vendé tu auto hoy.\nEfectivo inmediato.",
  servicios_b1_texto: "Efectivo en el acto, transferencia segura y 100% formal. Vendé tu unidad de forma directa y sin complicaciones ni intermediarios.",
  servicios_b1_imagen_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop",
  servicios_b2_titulo: "Asegurá tu auto\ncon [tu aseguradora].",
  servicios_b2_texto: "Salí de la concesionaria 100% protegido. Cotizá la mejor cobertura.",
  servicios_b2_boton_texto: "Ver Coberturas",
  servicios_b2_link_url: "https://...",
  servicios_b2_imagen_url: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=800&auto=format&fit=crop",
  servicios_b3_titulo: "Compramos o consignamos tu auto al instante.",
  servicios_b3_texto: "Dejanos tu vehículo en consignación para obtener la máxima rentabilidad, o te lo compramos en efectivo hoy mismo sin vueltas.",
  servicios_b3_imagen_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1000&auto=format&fit=crop",
};

export default function BannersClient() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/panel/configuracion-empresa").then((r) => r.json()).then((data) => setConfig(data.config)).finally(() => setCargando(false));
  }, []);

  const guardar = async (patch: Record<string, string | null>) => {
    if (!config) return;
    setConfig({ ...config, ...patch } as Config);
    setMensaje("");
    const res = await fetch("/api/panel/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const campo = (key: keyof Config) => config[key] ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-[#0145F2]" /> Banners de la home</h2>
        <p className="text-sm text-slate-400 mt-1">Los 3 banners promocionales ("Vendé tu auto", seguros, consignación) debajo del catálogo. Usá \n en el título para forzar un salto de línea. Dejá un campo vacío para volver al valor por defecto.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Banner 1 — Vender (naranja)</p>
        <div>
          <label className={labelClass}>Título</label>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} defaultValue={campo("servicios_b1_titulo")} placeholder={DEFAULTS.servicios_b1_titulo} onBlur={(e) => guardar({ servicios_b1_titulo: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Texto</label>
          <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={campo("servicios_b1_texto")} placeholder={DEFAULTS.servicios_b1_texto} onBlur={(e) => guardar({ servicios_b1_texto: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Imagen (URL)</label>
          <input className={inputClass} defaultValue={campo("servicios_b1_imagen_url")} placeholder={DEFAULTS.servicios_b1_imagen_url} onBlur={(e) => guardar({ servicios_b1_imagen_url: e.target.value.trim() || null })} />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Banner 2 — Seguros (rojo)</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-lg">Este banner promociona a una aseguradora partner ("La Caja" por defecto) — revisá que el link y el nombre coincidan con tu acuerdo real antes de publicar.</p>
        <div>
          <label className={labelClass}>Título</label>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} defaultValue={campo("servicios_b2_titulo")} placeholder={DEFAULTS.servicios_b2_titulo} onBlur={(e) => guardar({ servicios_b2_titulo: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Texto</label>
          <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={campo("servicios_b2_texto")} placeholder={DEFAULTS.servicios_b2_texto} onBlur={(e) => guardar({ servicios_b2_texto: e.target.value.trim() || null })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Texto del botón</label>
            <input className={inputClass} defaultValue={campo("servicios_b2_boton_texto")} placeholder={DEFAULTS.servicios_b2_boton_texto} onBlur={(e) => guardar({ servicios_b2_boton_texto: e.target.value.trim() || null })} />
          </div>
          <div>
            <label className={labelClass}>Link del botón</label>
            <input className={inputClass} defaultValue={campo("servicios_b2_link_url")} placeholder={DEFAULTS.servicios_b2_link_url} onBlur={(e) => guardar({ servicios_b2_link_url: e.target.value.trim() || null })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Imagen (URL)</label>
          <input className={inputClass} defaultValue={campo("servicios_b2_imagen_url")} placeholder={DEFAULTS.servicios_b2_imagen_url} onBlur={(e) => guardar({ servicios_b2_imagen_url: e.target.value.trim() || null })} />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Banner 3 — Consignar (verde)</p>
        <div>
          <label className={labelClass}>Título</label>
          <textarea className={`${inputClass} min-h-[60px] resize-y`} defaultValue={campo("servicios_b3_titulo")} placeholder={DEFAULTS.servicios_b3_titulo} onBlur={(e) => guardar({ servicios_b3_titulo: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Texto</label>
          <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={campo("servicios_b3_texto")} placeholder={DEFAULTS.servicios_b3_texto} onBlur={(e) => guardar({ servicios_b3_texto: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Imagen (URL)</label>
          <input className={inputClass} defaultValue={campo("servicios_b3_imagen_url")} placeholder={DEFAULTS.servicios_b3_imagen_url} onBlur={(e) => guardar({ servicios_b3_imagen_url: e.target.value.trim() || null })} />
        </div>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

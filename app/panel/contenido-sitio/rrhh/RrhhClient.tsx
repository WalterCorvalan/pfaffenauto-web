"use client";

import { useEffect, useState } from "react";
import { Loader2, Briefcase, Plus, X, GripVertical } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

interface Config {
  rrhh_badge: string | null;
  rrhh_titulo_prefijo: string | null;
  rrhh_titulo_destacado: string | null;
  rrhh_bajada: string | null;
  rrhh_beneficio1_titulo: string | null;
  rrhh_beneficio1_texto: string | null;
  rrhh_beneficio2_titulo: string | null;
  rrhh_beneficio2_texto: string | null;
  rrhh_beneficio3_titulo: string | null;
  rrhh_beneficio3_texto: string | null;
  rrhh_puestos: string[] | null;
}

const DEFAULTS = {
  rrhh_badge: "Sumate al equipo",
  rrhh_titulo_prefijo: "Construí tu futuro en",
  rrhh_titulo_destacado: "Pfaffen Cars",
  rrhh_bajada: "Somos una agencia líder en constante expansión. Buscamos personas proactivas, apasionadas por la industria automotriz y con ganas de desarrollarse en un entorno dinámico y profesional.",
  rrhh_beneficio1_titulo: "Desarrollo Profesional",
  rrhh_beneficio1_texto: "Oportunidades reales de crecimiento y capacitación constante en ventas y gestión.",
  rrhh_beneficio2_titulo: "Excelente Clima Laboral",
  rrhh_beneficio2_texto: "Fomentamos el trabajo en equipo, el respeto y la colaboración diaria entre todas las áreas.",
  rrhh_beneficio3_titulo: "Estabilidad y Beneficios",
  rrhh_beneficio3_texto: "Condiciones de contratación claras, esquema de comisiones competitivo y estabilidad garantizada.",
};

const PUESTOS_DEFAULT = ["Ventas / Comercial", "Administración", "Marketing / Redes Sociales", "Taller / Mecánica", "Atención al Cliente", "Gerencia / Liderazgo", "Otro"];

export default function RrhhClient() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [nuevoPuesto, setNuevoPuesto] = useState("");

  useEffect(() => {
    fetch("/api/panel/configuracion-empresa").then((r) => r.json()).then((data) => setConfig(data.config)).finally(() => setCargando(false));
  }, []);

  const guardar = async (patch: Record<string, any>) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setMensaje("");
    const res = await fetch("/api/panel/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const puestos = config.rrhh_puestos && config.rrhh_puestos.length > 0 ? config.rrhh_puestos : PUESTOS_DEFAULT;

  const agregarPuesto = () => {
    const valor = nuevoPuesto.trim();
    if (!valor || puestos.includes(valor)) return;
    guardar({ rrhh_puestos: [...puestos, valor] });
    setNuevoPuesto("");
  };

  const quitarPuesto = (p: string) => {
    guardar({ rrhh_puestos: puestos.filter((x) => x !== p) });
  };

  const campo = (key: keyof Config) => config[key] ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#0145F2]" /> Formulario "Trabajá con nosotros"</h2>
        <p className="text-sm text-slate-400 mt-1">Textos y lista de puestos de la página pública /trabaja-con-nosotros. Dejá un campo vacío para volver al valor por defecto.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Encabezado</p>
        <div>
          <label className={labelClass}>Etiqueta</label>
          <input className={inputClass} defaultValue={campo("rrhh_badge")} placeholder={DEFAULTS.rrhh_badge} onBlur={(e) => guardar({ rrhh_badge: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Título (parte normal)</label>
          <input className={inputClass} defaultValue={campo("rrhh_titulo_prefijo")} placeholder={DEFAULTS.rrhh_titulo_prefijo} onBlur={(e) => guardar({ rrhh_titulo_prefijo: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Título (parte destacada, en azul)</label>
          <input className={inputClass} defaultValue={campo("rrhh_titulo_destacado")} placeholder={DEFAULTS.rrhh_titulo_destacado} onBlur={(e) => guardar({ rrhh_titulo_destacado: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Bajada</label>
          <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={campo("rrhh_bajada")} placeholder={DEFAULTS.rrhh_bajada} onBlur={(e) => guardar({ rrhh_bajada: e.target.value.trim() || null })} />
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">3 beneficios (íconos fijos)</p>
        {([1, 2, 3] as const).map((n) => (
          <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
            <div>
              <label className={labelClass}>Título {n}</label>
              <input className={inputClass} defaultValue={campo(`rrhh_beneficio${n}_titulo` as keyof Config)} placeholder={(DEFAULTS as any)[`rrhh_beneficio${n}_titulo`]} onBlur={(e) => guardar({ [`rrhh_beneficio${n}_titulo`]: e.target.value.trim() || null })} />
            </div>
            <div>
              <label className={labelClass}>Texto {n}</label>
              <input className={inputClass} defaultValue={campo(`rrhh_beneficio${n}_texto` as keyof Config)} placeholder={(DEFAULTS as any)[`rrhh_beneficio${n}_texto`]} onBlur={(e) => guardar({ [`rrhh_beneficio${n}_texto`]: e.target.value.trim() || null })} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Puestos de interés (selector del formulario)</p>
        <div className="space-y-2">
          {puestos.map((p) => (
            <div key={p} className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2">
              <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{p}</span>
              <button onClick={() => quitarPuesto(p)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input className={inputClass} value={nuevoPuesto} onChange={(e) => setNuevoPuesto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarPuesto())} placeholder="Nuevo puesto..." />
          <button onClick={agregarPuesto} className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl"><Plus className="w-3.5 h-3.5" /> Agregar</button>
        </div>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

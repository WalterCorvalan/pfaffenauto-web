"use client";

import { useEffect, useState } from "react";
import { Loader2, Video } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

interface Config {
  hero_video_url: string | null;
  hero_badge: string | null;
  hero_titulo_prefijo: string | null;
  hero_titulo_destacado: string | null;
  hero_subtitulo: string | null;
}

const DEFAULTS: Config = {
  hero_video_url: "/hero-video.mp4",
  hero_badge: "Compra o Vende tu auto en el momento",
  hero_titulo_prefijo: "La forma mas confiable de comprar o vender",
  hero_titulo_destacado: "TU AUTO",
  hero_subtitulo: "Autos 0KM y usados seleccionados en Zona Norte, Buenos Aires",
};

export default function HeroClient() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/panel/configuracion-empresa")
      .then((r) => r.json())
      .then((data) => setConfig(data.config))
      .finally(() => setCargando(false));
  }, []);

  const guardar = async (patch: Partial<Config>) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setMensaje("");
    const res = await fetch("/api/panel/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  if (cargando || !config) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  const valor = (k: keyof Config) => config[k] ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><Video className="w-4 h-4 text-[#0145F2]" /> Portada (Hero) de la home</h2>
        <p className="text-sm text-slate-400 mt-1">El video y los textos que se ven al entrar al sitio. Dejá un campo vacío para volver al valor por defecto.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>URL del video de fondo (.mp4)</label>
          <input className={inputClass} defaultValue={valor("hero_video_url")} placeholder={DEFAULTS.hero_video_url!} onBlur={(e) => guardar({ hero_video_url: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Etiqueta arriba del título</label>
          <input className={inputClass} defaultValue={valor("hero_badge")} placeholder={DEFAULTS.hero_badge!} onBlur={(e) => guardar({ hero_badge: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Título (parte normal)</label>
          <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={valor("hero_titulo_prefijo")} placeholder={DEFAULTS.hero_titulo_prefijo!} onBlur={(e) => guardar({ hero_titulo_prefijo: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Título (parte destacada, en negrita/color)</label>
          <input className={inputClass} defaultValue={valor("hero_titulo_destacado")} placeholder={DEFAULTS.hero_titulo_destacado!} onBlur={(e) => guardar({ hero_titulo_destacado: e.target.value.trim() || null })} />
        </div>
        <div>
          <label className={labelClass}>Subtítulo</label>
          <input className={inputClass} defaultValue={valor("hero_subtitulo")} placeholder={DEFAULTS.hero_subtitulo!} onBlur={(e) => guardar({ hero_subtitulo: e.target.value.trim() || null })} />
        </div>
      </div>

      {/* Vista previa simple del título tal como se arma en Hero.tsx */}
      <div className="bg-slate-900 rounded-2xl p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Vista previa del título</p>
        <p className="text-xl font-light text-white leading-snug">
          {config.hero_titulo_prefijo || DEFAULTS.hero_titulo_prefijo}
          <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-300"> {config.hero_titulo_destacado || DEFAULTS.hero_titulo_destacado}</span>
        </p>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

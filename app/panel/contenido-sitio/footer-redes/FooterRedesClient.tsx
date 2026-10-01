"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Camera, Globe2, Video, ExternalLink } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";

interface Config {
  redes_whatsapp: string | null;
  redes_instagram: string | null;
  redes_facebook: string | null;
  redes_tiktok: string | null;
}

const REDES: { key: keyof Config; label: string; icon: any; placeholder: string }[] = [
  { key: "redes_whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/5491121907000" },
  { key: "redes_instagram", label: "Instagram", icon: Camera, placeholder: "https://www.instagram.com/..." },
  { key: "redes_facebook", label: "Facebook", icon: Globe2, placeholder: "https://www.facebook.com/..." },
  { key: "redes_tiktok", label: "TikTok", icon: Video, placeholder: "https://tiktok.com/@..." },
];

export default function FooterRedesClient() {
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Redes sociales del footer</h2>
        <p className="text-sm text-slate-400 mt-1">Los links que se muestran en "Seguinos" al pie de todas las páginas públicas. Dejá un campo vacío para volver al link por defecto.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        {REDES.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#0145F2]" /> {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={inputClass}
                defaultValue={config[key] || ""}
                placeholder={placeholder}
                onBlur={(e) => guardar({ [key]: e.target.value.trim() || null })}
              />
              {config[key] && (
                <a href={config[key]!} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-[#0145F2] hover:border-[#0145F2]" title="Abrir link">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

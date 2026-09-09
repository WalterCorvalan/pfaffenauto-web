"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { MessageCircle, Save } from "lucide-react";
import { inputClass, labelClass } from "./shared";

const DEFAULT_SALUDO = "Hola {nombre}! 👋 Te escribo de {agencia}. ¿Cómo estás? Quería saber si seguís interesado/a y si te puedo ayudar en algo.";

export default function MiWhatsAppTab({ miId, agenciaNombre = "Pfaffen Autos" }: { miId: string; agenciaNombre?: string }) {
  const [saludo, setSaludo] = useState("");
  const [firma, setFirma] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    supabase2.from("espacio_whatsapp_prefs").select("*").eq("perfil_id", miId).maybeSingle().then(({ data }) => {
      setSaludo(data?.saludo_seguimiento || "");
      setFirma(data?.firma || "");
      setCargando(false);
    });
  }, [miId]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await supabase2.from("espacio_whatsapp_prefs").upsert({ perfil_id: miId, saludo_seguimiento: saludo || null, firma: firma || null, updated_at: new Date().toISOString() });
    } catch { alert("No se pudo guardar."); } finally { setGuardando(false); }
  };

  if (cargando) return null;

  const plantilla = saludo.trim() || DEFAULT_SALUDO;
  const preview = plantilla.replace(/\{nombre\}/g, "Juan").replace(/\{agencia\}/g, agenciaNombre).replace(/\{vendedor\}/g, "vos") + (firma.trim() ? `\n${firma.trim()}` : "");

  return (
    <div className="max-w-lg">
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Mi WhatsApp</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tu saludo de seguimiento y tu firma personales. Los usa el botón "Escribir por WhatsApp" del detalle del cliente. Si no completás nada, se usa un saludo genérico sin firma.</p>
      </div>

      <label className={labelClass}>Saludo de seguimiento</label>
      <textarea value={saludo} onChange={(e) => setSaludo(e.target.value)} rows={4} placeholder={DEFAULT_SALUDO} className={inputClass} />
      <p className="text-[10px] text-slate-400 mt-1 mb-3">Variables: {"{nombre}"} (cliente), {"{agencia}"}, {"{vendedor}"}. Dejalo vacío para usar el default.</p>

      <label className={labelClass}>Firma</label>
      <input value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="— Tu nombre, agencia" className={inputClass} />
      <p className="text-[10px] text-slate-400 mt-1 mb-4">Se agrega al final del mensaje, en una línea nueva. Ej: — Juan, Automotores San Martín</p>

      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vista previa (cliente de ejemplo: Juan)</p>
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm whitespace-pre-wrap">{preview}</div>

      <div className="flex justify-end mt-4">
        <button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar"}</button>
      </div>
    </div>
  );
}

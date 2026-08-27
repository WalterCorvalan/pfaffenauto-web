"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Copy, Check, MessageCircle, ExternalLink, Tag, Eye, Car, MessageSquare } from "lucide-react";

interface CatalogoConfig { id: string; mostrar_precios: boolean; visitas_totales: number; fichas_vistas_totales: number; consultas_whatsapp_totales: number }

interface Props {
  config: CatalogoConfig | null;
  esAdmin: boolean;
  onClose: () => void;
  onConfigActualizada: (c: CatalogoConfig) => void;
}

export default function TuCatalogoModal({ config, esAdmin, onClose, onConfigActualizada }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [guardandoToggle, setGuardandoToggle] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/catalogo-v2` : "/catalogo-v2";

  useEffect(() => {
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: "#1e293b", light: "#ffffff" } }).then(setQrUrl);
  }, [url]);

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const toggleMostrarPrecios = async () => {
    if (!config) return;
    setGuardandoToggle(true);
    const nuevo = { ...config, mostrar_precios: !config.mostrar_precios };
    const { data, error } = await supabase2.from("catalogo_config").update({ mostrar_precios: nuevo.mostrar_precios, updated_at: new Date().toISOString() }).eq("id", "default").select().single();
    if (!error && data) onConfigActualizada(data);
    setGuardandoToggle(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Esta es tu vidriera pública. Se actualiza sola con los autos disponibles que cargás en Stock. Compartila donde quieras.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{url}</div>
          <button onClick={copiar} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0">
            {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <a href={`https://wa.me/?text=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100">
            <MessageCircle className="w-3.5 h-3.5" /> Compartir por WhatsApp
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir
          </a>
        </div>

        {esAdmin && config && (
          <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer mb-4">
            <input type="checkbox" checked={config.mostrar_precios} onChange={toggleMostrarPrecios} disabled={guardandoToggle} className="w-4 h-4 accent-rose-600" />
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"><Tag className="w-3.5 h-3.5" /> Mostrar los precios en el catálogo</span>
          </label>
        )}
        {esAdmin && !config?.mostrar_precios && config && <p className="text-[10px] text-slate-400 -mt-2 mb-4 ml-1">Si lo desactivás, en la vidriera y en cada ficha se muestra «Consultar» en vez del precio.</p>}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center bg-slate-50 dark:bg-white/5 rounded-xl py-3">
            <Eye className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-black text-slate-800 dark:text-white">{config?.visitas_totales ?? 0}</p>
            <p className="text-[9px] text-slate-400">visitas al catálogo</p>
          </div>
          <div className="text-center bg-slate-50 dark:bg-white/5 rounded-xl py-3">
            <Car className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-black text-slate-800 dark:text-white">{config?.fichas_vistas_totales ?? 0}</p>
            <p className="text-[9px] text-slate-400">fichas vistas</p>
          </div>
          <div className="text-center bg-slate-50 dark:bg-white/5 rounded-xl py-3">
            <MessageSquare className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-lg font-black text-slate-800 dark:text-white">{config?.consultas_whatsapp_totales ?? 0}</p>
            <p className="text-[9px] text-slate-400">consultas WhatsApp</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center -mt-2 mb-4">Totales desde que está online. Se actualiza solo.</p>

        <div className="border-t border-slate-100 dark:border-white/10 pt-4 text-center">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">📱 QR para imprimir o pegar en el local</p>
          {qrUrl && <img src={qrUrl} alt="QR del catálogo" className="mx-auto rounded-xl border border-slate-100 dark:border-white/10" />}
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-3">¿Los autos se ven sin foto? Cargá las fotos en <strong>Stock → Editar auto → Fotos</strong> y aparecen ahí al toque.</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Share2, Loader2, CheckCircle2 } from "lucide-react";

export default function PublicarRedesBoton({ vehiculoId, yaPublicado }: { vehiculoId: string; yaPublicado: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [publicado, setPublicado] = useState(yaPublicado);
  const [error, setError] = useState("");

  const publicar = async () => {
    if (cargando) return;
    if (!confirm("¿Publicar este vehículo en Instagram y Facebook?")) return;
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/vehiculos/publicar-redes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculoId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo publicar.");
      setPublicado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar.");
    } finally {
      setCargando(false);
    }
  };

  if (publicado) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
        <CheckCircle2 className="w-3.5 h-3.5" /> Publicado
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={publicar}
        disabled={cargando}
        title="Publicar en Instagram y Facebook"
        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-sky-300 uppercase tracking-widest disabled:opacity-50"
      >
        {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Publicar
      </button>
      {error && <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{error}</span>}
    </div>
  );
}

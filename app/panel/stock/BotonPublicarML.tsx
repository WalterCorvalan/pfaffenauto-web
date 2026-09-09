"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload, AlertTriangle } from "lucide-react";

export default function BotonPublicarML({
  vehiculoId, publicado, error, onPublicado,
}: { vehiculoId: string; publicado: boolean; error: string | null; onPublicado: (id: string) => void }) {
  const [publicando, setPublicando] = useState(false);

  const publicar = async () => {
    setPublicando(true);
    try {
      const res = await fetch("/api/panel-v2/ml/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculoId }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "No se pudo publicar en MercadoLibre.");
      onPublicado(vehiculoId);
    } catch {
      alert("Error de red publicando en MercadoLibre.");
    } finally {
      setPublicando(false);
    }
  };

  if (publicando) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  if (publicado) return <span title="Publicado en MercadoLibre"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>;
  if (error) {
    return (
      <button onClick={publicar} title={error} className="text-rose-500 hover:text-rose-600">
        <AlertTriangle className="w-4 h-4" />
      </button>
    );
  }
  return (
    <button onClick={publicar} title="Publicar en MercadoLibre" className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400">
      <Upload className="w-4 h-4" />
    </button>
  );
}

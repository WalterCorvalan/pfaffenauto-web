"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload, AlertTriangle } from "lucide-react";

// "Publicar en todos lados" (pedido 27/9): un solo click dispara MercadoLibre
// (API de Items, /api/panel/ml/publicar -- ya existía por auto) Y le pide a
// Meta que relea el feed de Instagram/Facebook ahora mismo en vez de esperar
// su ciclo diario (/api/panel/meta-catalog/forzar-sync). Instagram igual se
// sincroniza solo aunque este botón no se toque -- esto solo adelanta el
// momento en que Meta lo relee.
export default function BotonPublicarTodo({
  vehiculoId, publicado, error, onPublicado,
}: { vehiculoId: string; publicado: boolean; error: string | null; onPublicado: (id: string) => void }) {
  const [publicando, setPublicando] = useState(false);
  const [avisoMeta, setAvisoMeta] = useState<string | null>(null);

  const publicar = async () => {
    setPublicando(true);
    setAvisoMeta(null);
    try {
      const [resMl, resMeta] = await Promise.all([
        fetch("/api/panel/ml/publicar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehiculoId }) }),
        fetch("/api/panel/meta-catalog/forzar-sync", { method: "POST" }),
      ]);
      const dataMl = await resMl.json();
      const dataMeta = await resMeta.json().catch(() => null);
      if (!resMl.ok) { alert(dataMl.error || "No se pudo publicar en MercadoLibre."); return; }
      onPublicado(vehiculoId);
      if (dataMeta && dataMeta.sincronizado === false) setAvisoMeta(dataMeta.motivo || "Meta no se pudo resincronizar ahora.");
    } catch {
      alert("Error de red publicando.");
    } finally {
      setPublicando(false);
    }
  };

  if (publicando) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  if (publicado) {
    return (
      <span className="inline-flex items-center gap-1" title={avisoMeta ? `Publicado en ML. ${avisoMeta}` : "Publicado en MercadoLibre + Meta resincronizado"}>
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        {avisoMeta && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
      </span>
    );
  }
  if (error) {
    return (
      <button onClick={publicar} title={error} className="flex items-center gap-1 text-rose-500 hover:text-rose-600 text-[11px] font-bold">
        <AlertTriangle className="w-4 h-4 shrink-0" /> Error al publicar
      </button>
    );
  }
  // Antes era solo el ícono, sin texto -- el title (tooltip on-hover) no
  // sirve para "entender de un vistazo qué es esto" la primera vez, hay que
  // pasar el mouse para enterarse. Ahora dice qué hace directo.
  return (
    <button onClick={publicar} title="Publicar en MercadoLibre y resincronizar Meta (Instagram/Facebook)" className="flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold">
      <Upload className="w-4 h-4 shrink-0" /> Publicar en ML
    </button>
  );
}

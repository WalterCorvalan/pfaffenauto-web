"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, Loader2, CheckCircle2, File as FileIcon } from "lucide-react";

interface Documento { id: string; nombre: string; url: string; created_at: string }

// Subida de documentación del vehículo que el cliente entrega (foto/PDF de
// título, cédula verde, VTV) desde el portal público, buscando por el mismo
// código de seguimiento de la URL -- pedido del 23/9. Sube a
// /api/seguimiento/documentos (sin sesión de panel, valida el código server-side).
export default function DocumentosCliente({ codigo }: { codigo: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [recargarKey, setRecargarKey] = useState(0);

  useEffect(() => {
    fetch(`/api/seguimiento/documentos?codigo=${encodeURIComponent(codigo)}`)
      .then((r) => r.json())
      .then((d) => setDocumentos(d.documentos || []))
      .finally(() => setCargando(false));
  }, [codigo, recargarKey]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setError("");
    for (const file of Array.from(files).slice(0, 5)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("codigo", codigo);
      try {
        const res = await fetch("/api/seguimiento/documentos", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo subir uno de los archivos.");
      }
    }
    setSubiendo(false);
    setRecargarKey((k) => k + 1);
  };

  return (
    <div className="bg-white dark:bg-[#111] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/10">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Documentación de tu vehículo
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Si entregás un auto en parte de pago, subí acá fotos o PDF del título, la cédula verde y la VTV — nuestro equipo de gestoría los recibe directo.
      </p>

      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 px-4 cursor-pointer transition-colors ${subiendo ? "border-slate-200 dark:border-white/10 opacity-60" : "border-slate-200 dark:border-white/10 hover:border-[#0145F2] dark:hover:border-sky-400"}`}>
        {subiendo ? <Loader2 className="w-6 h-6 text-slate-400 animate-spin" /> : <Upload className="w-6 h-6 text-slate-400" />}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{subiendo ? "Subiendo..." : "Tocá para elegir fotos o PDF"}</span>
        <input type="file" accept="image/*,.pdf" multiple disabled={subiendo} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

      {!cargando && documentos.length > 0 && (
        <ul className="mt-5 space-y-2">
          {documentos.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-300 hover:underline truncate flex items-center gap-1.5">
                <FileIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {d.nombre}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

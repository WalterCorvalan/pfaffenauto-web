"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Copy, ArrowLeft, FileText, Paperclip, Loader2, ExternalLink } from "lucide-react";

const ETAPAS = ["Seña", "Documentación", "Patentamiento", "Transferencia", "Entrega", "Completado"];

interface Documento {
  id: string;
  tipo_documento: string;
  estado: string;
  fecha_recibido: string | null;
  archivo_url: string | null;
  etapa: string | null;
  verificado_por: string | null;
}

// Patentamiento y Transferencia comparten los mismos ítems (aranceles, informes) —
// suceden en paralelo en la gestoría, no tiene sentido duplicarlos por etapa.
const ETAPA_DOCUMENTOS: Record<string, string> = {
  "Seña": "Seña",
  "Documentación": "Documentación",
  "Patentamiento": "Patentamiento",
  "Transferencia": "Patentamiento",
};

interface Venta {
  id: string;
  codigo_seguimiento: string | null;
  etapa_seguimiento: string | null;
  fecha: string;
  nombre: string | null;
  apellido: string | null;
  telefono_celular: string | null;
  marca: string | null;
  modelo: string | null;
  dominio: string | null;
}

export default function SeguimientoClient({ venta, documentosIniciales }: { venta: Venta; documentosIniciales: Documento[] }) {
  const router = useRouter();
  const [etapaActual, setEtapaActual] = useState(venta.etapa_seguimiento || "Seña");
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [cargando, setCargando] = useState(false);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const cambiarEtapa = async (nuevaEtapa: string) => {
    setEtapaActual(nuevaEtapa);
    await supabase.from("boletos_venta").update({ etapa_seguimiento: nuevaEtapa }).eq("id", venta.id);
    router.refresh();
  };

  const toggleDocumento = async (doc: Documento) => {
    const nuevoEstado = doc.estado === "Recibido" ? "Pendiente" : "Recibido";
    setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, estado: nuevoEstado } : d)));
    await supabase
      .from("documentacion_ventas")
      .update({ estado: nuevoEstado, fecha_recibido: nuevoEstado === "Recibido" ? new Date().toISOString().split("T")[0] : null })
      .eq("id", doc.id);
  };

  const cambiarVerificadoPor = async (doc: Documento, valor: string) => {
    setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, verificado_por: valor || null } : d)));
    await supabase.from("documentacion_ventas").update({ verificado_por: valor || null }).eq("id", doc.id);
  };

  const subirArchivo = async (doc: Documento, file: File) => {
    setSubiendoId(doc.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo");

      const hoy = new Date().toISOString().split("T")[0];
      await supabase
        .from("documentacion_ventas")
        .update({ archivo_url: data.publicUrl, estado: "Recibido", fecha_recibido: hoy })
        .eq("id", doc.id);

      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, archivo_url: data.publicUrl, estado: "Recibido", fecha_recibido: hoy } : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setSubiendoId(null);
    }
  };

  const copiarLink = () => {
    if (!venta.codigo_seguimiento) return;
    navigator.clipboard.writeText(`${window.location.origin}/seguimiento/${venta.codigo_seguimiento}`);
    alert("Link copiado");
  };

  const etapaDocumentosActual = ETAPA_DOCUMENTOS[etapaActual];
  const documentosVisibles = documentos.filter((d) => d.etapa === etapaDocumentosActual);
  const recibidos = documentosVisibles.filter((d) => d.estado === "Recibido").length;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {venta.marca} {venta.modelo} {venta.dominio ? `(${venta.dominio})` : ""}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{venta.nombre} {venta.apellido}</p>
            </div>
            {venta.codigo_seguimiento && (
              <button onClick={copiarLink} className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-[#00246b] transition-colors">
                <Copy className="w-3.5 h-3.5" /> {venta.codigo_seguimiento}
              </button>
            )}
          </div>

          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Etapa Actual</h2>
          <div className="flex flex-wrap gap-2">
            {ETAPAS.map((etapa) => (
              <button
                key={etapa}
                onClick={() => cambiarEtapa(etapa)}
                disabled={cargando}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  etapaActual === etapa
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:border-indigo-300"
                }`}
              >
                {etapa}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {etapaActual === "Transferencia" ? "Patentamiento / Transferencia" : etapaActual}
            </h2>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{recibidos}/{documentosVisibles.length} recibidos</span>
          </div>

          <div className="space-y-1">
            {documentosVisibles.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors">
                <button onClick={() => toggleDocumento(doc)} className="shrink-0">
                  {doc.estado === "Recibido" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
                <span
                  onClick={() => toggleDocumento(doc)}
                  className={`text-sm font-medium cursor-pointer flex-1 ${doc.estado === "Recibido" ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-200"}`}
                >
                  {doc.tipo_documento}
                </span>
                {doc.fecha_recibido && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{doc.fecha_recibido}</span>
                )}

                {doc.estado === "Recibido" && (
                  <select
                    value={doc.verificado_por || ""}
                    onChange={(e) => cambiarVerificadoPor(doc, e.target.value)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border outline-none cursor-pointer shrink-0 ${
                      doc.verificado_por === "Agencia" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]" :
                      doc.verificado_por === "Cliente" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" :
                      "bg-slate-50 dark:bg-[#00246b] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#0a2a6b]"
                    }`}
                    title="¿Quién verificó este documento?"
                  >
                    <option value="">¿Quién verificó?</option>
                    <option value="Agencia">Agencia</option>
                    <option value="Cliente">Cliente</option>
                  </select>
                )}

                {doc.archivo_url && (
                  <a
                    href={doc.archivo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-indigo-500 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200 hover:bg-indigo-50 dark:hover:bg-[#00246b] rounded-md transition-colors shrink-0"
                    title="Ver archivo adjunto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <input
                  ref={(el) => { inputsRef.current[doc.id] = el; }}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirArchivo(doc, file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => inputsRef.current[doc.id]?.click()}
                  disabled={subiendoId === doc.id}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 hover:bg-indigo-50 dark:hover:bg-[#00246b] rounded-md transition-colors shrink-0 disabled:opacity-50"
                  title={doc.archivo_url ? "Reemplazar archivo" : "Adjuntar archivo"}
                >
                  {subiendoId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
            {documentosVisibles.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4 text-center">
                {etapaDocumentosActual ? "Sin documentación para esta etapa." : "Esta etapa no tiene documentación asociada."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

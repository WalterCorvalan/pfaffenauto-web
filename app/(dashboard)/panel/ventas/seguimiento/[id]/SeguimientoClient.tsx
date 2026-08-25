"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Copy, ArrowLeft, FileText, Paperclip, Loader2, ExternalLink, Printer, Save, X } from "lucide-react";

const ETAPAS = ["Seña", "Documentación", "Patentamiento", "Transferencia", "Entrega", "Completado"];

interface ArchivoDocumento {
  id: string;
  url: string;
  nombre_archivo: string | null;
  created_at: string;
}

interface Documento {
  id: string;
  tipo_documento: string;
  estado: string;
  fecha_recibido: string | null;
  archivo_url: string | null;
  etapa: string | null;
  verificado_por: string | null;
  documentacion_ventas_archivos: ArchivoDocumento[];
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
  numero: number | null;
  codigo_seguimiento: string | null;
  etapa_seguimiento: string | null;
  fecha: string;
  nombre: string | null;
  apellido: string | null;
  telefono_celular: string | null;
  correo_electronico: string | null;
  marca: string | null;
  modelo: string | null;
  dominio: string | null;
  venta_ars: number | null;
  observaciones: string | null;
  comision_ars: number | null;
  porcentaje_comision: number | null;
}

export default function SeguimientoClient({ venta, documentosIniciales }: { venta: Venta; documentosIniciales: Documento[] }) {
  const router = useRouter();
  const [etapaActual, setEtapaActual] = useState(venta.etapa_seguimiento || "Seña");
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [cargando, setCargando] = useState(false);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const [telefono, setTelefono] = useState(venta.telefono_celular || "");
  const [correo, setCorreo] = useState(venta.correo_electronico || "");
  const [guardandoContacto, setGuardandoContacto] = useState(false);

  const [observaciones, setObservaciones] = useState(venta.observaciones || "");
  const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);

  const [porcentajeComision, setPorcentajeComision] = useState(venta.porcentaje_comision?.toString() || "");
  const [guardandoComision, setGuardandoComision] = useState(false);

  const comisionCalculada = (Number(venta.venta_ars) || 0) * (Number(porcentajeComision) || 0) / 100;

  const guardarContacto = async () => {
    setGuardandoContacto(true);
    await supabase.from("boletos_venta").update({ telefono_celular: telefono || null, correo_electronico: correo || null }).eq("id", venta.id);
    setGuardandoContacto(false);
  };

  const guardarObservaciones = async () => {
    setGuardandoObservaciones(true);
    await supabase.from("boletos_venta").update({ observaciones: observaciones || null }).eq("id", venta.id);
    setGuardandoObservaciones(false);
  };

  const guardarComision = async () => {
    setGuardandoComision(true);
    await supabase.from("boletos_venta").update({
      porcentaje_comision: porcentajeComision ? Number(porcentajeComision) : null,
      comision_ars: comisionCalculada || null,
    }).eq("id", venta.id);
    setGuardandoComision(false);
  };

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

      // Se agrega como un archivo más, no reemplaza a los que ya estaban.
      const { data: nuevoArchivo, error } = await supabase
        .from("documentacion_ventas_archivos")
        .insert({ documento_id: doc.id, url: data.publicUrl, nombre_archivo: file.name })
        .select("id, url, nombre_archivo, created_at")
        .single();
      if (error) throw error;

      const hoy = new Date().toISOString().split("T")[0];
      await supabase
        .from("documentacion_ventas")
        .update({ estado: "Recibido", fecha_recibido: hoy })
        .eq("id", doc.id);

      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, estado: "Recibido", fecha_recibido: hoy, documentacion_ventas_archivos: [...d.documentacion_ventas_archivos, nuevoArchivo] } : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setSubiendoId(null);
    }
  };

  const eliminarArchivo = async (doc: Documento, archivoId: string) => {
    if (!confirm("¿Quitar este archivo?")) return;
    const { error } = await supabase.from("documentacion_ventas_archivos").delete().eq("id", archivoId);
    if (error) {
      alert("No se pudo quitar el archivo.");
      return;
    }
    setDocumentos((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, documentacion_ventas_archivos: d.documentacion_ventas_archivos.filter((a) => a.id !== archivoId) } : d))
    );
  };

  const imprimirArchivo = (url: string) => {
    const ventana = window.open(url, "_blank");
    if (!ventana) return;
    ventana.addEventListener("load", () => {
      setTimeout(() => ventana.print(), 300);
    });
  };

  const copiarCodigo = () => {
    if (!venta.codigo_seguimiento) return;
    navigator.clipboard.writeText(venta.codigo_seguimiento);
    alert("Código copiado");
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
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <Link
            href={`/panel/boletos/imprimir/${venta.id}`}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir boleto
          </Link>
        </div>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {venta.numero ? `N° ${venta.numero} — ` : ""}{venta.marca} {venta.modelo} {venta.dominio ? `(${venta.dominio})` : ""}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{venta.nombre} {venta.apellido}</p>
            </div>
            {venta.codigo_seguimiento && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={copiarCodigo} title="Copiar solo el código" className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-[#00246b] transition-colors">
                  <Copy className="w-3.5 h-3.5" /> {venta.codigo_seguimiento}
                </button>
                <button onClick={copiarLink} title="Copiar link para compartir" className="flex items-center justify-center text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-[#00246b] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
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
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Datos de contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono celular"
              className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <input
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={guardarContacto}
            disabled={guardandoContacto}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {guardandoContacto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar contacto
          </button>
        </div>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Observaciones</h2>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            placeholder="Comentarios internos sobre esta venta..."
            className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 mb-3 resize-none"
          />
          <button
            onClick={guardarObservaciones}
            disabled={guardandoObservaciones}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {guardandoObservaciones ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar observaciones
          </button>
        </div>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Comisión del vendedor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">% Comisión</label>
              <input
                type="number"
                step="0.01"
                value={porcentajeComision}
                onChange={(e) => setPorcentajeComision(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Monto calculado</label>
              <div className="w-full bg-slate-100 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
                $ {comisionCalculada.toLocaleString("es-AR")}
              </div>
            </div>
          </div>
          <button
            onClick={guardarComision}
            disabled={guardandoComision}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {guardandoComision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar comisión
          </button>
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
              <div key={doc.id} className="py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors">
                <div className="flex items-center gap-3">
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
                      <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">¿Quién verificó?</option>
                      <option value="Agencia" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Agencia</option>
                      <option value="Cliente" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Cliente</option>
                    </select>
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
                    title={doc.documentacion_ventas_archivos.length > 0 ? "Adjuntar otro archivo" : "Adjuntar archivo"}
                  >
                    {subiendoId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {doc.documentacion_ventas_archivos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 ml-8">
                    {doc.documentacion_ventas_archivos.map((archivo, i) => (
                      <span key={archivo.id} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] rounded-md pl-2 pr-1 py-1 text-[10px] font-medium text-indigo-600 dark:text-sky-300">
                        <a href={archivo.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1" title={archivo.nombre_archivo || "Ver archivo"}>
                          <ExternalLink className="w-3 h-3" /> {archivo.nombre_archivo || `Archivo ${i + 1}`}
                        </a>
                        <button onClick={() => imprimirArchivo(archivo.url)} className="p-0.5 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors" title="Imprimir este archivo">
                          <Printer className="w-3 h-3" />
                        </button>
                        <button onClick={() => eliminarArchivo(doc, archivo.id)} className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Quitar">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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

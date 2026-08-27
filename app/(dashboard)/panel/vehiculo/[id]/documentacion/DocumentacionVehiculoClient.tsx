"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowLeft, FileText, Paperclip, Loader2, ExternalLink, X, Plus,
  CheckCircle2, Clock, Ban, AlertTriangle,
} from "lucide-react";

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
  vencimiento: string | null;
  observacion: string | null;
  documentacion_vehiculos_archivos: ArchivoDocumento[];
}

interface Vehiculo {
  id: string;
  patente: string | null;
  marca: string;
  modelo: string;
  anio: number;
  origen: string | null;
  sucursales: { nombre: string }[] | { nombre: string } | null;
}

const ESTADOS = ["Pendiente", "Recibido", "No corresponde", "Vencido"];

const ESTADO_INFO: Record<string, { color: string; icono: typeof Clock }> = {
  Pendiente: { color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#002a6e] dark:text-amber-300 dark:border-[#0a2a6b]", icono: Clock },
  Recibido: { color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#002a6e] dark:text-emerald-300 dark:border-[#0a2a6b]", icono: CheckCircle2 },
  "No corresponde": { color: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#00246b] dark:text-slate-400 dark:border-[#0a2a6b]", icono: Ban },
  Vencido: { color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-[#002a6e] dark:text-rose-300 dark:border-[#0a2a6b]", icono: AlertTriangle },
};

function nombreSucursal(s: Vehiculo["sucursales"]) {
  if (!s) return null;
  return Array.isArray(s) ? s[0]?.nombre : s.nombre;
}

// Vencimiento pasado o a menos de 30 días — marcamos "vence pronto" aunque
// el estado siga en "Recibido", porque ahí es donde a la gestora se le pasa.
function alertaVencimiento(vencimiento: string | null): "vencido" | "por_vencer" | null {
  if (!vencimiento) return null;
  const dias = Math.floor((new Date(vencimiento).getTime() - Date.now()) / 86400000);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "por_vencer";
  return null;
}

export default function DocumentacionVehiculoClient({ vehiculo, documentosIniciales }: { vehiculo: Vehiculo; documentosIniciales: Documento[] }) {
  const router = useRouter();
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const cambiarEstado = async (doc: Documento, nuevoEstado: string) => {
    setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, estado: nuevoEstado, fecha_recibido: nuevoEstado === "Recibido" ? new Date().toISOString().split("T")[0] : d.fecha_recibido } : d)));
    await supabase
      .from("documentacion_vehiculos")
      .update({ estado: nuevoEstado, fecha_recibido: nuevoEstado === "Recibido" ? new Date().toISOString().split("T")[0] : doc.fecha_recibido })
      .eq("id", doc.id);
  };

  const cambiarVencimiento = async (doc: Documento, valor: string) => {
    setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, vencimiento: valor || null } : d)));
    await supabase.from("documentacion_vehiculos").update({ vencimiento: valor || null }).eq("id", doc.id);
  };

  const cambiarObservacion = async (doc: Documento, valor: string) => {
    setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, observacion: valor || null } : d)));
    await supabase.from("documentacion_vehiculos").update({ observacion: valor || null }).eq("id", doc.id);
  };

  const subirArchivo = async (doc: Documento, file: File) => {
    setSubiendoId(doc.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo");

      const { data: nuevoArchivo, error } = await supabase
        .from("documentacion_vehiculos_archivos")
        .insert({ documento_id: doc.id, url: data.publicUrl, nombre_archivo: file.name })
        .select("id, url, nombre_archivo, created_at")
        .single();
      if (error) throw error;

      const hoy = new Date().toISOString().split("T")[0];
      const nuevoEstado = doc.estado === "Pendiente" ? "Recibido" : doc.estado;
      await supabase.from("documentacion_vehiculos").update({ estado: nuevoEstado, fecha_recibido: hoy }).eq("id", doc.id);

      setDocumentos((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, estado: nuevoEstado, fecha_recibido: hoy, documentacion_vehiculos_archivos: [...d.documentacion_vehiculos_archivos, nuevoArchivo] } : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setSubiendoId(null);
    }
  };

  const eliminarArchivo = async (doc: Documento, archivoId: string) => {
    if (!confirm("¿Quitar este archivo?")) return;
    const { error } = await supabase.from("documentacion_vehiculos_archivos").delete().eq("id", archivoId);
    if (error) {
      alert("No se pudo quitar el archivo.");
      return;
    }
    setDocumentos((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, documentacion_vehiculos_archivos: d.documentacion_vehiculos_archivos.filter((a) => a.id !== archivoId) } : d))
    );
  };

  const agregarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTipo.trim()) return;
    setAgregando(true);
    try {
      const { data, error } = await supabase
        .from("documentacion_vehiculos")
        .insert({ vehiculo_id: vehiculo.id, tipo_documento: nuevoTipo.trim() })
        .select("id, tipo_documento, estado, fecha_recibido, vencimiento, observacion, documentacion_vehiculos_archivos(id, url, nombre_archivo, created_at)")
        .single();
      if (error) throw error;
      setDocumentos((prev) => [...prev, data as any]);
      setNuevoTipo("");
    } catch {
      alert("No se pudo agregar el documento.");
    } finally {
      setAgregando(false);
    }
  };

  const eliminarDocumento = async (doc: Documento) => {
    if (!confirm(`¿Quitar "${doc.tipo_documento}" del legajo?`)) return;
    const { error } = await supabase.from("documentacion_vehiculos").delete().eq("id", doc.id);
    if (error) {
      alert("No se pudo quitar el documento.");
      return;
    }
    setDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const recibidos = documentos.filter((d) => d.estado === "Recibido").length;
  const faltantes = documentos.filter((d) => d.estado === "Pendiente").length;
  const vencidos = documentos.filter((d) => d.estado === "Vencido" || alertaVencimiento(d.vencimiento) === "vencido").length;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {vehiculo.marca} {vehiculo.modelo} {vehiculo.patente ? `(${vehiculo.patente})` : ""}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {vehiculo.anio} {nombreSucursal(vehiculo.sucursales) ? `· ${nombreSucursal(vehiculo.sucursales)}` : ""} {vehiculo.origen ? `· ${vehiculo.origen}` : ""}
              </p>
            </div>
            <Link
              href={`/panel/vehiculo/editar/${vehiculo.id}`}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors"
            >
              Ver ficha del vehículo
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-lg">{recibidos}/{documentos.length} recibidos</span>
            {faltantes > 0 && <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-lg">{faltantes} pendientes</span>}
            {vencidos > 0 && <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-[#002a6e] border border-rose-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-lg">{vencidos} vencidos</span>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Control documental
          </h2>

          <div className="space-y-3">
            {documentos.map((doc) => {
              const alerta = alertaVencimiento(doc.vencimiento);
              const info = ESTADO_INFO[doc.estado] || ESTADO_INFO.Pendiente;
              const Icono = info.icono;
              return (
                <div key={doc.id} className="p-3 rounded-xl border border-slate-100 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 min-w-[160px]">{doc.tipo_documento}</span>

                    <select
                      value={doc.estado}
                      onChange={(e) => cambiarEstado(doc, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg border outline-none cursor-pointer flex items-center gap-1 ${info.color}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={doc.vencimiento || ""}
                      onChange={(e) => cambiarVencimiento(doc, e.target.value)}
                      title="Vencimiento"
                      className={`text-[11px] font-medium px-2 py-1.5 rounded-lg border outline-none bg-slate-50 dark:bg-[#00246b] text-slate-600 dark:text-slate-300 ${alerta === "vencido" ? "border-rose-300 dark:border-rose-500/40" : alerta === "por_vencer" ? "border-amber-300 dark:border-amber-500/40" : "border-slate-200 dark:border-[#0a2a6b]"}`}
                    />

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
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 hover:bg-indigo-50 dark:hover:bg-[#002a6e] rounded-md transition-colors shrink-0 disabled:opacity-50"
                      title="Adjuntar archivo"
                    >
                      {subiendoId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => eliminarDocumento(doc)}
                      className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#002a6e] rounded-md transition-colors shrink-0"
                      title="Quitar de la lista"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(alerta || doc.observacion !== null) && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {alerta === "vencido" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400"><AlertTriangle className="w-3 h-3" /> Vencido</span>
                      )}
                      {alerta === "por_vencer" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Clock className="w-3 h-3" /> Vence pronto</span>
                      )}
                    </div>
                  )}

                  <input
                    value={doc.observacion || ""}
                    onChange={(e) => setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? { ...d, observacion: e.target.value } : d)))}
                    onBlur={(e) => cambiarObservacion(doc, e.target.value)}
                    placeholder="Observación..."
                    className="w-full mt-2 bg-transparent text-[12px] text-slate-500 dark:text-slate-400 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 border-b border-transparent focus:border-slate-200 dark:focus:border-[#0a2a6b] py-0.5"
                  />

                  {doc.documentacion_vehiculos_archivos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.documentacion_vehiculos_archivos.map((archivo, i) => (
                        <span key={archivo.id} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] rounded-md pl-2 pr-1 py-1 text-[10px] font-medium text-indigo-600 dark:text-sky-300">
                          <a href={archivo.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1" title={archivo.nombre_archivo || "Ver archivo"}>
                            <ExternalLink className="w-3 h-3" /> {archivo.nombre_archivo || `Archivo ${i + 1}`}
                          </a>
                          <button onClick={() => eliminarArchivo(doc, archivo.id)} className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Quitar">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={agregarDocumento} className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#0a2a6b]">
            <input
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              placeholder="Agregar documentación adicional..."
              className="flex-1 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={agregando || !nuevoTipo.trim()}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {agregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Agregar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Circle, Copy, ArrowLeft, FileText } from "lucide-react";

const ETAPAS = ["Seña", "Documentación", "Patentamiento", "Transferencia", "Entrega", "Completado"];

interface Documento {
  id: string;
  tipo_documento: string;
  estado: string;
  fecha_recibido: string | null;
}

interface Venta {
  id: string;
  codigo_seguimiento: string | null;
  etapa_seguimiento: string | null;
  fecha_venta: string;
  clientes: { nombre: string; apellido: string; telefono_celular: string | null } | null;
  vehiculos: { marca: string; modelo: string; patente: string | null } | null;
}

export default function SeguimientoClient({ venta, documentosIniciales }: { venta: Venta; documentosIniciales: Documento[] }) {
  const router = useRouter();
  const [etapaActual, setEtapaActual] = useState(venta.etapa_seguimiento || "Seña");
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [cargando, setCargando] = useState(false);

  const cambiarEtapa = async (nuevaEtapa: string) => {
    setEtapaActual(nuevaEtapa);
    await supabase.from("ventas").update({ etapa_seguimiento: nuevaEtapa }).eq("id", venta.id);
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

  const copiarLink = () => {
    if (!venta.codigo_seguimiento) return;
    navigator.clipboard.writeText(`${window.location.origin}/seguimiento/${venta.codigo_seguimiento}`);
    alert("Link copiado");
  };

  const recibidos = documentos.filter((d) => d.estado === "Recibido").length;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {venta.vehiculos?.marca} {venta.vehiculos?.modelo} {venta.vehiculos?.patente ? `(${venta.vehiculos.patente})` : ""}
              </h1>
              <p className="text-sm text-slate-500">{venta.clientes?.nombre} {venta.clientes?.apellido}</p>
            </div>
            {venta.codigo_seguimiento && (
              <button onClick={copiarLink} className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                <Copy className="w-3.5 h-3.5" /> {venta.codigo_seguimiento}
              </button>
            )}
          </div>

          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Etapa Actual</h2>
          <div className="flex flex-wrap gap-2">
            {ETAPAS.map((etapa) => (
              <button
                key={etapa}
                onClick={() => cambiarEtapa(etapa)}
                disabled={cargando}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  etapaActual === etapa
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                }`}
              >
                {etapa}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Documentación
            </h2>
            <span className="text-[11px] font-bold text-slate-400">{recibidos}/{documentos.length} recibidos</span>
          </div>

          <div className="space-y-1">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                onClick={() => toggleDocumento(doc)}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {doc.estado === "Recibido" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${doc.estado === "Recibido" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {doc.tipo_documento}
                </span>
                {doc.fecha_recibido && (
                  <span className="text-[10px] text-slate-400 ml-auto">{doc.fecha_recibido}</span>
                )}
              </div>
            ))}
            {documentos.length === 0 && (
              <p className="text-sm text-slate-400 italic py-4 text-center">Sin documentación cargada para esta venta.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

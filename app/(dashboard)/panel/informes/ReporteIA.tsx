"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Clock } from "lucide-react";

interface Reporte {
  id: string;
  mes: string;
  contenido: string;
  generado_en: string;
}

export default function ReporteIA({ reportesPrevios }: { reportesPrevios: Reporte[] }) {
  const router = useRouter();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporteActual, setReporteActual] = useState<Reporte | null>(reportesPrevios[0] || null);

  const generarReporte = async () => {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch("/api/informes/generar-reporte", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar el reporte");
      setReporteActual(data.reporte);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-white border border-indigo-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-slate-900">Resumen ejecutivo con IA</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {reporteActual ? `Generado ${new Date(reporteActual.generado_en).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Todavía no generaste un reporte este mes."}
            </p>
          </div>
        </div>
        <button
          onClick={generarReporte}
          disabled={generando}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 shrink-0"
        >
          {generando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {generando ? "Generando..." : "Generar reporte de este mes"}
        </button>
      </div>

      {error && (
        <div className="mx-6 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] p-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      {reporteActual && (
        <div className="mx-6 mb-6 bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{reporteActual.contenido}</p>
        </div>
      )}

      {reportesPrevios.length > 1 && (
        <div className="border-t border-indigo-100 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Reportes anteriores</p>
          <div className="space-y-1.5">
            {reportesPrevios.slice(1).map((r) => (
              <button
                key={r.id}
                onClick={() => setReporteActual(r)}
                className="w-full text-left text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 px-2 py-1.5 rounded-lg transition-colors"
              >
                {new Date(r.generado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Upload, CheckCircle2, XCircle } from "lucide-react";
import { fmt } from "./shared";

type FilaExtracto = { fecha: string; descripcion: string; monto: number; match?: any };

function parseCsv(text: string): FilaExtracto[] {
  const sep = text.includes(";") && !text.includes(",") ? ";" : ",";
  const lineas = text.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length === 0) return [];
  const header = lineas[0].toLowerCase().split(sep).map((h) => h.trim().replace(/"/g, ""));
  const iFecha = header.findIndex((h) => h.includes("fecha"));
  const iDesc = header.findIndex((h) => h.includes("descrip"));
  const iMonto = header.findIndex((h) => h.includes("monto"));
  if (iFecha < 0 || iDesc < 0 || iMonto < 0) return [];
  return lineas.slice(1).map((l) => {
    const cols = l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    return { fecha: cols[iFecha], descripcion: cols[iDesc], monto: Number((cols[iMonto] || "0").replace(/\./g, "").replace(",", ".")) || Number(cols[iMonto]) || 0 };
  });
}

export default function ConciliacionTab({ movimientos }: { movimientos: any[] }) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [filas, setFilas] = useState<FilaExtracto[]>([]);

  const onFile = async (file: File) => {
    setArchivo(file.name);
    const text = await file.text();
    const parseadas = parseCsv(text);
    const disponibles = new Set(movimientos.filter((m) => !m.deleted_at).map((m) => m.id));
    const usados = new Set<string>();
    const conMatch = parseadas.map((f) => {
      const fechaExtracto = new Date(f.fecha);
      const candidato = movimientos.find((m) => {
        if (m.deleted_at || usados.has(m.id) || !disponibles.has(m.id)) return false;
        const diffMonto = Math.abs(Number(m.monto) - Math.abs(f.monto));
        const diffDias = Math.abs((new Date(m.fecha).getTime() - fechaExtracto.getTime()) / 86400000);
        return diffMonto <= 1 && diffDias <= 3;
      });
      if (candidato) usados.add(candidato.id);
      return { ...f, match: candidato };
    });
    setFilas(conMatch);
  };

  const matcheadas = filas.filter((f) => f.match).length;

  return (
    <div>
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-700 dark:text-amber-300">
        🏦 <b>Conciliación bancaria (scaffold)</b>: subí el extracto CSV y matcheamos automáticamente contra los movimientos del CRM. Acepta columnas <code>fecha</code>, <code>descripcion</code> y <code>monto</code> (separador , o ;). Match por monto absoluto (±1) y fecha (±3 días).
      </div>

      <label className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer">
        <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Upload className="w-4 h-4" /> Subir extracto CSV</span>
        <span className="text-xs text-slate-400">{archivo || "Sin archivo cargado."}</span>
        <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>

      {filas.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-400 mb-2">{matcheadas} de {filas.length} filas matcheadas.</p>
          <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha extracto</th><th className="p-2.5">Descripción extracto</th><th className="p-2.5">Monto extracto</th><th className="p-2.5">Match</th></tr></thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-white/5">
                    <td className="p-2.5">{f.fecha}</td>
                    <td className="p-2.5">{f.descripcion}</td>
                    <td className="p-2.5 font-mono">{f.monto.toLocaleString("es-AR")}</td>
                    <td className="p-2.5">
                      {f.match ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> {f.match.tipo_movimiento || f.match.observaciones || "Movimiento"} · {fmt(f.match.monto, f.match.cuenta?.moneda)}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500 font-bold"><XCircle className="w-3.5 h-3.5" /> Sin match</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

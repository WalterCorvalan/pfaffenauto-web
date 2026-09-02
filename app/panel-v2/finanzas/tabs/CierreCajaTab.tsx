"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Package, Download, X } from "lucide-react";
import { fmt } from "./shared";

export default function CierreCajaTab({ cierres, setCierres }: { cierres: any[]; setCierres: (fn: any) => void }) {
  const [guardando, setGuardando] = useState(false);
  const [viendo, setViendo] = useState<any | null>(null);

  const cerrarHoy = async () => {
    setGuardando(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data: cierreId, error } = await supabase2.rpc("cerrar_dia_caja", { p_fecha: hoy });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("finanzas_cierres_diarios").select("*, detalle:finanzas_cierres_diarios_detalle(*), cerrado_por_perfil:perfiles!finanzas_cierres_diarios_cerrado_por_fkey(nombre)").eq("id", cierreId).single();
      setCierres((prev: any[]) => [fresh, ...prev.filter((c) => c.fecha !== hoy)]);
    } catch (err: any) {
      alert(err.message || "No se pudo cerrar el día.");
    } finally { setGuardando(false); }
  };

  const exportarXlsx = () => {
    const filas = [["Fecha", "Caja", "Moneda", "Saldo", "Cerrado por"]];
    cierres.forEach((c) => (c.detalle || []).forEach((d: any) => filas.push([c.fecha, d.cuenta_nombre, d.moneda, String(d.saldo), c.cerrado_por_perfil?.nombre || ""])));
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cierres_caja_${new Date().toISOString().slice(0, 10)}.xlsx.csv`;
    link.click();
  };

  const totales = (c: any) => {
    const usd = (c.detalle || []).filter((d: any) => d.moneda === "USD");
    const ars = (c.detalle || []).filter((d: any) => d.moneda === "ARS");
    return {
      usdCuentas: usd.length, arsCuentas: ars.length,
      usdTotal: usd.reduce((a: number, d: any) => a + Number(d.saldo), 0),
      arsTotal: ars.reduce((a: number, d: any) => a + Number(d.saldo), 0),
    };
  };

  return (
    <div>
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300">
        📦 <b>Cierre diario</b>: snapshot histórico de saldos por caja al final del día. Te permite saber "cuánto había en cada caja el 15 de marzo" aunque después se hayan movido fondos.
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <button onClick={exportarXlsx} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-white/10 rounded-lg"><Download className="w-4 h-4" /> XLSX</button>
        <button onClick={cerrarHoy} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Package className="w-4 h-4" /> Cerrar día actual</button>
      </div>

      {cierres.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin cierres diarios</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Cajas (USD)</th><th className="p-2.5">Cajas (ARS)</th><th className="p-2.5">Total USD</th><th className="p-2.5">Total ARS</th><th className="p-2.5">Responsable</th><th className="p-2.5">Ver detalle</th></tr></thead>
            <tbody>
              {cierres.map((c) => {
                const t = totales(c);
                return (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-white/5">
                    <td className="p-2.5 font-bold">{c.fecha}</td>
                    <td className="p-2.5">{t.usdCuentas} cuenta{t.usdCuentas === 1 ? "" : "s"}</td>
                    <td className="p-2.5">{t.arsCuentas} cuenta{t.arsCuentas === 1 ? "" : "s"}</td>
                    <td className="p-2.5 font-mono font-bold text-indigo-600">{fmt(t.usdTotal, "USD")}</td>
                    <td className="p-2.5 font-mono font-bold text-rose-500">{fmt(t.arsTotal, "ARS")}</td>
                    <td className="p-2.5">{c.cerrado_por_perfil?.nombre || "—"}</td>
                    <td className="p-2.5"><button onClick={() => setViendo(c)} className="text-rose-500 font-bold">Ver detalle →</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viendo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViendo(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><p className="text-xs text-slate-400">Cerrado por {viendo.cerrado_por_perfil?.nombre || "—"} · {new Date(viendo.cerrado_en).toLocaleString("es-AR")}</p><button onClick={() => setViendo(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="space-y-1.5 mt-3">
              {(viendo.detalle || []).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 text-sm"><span className="font-bold">{d.cuenta_nombre} <span className="text-slate-400 font-normal">({d.moneda})</span></span><span className="font-mono font-bold text-emerald-600">{fmt(d.saldo, d.moneda)}</span></div>
              ))}
            </div>
            <div className="flex justify-end mt-4"><button onClick={() => setViendo(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-white/10 rounded-lg"><X className="w-4 h-4" /> Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

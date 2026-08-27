"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { mostrarToast } from "@/lib/toast";
import {
  CheckCircle2, ExternalLink, AlertTriangle, User, Car, MapPin, DollarSign, Loader2, Inbox,
} from "lucide-react";

interface Movimiento {
  id: string;
  tipo: string;
  tipo_movimiento: string | null;
  monto: number;
  fecha: string;
  cuit_dni: string | null;
  telefono: string | null;
  patente: string | null;
  interno: string | null;
  destino_dinero: string | null;
  es_tercero: boolean;
  comprobante_url: string | null;
  observaciones: string | null;
  sucursales: { nombre: string } | { nombre: string }[] | null;
  perfiles: { nombre: string } | { nombre: string }[] | null;
}

function unoDe<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default function AprobacionesClient({ movimientosIniciales }: { movimientosIniciales: Movimiento[] }) {
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [aprobandoId, setAprobandoId] = useState<string | null>(null);

  const aprobar = async (mov: Movimiento) => {
    if (!mov.comprobante_url) {
      mostrarToast("Este movimiento no tiene comprobante adjunto — no se puede aprobar.", "error");
      return;
    }
    setAprobandoId(mov.id);
    const { error } = await supabase.from("movimientos_caja").update({ aprobado: true }).eq("id", mov.id);
    setAprobandoId(null);
    if (error) {
      mostrarToast(error.message.includes("comprobante") ? error.message : "No se pudo aprobar el movimiento.", "error");
      return;
    }
    setMovimientos((prev) => prev.filter((m) => m.id !== mov.id));
    mostrarToast("Movimiento aprobado.");
  };

  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-24 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl">
        <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sin movimientos pendientes</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Todo lo cargado ya está aprobado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {movimientos.map((m) => {
        const sucursal = unoDe(m.sucursales);
        const vendedor = unoDe(m.perfiles);
        return (
        <div
          key={m.id}
          className={`bg-white dark:bg-[#001c55] border rounded-2xl p-5 shadow-sm ${
            m.comprobante_url ? "border-slate-200 dark:border-[#0a2a6b]" : "border-amber-300 dark:border-amber-500/40"
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 border border-indigo-100 dark:border-[#0a2a6b] px-2 py-0.5 rounded-md">
                  {m.tipo_movimiento}
                </span>
                {m.es_tercero && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-50 dark:bg-[#002a6e] text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-[#0a2a6b] px-2 py-0.5 rounded-md">
                    A tercero
                  </span>
                )}
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(`${m.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                </span>
              </div>

              <p className="text-lg font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> {Number(m.monto).toLocaleString("es-AR")}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12px] text-slate-500 dark:text-slate-400">
                {vendedor?.nombre && (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {vendedor.nombre}</span>
                )}
                {m.patente && (
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {m.patente}{m.interno ? ` · Int. ${m.interno}` : ""}</span>
                )}
                {sucursal?.nombre && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {sucursal.nombre}</span>
                )}
                {m.destino_dinero && <span>Destino: <strong className="text-slate-700 dark:text-slate-200">{m.destino_dinero}</strong></span>}
              </div>

              {m.observaciones && (
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2 italic">"{m.observaciones}"</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {m.comprobante_url ? (
                <a
                  href={m.comprobante_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-[#00246b] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver comprobante
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" /> Sin comprobante
                </span>
              )}
              <button
                onClick={() => aprobar(m)}
                disabled={aprobandoId === m.id || !m.comprobante_url}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {aprobandoId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Aprobar
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

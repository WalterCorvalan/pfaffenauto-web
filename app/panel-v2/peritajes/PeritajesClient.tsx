"use client";

import Link from "next/link";
import { ClipboardCheck, CarFront, User, Calendar } from "lucide-react";
import NuevoPeritajeModal from "./NuevoPeritajeModal";

interface Lead {
  origen: "whatsapp" | "instagram";
  id: string;
  nombre: string;
  created_at: string;
}

export default function PeritajesClient({ peritajes, leadsSinPeritaje }: { peritajes: any[]; leadsSinPeritaje: Lead[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Peritajes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspecciones de vehículos tasados</p>
          </div>
        </div>
        <NuevoPeritajeModal leads={leadsSinPeritaje} />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#141414]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {peritajes.map((p: any) => (
            <Link
              key={p.id}
              href={`/panel-v2/peritajes/${p.id}`}
              className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${p.estado === "Completado" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                  {p.estado}
                </span>
                {p.puntaje !== null && (
                  <span className={`text-sm font-black ${p.puntaje >= 70 ? "text-emerald-600 dark:text-emerald-400" : p.puntaje >= 40 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {p.puntaje}%
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CarFront className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {p.vehiculo_descripcion || "Vehículo sin descripción"}
              </p>
              {p.nombreCliente && (
                <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <User className="w-3 h-3 shrink-0" /> {p.nombreCliente}
                </p>
              )}
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                <Calendar className="w-3 h-3 shrink-0" /> {new Date(p.created_at).toLocaleDateString("es-AR")} · {p.perfiles?.nombre || "Sin asignar"}
              </p>
            </Link>
          ))}

          {peritajes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
              <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin peritajes todavía</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Iniciá uno con el botón "Nuevo peritaje" desde un lead de WhatsApp o Instagram.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

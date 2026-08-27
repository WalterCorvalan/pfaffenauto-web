"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, CarFront, Calendar, ChevronRight, History, ChevronDown } from "lucide-react";
import EstadoCasoSelector from "./EstadoCasoSelector";

const TIPO_COLOR: Record<string, string> = {
  Service: "bg-blue-500 text-white",
  Reclamo: "bg-rose-500 text-white",
  Garantia: "bg-purple-500 text-white",
};

const ESTADO_BORDE: Record<string, string> = {
  Pendiente: "border-l-amber-400", "En proceso": "border-l-sky-400", Resuelto: "border-l-emerald-400",
};

function Tarjeta({ c, atenuada }: { c: any; atenuada?: boolean }) {
  return (
    <Link
      href={`/panel/postventa/${c.id}`}
      className={`block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-l-4 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group ${ESTADO_BORDE[c.estado] || "border-l-slate-200"} ${atenuada ? "opacity-70" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${TIPO_COLOR[c.tipo] || TIPO_COLOR.Service}`}>
          {c.tipo}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <EstadoCasoSelector id={c.id} estado={c.estado} />
        </div>
      </div>

      <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1 flex items-center justify-between gap-2">
        {c.nombre_contacto}
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
        <Phone className="w-3 h-3" /> {c.telefono_contacto}
      </p>

      {c.vehiculos && (
        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mb-2">
          <CarFront className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {c.vehiculos.marca} {c.vehiculos.modelo} {c.vehiculos.patente ? `(${c.vehiculos.patente})` : ""}
        </p>
      )}

      {c.descripcion && (
        <p className="text-[12px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-lg p-2.5 mb-2 line-clamp-3">
          {c.descripcion}
        </p>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-2">
        <Calendar className="w-3 h-3" /> {new Date(`${c.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" })}
      </p>
    </Link>
  );
}

export default function CasosPostventa({ casos }: { casos: any[] }) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const activos = casos.filter((c) => c.estado !== "Resuelto");
  const resueltos = casos.filter((c) => c.estado === "Resuelto");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activos.map((c) => (<Tarjeta key={c.id} c={c} />))}

        {activos.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sin casos activos de postventa.</p>
          </div>
        )}
      </div>

      {resueltos.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setMostrarHistorial((v) => !v)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-3"
          >
            <History className="w-3.5 h-3.5" /> Resueltos ({resueltos.length})
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarHistorial ? "rotate-180" : ""}`} />
          </button>
          {mostrarHistorial && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {resueltos.map((c) => (<Tarjeta key={c.id} c={c} atenuada />))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

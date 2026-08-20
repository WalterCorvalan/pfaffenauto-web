"use client";

import { useState } from "react";
import { Inbox, Phone, CarFront, MessageSquareText, History, ChevronDown } from "lucide-react";
import EstadoConsignacionSelector from "./EstadoConsignacionSelector";

interface Solicitud {
  id: string;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | null;
  estado: string | null;
}

function Tarjeta({ s, atenuada }: { s: Solicitud; atenuada?: boolean }) {
  return (
    <div className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${atenuada ? "opacity-70" : ""}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-indigo-50 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 border-indigo-200 dark:border-[#0a2a6b]">
          Consignación
        </span>
        <EstadoConsignacionSelector id={s.id} estado={s.estado} />
      </div>
      <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1">{s.nombre}</h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
        <Phone className="w-3 h-3" /> {s.telefono}
      </p>
      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mb-3">
        <CarFront className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {s.marca} {s.modelo} ({s.anio}) · {s.kilometraje?.toLocaleString("es-AR")} km
      </p>
      <a
        href={`https://wa.me/${String(s.telefono).replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te escribimos de Pfaffen Autos por tu solicitud de consignación del ${s.marca} ${s.modelo}.`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-[#002a6e] hover:bg-emerald-100 dark:hover:bg-[#00246b] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
      >
        <MessageSquareText className="w-3.5 h-3.5" /> Contactar
      </a>
    </div>
  );
}

export default function SolicitudesConsignacion({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const activas = solicitudes.filter((s) => !s.estado || s.estado === "Pendiente" || s.estado === "Contactado");
  const historial = solicitudes.filter((s) => s.estado === "Convertido" || s.estado === "Descartado");

  return (
    <>
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
          <Inbox className="w-3.5 h-3.5" /> Solicitudes Entrantes ({activas.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activas.map((s) => (<Tarjeta key={s.id} s={s} />))}
          {activas.length === 0 && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Sin solicitudes de consignación pendientes.</p>
            </div>
          )}
        </div>
      </div>

      {historial.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarHistorial((v) => !v)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-3"
          >
            <History className="w-3.5 h-3.5" /> Historial de solicitudes ({historial.length})
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarHistorial ? "rotate-180" : ""}`} />
          </button>
          {mostrarHistorial && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {historial.map((s) => (<Tarjeta key={s.id} s={s} atenuada />))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

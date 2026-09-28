"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ETAPAS_TALLER } from "./etapasTaller";
import OrdenTallerDetalleModal from "./OrdenTallerDetalleModal";

function TarjetaOT({ orden, mecanicoNombre, onClick }: { orden: any; mecanicoNombre: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{orden.patente || "Sin patente"}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{orden.marca} {orden.modelo}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{orden.cliente_nombre}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-slate-400 truncate">{mecanicoNombre}</p>
        {orden.gestoria_lista && <span title="Gestoría lista"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /></span>}
      </div>
    </button>
  );
}

export default function TallerBoard({ ordenesIniciales, mecanicos, busqueda }: { ordenesIniciales: any[]; mecanicos: any[]; busqueda: string }) {
  const [ordenes, setOrdenes] = useState(ordenesIniciales);
  const [seleccionada, setSeleccionada] = useState<any>(null);

  const actualizarOrden = (actualizada: any) => {
    setOrdenes((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
    setSeleccionada(actualizada);
  };

  const filtro = busqueda.trim().toLowerCase();
  const ordenesFiltradas = filtro
    ? ordenes.filter((o) => [o.patente, o.cliente_nombre, o.marca, o.modelo].some((v) => (v || "").toLowerCase().includes(filtro)))
    : ordenes;

  // Solo las etapas activas (todo antes de "entrega" -- ver ETAPA_ENTREGA
  // en etapasTaller.ts, ese estado vive en la pestaña "Cerradas" aparte).
  const etapasActivas = ETAPAS_TALLER.filter((e) => e.value !== "entrega");

  return (
    <>
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4">
        {etapasActivas.map((etapa) => {
          const ordenesEtapa = ordenesFiltradas.filter((o) => o.estado === etapa.value);
          return (
            <div key={etapa.value} className="shrink-0 w-64 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{etapa.label}</p>
                <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full w-5 h-5 flex items-center justify-center">{ordenesEtapa.length}</span>
              </div>
              <div className="space-y-2 min-h-[40px]">
                {ordenesEtapa.map((o) => (
                  <TarjetaOT key={o.id} orden={o} mecanicoNombre={mecanicos.find((m) => m.id === o.mecanico_id)?.nombre || "Sin asignar"} onClick={() => setSeleccionada(o)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {seleccionada && (
        <OrdenTallerDetalleModal
          orden={seleccionada}
          mecanicos={mecanicos}
          onClose={() => setSeleccionada(null)}
          onActualizada={actualizarOrden}
        />
      )}
    </>
  );
}

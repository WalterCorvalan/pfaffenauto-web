"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, Settings, Search, Plus, Smartphone } from "lucide-react";
import NuevaOtModal from "./NuevaOtModal";
import TallerConfigModal from "./TallerConfigModal";
import TallerResumenTab from "./TallerResumenTab";
import TallerBoard from "./TallerBoard";
import OrdenTallerDetalleModal from "./OrdenTallerDetalleModal";
import { ETAPAS_TALLER, ETAPA_ENTREGA } from "./etapasTaller";
import { Crossfade } from "@/components/ui/movimiento";
export default function TallerClient({
  ordenesIniciales,
  mecanicos,
  servicios,
  configuracion,
  cobrosMes,
  renglonesMes,
  puedeVerPlata,
}: {
  cobrosMes: any[];
  renglonesMes: any[];
  puedeVerPlata: boolean;
  ordenesIniciales: any[];
  mecanicos: any[];
  servicios: any[];
  configuracion: any;
}) {
  const [tabActivo, setTabActivo] = useState("Tablero");
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevaOT, setModalNuevaOT] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  const [ordenSeleccionadaCerrada, setOrdenSeleccionadaCerrada] = useState<any>(null);

  const TABS = ["Tablero", "Agenda", "Recontacto", "Cerradas", "Historial", "Resumen"];
  // Solo "Tablero" y "Cerradas" tienen estados definidos para contar de verdad
  // (Agenda/Recontacto todavía no tienen un estado propio en `ordenes` -- no
  // se les muestra un número inventado hasta que ese submódulo exista).
  const CONTEO_POR_TAB: Record<string, string[] | undefined> = {
    Tablero: ETAPAS_TALLER.filter((e) => e.value !== ETAPA_ENTREGA).map((e) => e.value),
    Cerradas: [ETAPA_ENTREGA],
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0 pt-6 px-6">
        <div className="flex items-center justify-between gap-2 pb-4 sm:pb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Wrench className="hidden sm:block w-6 h-6 text-[#0145F2]" />
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2"><img src="/icons/panel/taller.png" alt="" className="w-5 h-5 object-contain shrink-0" /> Taller</h1>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Órdenes de trabajo del taller mecánico.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/panel/taller/movil"
              title="Vista para celular"
              className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10"
            >
              <Smartphone className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setModalConfig(true)}
              className="p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModalNuevaOT(true)}
              className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap bg-[#0145F2] hover:bg-[#0138c9] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva OT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const count = CONTEO_POR_TAB[tab] ? ordenesIniciales.filter((o) => CONTEO_POR_TAB[tab]!.includes(o.estado)).length : null;
            const activo = tabActivo === tab;
            return (
              <button
                key={tab}
                onClick={() => setTabActivo(tab)}
                className={`pb-3 text-[13px] font-bold transition-colors border-b-2 whitespace-nowrap ${
                  activo
                    ? "border-[#0145F2] text-[#0145F2] dark:text-[#5b8dff]"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab} {count !== null && `(${count})`}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por patente, cliente, marca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <Crossfade id={tabActivo}>
        {tabActivo === "Resumen" ? (
          <TallerResumenTab ordenes={ordenesIniciales} cobros={cobrosMes} renglones={renglonesMes} puedeVerPlata={puedeVerPlata} />
        ) : tabActivo === "Tablero" ? (
          ordenesIniciales.filter((o) => o.estado !== ETAPA_ENTREGA).length === 0 ? (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center h-64">
              <Wrench className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-[13px] font-medium text-slate-500">
                No hay órdenes activas. Cargá una con &quot;Nueva OT&quot;.
              </p>
            </div>
          ) : (
            <TallerBoard ordenesIniciales={ordenesIniciales.filter((o) => o.estado !== ETAPA_ENTREGA)} mecanicos={mecanicos} busqueda={busqueda} />
          )
        ) : tabActivo === "Cerradas" ? (
          ordenesIniciales.filter((o) => o.estado === ETAPA_ENTREGA).length === 0 ? (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center h-64">
              <Wrench className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-[13px] font-medium text-slate-500">Todavía no hay OTs entregadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ordenesIniciales.filter((o) => o.estado === ETAPA_ENTREGA).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOrdenSeleccionadaCerrada(o)}
                  className="text-left bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 hover:shadow-md transition-all"
                >
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{o.patente || "Sin patente"}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{o.marca} {o.modelo}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{o.cliente_nombre}</p>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center h-64">
            <p className="text-[13px] font-medium text-slate-500">&quot;{tabActivo}&quot; todavía no está implementado.</p>
          </div>
        )}
        </Crossfade>
      </div>

      {modalNuevaOT && (
        <NuevaOtModal
          mecanicos={mecanicos}
          onClose={() => setModalNuevaOT(false)}
        />
      )}
      {ordenSeleccionadaCerrada && (
        <OrdenTallerDetalleModal
          orden={ordenSeleccionadaCerrada}
          mecanicos={mecanicos}
          onClose={() => setOrdenSeleccionadaCerrada(null)}
          onActualizada={setOrdenSeleccionadaCerrada}
        />
      )}
      {modalConfig && (
        <TallerConfigModal 
          configuracion={configuracion} 
          mecanicos={mecanicos} 
          servicios={servicios} 
          onClose={() => setModalConfig(false)} 
        />
      )}
    </div>
  );
}
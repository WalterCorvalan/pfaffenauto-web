"use client";

import { useState } from "react";
import { Wrench, Settings, Search, Plus } from "lucide-react";
import NuevaOtModal from "./NuevaOtModal";
import TallerConfigModal from "./TallerConfigModal";
import TallerResumenTab from "./TallerResumenTab";
export default function TallerClient({
  ordenesIniciales,
  mecanicos,
  servicios,
  configuracion,
}: {
  ordenesIniciales: any[];
  mecanicos: any[];
  servicios: any[];
  configuracion: any;
}) {
  const [tabActivo, setTabActivo] = useState("Tablero");
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevaOT, setModalNuevaOT] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  const TABS = ["Tablero", "Agenda", "Recontacto", "Cerradas", "Historial", "Resumen"];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0 pt-6 px-6">
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-rose-600" />
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Taller</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Órdenes de trabajo del taller mecánico.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalConfig(true)}
              className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-200 dark:border-white/10"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModalNuevaOT(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva OT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const count = ordenesIniciales.length; // Lógica de conteo real pendiente
            const showsCount = ["Tablero", "Agenda", "Recontacto", "Cerradas"].includes(tab);
            const activo = tabActivo === tab;
            return (
              <button
                key={tab}
                onClick={() => setTabActivo(tab)}
                className={`pb-3 text-[13px] font-bold transition-colors border-b-2 whitespace-nowrap ${
                  activo
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab} {showsCount && `(0)`}
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

        {tabActivo === "Resumen" ? (
          <TallerResumenTab ordenes={ordenesIniciales} />
        ) : ordenesIniciales.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center h-64">
            <Wrench className="w-8 h-8 text-slate-400 mb-3" />
            <p className="text-[13px] font-medium text-slate-500">
              No hay órdenes activas. Cargá una con "Nueva OT".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {/* Listado de OTs (Próxima iteración) */}
          </div>
        )}
      </div>

      {modalNuevaOT && (
        <NuevaOtModal 
          mecanicos={mecanicos} 
          onClose={() => setModalNuevaOT(false)} 
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
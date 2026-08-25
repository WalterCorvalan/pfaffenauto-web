import { FileSearch } from "lucide-react";
import NotificacionesBell from "../../../NotificacionesBell";
import GestoriaBuscador from "./GestoriaBuscador";

export default function GestoriaPage() {
  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <FileSearch className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Gestoría</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Buscá una venta por patente para ver el auto, el comprador y la documentación.
            </p>
          </div>
        </div>
        <NotificacionesBell seccion="gestoria" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <GestoriaBuscador />
      </div>
    </div>
  );
}

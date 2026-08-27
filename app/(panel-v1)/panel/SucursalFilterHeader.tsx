import Link from "next/link";
import { Filter } from "lucide-react";

export default function SucursalFilterHeader({
  icon,
  titulo,
  subtitulo,
  basePath,
  sucursales,
  sucursalActual,
}: {
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
  basePath: string;
  sucursales: { id: string; nombre: string }[];
  sucursalActual: string;
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">{titulo}</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0 hidden sm:block" />
        <Link
          href={basePath}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
            !sucursalActual
              ? "bg-slate-100 dark:bg-[#002a6e] text-slate-900 dark:text-white border border-slate-200 dark:border-[#0a2a6b] shadow-sm"
              : "bg-white dark:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#00246b] border border-transparent"
          }`}
        >
          Todas
        </Link>
        {sucursales.map((s) => (
          <Link
            key={s.id}
            href={`${basePath}?sucursal=${s.id}`}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              sucursalActual === s.id
                ? "bg-slate-100 dark:bg-[#002a6e] text-slate-900 dark:text-white border border-slate-200 dark:border-[#0a2a6b] shadow-sm"
                : "bg-white dark:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#00246b] border border-transparent"
            }`}
          >
            {s.nombre}
          </Link>
        ))}
      </div>
    </header>
  );
}

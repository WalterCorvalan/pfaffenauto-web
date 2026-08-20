"use client";

import Link from "next/link";
import { Users, AlertTriangle, Clock, Inbox } from "lucide-react";

interface MiembroEquipo {
  id: string;
  nombre: string;
  sucursal: string;
  sinContactar: number;
  tareasVencidas: number;
}

function TarjetaVendedor({ v }: { v: MiembroEquipo }) {
  const alerta = v.sinContactar > 0 || v.tareasVencidas > 0;
  return (
    <Link
      href={`/panel/crm/tareas?vendedor=${v.id}`}
      className={`block bg-white dark:bg-[#001c55] border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${alerta ? "border-amber-200 dark:border-amber-400/30" : "border-slate-200 dark:border-[#0a2a6b]"}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
          {v.nombre?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{v.nombre}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{v.sucursal}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-lg p-2.5 text-center ${v.sinContactar > 0 ? "bg-sky-50 dark:bg-sky-400/10" : "bg-slate-50 dark:bg-[#00246b]"}`}>
          <p className={`text-lg font-black ${v.sinContactar > 0 ? "text-sky-600 dark:text-sky-300" : "text-slate-400 dark:text-slate-500"}`}>{v.sinContactar}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Sin contactar</p>
        </div>
        <div className={`rounded-lg p-2.5 text-center ${v.tareasVencidas > 0 ? "bg-rose-50 dark:bg-rose-400/10" : "bg-slate-50 dark:bg-[#00246b]"}`}>
          <p className={`text-lg font-black ${v.tareasVencidas > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-400 dark:text-slate-500"}`}>{v.tareasVencidas}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Vencidas</p>
        </div>
      </div>
    </Link>
  );
}

export default function EquipoClient({ equipo, sinAsignar, esAdmin }: { equipo: MiembroEquipo[]; sinAsignar: number; esAdmin: boolean }) {
  const totalSinContactar = equipo.reduce((a, v) => a + v.sinContactar, 0);
  const totalVencidas = equipo.reduce((a, v) => a + v.tareasVencidas, 0);

  // Admin ve todas las sucursales — agrupamos para no mezclar equipos.
  const porSucursal = new Map<string, MiembroEquipo[]>();
  equipo.forEach((v) => {
    if (!porSucursal.has(v.sucursal)) porSucursal.set(v.sucursal, []);
    porSucursal.get(v.sucursal)!.push(v);
  });
  const grupos = Array.from(porSucursal.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Supervisión de Equipo</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {esAdmin ? "Todos los vendedores, todas las sucursales" : "Vendedores de tu sucursal"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-400/10 border border-sky-100 dark:border-sky-400/20 px-3 py-1.5 rounded-lg text-[12px] font-bold text-sky-700 dark:text-sky-300">
            <Inbox className="w-3.5 h-3.5" /> {totalSinContactar} sin contactar
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20 px-3 py-1.5 rounded-lg text-[12px] font-bold text-rose-700 dark:text-rose-300">
            <Clock className="w-3.5 h-3.5" /> {totalVencidas} vencidas
          </div>
          {sinAsignar > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-400/10 border border-amber-100 dark:border-amber-400/20 px-3 py-1.5 rounded-lg text-[12px] font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> {sinAsignar} sin asignar a nadie
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-8">
          {grupos.map(([sucursal, miembros]) => (
            <div key={sucursal}>
              {esAdmin && (
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{sucursal}</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {miembros
                  .sort((a, b) => (b.sinContactar + b.tareasVencidas) - (a.sinContactar + a.tareasVencidas))
                  .map((v) => (<TarjetaVendedor key={v.id} v={v} />))}
              </div>
            </div>
          ))}

          {equipo.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No hay vendedores activos {esAdmin ? "" : "en tu sucursal"}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { FileText, TrendingUp, Tags, Car, Wrench, CheckCircle2 } from "lucide-react";

export default function TallerResumenTab({ ordenes }: { ordenes: any[] }) {
  // Helpers para la fecha ("Agosto 2026")
  const fechaActual = new Date();
  const mesActualStr = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fechaActual);
  const tituloMes = mesActualStr.charAt(0).toUpperCase() + mesActualStr.slice(1);

  // Cálculos de métricas (mockeados a 0/estado inicial hasta que se construya el submódulo de cobros)
  const facturacionMes = 0;
  const gananciaMes = 0;
  const ticketPromedio = 0;
  
  // Autos atendidos = Órdenes creadas este mes
  const mesActualIso = fechaActual.toISOString().slice(0, 7); // "YYYY-MM"
  const autosAtendidos = ordenes.filter(o => o.created_at?.startsWith(mesActualIso)).length;
  
  // En el taller ahora = Estados intermedios
  const enElTallerAhora = ordenes.filter(o => ["ingresado", "presupuestado", "aprobado", "en_proceso"].includes(o.estado)).length;
  
  // Presupuestos aprobados = Aprobados / Total presupuestados
  const ordenesPresupuestadas = ordenes.filter(o => o.estado !== "ingresado");
  const ordenesAprobadas = ordenesPresupuestadas.filter(o => ["aprobado", "en_proceso", "cerrada"].includes(o.estado));
  const pctAprobados = ordenesPresupuestadas.length > 0 
    ? Math.round((ordenesAprobadas.length / ordenesPresupuestadas.length) * 100) + "%" 
    : "—";

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
        {tituloMes}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Facturación */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <FileText className="w-4 h-4" /> Facturación del mes
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            USD {facturacionMes.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Ganancia */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" /> Ganancia del mes
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            USD {gananciaMes.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Ticket promedio */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Tags className="w-4 h-4" /> Ticket promedio
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            USD {ticketPromedio.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Autos atendidos */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Car className="w-4 h-4" /> Autos atendidos
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {autosAtendidos}
          </p>
        </div>

        {/* En el taller ahora */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Wrench className="w-4 h-4" /> En el taller ahora
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {enElTallerAhora}
          </p>
        </div>

        {/* Presupuestos aprobados */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4" /> Presupuestos aprobados
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {pctAprobados}
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Wallet, Calculator, Save, ClipboardList } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  sueldo_base: number;
  tiene_comision: boolean;
  monto_por_auto_taller: number;
}

interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  categoria_id: string | null;
  categorias_empleado: Categoria | null;
}

export default function LiquidadorClient({
  empleados,
  liquidacionesPrevias,
}: {
  empleados: Empleado[];
  liquidacionesPrevias: any[];
}) {
  const router = useRouter();
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const [empleadoId, setEmpleadoId] = useState("");
  const [mes, setMes] = useState(mesActual);
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [comisionTotal, setComisionTotal] = useState(0);
  const [cantidadAutos, setCantidadAutos] = useState(0);
  const [faltas, setFaltas] = useState("0");
  const [tardanzas, setTardanzas] = useState("0");
  const [descuentoPresentismo, setDescuentoPresentismo] = useState("0");

  const empleado = empleados.find((e) => e.id === empleadoId);
  const categoria = empleado?.categorias_empleado;
  const sueldoBase = categoria?.sueldo_base || 0;
  const montoTaller = cantidadAutos * (categoria?.monto_por_auto_taller || 0);
  const totalFinal = sueldoBase + comisionTotal + montoTaller - (Number(descuentoPresentismo) || 0);

  useEffect(() => {
    if (!empleadoId || !categoria) {
      setComisionTotal(0);
      setCantidadAutos(0);
      return;
    }

    const calcular = async () => {
      setCalculando(true);
      const [anio, mesNum] = mes.split("-").map(Number);
      const desde = `${mes}-01`;
      const hastaDate = new Date(anio, mesNum, 0); // último día del mes
      const hasta = hastaDate.toISOString().split("T")[0];

      if (categoria.tiene_comision) {
        const { data: ventas } = await supabase
          .from("boletos_venta")
          .select("comision_ars")
          .eq("vendedor_id", empleadoId)
          .gte("fecha", desde)
          .lte("fecha", hasta);
        setComisionTotal((ventas || []).reduce((acc, v) => acc + (Number(v.comision_ars) || 0), 0));
      } else {
        setComisionTotal(0);
      }

      if (categoria.monto_por_auto_taller > 0) {
        const desdeTs = `${desde}T00:00:00`;
        const hastaTs = `${hasta}T23:59:59`;
        const { data: cambios } = await supabase
          .from("historial_cambios")
          .select("registro_id")
          .eq("usuario_id", empleadoId)
          .eq("campo_modificado", "etapa_preparacion")
          .gte("fecha_cambio", desdeTs)
          .lte("fecha_cambio", hastaTs);
        const autosUnicos = new Set((cambios || []).map((c) => c.registro_id));
        setCantidadAutos(autosUnicos.size);
      } else {
        setCantidadAutos(0);
      }
      setCalculando(false);
    };
    calcular();
  }, [empleadoId, mes, categoria]);

  const guardar = async () => {
    if (!empleadoId) return alert("Elegí un empleado.");
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("liquidaciones_sueldo").upsert(
        {
          perfil_id: empleadoId,
          mes: `${mes}-01`,
          sueldo_base: sueldoBase,
          comision_total: comisionTotal,
          cantidad_autos_taller: cantidadAutos,
          monto_taller: montoTaller,
          faltas: Number(faltas) || 0,
          tardanzas: Number(tardanzas) || 0,
          descuento_presentismo: Number(descuentoPresentismo) || 0,
          total_final: totalFinal,
          generado_por: user?.id,
        },
        { onConflict: "perfil_id,mes" }
      );
      if (error) throw error;
      router.refresh();
      alert("Liquidación guardada.");
    } catch (err) {
      console.error(err);
      alert("Error al guardar la liquidación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Liquidador de Sueldos</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Sueldo base + comisión / autos trabajados + presentismo</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar p-6 space-y-6">
        {/* Selector */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Empleado</label>
              <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white">
                <option value="">Seleccionar...</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} {e.categorias_empleado ? `— ${e.categorias_empleado.nombre}` : "(sin categoría)"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Mes</label>
              <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
            </div>
          </div>

          {empleadoId && !categoria && (
            <p className="mt-4 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] rounded-lg px-3.5 py-2.5">
              Este empleado no tiene categoría asignada. Asignale una en Gestión de Equipo antes de liquidar.
            </p>
          )}
        </div>

        {/* Cálculo */}
        {empleadoId && categoria && (
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-sky-300" /> Cálculo {calculando && <span className="text-slate-400 dark:text-slate-500 normal-case font-medium">calculando...</span>}
            </h2>

            <dl className="space-y-3 text-sm mb-5">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Sueldo base ({categoria.nombre})</dt>
                <dd className="font-bold text-slate-900 dark:text-white font-mono">$ {sueldoBase.toLocaleString("es-AR")}</dd>
              </div>
              {categoria.tiene_comision && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Comisión de ventas del mes</dt>
                  <dd className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">+ $ {comisionTotal.toLocaleString("es-AR")}</dd>
                </div>
              )}
              {categoria.monto_por_auto_taller > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{cantidadAutos} autos trabajados × $ {categoria.monto_por_auto_taller.toLocaleString("es-AR")}</dt>
                  <dd className="font-bold text-amber-700 dark:text-amber-300 font-mono">+ $ {montoTaller.toLocaleString("es-AR")}</dd>
                </div>
              )}
            </dl>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-[#0a2a6b] mb-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Faltas</label>
                <input type="number" min="0" value={faltas} onChange={(e) => setFaltas(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Tardanzas</label>
                <input type="number" min="0" value={tardanzas} onChange={(e) => setTardanzas(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Descuento presentismo ($)</label>
                <input type="number" min="0" value={descuentoPresentismo} onChange={(e) => setDescuentoPresentismo(e.target.value)} className="w-full bg-rose-50 dark:bg-[#002a6e] border border-rose-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 text-rose-700 dark:text-rose-300 font-bold" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-[#0a2a6b] mb-6">
              <span className="text-base font-bold text-slate-900 dark:text-white">Total a liquidar</span>
              <span className="text-3xl font-black text-indigo-700 dark:text-sky-300">$ {totalFinal.toLocaleString("es-AR")}</span>
            </div>

            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {guardando ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar liquidación de {mes}</>}
            </button>
          </div>
        )}

        {/* Historial */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-sky-300" />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Liquidaciones generadas</h2>
          </div>
          {liquidacionesPrevias.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 dark:text-slate-500 text-center">Todavía no generaste ninguna liquidación.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#00246b] text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-[#0a2a6b]">
                  <th className="px-6 py-3">Empleado</th>
                  <th className="px-6 py-3">Mes</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                {liquidacionesPrevias.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b]">
                    <td className="px-6 py-3 font-bold text-slate-800 dark:text-white text-[13px]">{l.perfiles?.nombre || "—"}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-[13px]">
                      {new Date(l.mes).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-indigo-700 dark:text-sky-300 text-[13px]">
                      $ {Number(l.total_final).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

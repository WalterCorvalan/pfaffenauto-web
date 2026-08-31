"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Wallet, Calculator, Save, ClipboardList } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  sueldo_base: number;
  moneda_sueldo: string;
  tiene_comision: boolean;
  monto_por_auto_taller: number | null;
  moneda_taller: string;
}
interface Empleado {
  id: string;
  nombre: string;
  categoria_id: string | null;
  categorias_empleado: Categoria | null;
}

function fmt(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

export default function LiquidadorClient({ empleados, liquidacionesPrevias, categorias }: { empleados: Empleado[]; liquidacionesPrevias: any[]; categorias: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const [empleadoId, setEmpleadoId] = useState("");
  const [mes, setMes] = useState(mesActual);
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [categoriaAAsignar, setCategoriaAAsignar] = useState("");
  const [asignando, setAsignando] = useState(false);

  const [comisionUsd, setComisionUsd] = useState(0);
  const [comisionArs, setComisionArs] = useState(0);
  const [cantidadAutos, setCantidadAutos] = useState("0");
  const [faltas, setFaltas] = useState("0");
  const [tardanzas, setTardanzas] = useState("0");
  const [descuentoPresentismo, setDescuentoPresentismo] = useState("0");

  const empleado = empleados.find((e) => e.id === empleadoId);
  const categoria = empleado?.categorias_empleado;
  const sueldoBase = categoria?.sueldo_base || 0;
  const monedaSueldo = categoria?.moneda_sueldo || "ARS";
  const montoTaller = (Number(cantidadAutos) || 0) * (categoria?.monto_por_auto_taller || 0);
  const monedaTaller = categoria?.moneda_taller || "ARS";
  const comisionEnMonedaSueldo = monedaSueldo === "USD" ? comisionUsd : comisionArs;
  const comisionAparte = monedaSueldo === "USD" ? comisionArs : comisionUsd;
  const tallerEnMonedaSueldo = monedaTaller === monedaSueldo ? montoTaller : 0;
  const tallerAparte = monedaTaller === monedaSueldo ? 0 : montoTaller;
  const totalFinal = sueldoBase + comisionEnMonedaSueldo + tallerEnMonedaSueldo - (Number(descuentoPresentismo) || 0);

  useEffect(() => {
    if (!empleadoId || !categoria) {
      setComisionUsd(0);
      setComisionArs(0);
      return;
    }
    const calcular = async () => {
      setCalculando(true);
      const [anio, mesNum] = mes.split("-").map(Number);
      const desde = `${mes}-01`;
      const hasta = new Date(anio, mesNum, 1).toISOString().split("T")[0];

      if (categoria.tiene_comision) {
        const { data } = await supabase2.rpc("comisiones_periodo_empleado", { p_perfil_id: empleadoId, p_desde: desde, p_hasta: hasta });
        setComisionUsd(Number((data || []).find((r: any) => r.moneda === "USD")?.total) || 0);
        setComisionArs(Number((data || []).find((r: any) => r.moneda === "ARS")?.total) || 0);
      } else {
        setComisionUsd(0);
        setComisionArs(0);
      }
      setCalculando(false);
    };
    calcular();
  }, [empleadoId, mes, categoria]);

  const asignarCategoria = async () => {
    if (!categoriaAAsignar || !empleadoId) return;
    setAsignando(true);
    try {
      const { error } = await supabase2.from("perfiles").update({ categoria_id: categoriaAAsignar }).eq("id", empleadoId);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo asignar la categoría.");
    } finally {
      setAsignando(false);
    }
  };

  const guardar = async () => {
    if (!empleadoId) return alert("Elegí un empleado.");
    setGuardando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { error } = await supabase2.from("liquidaciones_sueldo").upsert(
        {
          perfil_id: empleadoId,
          mes: `${mes}-01`,
          sueldo_base: sueldoBase,
          moneda_sueldo: monedaSueldo,
          comision_total_usd: comisionUsd,
          comision_total_ars: comisionArs,
          cantidad_autos_taller: Number(cantidadAutos) || 0,
          monto_taller: montoTaller,
          moneda_taller: monedaTaller,
          faltas: Number(faltas) || 0,
          tardanzas: Number(tardanzas) || 0,
          descuento_presentismo: Number(descuentoPresentismo) || 0,
          total_final: totalFinal,
          moneda_total: monedaSueldo,
          generado_por: user?.id || null,
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
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Liquidador de sueldos</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sueldo base + comisión + trabajo de taller + presentismo</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#141414] p-6 space-y-6">
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Empleado</label>
              <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white">
                <option value="">Seleccionar...</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} {e.categorias_empleado ? `— ${e.categorias_empleado.nombre}` : "(sin categoría)"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Mes</label>
              <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
            </div>
          </div>

          {empleadoId && !categoria && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3.5 py-2.5">
              <span className="flex-1">Este empleado no tiene categoría asignada.</span>
              <div className="flex items-center gap-2">
                <select value={categoriaAAsignar} onChange={(e) => setCategoriaAAsignar(e.target.value)} className="bg-white dark:bg-white/10 border border-amber-300 dark:border-amber-500/30 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-900 dark:text-white">
                  <option value="">Elegir categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <button onClick={asignarCategoria} disabled={!categoriaAAsignar || asignando} className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 shrink-0">
                  {asignando ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {empleadoId && categoria && (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-5">
              <Calculator className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Cálculo {calculando && <span className="text-slate-400 normal-case font-medium">calculando...</span>}
            </h2>

            <dl className="space-y-3 text-sm mb-5">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Sueldo base ({categoria.nombre})</dt>
                <dd className="font-bold text-slate-900 dark:text-white font-mono">{fmt(sueldoBase, monedaSueldo)}</dd>
              </div>
              {categoria.tiene_comision && comisionEnMonedaSueldo > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Comisión de ventas del mes</dt>
                  <dd className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">+ {fmt(comisionEnMonedaSueldo, monedaSueldo)}</dd>
                </div>
              )}
              {tallerEnMonedaSueldo > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{cantidadAutos} autos de taller × {fmt(categoria.monto_por_auto_taller || 0, monedaTaller)}</dt>
                  <dd className="font-bold text-amber-700 dark:text-amber-400 font-mono">+ {fmt(tallerEnMonedaSueldo, monedaSueldo)}</dd>
                </div>
              )}
              {(comisionAparte > 0 || tallerAparte > 0) && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-white/10">
                  Además tiene {comisionAparte > 0 && <>comisión por {fmt(comisionAparte, monedaSueldo === "USD" ? "ARS" : "USD")}</>}
                  {comisionAparte > 0 && tallerAparte > 0 && " y "}
                  {tallerAparte > 0 && <>taller por {fmt(tallerAparte, monedaTaller)}</>} — no se suma al total porque es otra moneda.
                </p>
              )}
            </dl>

            {categoria.monto_por_auto_taller != null && (
              <div className="mb-5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Cantidad de autos de taller (carga manual)</label>
                <input type="number" min="0" value={cantidadAutos} onChange={(e) => setCantidadAutos(e.target.value)} className="w-full max-w-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-white/10 mb-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Faltas</label>
                <input type="number" min="0" value={faltas} onChange={(e) => setFaltas(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Tardanzas</label>
                <input type="number" min="0" value={tardanzas} onChange={(e) => setTardanzas(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Descuento presentismo ({monedaSueldo})</label>
                <input type="number" min="0" value={descuentoPresentismo} onChange={(e) => setDescuentoPresentismo(e.target.value)} className="w-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-400 text-rose-700 dark:text-rose-300 font-bold" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/10 mb-6">
              <span className="text-base font-bold text-slate-900 dark:text-white">Total a liquidar</span>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{fmt(totalFinal, monedaSueldo)}</span>
            </div>

            <button onClick={guardar} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {guardando ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar liquidación de {mes}</>}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Liquidaciones generadas</h2>
          </div>
          {liquidacionesPrevias.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">Todavía no generaste ninguna liquidación.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Mes</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {liquidacionesPrevias.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="px-6 py-3 font-bold text-slate-800 dark:text-white text-[13px]">{l.perfiles?.nombre || "—"}</td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-[13px]">{new Date(l.mes).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })}</td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-[13px]">{fmt(Number(l.total_final), l.moneda_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

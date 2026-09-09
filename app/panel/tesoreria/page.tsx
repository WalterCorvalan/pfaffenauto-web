import { createClient } from "@/lib/supabase/server";
import { Landmark, CreditCard, Wallet, HelpCircle } from "lucide-react";
import NuevaCuentaModal from "./NuevaCuentaModal";

export const metadata = { title: "Tesorería | Pfaffen Autos" };

const ICONO_TIPO: Record<string, any> = { Banco: Landmark, Tarjeta: CreditCard, Efectivo: Wallet, Otro: HelpCircle };

export default async function TesoreriaPage() {
  const supabase = await createClient();

  const [{ data: cuentas }, { data: sucursales }, { data: movimientos }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    // estado='aprobado' y deleted_at null — mismo filtro que saldo_cuenta()
    // en Finanzas. Antes esto sumaba TODO (pendientes de aprobación y
    // eliminados incluidos), así que Tesorería y Finanzas mostraban un
    // saldo distinto para la misma cuenta.
    supabase.from("movimientos_caja").select("cuenta_id, tipo, monto").not("cuenta_id", "is", null).eq("estado", "aprobado").is("deleted_at", null),
  ]);

  const saldoPorCuenta = (cuentaId: string) => {
    const movs = (movimientos || []).filter((m) => m.cuenta_id === cuentaId);
    return movs.reduce((acc, m) => acc + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)), 0);
  };

  const cuentasConSaldo = (cuentas || [])
    .map((c) => ({ ...c, saldo: Number(c.saldo_inicial) + saldoPorCuenta(c.id) }))
    .sort((a, b) => b.saldo - a.saldo);
  const saldoTotalArs = cuentasConSaldo.filter((c) => (c.moneda || "ARS") === "ARS").reduce((acc, c) => acc + c.saldo, 0);
  const saldoTotalUsd = cuentasConSaldo.filter((c) => c.moneda === "USD").reduce((acc, c) => acc + c.saldo, 0);
  const maxSaldoArs = Math.max(1, ...cuentasConSaldo.filter((c) => (c.moneda || "ARS") === "ARS").map((c) => Math.abs(c.saldo)));
  const maxSaldoUsd = Math.max(1, ...cuentasConSaldo.filter((c) => c.moneda === "USD").map((c) => Math.abs(c.saldo)));

  const BADGE_TIPO: Record<string, string> = {
    Banco: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    Tarjeta: "bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-100 dark:border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
    Efectivo: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400",
    Otro: "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400",
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Tesorería</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cuentas bancarias, tarjetas y saldos</p>
              </div>
            </div>
            <NuevaCuentaModal sucursales={sucursales || []} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-6 text-white shadow-sm">
              <Wallet className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-rose-100">Saldo total en pesos</span>
              <h3 className="text-3xl font-black mt-1 font-mono">$ {saldoTotalArs.toLocaleString("es-AR")}</h3>
              <p className="text-[11px] text-rose-100/80 mt-1 font-semibold">{cuentasConSaldo.filter((c) => (c.moneda || "ARS") === "ARS").length} cuenta(s)</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-sm">
              <Wallet className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-100">Saldo total en dólares</span>
              <h3 className="text-3xl font-black mt-1 font-mono">US$ {saldoTotalUsd.toLocaleString("en-US")}</h3>
              <p className="text-[11px] text-emerald-100/80 mt-1 font-semibold">{cuentasConSaldo.filter((c) => c.moneda === "USD").length} cuenta(s)</p>
            </div>
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Cuentas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasConSaldo.map((c) => {
              const Icono = ICONO_TIPO[c.tipo] || HelpCircle;
              const esUsd = c.moneda === "USD";
              const maxRef = esUsd ? maxSaldoUsd : maxSaldoArs;
              const pct = Math.min(100, (Math.abs(c.saldo) / maxRef) * 100);
              return (
                <div key={c.id} className={`bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-l-4 ${esUsd ? "border-l-emerald-400" : "border-l-rose-300"} rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${BADGE_TIPO[c.tipo] || BADGE_TIPO.Otro}`}><Icono className="w-4 h-4" /></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded">{c.tipo}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${esUsd ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"}`}>{c.moneda || "ARS"}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1 truncate">{c.nombre}</h3>
                  <p className={`text-xl font-black font-mono ${c.saldo >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>{esUsd ? "US$" : "$"} {c.saldo.toLocaleString(esUsd ? "en-US" : "es-AR")}</p>
                  <div className="mt-3 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.saldo < 0 ? "bg-rose-500" : esUsd ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {cuentasConSaldo.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
                <Landmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin cuentas cargadas</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Creá tu primera cuenta bancaria o tarjeta.</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-4">El saldo se calcula desde el saldo inicial + movimientos de caja vinculados a la cuenta. La barra de cada tarjeta compara su peso contra la cuenta más grande de su misma moneda.</p>
        </div>
      </div>
    </div>
  );
}

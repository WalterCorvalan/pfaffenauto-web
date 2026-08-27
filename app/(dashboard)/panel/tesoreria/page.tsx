import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Landmark, CreditCard, Wallet, HelpCircle } from "lucide-react";
import NuevaCuentaModal from "./NuevaCuentaModal";

const ICONO_TIPO: Record<string, any> = {
  Banco: Landmark,
  Tarjeta: CreditCard,
  Efectivo: Wallet,
  Otro: HelpCircle,
};

export default async function TesoreriaPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: cuentas }, { data: sucursales }, { data: movimientos }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("movimientos_caja").select("cuenta_id, tipo, monto").not("cuenta_id", "is", null),
  ]);

  const saldoPorCuenta = (cuentaId: string) => {
    const movs = (movimientos || []).filter((m) => m.cuenta_id === cuentaId);
    const neto = movs.reduce((acc, m) => acc + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)), 0);
    return neto;
  };

  const cuentasConSaldo = (cuentas || []).map((c) => ({
    ...c,
    saldo: Number(c.saldo_inicial) + saldoPorCuenta(c.id),
  }));

  // Cada cuenta es de una sola moneda — sumar todo junto en un solo "$" mezclaba
  // ARS y USD sin sentido. Totalizamos por separado.
  const saldoTotalArs = cuentasConSaldo.filter((c) => (c.moneda || "ARS") === "ARS").reduce((acc, c) => acc + c.saldo, 0);
  const saldoTotalUsd = cuentasConSaldo.filter((c) => c.moneda === "USD").reduce((acc, c) => acc + c.saldo, 0);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Tesorería</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Cuentas bancarias, tarjetas y saldos</p>
          </div>
        </div>
        <NuevaCuentaModal sucursales={sucursales || []} />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Saldo Total en Pesos</span>
              <h3 className={`text-3xl font-black mt-1 font-mono ${saldoTotalArs >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>
                $ {saldoTotalArs.toLocaleString("es-AR")}
              </h3>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Saldo Total en Dólares</span>
              <h3 className={`text-3xl font-black mt-1 font-mono ${saldoTotalUsd >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600"}`}>
                US$ {saldoTotalUsd.toLocaleString("en-US")}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasConSaldo.map((c) => {
              const Icono = ICONO_TIPO[c.tipo] || HelpCircle;
              return (
                <div key={c.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center">
                      <Icono className="w-4 h-4 text-indigo-600 dark:text-sky-300" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2 py-0.5 rounded">
                        {c.tipo}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] px-2 py-0.5 rounded">
                        {c.moneda || "ARS"}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1">{c.nombre}</h3>
                  <p className={`text-xl font-black font-mono ${c.saldo >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>
                    {c.moneda === "USD" ? "US$" : "$"} {c.saldo.toLocaleString(c.moneda === "USD" ? "en-US" : "es-AR")}
                  </p>
                </div>
              );
            })}

            {cuentasConSaldo.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
                <Landmark className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin cuentas cargadas</h3>
                <p className="text-slate-500 text-xs mt-1">Creá tu primera cuenta bancaria o tarjeta.</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            El saldo se calcula desde el saldo inicial + movimientos de caja vinculados a la cuenta. Para tipificar un gasto/ingreso a una cuenta, elegila al cargar el movimiento en Gastos.
          </p>
        </div>
      </div>
    </div>
  );
}

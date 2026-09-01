"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Plus, Printer, CarFront, AlertTriangle } from "lucide-react";
import EstadoSenaSelector from "./EstadoSenaSelector";
import NuevaSenaModal from "./NuevaSenaModal";

const COLOR_ESTADO: Record<string, string> = { Activa: "border-l-amber-400", Convertida: "border-l-emerald-400", Perdida: "border-l-rose-400" };

export default function SenasClient({
  senasIniciales, clientes, vehiculos, vendedores, sucursales, cuentas,
}: { senasIniciales: any[]; clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; cuentas: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [senas, setSenas] = useState(senasIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalAbierto(true);
      router.replace("/panel-v2/senas");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Señas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Anticipos y reservas de unidades</p>
          </div>
        </div>
        <button onClick={() => setModalAbierto(true)} className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"><Plus className="w-4 h-4" /> Nueva Seña</button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="hidden md:block bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">N°</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sucursal</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vehículo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Seña</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Estado</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {senas.map((s: any) => (
                    <tr key={s.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-l-4 ${COLOR_ESTADO[s.estado] || "border-l-slate-200"}`}>
                      <td className="px-4 py-3 font-mono text-[13px] font-bold text-rose-600 dark:text-rose-400">{s.numero || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{s.sucursales?.nombre || "—"}</td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-white">
                        {s.apellido || s.cliente_nombre}{s.apellido ? `, ${s.nombre}` : ""}
                        {s.precio_confirmado === false && <span title="Precio a confirmar" className="inline-flex ml-1.5 align-middle"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200"><span className="flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {s.marca} {s.modelo}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">{s.sena_ars ? `$ ${Number(s.sena_ars).toLocaleString("es-AR")}` : s.monto ? `${s.moneda} ${Number(s.monto).toLocaleString("es-AR")}` : "—"}</td>
                      <td className="px-4 py-3 text-center"><EstadoSenaSelector id={s.id} estado={s.estado} vehiculoId={s.vehiculo_id} /></td>
                      <td className="px-4 py-3 text-center"><Link href={`/panel-v2/senas/imprimir/${s.id}`} className="inline-flex p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"><Printer className="w-4 h-4" /></Link></td>
                    </tr>
                  ))}
                  {senas.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">Sin señas cargadas todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {senas.length === 0 && <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center text-slate-400 text-sm italic">Sin señas cargadas todavía.</div>}
            {senas.map((s: any) => (
              <div key={s.id} className={`bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-2 border-l-4 ${COLOR_ESTADO[s.estado] || "border-l-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-rose-600 dark:text-rose-400">N° {s.numero || "—"}</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{s.sena_ars ? `$ ${Number(s.sena_ars).toLocaleString("es-AR")}` : s.monto ? `${s.moneda} ${Number(s.monto).toLocaleString("es-AR")}` : "—"}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-1.5">{s.apellido || s.cliente_nombre}{s.apellido ? `, ${s.nombre}` : ""} {s.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}</p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {s.marca} {s.modelo}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">{s.sucursales?.nombre || "Sin sucursal"}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</span>
                    <EstadoSenaSelector id={s.id} estado={s.estado} vehiculoId={s.vehiculo_id} />
                  </div>
                  <Link href={`/panel-v2/senas/imprimir/${s.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400"><Printer className="w-3.5 h-3.5" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalAbierto && (
        <NuevaSenaModal
          clientes={clientes} vehiculos={vehiculos} vendedores={vendedores} sucursales={sucursales} cuentas={cuentas}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}

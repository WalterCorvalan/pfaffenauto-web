"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Printer, CarFront, AlertTriangle } from "lucide-react";
import CompartirPresupuestoBoton from "./CompartirPresupuestoBoton";
import NuevoPresupuestoModal from "./NuevoPresupuestoModal";

export default function PresupuestosClient({
  presupuestosIniciales, clientes, vehiculos, vendedores, sucursales,
}: { presupuestosIniciales: any[]; clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [presupuestos, setPresupuestos] = useState(presupuestosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalAbierto(true);
      router.replace("/panel-v2/presupuestos");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Presupuestos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cotizaciones formales enviadas a clientes</p>
          </div>
        </div>
        <button onClick={() => setModalAbierto(true)} className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"><Plus className="w-4 h-4" /> Nuevo Presupuesto</button>
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
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vehículo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vendedor</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Precio</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Link</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {presupuestos.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-l-4 ${p.precio_confirmado === false ? "border-l-amber-400" : "border-l-rose-300"}`}>
                      <td className="px-4 py-3 font-mono text-[13px] font-bold text-rose-600 dark:text-rose-400">{p.numero || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</td>
                      <td className="px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-white">
                        {p.cliente_nombre}
                        {p.precio_confirmado === false && <span title="Precio a confirmar" className="inline-flex ml-1.5 align-middle"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200"><span className="flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {p.marca} {p.modelo}</span></td>
                      <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{p.perfiles?.nombre || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">{p.precio_ars ? `$ ${Number(p.precio_ars).toLocaleString("es-AR")}` : p.precio_usd ? `US$ ${Number(p.precio_usd).toLocaleString("es-AR")}` : "—"}</td>
                      <td className="px-4 py-3 text-center"><CompartirPresupuestoBoton tokenPublico={p.token_publico} /></td>
                      <td className="px-4 py-3 text-center"><Link href={`/panel-v2/presupuestos/imprimir/${p.id}`} className="inline-flex p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"><Printer className="w-4 h-4" /></Link></td>
                    </tr>
                  ))}
                  {presupuestos.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">Sin presupuestos cargados todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {presupuestos.length === 0 && <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center text-slate-400 text-sm italic">Sin presupuestos cargados todavía.</div>}
            {presupuestos.map((p: any) => (
              <div key={p.id} className={`bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-2 border-l-4 ${p.precio_confirmado === false ? "border-l-amber-400" : "border-l-rose-300"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-rose-600 dark:text-rose-400">N° {p.numero || "—"}</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{p.precio_ars ? `$ ${Number(p.precio_ars).toLocaleString("es-AR")}` : p.precio_usd ? `US$ ${Number(p.precio_usd).toLocaleString("es-AR")}` : "—"}</span>
                </div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-1.5">{p.cliente_nombre} {p.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}</p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {p.marca} {p.modelo}</p>
                <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-white/10">
                  <span>{p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"} · {p.perfiles?.nombre || "Sin vendedor"}</span>
                  <div className="flex items-center gap-1.5">
                    <CompartirPresupuestoBoton tokenPublico={p.token_publico} compacto />
                    <Link href={`/panel-v2/presupuestos/imprimir/${p.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400"><Printer className="w-3.5 h-3.5" /></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalAbierto && (
        <NuevoPresupuestoModal clientes={clientes} vehiculos={vehiculos} vendedores={vendedores} sucursales={sucursales} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  );
}

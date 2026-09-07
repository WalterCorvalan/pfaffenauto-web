"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase2/client";
import { Wallet, Plus, Printer, CarFront, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";
import EstadoSenaSelector from "./EstadoSenaSelector";
import NuevaSenaModal from "./NuevaSenaModal";
import EditarSenaModal from "./EditarSenaModal";

const COLOR_ESTADO: Record<string, string> = { Activa: "border-l-amber-400", Convertida: "border-l-emerald-400", Perdida: "border-l-rose-400" };

export default function SenasClient({
  senasIniciales, clientes, vehiculos, vendedores, sucursales, cuentas,
}: { senasIniciales: any[]; clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; cuentas: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [senas, setSenas] = useState(senasIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const [query, setQuery] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalAbierto(true);
      router.replace("/panel-v2/senas");
    }
  }, [searchParams, router]);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return senas.filter((s: any) => {
      if (vendedorFiltro && s.vendedor_id !== vendedorFiltro) return false;
      if (desde && (!s.fecha || s.fecha < desde)) return false;
      if (hasta && (!s.fecha || s.fecha > hasta)) return false;
      if (!q) return true;
      const nombre = `${s.apellido || s.cliente_nombre || ""} ${s.nombre || ""}`.toLowerCase();
      const vehiculo = `${s.marca || ""} ${s.modelo || ""}`.toLowerCase();
      return nombre.includes(q) || vehiculo.includes(q) || (s.dni || "").includes(q) || String(s.numero || "").includes(q);
    });
  }, [senas, query, vendedorFiltro, desde, hasta]);

  const eliminar = async (s: any) => {
    if (!confirm(`¿Eliminar la seña${s.numero ? ` N° ${s.numero}` : ""} de ${s.apellido || s.cliente_nombre || "este cliente"}? No se puede deshacer.`)) return;
    const { error, count } = await supabase2.from("senas").delete({ count: "exact" }).eq("id", s.id);
    if (error || !count) { alert("No se pudo eliminar."); return; }
    if (s.vehiculo_id && s.estado === "Activa") {
      await supabase2.from("vehiculos").update({ estado: "disponible" }).eq("id", s.vehiculo_id);
    }
    setSenas((prev) => prev.filter((x) => x.id !== s.id));
  };

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
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cliente, DNI, vehículo, N°..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <select value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white">
              <option value="">Todos los vendedores</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
          </div>

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
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filtradas.map((s: any) => (
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setEditando(s)} title="Editar" className="inline-flex p-2 bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"><Pencil className="w-4 h-4" /></button>
                          <Link href={`/panel-v2/senas/imprimir/${s.id}`} title="Imprimir" className="inline-flex p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"><Printer className="w-4 h-4" /></Link>
                          <button onClick={() => eliminar(s)} title="Eliminar" className="inline-flex p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">{senas.length === 0 ? "Sin señas cargadas todavía." : "Ninguna seña coincide con el filtro."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filtradas.length === 0 && <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center text-slate-400 text-sm italic">{senas.length === 0 ? "Sin señas cargadas todavía." : "Ninguna seña coincide con el filtro."}</div>}
            {filtradas.map((s: any) => (
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
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditando(s)} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <Link href={`/panel-v2/senas/imprimir/${s.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400"><Printer className="w-3.5 h-3.5" /></Link>
                    <button onClick={() => eliminar(s)} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
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

      {editando && (
        <EditarSenaModal
          sena={editando} vendedores={vendedores} sucursales={sucursales}
          onClose={() => setEditando(null)}
          onGuardado={(s) => setSenas((prev) => prev.map((x) => (x.id === s.id ? s : x)))}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Search, Briefcase, Download, Plus, Wrench, ShoppingCart, Eye, Pencil, FileText, Wallet, Trash2, Globe } from "lucide-react";
import NuevaVentaModal, { type VentaPrefill } from "./NuevaVentaModal";
import VentaDetalleModal from "./VentaDetalleModal";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";
import { supabase2 } from "@/lib/supabase2/client";

interface Venta {
  id: string; estado: string; vehiculo_marca: string | null; vehiculo_modelo: string | null; vehiculo_anio: number | null;
  vehiculo_patente: string | null; precio_venta: number; moneda_venta: string; vendedor_id: string | null; fecha_cierre: string;
  comprador_nombre: string; comprador_telefono: string | null; comprador_dni: string | null; metodo_pago: string | null; created_at: string;
  comision_vendedor_pct: number; comision_consignacion_pct: number; fecha_entrega: string | null; comision_liquidada: boolean;
}
interface Perfil { id: string; nombre: string; roles: string[] }
interface Cliente { id: string; nombre: string; telefono: string | null; email: string | null; dni_cuit: string | null }
interface Vehiculo { id: string; marca: string; modelo: string; anio: number; patente: string | null; km: number | null; precio_venta: number; moneda_venta: string; estado: string; color: string | null; condicion: string }

type Tab = "todas" | "borrador" | "activa" | "reserva" | "cerrada" | "caida" | "cancelada";
const TABS: { value: Tab; label: string }[] = [
  { value: "todas", label: "Todas" }, { value: "borrador", label: "Borradores" }, { value: "activa", label: "Activas" },
  { value: "reserva", label: "Reservas" }, { value: "cerrada", label: "Cerradas" }, { value: "caida", label: "Caídas" }, { value: "cancelada", label: "Canceladas" },
];
const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  activa: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  reserva: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  cerrada: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  caida: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
  cancelada: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
};

export default function VentasClient({
  ventasIniciales, perfiles, clientes, vehiculos, ventaIdsConPermuta, senasPorVenta, miId, soyAdmin, puedeOperacionCaida,
}: { ventasIniciales: Venta[]; perfiles: Perfil[]; clientes: Cliente[]; vehiculos: Vehiculo[]; ventaIdsConPermuta: string[]; senasPorVenta: Record<string, number>; miId: string; soyAdmin: boolean; puedeOperacionCaida: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ventas, setVentas] = useState(ventasIniciales);
  const [tab, setTab] = useState<Tab>("todas");
  const [soloMias, setSoloMias] = useState(false);
  const [query, setQuery] = useState("");
  const [queryVendedor, setQueryVendedor] = useState("");
  const [metodoFiltro, setMetodoFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [soloPermuta, setSoloPermuta] = useState(false);
  const [mes, setMes] = useState("");
  const [modalNueva, setModalNueva] = useState(false);
  const [prefill, setPrefill] = useState<VentaPrefill | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [editando, setEditando] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get("nueva") === "1") {
      setModalNueva(true);
      router.replace("/panel-v2/ventas");
      return;
    }
    const cotizacionId = searchParams.get("cotizacion");
    if (cotizacionId) {
      supabase2.from("cotizaciones").select("*").eq("id", cotizacionId).single().then(({ data }) => {
        if (data) {
          setPrefill({
            compradorNombre: data.cliente_nombre || "",
            vehiculoDescripcion: data.vehiculo_descripcion || "",
            precioVenta: data.precio_sugerido ? String(data.precio_sugerido) : "",
            monedaVenta: data.moneda || "USD",
            vehiculoId: data.vehiculo_id || "",
          });
          setModalNueva(true);
        }
      });
      router.replace("/panel-v2/ventas");
    }
    const ventaParam = searchParams.get("venta");
    if (ventaParam) setDetalleId(ventaParam);
  }, [searchParams, router]);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const permutaSet = useMemo(() => new Set(ventaIdsConPermuta), [ventaIdsConPermuta]);

  const filtradas = useMemo(() => {
    let lista = ventas;
    if (tab !== "todas") lista = lista.filter((v) => v.estado === tab);
    if (soloMias) lista = lista.filter((v) => v.vendedor_id === miId);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((v) => [v.comprador_nombre, v.comprador_telefono, v.comprador_dni, v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_patente].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    if (queryVendedor.trim()) {
      const q = queryVendedor.trim().toLowerCase();
      lista = lista.filter((v) => v.vendedor_id && (perfilMap[v.vendedor_id] || "").toLowerCase().includes(q));
    }
    if (metodoFiltro) lista = lista.filter((v) => v.metodo_pago === metodoFiltro);
    if (desde) lista = lista.filter((v) => v.fecha_cierre >= desde);
    if (hasta) lista = lista.filter((v) => v.fecha_cierre <= hasta);
    if (soloPermuta) lista = lista.filter((v) => permutaSet.has(v.id));
    if (mes) lista = lista.filter((v) => v.fecha_cierre.startsWith(mes));
    return lista;
  }, [ventas, tab, soloMias, miId, query, queryVendedor, metodoFiltro, desde, hasta, soloPermuta, mes, perfilMap, permutaSet]);

  const enCurso = ventas.filter((v) => ["activa", "reserva"].includes(v.estado)).length;
  const cerradas = ventas.filter((v) => v.estado === "cerrada").length;
  const misVentas = ventas.filter((v) => v.vendedor_id === miId).length;

  const totalesPorMoneda = useMemo(() => {
    const totales: Record<string, number> = {};
    for (const v of filtradas) totales[v.moneda_venta] = (totales[v.moneda_venta] || 0) + Number(v.precio_venta);
    return totales;
  }, [filtradas]);

  const exportar = () => {
    const filas = filtradas.map((v) => ({
      Estado: v.estado, Comprador: v.comprador_nombre, Vehículo: [v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio].filter(Boolean).join(" "),
      Patente: v.vehiculo_patente, Precio: v.precio_venta, Moneda: v.moneda_venta, Vendedor: v.vendedor_id ? perfilMap[v.vendedor_id] : "",
      "Método de pago": v.metodo_pago, "Fecha de cierre": v.fecha_cierre,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `ventas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const servicePreEntrega = (v: Venta) => {
    if (!v.comprador_telefono) return;
    const auto = [v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio].filter(Boolean).join(" ") || "tu vehículo";
    const texto = encodeURIComponent(`¡Hola ${v.comprador_nombre.split(" ")[0]}! Antes de entregarte el ${auto} te queremos ofrecer hacerle el service completo en nuestro taller, sin cargo adicional. ¿Coordinamos?`);
    window.open(`https://wa.me/${v.comprador_telefono.replace(/\D/g, "")}?text=${texto}`, "_blank");
  };

  const toggleLiquidada = async (v: Venta) => {
    const nuevo = !v.comision_liquidada;
    const { data, error } = await supabase2.from("ventas").update({ comision_liquidada: nuevo, comision_liquidada_en: nuevo ? new Date().toISOString() : null }).eq("id", v.id).select().single();
    if (error) { alert("No se pudo actualizar."); return; }
    setVentas((prev) => prev.map((x) => (x.id === v.id ? { ...x, ...data } : x)));
  };

  const eliminarRapido = async (v: Venta) => {
    if (!confirm(`¿Eliminar la venta de ${v.comprador_nombre}? No se puede deshacer.`)) return;
    const { error, count } = await supabase2.from("ventas").delete({ count: "exact" }).eq("id", v.id);
    if (error || !count) { alert("No se pudo eliminar (sin permiso o ya no existe)."); return; }
    setVentas((prev) => prev.filter((x) => x.id !== v.id));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-rose-600" /> Ventas</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ventas.length} ventas · {enCurso} en curso · {cerradas} cerradas</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportar} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Download className="w-3.5 h-3.5" /> Exportar</button>
              <button onClick={() => setModalNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"><Plus className="w-3.5 h-3.5" /> Nueva venta</button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setSoloMias(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${!soloMias ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
              <Globe className="w-3.5 h-3.5" /> General <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${!soloMias ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{ventas.length}</span>
            </button>
            <button onClick={() => setSoloMias(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${soloMias ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
              {perfilMap[miId] || "Mis ventas"} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${soloMias ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{misVentas}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 mb-4 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => setTab(t.value)} className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.value ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>{t.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Comprador, vehículo, DNI, teléfono..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={queryVendedor} onChange={(e) => setQueryVendedor(e.target.value)} placeholder="Buscar vendedor." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <select value={metodoFiltro} onChange={(e) => setMetodoFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <option value="">Todos los métodos</option>
              <option>Contado</option><option>Financiado</option><option>Leasing</option><option>Permuta</option><option>Criptomonedas</option>
            </select>
            <div className="flex gap-1.5">
              <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 block">DESDE</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" /></div>
              <div className="flex-1"><label className="text-[9px] font-bold text-slate-400 block">HASTA</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white" /></div>
            </div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><input type="checkbox" checked={soloPermuta} onChange={(e) => setSoloPermuta(e.target.checked)} className="w-4 h-4 accent-rose-600" /> Solo con permuta</label>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mes:</label>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white" />
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 mb-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{filtradas.length} venta{filtradas.length === 1 ? "" : "s"} en lista</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{Object.entries(totalesPorMoneda).map(([m, t]) => `${m} ${t.toLocaleString("es-AR")}`).join(" · ") || "—"}</p>
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin resultados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay ventas cargadas. Podés crear una desde el botón de arriba.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Vehículo</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Comprador</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Vendedor</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Precio</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Adelanto</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Método</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Comisión</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Entrega</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Liquidada</th>
                    <th className="px-4 py-3 w-px whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((v) => {
                    const adelanto = senasPorVenta[v.id] || 0;
                    const comisionPct = Number(v.comision_vendedor_pct || 0) + Number(v.comision_consignacion_pct || 0);
                    const comisionMonto = (Number(v.precio_venta) * comisionPct) / 100;
                    return (
                      <tr key={v.id} onClick={() => setEditando(v)} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer">
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtFechaLocal(v.fecha_cierre)}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{[v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio].filter(Boolean).join(" ") || "—"}{v.vehiculo_patente ? ` · ${v.vehiculo_patente}` : ""}{permutaSet.has(v.id) && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">PERMUTA</span>}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{v.comprador_nombre}</p>
                          {v.comprador_telefono && <p className="text-[11px] text-slate-400">{v.comprador_telefono}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.vendedor_id ? perfilMap[v.vendedor_id] || "—" : "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{v.moneda_venta} {Number(v.precio_venta).toLocaleString("es-AR")}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{adelanto > 0 ? `${v.moneda_venta} ${adelanto.toLocaleString("es-AR")}` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.metodo_pago || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{comisionMonto > 0 ? <>{v.moneda_venta} {comisionMonto.toLocaleString("es-AR")} <span className="text-slate-400">({comisionPct}%)</span></> : "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.fecha_entrega ? fmtFechaLocal(v.fecha_entrega) : "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${ESTADO_COLOR[v.estado]}`}>{v.estado}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {comisionMonto > 0 ? (
                            <button onClick={() => toggleLiquidada(v)} className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${v.comision_liquidada ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                              {v.comision_liquidada ? "✅ Liquidada" : "⏳ Pendiente"}
                            </button>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 w-px whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDetalleId(v.id)} title="Ver" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditando(v)} title="Editar" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                            <button disabled title="Boleto — todavía no construido" className="p-2 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 rounded-lg opacity-60 cursor-not-allowed"><FileText className="w-3.5 h-3.5" /></button>
                            <button disabled title="Recibo/seña — todavía no construido" className="p-2 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 rounded-lg opacity-60 cursor-not-allowed"><Wallet className="w-3.5 h-3.5" /></button>
                            {v.estado === "cerrada" && v.comprador_telefono && (
                              <button onClick={() => servicePreEntrega(v)} title="Service pre-entrega" className="p-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-300 rounded-lg"><Wrench className="w-3.5 h-3.5" /></button>
                            )}
                            {soyAdmin && (
                              <button onClick={() => eliminarRapido(v)} title="Eliminar" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalNueva && (
        <NuevaVentaModal
          perfiles={perfiles} clientes={clientes} vehiculos={vehiculos} miId={miId} initial={prefill || undefined}
          onClose={() => { setModalNueva(false); setPrefill(null); }}
          onCreado={(v) => setVentas((prev) => [v, ...prev])}
        />
      )}

      {editando && (
        <NuevaVentaModal
          perfiles={perfiles} clientes={clientes} vehiculos={vehiculos} miId={miId} editando={editando}
          onClose={() => setEditando(null)}
          onCreado={(v) => { setVentas((prev) => prev.map((x) => (x.id === v.id ? { ...x, ...v } : x))); setEditando(null); }}
        />
      )}

      {detalleId && (
        <VentaDetalleModal
          ventaId={detalleId}
          miId={miId}
          soyAdmin={soyAdmin}
          puedeOperacionCaida={puedeOperacionCaida}
          perfilMap={perfilMap}
          onClose={() => { setDetalleId(null); if (searchParams.get("venta")) router.replace("/panel-v2/ventas"); }}
          onActualizado={(v) => setVentas((prev) => prev.map((x) => (x.id === v.id ? { ...x, ...v } : x)))}
          onEliminado={(id) => { setVentas((prev) => prev.filter((x) => x.id !== id)); setDetalleId(null); }}
          onEditar={(v) => { setDetalleId(null); setEditando(v); }}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { supabase2 } from "@/lib/supabase2/client";
import {
  Search, Car, Globe, Download, Upload, FileText, Plus, Edit2,
  AlertTriangle, Clock, CheckCircle2, Tag, Trash2, TrendingUp, ChevronLeft, ChevronRight,
  Building2, UserCircle2, Loader2, Handshake,
} from "lucide-react";
import NuevoVehiculoModal from "./NuevoVehiculoModal";
import NuevoMandatoModal from "./NuevoMandatoModal";
import TuCatalogoModal from "./TuCatalogoModal";
import ImportarXlsxModal from "./ImportarXlsxModal";
import SenaModal from "./SenaModal";
import PresupuestoModal from "./PresupuestoModal";
import PrecioEditor from "./PrecioEditor";
import SucursalEditor from "./SucursalEditor";
import VendedorEditor from "./VendedorEditor";
import { parseFechaLocal } from "@/lib/panelV2/fechas";

interface Vehiculo {
  id: string; categoria: string; marca: string; modelo: string; anio: number; patente: string | null; color: string | null;
  condicion: string; km: number | null; precio_venta: number; moneda_venta: string; ubicacion: string; estado: string;
  propio_agencia: boolean; propietario_nombre: string | null; consignado_por: string | null; publicado_ml: boolean;
  fotos: string[]; notas: string | null; created_at: string;
  sucursal_id: string | null; sucursal: { nombre: string } | null; vendedor_asignado_id: string | null;
}
interface Mandato { id: string; mandante_nombre: string; vehiculo_marca: string; vehiculo_modelo: string; vehiculo_anio: number; fecha: string; plazo_dias: number; tipo_tramite: string; valor: number | null; moneda: string; vehiculo_id: string | null }
interface Perfil { id: string; nombre: string }
interface Cliente { id: string; nombre: string; telefono: string | null; dni_cuit: string | null }
interface CatalogoConfig { id: string; mostrar_precios: boolean; visitas_totales: number; fichas_vistas_totales: number; consultas_whatsapp_totales: number }

type Tab = "general" | "consignaciones" | "0km" | "mandatos";

const ESTADO_LABEL: Record<string, string> = { disponible: "Disponible", reservado: "Reservado", "señado": "Señado", vendido: "Vendido", en_preparacion: "En preparación" };
const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  reservado: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  "señado": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  vendido: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  en_preparacion: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20",
};

function diasEnStock(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}
function aRevisar(v: Vehiculo) {
  return !v.publicado_ml || v.fotos.length === 0 || !v.precio_venta;
}

export default function StockClient({
  vehiculosIniciales, mandatosIniciales, perfiles, clientes, catalogoConfigInicial, sucursales, miId, diasEstancado = 90,
}: { vehiculosIniciales: Vehiculo[]; mandatosIniciales: Mandato[]; perfiles: Perfil[]; clientes: Cliente[]; catalogoConfigInicial: CatalogoConfig | null; sucursales: { id: string; nombre: string }[]; miId: string; diasEstancado?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);
  const [mandatos, setMandatos] = useState(mandatosIniciales);
  const [catalogoConfig, setCatalogoConfig] = useState(catalogoConfigInicial);
  const [tab, setTab] = useState<Tab>("general");
  const [estadoFiltro, setEstadoFiltro] = useState("disponible");
  const [soloEstancados, setSoloEstancados] = useState(false);
  const [soloARevisar, setSoloARevisar] = useState(false);
  const [query, setQuery] = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalMandato, setModalMandato] = useState(false);
  const [modalCatalogo, setModalCatalogo] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [senaVehiculo, setSenaVehiculo] = useState<Vehiculo | null>(null);
  const [presupuestoVehiculo, setPresupuestoVehiculo] = useState<Vehiculo | null>(null);
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [galeria, setGaleria] = useState<{ fotos: string[]; index: number } | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalNuevo(true);
      router.replace("/panel-v2/stock");
    }
  }, [searchParams, router]);

  const esAdmin = true; // Config→Empresa→Roles todavía no construido: todo admin por ahora en panel-v2 nuevo.
  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const miNombre = perfilMap[miId] || "Usuario";

  const onCreadoVehiculo = (v: Vehiculo) => setVehiculos((prev) => (prev.some((x) => x.id === v.id) ? prev.map((x) => (x.id === v.id ? v : x)) : [v, ...prev]));

  const eliminarVehiculo = async (v: Vehiculo) => {
    if (!confirm(`¿Eliminar ${v.marca} ${v.modelo}? Esta acción no se puede deshacer.`)) return;
    setOcupadoId(v.id);
    const { error } = await supabase2.from("vehiculos").delete().eq("id", v.id);
    if (!error) setVehiculos((prev) => prev.filter((x) => x.id !== v.id));
    else alert("No se pudo eliminar (puede que solo admin pueda borrar vehículos).");
    setOcupadoId(null);
  };

  const onSenaGuardada = (vehiculoId: string) => setVehiculos((prev) => prev.map((x) => (x.id === vehiculoId ? { ...x, estado: "señado" } : x)));
  const onCreadoMandato = (m: Mandato, v: Vehiculo | null) => {
    setMandatos((prev) => [m, ...prev]);
    if (v) setVehiculos((prev) => [v, ...prev]);
  };

  const marcas = useMemo(() => Array.from(new Set(vehiculos.map((v) => v.marca))).sort(), [vehiculos]);

  const baseTab = useMemo(() => {
    if (tab === "consignaciones") return vehiculos.filter((v) => v.consignado_por);
    if (tab === "0km") return vehiculos.filter((v) => v.condicion === "0km");
    return vehiculos;
  }, [vehiculos, tab]);

  const filtrados = useMemo(() => {
    let lista = baseTab;
    if (soloEstancados) lista = lista.filter((v) => diasEnStock(v.created_at) >= diasEstancado);
    else if (soloARevisar) lista = lista.filter((v) => aRevisar(v) && v.estado === "disponible");
    else if (estadoFiltro) lista = lista.filter((v) => v.estado === estadoFiltro);
    if (marcaFiltro) lista = lista.filter((v) => v.marca === marcaFiltro);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((v) => [v.marca, v.modelo, v.patente, v.ubicacion, String(v.anio), v.propietario_nombre].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return [...lista].sort((a, b) => diasEnStock(b.created_at) - diasEnStock(a.created_at));
  }, [baseTab, estadoFiltro, soloEstancados, soloARevisar, marcaFiltro, query]);

  const disponibles = vehiculos.filter((v) => v.estado === "disponible");
  const actualizarVehiculo = (id: string, cambios: Partial<Vehiculo>) => setVehiculos((prev) => prev.map((x) => (x.id === id ? { ...x, ...cambios } : x)));
  const valorTotalPorMoneda = useMemo(() => {
    const acc: Record<string, number> = {};
    vehiculos.filter((v) => v.estado !== "vendido").forEach((v) => { acc[v.moneda_venta] = (acc[v.moneda_venta] || 0) + Number(v.precio_venta || 0); });
    return acc;
  }, [vehiculos]);
  const estancados = vehiculos.filter((v) => diasEnStock(v.created_at) >= diasEstancado && v.estado === "disponible").length;
  const publicadoPct = disponibles.length ? Math.round((disponibles.filter((v) => v.publicado_ml).length / disponibles.length) * 100) : 0;
  const diasProm = disponibles.length ? Math.round(disponibles.reduce((acc, v) => acc + diasEnStock(v.created_at), 0) / disponibles.length) : 0;
  const aRevisarCount = disponibles.filter(aRevisar).length;

  const exportarXlsx = () => {
    const filas = filtrados.map((v) => ({
      Marca: v.marca, Modelo: v.modelo, Año: v.anio, Patente: v.patente, Color: v.color, Condición: v.condicion,
      KM: v.km, Precio: v.precio_venta, Moneda: v.moneda_venta, Ubicación: v.ubicacion, Estado: ESTADO_LABEL[v.estado],
      "Días en stock": diasEnStock(v.created_at), "Publicado ML": v.publicado_ml ? "Sí" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `stock-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Stock</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{disponibles.length} vehículos disponibles para vender</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setModalCatalogo(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Globe className="w-3.5 h-3.5" /> Tu catálogo</button>
              <button onClick={exportarXlsx} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Download className="w-3.5 h-3.5" /> Exportar XLSX</button>
              <button onClick={() => setModalImportar(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Upload className="w-3.5 h-3.5" /> Importar XLSX</button>
              <button onClick={() => setModalMandato(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><FileText className="w-3.5 h-3.5" /> Nuevo mandato + Stock</button>
              <button onClick={() => setModalNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"><Plus className="w-3.5 h-3.5" /> Nuevo vehículo</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20"><Car className="w-3.5 h-3.5" /> {disponibles.length} disponibles</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"><Clock className="w-3.5 h-3.5" /> {diasProm}d prom.</span>
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${publicadoPct === 100 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-500/20"}`}><TrendingUp className="w-3.5 h-3.5" /> {publicadoPct}% publicado</span>
            {aRevisarCount > 0 && <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-500/20"><AlertTriangle className="w-3.5 h-3.5" /> {aRevisarCount} a revisar</span>}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto">
              VALOR TOTAL DEL STOCK: <strong className="text-slate-800 dark:text-white">{Object.keys(valorTotalPorMoneda).length === 0 ? "—" : Object.entries(valorTotalPorMoneda).map(([m, n]) => fmtPrecio(n, m)).join(" · ")}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 mb-4 border-b border-slate-200 dark:border-white/10">
            {[["general", "Stock general"], ["consignaciones", "Consignaciones"], ["0km", "0 km"], ["mandatos", "Mandatos"]].map(([v, label]) => (
              <button key={v} onClick={() => setTab(v as Tab)} className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === v ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>{label}</button>
            ))}
          </div>

          {tab === "mandatos" ? (
            <>
              <div className="flex justify-end mb-3">
                <button onClick={() => setModalMandato(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-3.5 h-3.5" /> Nuevo mandato</button>
              </div>
              {mandatos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin mandatos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cuando generes mandatos desde Stock, van a aparecer acá con alertas de vencimiento.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5">
                  {mandatos.map((m) => {
                    const vence = parseFechaLocal(m.fecha); vence.setDate(vence.getDate() + m.plazo_dias);
                    const diasRestantes = Math.ceil((vence.getTime() - Date.now()) / 86400000);
                    return (
                      <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{m.vehiculo_marca} {m.vehiculo_modelo} {m.vehiculo_anio}</p>
                          <p className="text-xs text-slate-400">{m.mandante_nombre} · {m.tipo_tramite}{m.valor ? ` · ${fmtPrecio(m.valor, m.moneda)}` : ""}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${diasRestantes < 0 ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" : diasRestantes <= 7 ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:border-white/10"}`}>
                          {diasRestantes < 0 ? `Vencido hace ${-diasRestantes}d` : `Vence en ${diasRestantes}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {Object.entries(ESTADO_LABEL).map(([v, label]) => (
                  <button key={v} onClick={() => { setEstadoFiltro(v); setSoloEstancados(false); setSoloARevisar(false); }} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${estadoFiltro === v && !soloEstancados && !soloARevisar ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{label}</button>
                ))}
                <button onClick={() => { setSoloEstancados((v) => !v); setSoloARevisar(false); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${soloEstancados ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}><Clock className="w-3 h-3" /> Estancados (+90d) · {estancados}</button>
                <button onClick={() => { setSoloARevisar((v) => !v); setSoloEstancados(false); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${soloARevisar ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}><AlertTriangle className="w-3 h-3" /> A revisar</button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar marca, modelo, patente, año, propietario, ubicación..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
                </div>
                <select value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <option value="">Todas las marcas</option>
                  {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {filtrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin resultados</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay vehículos en el stock. Cargá el primero con el botón Nuevo vehículo.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {filtrados.length} vehículo{filtrados.length === 1 ? "" : "s"} en lista
                  </div>
                  <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vehículo</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Año</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Patente/VIN</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">KM</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Precio</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Estado</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sucursal</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Asignado</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Días</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">ML</th>
                        <th className="px-4 py-3 w-px">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((v) => {
                        const dias = diasEnStock(v.created_at);
                        const diasColor = dias >= diasEstancado ? "text-rose-600 dark:text-rose-400 font-black" : dias >= 30 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500";
                        return (
                          <tr key={v.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-11 h-11 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden ${v.fotos?.[0] ? "cursor-zoom-in" : ""}`}
                                  onClick={(e) => { if (v.fotos?.[0]) { e.stopPropagation(); setGaleria({ fotos: v.fotos, index: 0 }); } }}
                                >
                                  {v.fotos?.[0] ? <img src={v.fotos[0]} alt="" className="w-full h-full object-cover" /> : <Car className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">{v.marca} {v.modelo}</p>
                                    {aRevisar(v) && v.estado === "disponible" && (
                                      <span title="Datos incompletos: revisar publicación/foto/precio">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                  {v.color && <p className="text-[11px] text-slate-400">{v.color}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.anio}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.patente || "s/patente"}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{v.km?.toLocaleString("es-AR") ?? "—"}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <PrecioEditor vehiculoId={v.id} precio={v.precio_venta} moneda={v.moneda_venta} onActualizado={actualizarVehiculo} />
                            </td>
                            <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${ESTADO_COLOR[v.estado]}`}>{ESTADO_LABEL[v.estado]}</span></td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              <SucursalEditor vehiculoId={v.id} sucursalId={v.sucursal_id} sucursalNombre={v.sucursal?.nombre || null} sucursales={sucursales} onActualizado={actualizarVehiculo} />
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              <VendedorEditor vehiculoId={v.id} vendedorId={v.vendedor_asignado_id} vendedorNombre={v.vendedor_asignado_id ? perfilMap[v.vendedor_asignado_id] : null} perfiles={perfiles} onActualizado={actualizarVehiculo} />
                            </td>
                            <td className={`px-4 py-3 text-xs whitespace-nowrap ${diasColor}`}>{dias}d</td>
                            <td className="px-4 py-3">{v.publicado_ml ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                            <td className="px-4 py-3 w-px whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setPresupuestoVehiculo(v)} title="Nuevo presupuesto" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-lg"><FileText className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditando(v)} title="Editar" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                {v.estado === "disponible" && (
                                  <button onClick={() => setSenaVehiculo(v)} title="Marcar como señado" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500 hover:text-white text-slate-400 rounded-lg">
                                    <Tag className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => eliminarVehiculo(v)} disabled={ocupadoId === v.id} title="Eliminar" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg disabled:opacity-50">
                                  {ocupadoId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {(modalNuevo || editando) && <NuevoVehiculoModal perfiles={perfiles} clientes={clientes} sucursales={sucursales} miId={miId} editando={editando || undefined} onClose={() => { setModalNuevo(false); setEditando(null); }} onCreado={onCreadoVehiculo} />}

      {galeria && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-6 gap-4" onClick={() => setGaleria(null)}>
          <div className="relative flex items-center justify-center w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {galeria.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => setGaleria((g) => g && { ...g, index: (g.index - 1 + g.fotos.length) % g.fotos.length })}
                className="absolute left-0 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 ml-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <img src={galeria.fotos[galeria.index]} alt="" className="max-w-full max-h-[75vh] rounded-xl object-contain cursor-zoom-out" onClick={() => setGaleria(null)} />
            {galeria.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => setGaleria((g) => g && { ...g, index: (g.index + 1) % g.fotos.length })}
                className="absolute right-0 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 mr-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          {galeria.fotos.length > 1 && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {galeria.fotos.map((f, i) => (
                <button
                  key={f + i}
                  type="button"
                  onClick={() => setGaleria((g) => g && { ...g, index: i })}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${i === galeria.index ? "border-white" : "border-transparent opacity-60"}`}
                >
                  <img src={f} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {modalMandato && <NuevoMandatoModal miId={miId} miNombre={miNombre} onClose={() => setModalMandato(false)} onCreado={onCreadoMandato} />}
      {modalCatalogo && <TuCatalogoModal config={catalogoConfig} esAdmin={esAdmin} onClose={() => setModalCatalogo(false)} onConfigActualizada={setCatalogoConfig} />}
      {modalImportar && <ImportarXlsxModal miId={miId} onClose={() => setModalImportar(false)} onImportados={(nuevos) => setVehiculos((prev) => [...nuevos, ...prev])} />}
      {senaVehiculo && <SenaModal vehiculo={senaVehiculo} miId={miId} onClose={() => setSenaVehiculo(null)} onGuardada={onSenaGuardada} />}
      {presupuestoVehiculo && <PresupuestoModal vehiculo={presupuestoVehiculo} miId={miId} onClose={() => setPresupuestoVehiculo(null)} />}
    </div>
  );
}

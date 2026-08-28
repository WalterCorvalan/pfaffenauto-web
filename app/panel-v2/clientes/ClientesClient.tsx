"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import {
  Search, Users, UserPlus, Phone, Mail, List, Columns3, TrendingUp,
  PieChart, Trophy, CheckCircle2, Circle, MessageCircle, Download, Upload,
  Sun, Palmtree, Thermometer, X, ShoppingBag, Pencil, Trash2,
} from "lucide-react";
import NuevoClienteModal from "./NuevoClienteModal";
import DisponibilidadModal from "./DisponibilidadModal";

interface Cliente {
  id: string; nombre: string; tipo: string; sexo: string | null; dni_cuit: string | null;
  telefono: string | null; email: string | null; origen: string; canal_ingreso: string;
  vehiculo_interes_texto: string | null; busca_marca: string | null; busca_modelo: string | null;
  fecha_nacimiento: string | null; ultimo_contacto: string | null; vendedor_id: string | null;
  direccion: string | null; observaciones: string | null; pipeline_stage: string;
  pipeline_stage_manual: boolean; importado_excel: boolean; created_at: string;
}
interface Perfil { id: string; nombre: string; roles: string[] }
interface Disponibilidad { vendedor_id: string; estado: string; desde: string | null; hasta: string | null; recibir_leads: boolean }

type Vista = "lista" | "pipeline" | "ingresos" | "demanda" | "ranking";
type TabLista = "mis_clientes" | "sin_contactar" | "contactados" | "compraron" | "perdidos" | "todos";
type Periodo = "hoy" | "ayer" | "7dias" | "30dias" | "este_mes" | "mes_pasado" | "todos";

const PIPELINE_COLUMNAS = [
  { key: "sin_contactar", label: "Sin contactar", desc: "Entró y todavía nadie lo tocó", color: "border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]" },
  { key: "contactado", label: "Contactado", desc: "Alguien del equipo ya le escribió o lo llamó", color: "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5" },
  { key: "visita", label: "Visita", desc: "Tiene fecha para venir, o ya vino", color: "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5" },
  { key: "negociacion", label: "Negociación", desc: "Hay una cotización o una seña sobre la mesa", color: "border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5" },
  { key: "cerrado", label: "Cerrado", desc: "Compró", color: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5" },
  { key: "perdido", label: "Perdido", desc: "Dijo que no, o hace 90 días que no responde", color: "border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]" },
] as const;

const ESTADO_ICON: Record<string, any> = { disponible: Sun, vacaciones: Palmtree, enfermo: Thermometer };
const ESTADO_LABEL: Record<string, string> = { disponible: "Disponible", vacaciones: "De vacaciones", enfermo: "Enfermo" };

function tiempoRelativo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtFecha(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}
function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function nombreVacio(n: string) {
  return !n || n.trim() === "" || n.trim() === ".";
}
function motivoDe(c: Cliente) {
  switch (c.pipeline_stage) {
    case "sin_contactar": return `Entró ${fmtFecha(c.created_at)}`;
    case "contactado": return c.ultimo_contacto ? `Contactado — ${fmtFecha(c.ultimo_contacto)}` : "Contactado";
    case "visita": return "Visita agendada";
    case "negociacion": return "En negociación";
    case "cerrado": return "Compró";
    case "perdido": {
      const ref = c.ultimo_contacto || c.created_at;
      const d = diasDesde(ref);
      return d >= 90 ? `Sin respuesta hace ${d} días` : "Sin interés";
    }
    default: return "";
  }
}
function inicioDia(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function finDia(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function sumarDias(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function rangoPeriodo(p: Periodo): { desde: Date | null; hasta: Date | null; desdeAnt: Date | null; hastaAnt: Date | null } {
  const hoy = new Date();
  if (p === "hoy") {
    const desde = inicioDia(hoy), hasta = finDia(hoy);
    return { desde, hasta, desdeAnt: inicioDia(sumarDias(hoy, -1)), hastaAnt: finDia(sumarDias(hoy, -1)) };
  }
  if (p === "ayer") {
    const ayer = sumarDias(hoy, -1);
    return { desde: inicioDia(ayer), hasta: finDia(ayer), desdeAnt: inicioDia(sumarDias(hoy, -2)), hastaAnt: finDia(sumarDias(hoy, -2)) };
  }
  if (p === "7dias") {
    return { desde: inicioDia(sumarDias(hoy, -6)), hasta: finDia(hoy), desdeAnt: inicioDia(sumarDias(hoy, -13)), hastaAnt: finDia(sumarDias(hoy, -7)) };
  }
  if (p === "30dias") {
    return { desde: inicioDia(sumarDias(hoy, -29)), hasta: finDia(hoy), desdeAnt: inicioDia(sumarDias(hoy, -59)), hastaAnt: finDia(sumarDias(hoy, -30)) };
  }
  if (p === "este_mes") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const mesAntDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mesAntHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);
    return { desde, hasta: finDia(hoy), desdeAnt: mesAntDesde, hastaAnt: mesAntHasta };
  }
  if (p === "mes_pasado") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);
    const desdeAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    const hastaAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 0, 23, 59, 59, 999);
    return { desde, hasta, desdeAnt, hastaAnt };
  }
  return { desde: null, hasta: null, desdeAnt: null, hastaAnt: null };
}

export default function ClientesClient({
  clientesIniciales, perfiles, disponibilidadInicial, ventas, miId,
}: { clientesIniciales: Cliente[]; perfiles: Perfil[]; disponibilidadInicial: Disponibilidad[]; ventas: { id: string; cliente_id: string | null }[]; miId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clientes, setClientes] = useState(clientesIniciales);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const opsMap = useMemo(() => {
    const acc: Record<string, number> = {};
    ventas.forEach((v) => { if (v.cliente_id) acc[v.cliente_id] = (acc[v.cliente_id] || 0) + 1; });
    return acc;
  }, [ventas]);

  const eliminarCliente = async (c: Cliente) => {
    if (!confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return;
    setEliminandoId(c.id);
    const { error } = await supabase2.from("clientes").delete().eq("id", c.id);
    if (!error) setClientes((prev) => prev.filter((x) => x.id !== c.id));
    else alert("No se pudo eliminar (puede que solo admin pueda borrar clientes).");
    setEliminandoId(null);
  };
  const [disponibilidad, setDisponibilidad] = useState(disponibilidadInicial);
  const [vista, setVista] = useState<Vista>("lista");
  const [tabLista, setTabLista] = useState<TabLista>("todos");
  const [origenFiltro, setOrigenFiltro] = useState<string | null>(null);
  const [sexoFiltro, setSexoFiltro] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [vendedorFiltroPipeline, setVendedorFiltroPipeline] = useState<string>("todos");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalDisponibilidad, setModalDisponibilidad] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [origenIngresos, setOrigenIngresos] = useState<string | null>(null);
  const [vendedorIngresos, setVendedorIngresos] = useState<string | null>(null);
  const [incluirImportados, setIncluirImportados] = useState(false);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalNuevo(true);
      router.replace("/panel-v2/clientes");
    }
  }, [searchParams, router]);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const miDisponibilidad = disponibilidad.find((d) => d.vendedor_id === miId);
  const esAdmin = perfiles.find((p) => p.id === miId)?.roles?.includes("admin") ?? false;

  const onCreado = (c: Cliente) => setClientes((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));
  const onDisponibilidadGuardada = (d: Disponibilidad) =>
    setDisponibilidad((prev) => [...prev.filter((x) => x.vendedor_id !== d.vendedor_id), d]);

  const toggleContacto = async (c: Cliente) => {
    const yaContactado = c.pipeline_stage !== "sin_contactar";
    const nuevaEtapa = yaContactado ? "sin_contactar" : "contactado";
    const nuevoUltimoContacto = nuevaEtapa === "contactado" ? new Date().toISOString() : c.ultimo_contacto;
    setActualizando(c.id);
    try {
      const { error } = await supabase2.from("clientes").update({ pipeline_stage: nuevaEtapa, pipeline_stage_manual: true, ultimo_contacto: nuevoUltimoContacto }).eq("id", c.id);
      if (error) throw error;
      setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, pipeline_stage: nuevaEtapa, pipeline_stage_manual: true, ultimo_contacto: nuevoUltimoContacto } : x)));
    } catch {
      alert("No se pudo actualizar el estado de contacto.");
    } finally {
      setActualizando(null);
    }
  };

  const moverEtapa = async (clienteId: string, nuevaEtapa: string) => {
    setClientes((prev) => prev.map((c) => (c.id === clienteId ? { ...c, pipeline_stage: nuevaEtapa, pipeline_stage_manual: true } : c)));
    const { error } = await supabase2.from("clientes").update({ pipeline_stage: nuevaEtapa, pipeline_stage_manual: true }).eq("id", clienteId);
    if (error) alert("No se pudo mover el cliente.");
  };

  // ---------- LISTA ----------
  const hoyStr = inicioDia(new Date()).toDateString();
  const ingresosHoy = clientes.filter((c) => !c.importado_excel && new Date(c.created_at).toDateString() === hoyStr).length;
  const ingresosAyer = clientes.filter((c) => !c.importado_excel && new Date(c.created_at).toDateString() === sumarDias(new Date(), -1).toDateString()).length;
  const { desde: desde7, hasta: hasta7 } = rangoPeriodo("7dias");
  const { desde: desdeMes, hasta: hastaMes } = rangoPeriodo("este_mes");
  const ingresos7 = clientes.filter((c) => !c.importado_excel && new Date(c.created_at) >= desde7! && new Date(c.created_at) <= hasta7!).length;
  const ingresosMes = clientes.filter((c) => !c.importado_excel && new Date(c.created_at) >= desdeMes! && new Date(c.created_at) <= hastaMes!).length;

  const clientesFiltrados = useMemo(() => {
    let lista = clientes;
    if (tabLista === "mis_clientes") lista = lista.filter((c) => c.vendedor_id === miId);
    if (tabLista === "sin_contactar") lista = lista.filter((c) => c.pipeline_stage === "sin_contactar");
    if (tabLista === "contactados") lista = lista.filter((c) => ["contactado", "visita", "negociacion"].includes(c.pipeline_stage));
    if (tabLista === "compraron") lista = lista.filter((c) => c.pipeline_stage === "cerrado");
    if (tabLista === "perdidos") lista = lista.filter((c) => c.pipeline_stage === "perdido");
    if (origenFiltro) lista = lista.filter((c) => c.origen === origenFiltro);
    if (sexoFiltro) lista = lista.filter((c) => c.sexo === sexoFiltro);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((c) => c.nombre.toLowerCase().includes(q) || (c.dni_cuit || "").includes(q) || (c.telefono || "").includes(q) || (c.email || "").toLowerCase().includes(q));
    }
    return lista;
  }, [clientes, tabLista, origenFiltro, sexoFiltro, query, miId]);

  // ---------- PIPELINE ----------
  const clientesPipeline = useMemo(() => (vendedorFiltroPipeline === "todos" ? clientes : clientes.filter((c) => c.vendedor_id === vendedorFiltroPipeline)), [clientes, vendedorFiltroPipeline]);

  // ---------- INGRESOS ----------
  const { desde, hasta, desdeAnt, hastaAnt } = rangoPeriodo(periodo);
  const enPeriodo = (c: Cliente, d0: Date | null, d1: Date | null) => {
    if (c.importado_excel && !incluirImportados) return false;
    if (!d0 || !d1) return true;
    const t = new Date(c.created_at);
    return t >= d0 && t <= d1;
  };
  let ingresosFiltrados = useMemo(() => clientes.filter((c) => enPeriodo(c, desde, hasta)), [clientes, desde, hasta, incluirImportados]);
  const ingresosAnteriorCount = useMemo(() => clientes.filter((c) => enPeriodo(c, desdeAnt, hastaAnt)).length, [clientes, desdeAnt, hastaAnt, incluirImportados]);
  if (diaSeleccionado) ingresosFiltrados = ingresosFiltrados.filter((c) => new Date(c.created_at).toDateString() === diaSeleccionado);
  if (origenIngresos) ingresosFiltrados = ingresosFiltrados.filter((c) => c.origen === origenIngresos);
  if (vendedorIngresos) ingresosFiltrados = vendedorIngresos === "__sin_asignar__" ? ingresosFiltrados.filter((c) => !c.vendedor_id) : ingresosFiltrados.filter((c) => c.vendedor_id === vendedorIngresos);

  const sinContactarPeriodo = ingresosFiltrados.filter((c) => c.pipeline_stage === "sin_contactar").length;
  const yaContactadosPeriodo = ingresosFiltrados.length - sinContactarPeriodo;
  const canalTop = useMemo(() => {
    const cont: Record<string, number> = {};
    ingresosFiltrados.forEach((c) => { cont[c.origen] = (cont[c.origen] || 0) + 1; });
    const entries = Object.entries(cont).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || "—";
  }, [ingresosFiltrados]);

  const barras30 = useMemo(() => {
    const dias: { fecha: Date; key: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = sumarDias(new Date(), -i);
      const key = d.toDateString();
      const count = clientes.filter((c) => (!c.importado_excel || incluirImportados) && new Date(c.created_at).toDateString() === key).length;
      dias.push({ fecha: d, key, count });
    }
    return dias;
  }, [clientes, incluirImportados]);
  const maxBarra = Math.max(1, ...barras30.map((d) => d.count));

  function desgloseConteo(campo: (c: Cliente) => string | null) {
    const cont: Record<string, number> = {};
    ingresosFiltrados.forEach((c) => { const v = campo(c) || "Sin especificar"; cont[v] = (cont[v] || 0) + 1; });
    return Object.entries(cont).sort((a, b) => b[1] - a[1]);
  }
  const desgloseOrigen = desgloseConteo((c) => c.origen);
  const desgloseVendedor = desgloseConteo((c) => (c.vendedor_id ? perfilMap[c.vendedor_id] : "Sin asignar"));
  const desgloseBusca = desgloseConteo((c) => c.busca_marca);

  const repartoVendedores = useMemo(() => {
    const base = [...perfiles.map((p) => ({ id: p.id, nombre: p.nombre })), { id: "__sin_asignar__", nombre: "Sin asignar" }];
    return base.map((v) => {
      const enPeriodoV = clientes.filter((c) => enPeriodo(c, desde, hasta) && (v.id === "__sin_asignar__" ? !c.vendedor_id : c.vendedor_id === v.id));
      const enAnteriorV = clientes.filter((c) => enPeriodo(c, desdeAnt, hastaAnt) && (v.id === "__sin_asignar__" ? !c.vendedor_id : c.vendedor_id === v.id)).length;
      const sinContactarV = enPeriodoV.filter((c) => c.pipeline_stage === "sin_contactar").length;
      return { ...v, entraron: enPeriodoV.length, entraronAnterior: enAnteriorV, sinContactar: sinContactarV };
    }).filter((v) => v.entraron > 0 || v.entraronAnterior > 0);
  }, [clientes, perfiles, desde, hasta, desdeAnt, hastaAnt, incluirImportados]);

  // ---------- DEMANDA ----------
  const pedidosActivos = useMemo(() => clientes.filter((c) => (c.busca_marca || c.busca_modelo) && !["cerrado", "perdido"].includes(c.pipeline_stage)), [clientes]);
  const marcasTop = useMemo(() => {
    const cont: Record<string, number> = {};
    pedidosActivos.forEach((c) => { if (c.busca_marca) cont[c.busca_marca] = (cont[c.busca_marca] || 0) + 1; });
    return Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [pedidosActivos]);
  const canalDemanda = useMemo(() => {
    const cont: Record<string, number> = {};
    clientes.forEach((c) => { cont[c.origen] = (cont[c.origen] || 0) + 1; });
    return Object.entries(cont).sort((a, b) => b[1] - a[1]);
  }, [clientes]);
  const maxMarca = Math.max(1, ...marcasTop.map((m) => m[1]));

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: "hoy", label: "Hoy" }, { value: "ayer", label: "Ayer" }, { value: "7dias", label: "7 días" },
    { value: "30dias", label: "30 días" }, { value: "este_mes", label: "Este mes" }, { value: "mes_pasado", label: "Mes pasado" }, { value: "todos", label: "Todos" },
  ];
  const TABS_LISTA: { value: TabLista; label: string }[] = [
    { value: "todos", label: "Todos" }, { value: "mis_clientes", label: "Mis Clientes" }, { value: "sin_contactar", label: "Sin contactar" },
    { value: "contactados", label: "Contactados" }, { value: "compraron", label: "Compraron" }, { value: "perdidos", label: "Perdidos" },
  ];

  const activos = clientes.filter((c) => !["cerrado", "perdido"].includes(c.pipeline_stage)).length;
  const nuevosHoy = clientes.filter((c) => new Date(c.created_at).toDateString() === hoyStr).length;

  const EstadoIcon = ESTADO_ICON[miDisponibilidad?.estado || "disponible"];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-5 h-5 text-rose-600" /> Clientes</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{clientes.length} clientes · {activos} activos · {nuevosHoy} nuevos</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button disabled title="Todavía no construido" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 opacity-60 cursor-not-allowed"><Download className="w-3.5 h-3.5" /> Exportar XLSX</button>
              <button disabled title="Todavía no construido" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 opacity-60 cursor-not-allowed"><Upload className="w-3.5 h-3.5" /> Importar XLSX</button>
              <button onClick={() => setModalDisponibilidad(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300">
                {EstadoIcon && <EstadoIcon className="w-3.5 h-3.5 text-emerald-500" />} {ESTADO_LABEL[miDisponibilidad?.estado || "disponible"]}
              </button>
              <button onClick={() => setModalNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"><UserPlus className="w-3.5 h-3.5" /> Nuevo cliente</button>
            </div>
          </div>

          {/* TABS DE VISTA */}
          <div className="flex items-center gap-1 mb-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 w-fit">
            {[
              { v: "lista", label: "Lista", icon: List },
              { v: "pipeline", label: "Pipeline", icon: Columns3 },
              { v: "ingresos", label: "Ingresos", icon: TrendingUp },
              { v: "demanda", label: "Demanda", icon: PieChart },
              { v: "ranking", label: "Ranking", icon: Trophy },
            ].map((t) => {
              const Icon = t.icon;
              const activo = vista === t.v;
              return (
                <button key={t.v} onClick={() => setVista(t.v as Vista)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activo ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10"}`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* ===================== LISTA ===================== */}
          {vista === "lista" && (
            <>
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400 font-semibold"><TrendingUp className="w-3.5 h-3.5" /> Ingresaron:</span>
                {[["Hoy", ingresosHoy], ["Ayer", ingresosAyer], ["7 días", ingresos7], ["Este mes", ingresosMes]].map(([label, n]) => (
                  <button key={label as string} onClick={() => setVista("ingresos")} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10">
                    {label} <span className="px-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px]">{n}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {TABS_LISTA.map((t) => (
                  <button key={t.value} onClick={() => setTabLista(t.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${tabLista === t.value ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{t.label}</button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => setOrigenFiltro(null)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${!origenFiltro ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>Todos</button>
                  {["Instagram", "Facebook", "Web", "Referido", "Showroom", "WhatsApp", "Otro"].map((o) => (
                    <button key={o} onClick={() => setOrigenFiltro(o)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${origenFiltro === o ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>{o}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] font-semibold text-slate-400">Sexo:</span>
                  {[null, "Femenino", "Masculino"].map((s) => (
                    <button key={s || "todos"} onClick={() => setSexoFiltro(s)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sexoFiltro === s ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>{s || "Todos"}</button>
                  ))}
                </div>
              </div>

              <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, email o teléfono..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>

              {clientesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin resultados</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay clientes cargados. Podés darlos de alta desde acá mismo.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Contacto</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tipo</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Origen</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Interés</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vendedor</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Último contacto</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ops.</th>
                        <th className="px-4 py-3 w-px">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map((c) => {
                        const contactado = c.pipeline_stage !== "sin_contactar";
                        const telLimpio = (c.telefono || "").replace(/\D/g, "");
                        const vacio = nombreVacio(c.nombre);
                        const col = PIPELINE_COLUMNAS.find((p) => p.key === c.pipeline_stage);
                        return (
                          <tr key={c.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200 dark:border-white/10">{vacio ? "?" : c.nombre.charAt(0).toUpperCase()}</div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-bold truncate ${vacio ? "text-slate-400 italic" : "text-slate-900 dark:text-white"}`}>{vacio ? "Cliente sin nombre" : c.nombre}</p>
                                  {c.dni_cuit && <p className="text-[10px] font-semibold text-slate-400">DNI {c.dni_cuit}</p>}
                                  {!contactado && (
                                    <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Sin contactar: {tiempoRelativo(c.created_at)}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                {c.telefono && <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"><Phone className="w-3 h-3 text-rose-500 shrink-0" /> {c.telefono}</span>}
                                {c.email && <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]"><Mail className="w-3 h-3 shrink-0" /> {c.email}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">{c.tipo}</span></td>
                            <td className="px-4 py-3"><span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{c.origen}</span></td>
                            <td className="px-4 py-3"><span className="text-[11px] text-slate-500 dark:text-slate-400">{[c.busca_marca, c.busca_modelo].filter(Boolean).join(" ") || c.vehiculo_interes_texto || "—"}</span></td>
                            <td className="px-4 py-3"><span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{c.vendedor_id ? perfilMap[c.vendedor_id] || "—" : "Sin asignar"}</span></td>
                            <td className="px-4 py-3"><span className="text-[11px] text-slate-500 dark:text-slate-400">{c.ultimo_contacto ? fmtFecha(c.ultimo_contacto) : "—"}</span></td>
                            <td className="px-4 py-3">
                              {opsMap[c.id] ? <span title={`${opsMap[c.id]} operación(es)`} className="inline-flex items-center gap-1 text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20"><ShoppingBag className="w-3 h-3" /> {opsMap[c.id]}</span> : <span className="text-[11px] text-slate-300 dark:text-slate-600">0</span>}
                            </td>
                            <td className="px-4 py-3 w-px whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button onClick={() => toggleContacto(c)} disabled={actualizando === c.id} title={contactado ? "Marcar como Sin contactar" : "Marcar como Contactado"} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border whitespace-nowrap disabled:opacity-50 ${contactado ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20"}`}>
                                  {contactado ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />} {col?.label}
                                </button>
                                {telLimpio && <a href={`https://wa.me/${telLimpio}`} target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp" className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg inline-flex"><MessageCircle className="w-3.5 h-3.5" /></a>}
                                <button onClick={() => setEditando(c)} title="Editar cliente" className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => eliminarCliente(c)} disabled={eliminandoId === c.id} title="Eliminar cliente" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ===================== PIPELINE ===================== */}
          {vista === "pipeline" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Vendedor:</span>
                <select value={vendedorFiltroPipeline} onChange={(e) => setVendedorFiltroPipeline(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <option value="todos">Todos ({clientes.length})</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({clientes.filter((c) => c.vendedor_id === p.id).length})</option>)}
                </select>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
                {PIPELINE_COLUMNAS.map((col) => {
                  const items = clientesPipeline
                    .filter((c) => c.pipeline_stage === col.key)
                    .sort((a, b) => new Date(a.ultimo_contacto || a.created_at).getTime() - new Date(b.ultimo_contacto || b.created_at).getTime())
                    .slice(0, 40);
                  return (
                    <div
                      key={col.key}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) moverEtapa(id, col.key); }}
                      className={`shrink-0 w-72 rounded-xl border ${col.color} p-3 flex flex-col`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{col.label}</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-white/10 text-slate-500">{clientesPipeline.filter((c) => c.pipeline_stage === col.key).length}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2 leading-snug">{col.desc}</p>
                      <div className="space-y-2 min-h-[60px]">
                        {items.length === 0 && <p className="text-[11px] text-slate-300 dark:text-slate-600 italic py-4 text-center">Sin clientes en este stage.</p>}
                        {items.map((c) => (
                          <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-lg p-2.5 cursor-grab active:cursor-grabbing shadow-sm">
                            <p className={`text-xs font-bold truncate ${nombreVacio(c.nombre) ? "text-slate-400 italic" : "text-slate-900 dark:text-white"}`}>{nombreVacio(c.nombre) ? "Cliente sin nombre" : c.nombre}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{motivoDe(c)}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">{c.origen}</span>
                              {c.vendedor_id && <span className="text-[9px] text-slate-400 truncate max-w-[90px]">{perfilMap[c.vendedor_id]}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ===================== INGRESOS ===================== */}
          {vista === "ingresos" && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {PERIODOS.map((p) => (
                  <button key={p.value} onClick={() => { setPeriodo(p.value); setDiaSeleccionado(null); }} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${periodo === p.value ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{p.label}</button>
                ))}
                <label className="flex items-center gap-1.5 ml-2 text-[11px] font-semibold text-slate-400">
                  <input type="checkbox" checked={incluirImportados} onChange={(e) => setIncluirImportados(e.target.checked)} className="accent-rose-600" /> Incluir importados por Excel
                </label>
              </div>

              {(diaSeleccionado || origenIngresos || vendedorIngresos) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {diaSeleccionado && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[11px] font-semibold">{new Date(diaSeleccionado).toLocaleDateString("es-AR")} <button onClick={() => setDiaSeleccionado(null)}><X className="w-3 h-3" /></button></span>}
                  {origenIngresos && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[11px] font-semibold">{origenIngresos} <button onClick={() => setOrigenIngresos(null)}><X className="w-3 h-3" /></button></span>}
                  {vendedorIngresos && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[11px] font-semibold">{vendedorIngresos === "__sin_asignar__" ? "Sin asignar" : perfilMap[vendedorIngresos]} <button onClick={() => setVendedorIngresos(null)}><X className="w-3 h-3" /></button></span>}
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos · {PERIODOS.find((p) => p.value === periodo)?.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ingresosFiltrados.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Período anterior: {periodo === "todos" ? "—" : ingresosAnteriorCount}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Todavía sin contactar</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{sinContactarPeriodo}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ya contactados</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{yaContactadosPeriodo}</p>
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canal que más trajo</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{canalTop}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-4">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Ingresos por día — últimos 30 días</p>
                <p className="text-[11px] text-slate-400 mb-4">Clickeá una barra para ver los clientes de ese día</p>
                <div className="flex items-end gap-1 h-32">
                  {barras30.map((d) => (
                    <button key={d.key} onClick={() => setDiaSeleccionado(diaSeleccionado === d.key ? null : d.key)} title={`${d.fecha.toLocaleDateString("es-AR")}: ${d.count}`} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className={`w-full rounded-t transition-colors ${diaSeleccionado === d.key ? "bg-rose-600" : "bg-rose-200 dark:bg-rose-500/30 group-hover:bg-rose-400"}`} style={{ height: `${(d.count / maxBarra) * 100}%`, minHeight: d.count > 0 ? "4px" : "1px" }} />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1"><span>{barras30[0]?.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</span><span>{barras30[barras30.length - 1]?.fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">De dónde vinieron</p>
                  {desgloseOrigen.length === 0 ? <p className="text-xs text-slate-400">Sin datos en el período.</p> : desgloseOrigen.map(([k, n]) => (
                    <button key={k} onClick={() => setOrigenIngresos(origenIngresos === k ? null : k)} className={`w-full flex items-center justify-between text-xs py-1.5 px-1.5 rounded-lg ${origenIngresos === k ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                      <span className="font-semibold">{k}</span><span className="font-black">{n}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Quién los tiene</p>
                  {desgloseVendedor.length === 0 ? <p className="text-xs text-slate-400">Sin datos en el período.</p> : desgloseVendedor.map(([k, n]) => (
                    <div key={k} className="flex items-center justify-between text-xs py-1.5 px-1.5 text-slate-600 dark:text-slate-300"><span className="font-semibold">{k}</span><span className="font-black">{n}</span></div>
                  ))}
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Qué buscan</p>
                  {desgloseBusca.length === 0 ? <p className="text-xs text-slate-400">Sin datos en el período.</p> : desgloseBusca.map(([k, n]) => (
                    <div key={k} className="flex items-center justify-between text-xs py-1.5 px-1.5 text-slate-600 dark:text-slate-300"><span className="font-semibold">{k}</span><span className="font-black">{n}</span></div>
                  ))}
                </div>
              </div>

              {repartoVendedores.length > 0 && (
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 mb-4 overflow-x-auto">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Cómo se repartió</p>
                  <table className="w-full text-left text-xs">
                    <thead><tr className="text-[10px] uppercase text-slate-400"><th className="py-1.5 pr-3">Vendedor</th><th className="py-1.5 pr-3">Entraron</th><th className="py-1.5 pr-3">Período anterior</th><th className="py-1.5 pr-3">Sin contactar</th></tr></thead>
                    <tbody>
                      {repartoVendedores.map((v) => {
                        const alerta = v.entraron >= 2 && v.sinContactar / v.entraron >= 0.5;
                        const flecha = v.entraron > v.entraronAnterior ? "▲" : v.entraron < v.entraronAnterior ? "▼" : "";
                        return (
                          <tr key={v.id} className="border-t border-slate-100 dark:border-white/5">
                            <td className="py-2 pr-3 font-semibold text-slate-700 dark:text-slate-200">
                              <button onClick={() => setVendedorIngresos(vendedorIngresos === v.id ? null : v.id)} className="hover:underline">{v.nombre}</button>
                            </td>
                            <td className="py-2 pr-3 font-black">{v.entraron}</td>
                            <td className="py-2 pr-3 text-slate-400">{v.entraronAnterior} <span className={flecha === "▲" ? "text-emerald-500" : "text-rose-500"}>{flecha}</span></td>
                            <td className={`py-2 pr-3 font-black ${alerta ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>{v.sinContactar}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {ingresosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Users className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-2" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sin ingresos en este período</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Probá con otro período o sacá los filtros.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5">
                  {ingresosFiltrados.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{nombreVacio(c.nombre) ? "Cliente sin nombre" : c.nombre}</span>
                      <span className="text-slate-400">{new Date(c.created_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {c.origen} · {c.vendedor_id ? perfilMap[c.vendedor_id] : "Sin asignar"}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===================== DEMANDA ===================== */}
          {vista === "demanda" && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">0</p>
                  <p className="text-[11px] text-slate-400">clientes con auto identificado (0% de {clientes.length})</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{pedidosActivos.length}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">pedidos activos (wishlist)</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Marcas más pedidas (top 15)</p>
                  {marcasTop.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Sin marcas reconocidas todavía.</p> : (
                    <div className="space-y-1.5">
                      {marcasTop.map(([k, n]) => (
                        <div key={k} className="flex items-center gap-2 text-xs">
                          <span className="w-20 shrink-0 font-semibold text-slate-600 dark:text-slate-300 truncate">{k}</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${(n / maxMarca) * 100}%` }} /></div>
                          <span className="w-5 text-right font-black text-slate-500">{n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Por canal de entrada</p>
                  {canalDemanda.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Sin datos de canal.</p> : canalDemanda.map(([k, n]) => (
                    <div key={k} className="flex items-center justify-between text-xs py-1.5"><span className="font-semibold text-slate-600 dark:text-slate-300">{k}</span><span className="font-black text-slate-500">{n}</span></div>
                  ))}
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Por tipo de auto</p>
                  <p className="text-[10px] text-slate-400 mb-3">Sale de la carrocería del vehículo vinculado; cubre solo a los clientes con auto de stock enganchado.</p>
                  <p className="text-xs text-slate-400 text-center py-4">Todavía no hay clientes con auto de stock vinculado.</p>
                </div>
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Pedidos activos por marca (wishlist)</p>
                  <p className="text-[10px] text-slate-400 mb-3">Demanda explícita: lo que el cliente dejó pedido y sigue abierto.</p>
                  {marcasTop.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Sin pedidos activos.</p> : (
                    <div className="space-y-1.5">
                      {marcasTop.slice(0, 6).map(([k, n]) => (
                        <div key={k} className="flex items-center gap-2 text-xs">
                          <span className="w-20 shrink-0 font-semibold text-slate-600 dark:text-slate-300 truncate">{k}</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(n / maxMarca) * 100}%` }} /></div>
                          <span className="w-5 text-right font-black text-slate-500">{n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===================== RANKING ===================== */}
          {vista === "ranking" && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">Todavía no hay compras cerradas</h3>
              <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">Cuando cierres ventas vinculadas a un cliente, acá vas a ver quiénes son los que más te compran. Depende del módulo de Ventas, todavía no construido.</p>
            </div>
          )}
        </div>
      </div>

      {(modalNuevo || editando) && <NuevoClienteModal perfiles={perfiles} disponibilidad={disponibilidad} miId={miId} editando={editando || undefined} onClose={() => { setModalNuevo(false); setEditando(null); }} onCreado={onCreado} />}
      {modalDisponibilidad && <DisponibilidadModal perfiles={perfiles} disponibilidad={disponibilidad} miId={miId} esAdmin={esAdmin} onClose={() => setModalDisponibilidad(false)} onGuardado={onDisponibilidadGuardada} />}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import {
  BarChart3, Trophy, Flame, ExternalLink, Plus, X, Save, CheckCircle2,
  CreditCard, Trash2, Pencil, Car, ShoppingCart, Briefcase, Wallet2, ChevronDown,
  ClipboardCheck, CalendarPlus, Wallet as WalletIcon,
} from "lucide-react";
import DeudasTab from "./tabs/DeudasTab";
import CuotasPagarTab from "./tabs/CuotasPagarTab";
import CuotasCobrarTab from "./tabs/CuotasCobrarTab";
import SaldoAgenciaTab from "./tabs/SaldoAgenciaTab";
import MisAutosTab from "./tabs/MisAutosTab";
import PatrimonioTab from "./tabs/PatrimonioTab";
import PendientesTab from "./tabs/PendientesTab";
import CalendarioTab from "./tabs/CalendarioTab";
import GastosFijosTab from "./tabs/GastosFijosTab";
import ContactosTab from "./tabs/ContactosTab";
import NotificacionesTab from "./tabs/NotificacionesTab";
import MiWhatsAppTab from "./tabs/MiWhatsAppTab";

const RESUMEN_ITEMS = [
  { key: "ventas_cerradas", label: "Ventas cerradas", desc: "Cerradas en 24h y en la semana" },
  { key: "leads_nuevos", label: "Leads nuevos", desc: "Nuevos en 24h y en la semana" },
  { key: "expedientes_atrasados", label: "Expedientes atrasados", desc: "Sin cerrar pasado el umbral" },
  { key: "cuotas", label: "Cuotas", desc: "Por vencer y vencidas" },
  { key: "stock_disponible", label: "Stock disponible", desc: "Vehículos disponibles" },
  { key: "cotizaciones_nuevas", label: "Cotizaciones nuevas", desc: "Emitidas en las últimas 24h" },
  { key: "clientes_ingresaron", label: "Clientes que ingresaron", desc: "Altas nuevas en 24h y en la semana, con el canal de dónde vinieron" },
  { key: "clientes_sin_contactar", label: "Clientes sin contactar", desc: "Leads que esperan atención" },
  { key: "reclamos_abiertos", label: "Reclamos abiertos", desc: "Abiertos y estancados (sin moverse)" },
  { key: "autorizaciones_pendientes", label: "Autorizaciones pendientes", desc: "", sensible: true },
];

const PANEL_TABS = [
  { grupo: "PANEL", value: "mi-dia", label: "Mi día", icon: BarChart3 },
  { grupo: "PANEL", value: "mis-ventas", label: "Mis ventas", icon: Trophy, externo: "/panel-v2/mis-ventas" },
  { grupo: "PANEL", value: "mi-resumen", label: "Mi resumen", icon: BarChart3 },
];
const FINANZAS_TABS = [
  { grupo: "FINANZAS PERSONALES", value: "urgente", label: "URGENTE", icon: Flame },
  { grupo: "FINANZAS PERSONALES", value: "pagos", label: "Pagos realizados", icon: CreditCard },
  { grupo: "FINANZAS PERSONALES", value: "deudas", label: "Deudas" },
  { grupo: "FINANZAS PERSONALES", value: "gastos-fijos", label: "Gastos fijos" },
  { grupo: "FINANZAS PERSONALES", value: "cuotas-pagar", label: "Cuotas a pagar" },
  { grupo: "FINANZAS PERSONALES", value: "cuotas-cobrar", label: "Cuotas a cobrar" },
  { grupo: "FINANZAS PERSONALES", value: "saldo-agencia", label: "Saldo agencia" },
];
const OTRAS_TABS = [
  { grupo: "ORGANIZACIÓN", value: "mis-autos", label: "Mis autos" },
  { grupo: "ORGANIZACIÓN", value: "patrimonio", label: "Patrimonio" },
  { grupo: "ORGANIZACIÓN", value: "pendientes", label: "Pendientes" },
  { grupo: "ORGANIZACIÓN", value: "calendario", label: "Calendario" },
  { grupo: "ORGANIZACIÓN", value: "contactos", label: "Contactos" },
  { grupo: "PREFERENCIAS", value: "notificaciones", label: "Mis notificaciones" },
  { grupo: "PREFERENCIAS", value: "whatsapp", label: "Mi WhatsApp" },
];

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";
const LS_KEY = "mi-espacio-ultima-tab";

function fmt(n: number, moneda = "ARS") {
  return `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
}

function diasHasta(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha + "T00:00:00");
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}

export default function MiEspacioClient({
  miId, miNombre, soyAdmin, agencia, urgentesIniciales, pagosIniciales, prefsIniciales,
}: {
  miId: string; miNombre: string; soyAdmin: boolean;
  agencia: { stockDisponible: number; ventasDelMes: number; expedientesActivos: number; ingresosDelMesUsd: number } | null;
  urgentesIniciales: any[]; pagosIniciales: any[]; prefsIniciales: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("mi-dia");
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [autoAbrir, setAutoAbrir] = useState<string | null>(null);
  const [urgentes, setUrgentes] = useState(urgentesIniciales);
  const [pagos, setPagos] = useState(pagosIniciales);
  const [recibirResumen, setRecibirResumen] = useState(prefsIniciales?.recibir_resumen ?? true);
  const [items, setItems] = useState<string[]>(prefsIniciales?.items || RESUMEN_ITEMS.map((i) => i.key));

  const [showNuevoUrgente, setShowNuevoUrgente] = useState(false);
  const [uTitulo, setUTitulo] = useState("");
  const [uMoneda, setUMoneda] = useState("ARS");
  const [uMonto, setUMonto] = useState("");
  const [uVencimiento, setUVencimiento] = useState("");
  const [uNotas, setUNotas] = useState("");
  const [guardandoUrgente, setGuardandoUrgente] = useState(false);

  const [pagando, setPagando] = useState<any | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pagoNotas, setPagoNotas] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [showPagoManual, setShowPagoManual] = useState(false);
  const [pmFecha, setPmFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pmMetodo, setPmMetodo] = useState("");
  const [pmConcepto, setPmConcepto] = useState("");
  const [pmMoneda, setPmMoneda] = useState("USD");
  const [pmMonto, setPmMonto] = useState("");
  const [pmBeneficiario, setPmBeneficiario] = useState("");
  const [pmNotas, setPmNotas] = useState("");
  const [guardandoPagoManual, setGuardandoPagoManual] = useState(false);
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7));
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    const desdeUrl = searchParams.get("tab");
    if (desdeUrl) { setTab(desdeUrl); localStorage.setItem(LS_KEY, desdeUrl); return; }
    const guardada = localStorage.getItem(LS_KEY);
    if (guardada) { setTab(guardada); router.replace(`/panel-v2/mi-espacio?tab=${guardada}`); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const irATab = (v: string) => {
    setTab(v);
    localStorage.setItem(LS_KEY, v);
    router.replace(`/panel-v2/mi-espacio?tab=${v}`);
  };

  const urgentesPendientes = useMemo(() => urgentes.filter((u) => !u.pagado), [urgentes]);
  const vencidos = urgentesPendientes.filter((u) => diasHasta(u.vencimiento) < 0);
  const hoyVencen = urgentesPendientes.filter((u) => diasHasta(u.vencimiento) === 0);

  const inicioMesStr = new Date().toISOString().slice(0, 7);
  const aPagarEsteMes = urgentesPendientes.filter((u) => u.vencimiento.slice(0, 7) === inicioMesStr && u.moneda === "ARS").reduce((a, u) => a + (Number(u.monto) - Number(u.monto_pagado)), 0);
  const yaPagueEsteMes = pagos.filter((p) => p.fecha.slice(0, 7) === inicioMesStr && p.moneda === "ARS").reduce((a, p) => a + Number(p.monto), 0);

  const crearUrgente = async () => {
    if (!uTitulo.trim() || !uVencimiento) return alert("Completá al menos el título y el vencimiento.");
    setGuardandoUrgente(true);
    try {
      const { data, error } = await supabase2.from("espacio_urgentes").insert({ perfil_id: miId, titulo: uTitulo.trim(), moneda: uMoneda, monto: Number(uMonto) || 0, vencimiento: uVencimiento, notas: uNotas || null }).select().single();
      if (error) throw error;
      setUrgentes((prev) => [...prev, data].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)));
      setShowNuevoUrgente(false);
      setUTitulo(""); setUMonto(""); setUVencimiento(""); setUNotas("");
    } catch { alert("No se pudo crear el urgente."); } finally { setGuardandoUrgente(false); }
  };

  const eliminarUrgente = async (u: any) => {
    if (!confirm(`¿Eliminar "${u.titulo}"?`)) return;
    await supabase2.from("espacio_urgentes").delete().eq("id", u.id);
    setUrgentes((prev) => prev.filter((x) => x.id !== u.id));
  };

  const abrirPago = (u: any, completo: boolean) => {
    setPagando(u);
    setPagoMonto(completo ? String(Number(u.monto) - Number(u.monto_pagado)) : "");
    setPagoFecha(new Date().toISOString().slice(0, 10));
    setPagoNotas("");
  };

  const saldoPendiente = pagando ? Number(pagando.monto) - Number(pagando.monto_pagado) : 0;

  const confirmarPago = async () => {
    if (!pagando) return;
    const monto = Number(pagoMonto);
    if (!monto || monto <= 0) return alert("Ingresá un monto válido.");
    setGuardandoPago(true);
    try {
      const { data: pago, error: err1 } = await supabase2.from("espacio_pagos").insert({
        perfil_id: miId, fecha: pagoFecha, concepto: pagando.titulo, moneda: pagando.moneda, monto, notas: pagoNotas || null, origen: "urgente", origen_id: pagando.id,
      }).select().single();
      if (err1) throw err1;
      const nuevoPagado = Number(pagando.monto_pagado) + monto;
      const pagadoCompleto = nuevoPagado >= Number(pagando.monto);
      const { error: err2 } = await supabase2.from("espacio_urgentes").update({ monto_pagado: nuevoPagado, pagado: pagadoCompleto }).eq("id", pagando.id);
      if (err2) throw err2;
      setPagos((prev) => [pago, ...prev]);
      setUrgentes((prev) => prev.map((u) => (u.id === pagando.id ? { ...u, monto_pagado: nuevoPagado, pagado: pagadoCompleto } : u)));
      setPagando(null);
    } catch { alert("No se pudo registrar el pago."); } finally { setGuardandoPago(false); }
  };

  const registrarPagoManual = async () => {
    if (!pmConcepto.trim() || !pmMonto) return alert("Completá concepto y monto.");
    setGuardandoPagoManual(true);
    try {
      const { data, error } = await supabase2.from("espacio_pagos").insert({
        perfil_id: miId, fecha: pmFecha, metodo: pmMetodo || null, concepto: pmConcepto.trim(), moneda: pmMoneda, monto: Number(pmMonto), beneficiario: pmBeneficiario || null, notas: pmNotas || null, origen: "manual",
      }).select().single();
      if (error) throw error;
      setPagos((prev) => [data, ...prev]);
      setShowPagoManual(false);
      setPmMetodo(""); setPmConcepto(""); setPmMonto(""); setPmBeneficiario(""); setPmNotas("");
    } catch { alert("No se pudo registrar el pago."); } finally { setGuardandoPagoManual(false); }
  };

  const eliminarPago = async (p: any) => {
    if (p.origen !== "manual") return;
    if (!confirm("¿Eliminar este pago?")) return;
    await supabase2.from("espacio_pagos").delete().eq("id", p.id);
    setPagos((prev) => prev.filter((x) => x.id !== p.id));
  };

  const togglePref = async (recibir: boolean, nuevosItems: string[]) => {
    setRecibirResumen(recibir);
    setItems(nuevosItems);
    await supabase2.from("espacio_resumen_prefs").upsert({ perfil_id: miId, recibir_resumen: recibir, items: nuevosItems, updated_at: new Date().toISOString() });
  };

  const pagosFiltrados = verTodos ? pagos : pagos.filter((p) => p.fecha.slice(0, 7) === mesFiltro);
  const totalMes = pagosFiltrados.reduce((a, p) => a + (p.moneda === "ARS" ? Number(p.monto) : 0), 0);
  const totalGeneral = pagos.reduce((a, p) => a + (p.moneda === "ARS" ? Number(p.monto) : 0), 0);

  const renderTab = (t: any) => {
    const Icon = t.icon;
    if (t.externo) {
      return (
        <Link key={t.value} href={t.externo} className="px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600">
          {Icon && <Icon className="w-3.5 h-3.5" />} {t.label} <ExternalLink className="w-3 h-3" />
        </Link>
      );
    }
    return (
      <button key={t.value} disabled={t.disabled} onClick={() => irATab(t.value)} title={t.disabled ? "Todavía no construido" : undefined}
        className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 rounded-lg transition-colors ${tab === t.value ? "bg-rose-600 text-white" : t.disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />} {t.label}
      </button>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Mi Espacio — {miNombre}</h1>
          <p className="text-sm text-slate-400">Tu zona personal — separada de la operación de la agencia. Solo vos ves esto.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 relative">
          {soyAdmin && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">Administrador</span>}
          <button onClick={() => setMostrarAgregar((v) => !v)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Agregar <ChevronDown className="w-3.5 h-3.5" /></button>
          {mostrarAgregar && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl w-56 py-1 z-20">
              <button onClick={() => { irATab("pendientes"); setAutoAbrir("pendientes"); setMostrarAgregar(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5"><ClipboardCheck className="w-4 h-4 text-slate-400" /> Pendiente</button>
              <button onClick={() => { irATab("calendario"); setAutoAbrir("calendario"); setMostrarAgregar(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5"><CalendarPlus className="w-4 h-4 text-slate-400" /> Evento de calendario</button>
              {soyAdmin && <button onClick={() => { irATab("gastos-fijos"); setAutoAbrir("gastos-fijos"); setMostrarAgregar(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5"><WalletIcon className="w-4 h-4 text-slate-400" /> Gasto fijo</button>}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 my-4 flex items-center gap-1 overflow-x-auto">
        {PANEL_TABS.map(renderTab)}
        {soyAdmin && <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0 mx-1" />}
        {soyAdmin && FINANZAS_TABS.map(renderTab)}
        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0 mx-1" />
        {OTRAS_TABS.map(renderTab)}
      </div>

      {tab === "mi-dia" && (
        <div className="space-y-4">
          {vencidos.length === 0 && hoyVencen.length === 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" /> Estás al día — nada te apremia para hoy.
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {vencidos.length > 0 && <button onClick={() => irATab("urgente")} className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white">{vencidos.length} vencido{vencidos.length === 1 ? "" : "s"}</button>}
              {hoyVencen.length > 0 && <button onClick={() => irATab("urgente")} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white">{hoyVencen.length} vence{hoyVencen.length === 1 ? "" : "n"} hoy</button>}
            </div>
          )}

          {soyAdmin && agencia && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tu resumen como administrador — <strong>{new Date().toISOString().slice(0, 7)}</strong></p>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Plata este mes</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4">
                    <p className="text-lg font-black text-rose-600">{fmt(aPagarEsteMes)}</p>
                    <p className="text-[10px] font-bold uppercase text-rose-500">A pagar este mes</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cuotas + deudas que vencen</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                    <p className="text-lg font-black text-emerald-600">{fmt(yaPagueEsteMes)}</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Ya pagué este mes</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Suma de pagos registrados</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
                    <p className="text-lg font-black text-indigo-600">$ 0</p>
                    <p className="text-[10px] font-bold uppercase text-indigo-500">A cobrar este mes</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cuotas a cobrar que vencen</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                    <p className="text-lg font-black text-emerald-600">$ 0</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-600">Ya cobré este mes</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Suma de cobros registrados</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">Próximos 7 días <span className="font-normal normal-case text-slate-400">0 eventos</span></p>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400">Nada que vence en los próximos 7 días. Aprovechá la calma.</div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Tu agencia</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4"><Car className="w-4 h-4 text-emerald-600 mb-1" /><p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{agencia.stockDisponible}</p><p className="text-[10px] font-bold uppercase text-slate-400">Stock disponible</p></div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4"><ShoppingCart className="w-4 h-4 text-indigo-600 mb-1" /><p className="text-lg font-black text-indigo-700 dark:text-indigo-300">{agencia.ventasDelMes}</p><p className="text-[10px] font-bold uppercase text-slate-400">Ventas del mes</p></div>
                  <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl p-4"><Briefcase className="w-4 h-4 text-purple-600 mb-1" /><p className="text-lg font-black text-purple-700 dark:text-purple-300">{agencia.expedientesActivos}</p><p className="text-[10px] font-bold uppercase text-slate-400">Expedientes activos</p></div>
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4"><Wallet2 className="w-4 h-4 text-amber-600 mb-1" /><p className="text-lg font-black text-amber-700 dark:text-amber-300">USD {agencia.ingresosDelMesUsd.toLocaleString("es-AR")}</p><p className="text-[10px] font-bold uppercase text-slate-400">Ingresos del mes</p><p className="text-[10px] text-slate-400">Solo movimientos USD</p></div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Hoy</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-lg font-black">0</p><p className="text-[10px] font-bold uppercase text-slate-400">Mis pendientes</p></div>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-lg font-black">0</p><p className="text-[10px] font-bold uppercase text-slate-400">Eventos hoy</p></div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4"><p className="text-lg font-black text-indigo-600">USD 0</p><p className="text-[10px] font-bold uppercase text-slate-400">Gastos fijos / mes</p><p className="text-[10px] text-slate-400">Piso comprometido</p></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "mi-resumen" && (
        <div className="space-y-3 max-w-lg">
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4">
            <p className="text-sm font-bold flex items-center gap-1.5">📊 Mi resumen diario</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elegí qué querés ver en tu resumen de cada mañana en la campanita 🔔. Es tuyo: cada uno arma el suyo.</p>
          </div>
          <label className="flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer">
            <input type="checkbox" checked={recibirResumen} onChange={(e) => togglePref(e.target.checked, items)} className="w-5 h-5 accent-emerald-600" />
            <span><span className="block text-sm font-bold">Recibir el resumen diario</span><span className="block text-xs text-slate-400">Si lo apagás, no recibís el resumen en la campanita.</span></span>
          </label>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 mt-2">Qué incluir</p>
            <div className="space-y-1.5">
              {RESUMEN_ITEMS.map((it) => (
                <label key={it.key} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-3 cursor-pointer">
                  <input type="checkbox" checked={items.includes(it.key)} onChange={(e) => togglePref(recibirResumen, e.target.checked ? [...items, it.key] : items.filter((k) => k !== it.key))} className="w-4 h-4 accent-rose-600" />
                  <span className="flex-1"><span className="block text-sm font-semibold">{it.label}</span>{it.desc && <span className="block text-[11px] text-slate-400">{it.desc}</span>}</span>
                  {it.sensible && <span className="text-[9px] font-bold uppercase text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">sensible</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "urgente" && soyAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-lg font-bold">URGENTE — {urgentesPendientes.length} pendiente{urgentesPendientes.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Tus anotaciones de cosas urgentes a pagar. Cada ítem muestra cuántos días faltan para el vencimiento.</p></div>
            <button onClick={() => setShowNuevoUrgente(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo urgente</button>
          </div>

          {urgentes.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
              <p className="text-sm font-bold">Sin items urgentes</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">Anotá acá pagos / trámites con vencimiento para no olvidarlos.</p>
              <button onClick={() => setShowNuevoUrgente(true)} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">+ Agregar urgente</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {urgentes.map((u) => {
                const d = diasHasta(u.vencimiento);
                return (
                  <div key={u.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{u.titulo}</p>
                      {!u.pagado && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${d < 0 ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300" : d === 0 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-slate-100 dark:bg-white/10 text-slate-500"}`}>{d < 0 ? `Vencido ${-d}d` : d === 0 ? "Vence hoy" : `Vence en ${d}d`}</span>}
                      {u.pagado && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">Pagado</span>}
                    </div>
                    <p className="text-lg font-black mt-1">{fmt(u.monto, u.moneda)}</p>
                    {u.monto_pagado > 0 && !u.pagado && <p className="text-[11px] text-slate-400">Pagado: {fmt(u.monto_pagado, u.moneda)} · Saldo: {fmt(u.monto - u.monto_pagado, u.moneda)}</p>}
                    <p className="text-[11px] text-slate-400">Vence: {u.vencimiento}</p>
                    {!u.pagado && (
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => abrirPago(u, false)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"><CreditCard className="w-3.5 h-3.5" /> Pago parcial</button>
                        <button onClick={() => abrirPago(u, true)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"><CheckCircle2 className="w-3.5 h-3.5" /> Marcar pagado</button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white ml-auto"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => eliminarUrgente(u)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "pagos" && soyAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div><p className="text-lg font-bold">Pagos realizados — {pagosFiltrados.length} item{pagosFiltrados.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Todos tus pagos en un solo lugar — los manuales + los parciales que cargaste en Deudas, Urgente y Cuotas a pagar.</p></div>
            <button onClick={() => setShowPagoManual(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Registrar pago manual</button>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <label className="text-xs font-bold text-slate-500">Mes:</label>
            <input type="month" value={mesFiltro} onChange={(e) => { setMesFiltro(e.target.value); setVerTodos(false); }} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none" />
            <button onClick={() => setVerTodos((v) => !v)} className={`text-xs font-bold ${verTodos ? "text-rose-600" : "text-slate-400 hover:text-rose-600"}`}>Ver todos</button>
            <div className="ml-auto flex gap-2">
              <span className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">Total del mes: {fmt(totalMes)}</span>
              <span className="text-[11px] font-bold bg-slate-100 dark:bg-white/10 text-slate-500 px-2.5 py-1 rounded-full">General: {fmt(totalGeneral)}</span>
            </div>
          </div>

          {pagosFiltrados.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
              <p className="text-sm font-bold">Sin pagos registrados</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">Anotá un pago manual acá, o cargá un pago parcial en Deudas/Urgente/Cuotas a pagar y va a aparecer en esta lista.</p>
              <button onClick={() => setShowPagoManual(true)} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">+ Registrar pago manual</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-bold"><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Concepto</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3">Beneficiario</th><th className="px-4 py-3">Método</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3 w-px">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {pagosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{p.fecha}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{p.concepto}</td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.origen === "manual" ? "bg-slate-100 dark:bg-white/10 text-slate-500" : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"}`}>{p.origen === "manual" ? "Manual" : "Urgente"}</span></td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.beneficiario || "—"}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.metodo || "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold">{fmt(p.monto, p.moneda)}</td>
                        <td className="px-4 py-3">{p.origen === "manual" && <button onClick={() => eliminarPago(p)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "deudas" && soyAdmin && <DeudasTab miId={miId} />}
      {tab === "cuotas-pagar" && soyAdmin && <CuotasPagarTab miId={miId} />}
      {tab === "cuotas-cobrar" && soyAdmin && <CuotasCobrarTab miId={miId} />}
      {tab === "saldo-agencia" && soyAdmin && <SaldoAgenciaTab miId={miId} />}
      {tab === "gastos-fijos" && soyAdmin && <GastosFijosTab miId={miId} autoAbrir={autoAbrir === "gastos-fijos"} onAutoAbierto={() => setAutoAbrir(null)} />}
      {tab === "mis-autos" && <MisAutosTab miId={miId} />}
      {tab === "patrimonio" && <PatrimonioTab miId={miId} miNombre={miNombre} soyAdmin={soyAdmin} />}
      {tab === "pendientes" && <PendientesTab miId={miId} autoAbrir={autoAbrir === "pendientes"} onAutoAbierto={() => setAutoAbrir(null)} />}
      {tab === "calendario" && <CalendarioTab miId={miId} autoAbrir={autoAbrir === "calendario"} onAutoAbierto={() => setAutoAbrir(null)} />}
      {tab === "contactos" && <ContactosTab miId={miId} />}
      {tab === "notificaciones" && <NotificacionesTab miId={miId} />}
      {tab === "whatsapp" && <MiWhatsAppTab miId={miId} />}

      {!soyAdmin && ["urgente", "pagos", "deudas", "cuotas-pagar", "cuotas-cobrar", "saldo-agencia", "gastos-fijos"].includes(tab) && (
        <p className="text-sm text-slate-400 text-center py-16">Esta sección es solo para administradores.</p>
      )}

      {showNuevoUrgente && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevoUrgente(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo urgente</h3><button onClick={() => setShowNuevoUrgente(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Algo que tenés que pagar / hacer pronto. Solo vos lo ves.</p>
            <label className={labelClass}>Título / Concepto *</label>
            <input value={uTitulo} onChange={(e) => setUTitulo(e.target.value)} placeholder="Pagar la luz" className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Moneda</label><select value={uMoneda} onChange={(e) => setUMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label className={labelClass}>Monto</label><input type="number" value={uMonto} onChange={(e) => setUMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Vencimiento *</label><input type="date" value={uVencimiento} onChange={(e) => setUVencimiento(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={uNotas} onChange={(e) => setUNotas(e.target.value)} rows={2} placeholder="Detalles, link de pago, sucursal..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNuevoUrgente(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={crearUrgente} disabled={guardandoUrgente} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button>
            </div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Pago sobre "{pagando.titulo}"</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">Total a pagar</span><strong>{fmt(pagando.monto, pagando.moneda)}</strong>
            </div>
            <div className="flex items-center justify-between text-sm mb-3"><span className="text-slate-500">Saldo pendiente</span><strong className="text-amber-600">{fmt(saldoPendiente, pagando.moneda)}</strong></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={pagoFecha} onChange={(e) => setPagoFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Monto ({pagando.moneda}) *</label><input type="number" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas (opcional)</label>
            <textarea value={pagoNotas} onChange={(e) => setPagoNotas(e.target.value)} rows={2} placeholder="Transferencia, efectivo, etc." className={inputClass} />
            {Number(pagoMonto) >= saldoPendiente && Number(pagoMonto) > 0 && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Con este pago el ítem queda saldado.</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={confirmarPago} disabled={guardandoPago} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar pago</button>
            </div>
          </div>
        </div>
      )}

      {showPagoManual && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPagoManual(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Registrar pago manual</h3><button onClick={() => setShowPagoManual(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Anotalo acá para tener registro. No afecta finanzas de la agencia.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={pmFecha} onChange={(e) => setPmFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Método</label><input value={pmMetodo} onChange={(e) => setPmMetodo(e.target.value)} placeholder="Efectivo, transferencia, cripto" className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Concepto *</label>
            <input value={pmConcepto} onChange={(e) => setPmConcepto(e.target.value)} placeholder="Compra dólares, pago auto, etc." className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Moneda</label><select value={pmMoneda} onChange={(e) => setPmMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
              <div className="col-span-2"><label className={labelClass}>Monto *</label><input type="number" value={pmMonto} onChange={(e) => setPmMonto(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Beneficiario</label>
            <input value={pmBeneficiario} onChange={(e) => setPmBeneficiario(e.target.value)} placeholder="A quién" className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={pmNotas} onChange={(e) => setPmNotas(e.target.value)} rows={2} placeholder="Cotización, comprobante, contexto..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPagoManual(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={registrarPagoManual} disabled={guardandoPagoManual} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

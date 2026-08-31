"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { hoyLocalISO } from "@/lib/panelV2/fechas";
import {
  Trophy, Wallet, FileText, DollarSign, Star, ChevronLeft, ChevronRight, Calendar, Award,
  Hourglass, Car, Target, ChevronDown, ChevronUp, Download, Loader2,
} from "lucide-react";
import ReciboModal from "./ReciboModal";
import BoletoModal from "../expedientes/BoletoModal";

interface Vendedor { id: string; nombre: string }
type Periodo = "mes" | "anio" | "historico";

function fmt(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}

export default function MisVentasClient({ vendedores, miId, miNombre, esAdmin }: { vendedores: Vendedor[]; miId: string; miNombre: string; esAdmin: boolean }) {
  const [vendedorId, setVendedorId] = useState(miId);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [mesOffset, setMesOffset] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [tier, setTier] = useState<any>(null);
  const [bonoProyectado, setBonoProyectado] = useState(0);
  const [premios, setPremios] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [funnel, setFunnel] = useState({ leads: 0, contactados: 0, vendidos: 0 });
  const [tiempoRespuesta, setTiempoRespuesta] = useState<string | null>(null);
  const [pctResenas, setPctResenas] = useState(0);
  const [ventas, setVentas] = useState<any[]>([]);
  const [comisionesPendientes, setComisionesPendientes] = useState<{ cantidad: number; totalPorMoneda: Record<string, number> }>({ cantidad: 0, totalPorMoneda: {} });
  const [ventasAbierto, setVentasAbierto] = useState(true);
  const [consigAbierto, setConsigAbierto] = useState(true);
  const [modalRecibo, setModalRecibo] = useState(false);
  const [modalBoleto, setModalBoleto] = useState(false);
  const [generandoReporte, setGenerandoReporte] = useState(false);

  const hoy = new Date();
  const esUltimoDiaDelMes = hoy.getDate() === new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

  const rangoMes = useMemo(() => {
    const base = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
    const desde = new Date(base.getFullYear(), base.getMonth(), 1);
    const hasta = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { desde, hasta, label: base.toLocaleDateString("es-AR", { month: "long", year: "numeric" }) };
  }, [mesOffset]);

  const rango = useMemo(() => {
    if (periodo === "mes") return rangoMes;
    if (periodo === "anio") return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: hoy, label: `Año ${hoy.getFullYear()}` };
    return { desde: new Date(2015, 0, 1), hasta: hoy, label: "Histórico" };
  }, [periodo, rangoMes]);

  const desdeStr = rango.desde.toISOString().split("T")[0];
  const hastaStr = rango.hasta.toISOString().split("T")[0];
  // Para "mes actual" el tier/bono proyectado siempre miran el mes calendario
  // en curso — si el usuario navegó a otro mes o cambió a "año"/"histórico"
  // esos cálculos igual se muestran sobre el mes actual real (no tiene
  // sentido un "tier del año").
  const desdeMesActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const hastaMesActualStr = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split("T")[0];

  useEffect(() => {
    if (!vendedorId) return;
    let cancelado = false;
    const cargar = async () => {
      setCargando(true);
      const [
        { data: tierData },
        { data: bonoData },
        { data: premiosData },
        { data: rankingData },
        { data: funnelData },
        { data: tiempoData },
        { data: resenasData },
        { data: ventasData },
      ] = await Promise.all([
        supabase2.rpc("tier_para_vendedor", { p_vendedor_id: vendedorId, p_desde: desdeMesActualStr, p_hasta: hastaMesActualStr }),
        supabase2.rpc("bono_retroactivo_proyectado", { p_vendedor_id: vendedorId, p_desde: desdeMesActualStr, p_hasta: hastaMesActualStr }),
        supabase2.rpc("premios_consignaciones_vendedor", { p_vendedor_id: vendedorId, p_desde: desdeMesActualStr, p_hasta: hastaMesActualStr }),
        supabase2.rpc("ranking_ventas", { p_desde: desdeMesActualStr, p_hasta: hastaMesActualStr }),
        supabase2.rpc("funnel_vendedor", { p_vendedor_id: vendedorId, p_desde: rango.desde.toISOString(), p_hasta: rango.hasta.toISOString() }),
        supabase2.rpc("tiempo_respuesta_promedio_vendedor", { p_vendedor_id: vendedorId, p_desde: rango.desde.toISOString(), p_hasta: rango.hasta.toISOString() }),
        supabase2.rpc("pct_resenas_pedidas_vendedor", { p_vendedor_id: vendedorId, p_desde: desdeStr, p_hasta: hastaStr }),
        supabase2
          .from("ventas")
          .select("id, fecha_cierre, vehiculo_marca, vehiculo_modelo, vehiculo_anio, precio_venta, moneda_venta, vendedor_id, vendedor_compartido_id, responsable_consignacion_id, comisiones ( monto, moneda, estado, beneficiario_id )")
          .eq("estado", "cerrada")
          .gte("fecha_cierre", desdeStr)
          .lte("fecha_cierre", hastaStr)
          .or(`vendedor_id.eq.${vendedorId},vendedor_compartido_id.eq.${vendedorId},responsable_consignacion_id.eq.${vendedorId}`)
          .order("fecha_cierre", { ascending: false }),
      ]);
      if (cancelado) return;

      setTier((tierData || [])[0] || null);
      setBonoProyectado(Number(bonoData) || 0);
      setPremios(premiosData || []);
      setRanking(rankingData || []);
      setFunnel(funnelData?.[0] || { leads: 0, contactados: 0, vendidos: 0 });
      setTiempoRespuesta(tiempoData || null);
      setPctResenas(Number(resenasData) || 0);

      const ventasProcesadas = (ventasData || []).map((v: any) => {
        const misComisiones = (v.comisiones || []).filter((c: any) => c.beneficiario_id === vendedorId);
        const esVendedor = v.vendedor_id === vendedorId || v.vendedor_compartido_id === vendedorId;
        const esConsig = v.responsable_consignacion_id === vendedorId;
        const rol = esVendedor && esConsig ? "Vendedor+Consig" : esVendedor ? (v.vendedor_compartido_id === vendedorId ? "Vendedor (compartido)" : "Vendedor") : "Consignación";
        const comisionPorMoneda: Record<string, number> = {};
        misComisiones.forEach((c: any) => { comisionPorMoneda[c.moneda] = (comisionPorMoneda[c.moneda] || 0) + Number(c.monto); });
        const estadoComision = misComisiones.some((c: any) => c.estado === "pendiente") ? "Pendiente" : misComisiones.length ? "Cobrada" : "—";
        return { ...v, rol, comisionPorMoneda, estadoComision, esConsig };
      });
      setVentas(ventasProcesadas);

      const pendientes = ventasProcesadas.flatMap((v: any) => Object.entries(v.comisionPorMoneda).map(([moneda, monto]) => ({ moneda, monto: monto as number, pendiente: v.estadoComision === "Pendiente" })));
      const totalPorMoneda: Record<string, number> = {};
      let cantidadPendiente = 0;
      pendientes.forEach((p) => { if (p.pendiente) { totalPorMoneda[p.moneda] = (totalPorMoneda[p.moneda] || 0) + p.monto; cantidadPendiente++; } });
      setComisionesPendientes({ cantidad: cantidadPendiente, totalPorMoneda });

      setCargando(false);
    };
    cargar();
    return () => { cancelado = true; };
  }, [vendedorId, desdeStr, hastaStr, desdeMesActualStr, hastaMesActualStr]);

  const facturadoPorMoneda = useMemo(() => {
    const acc: Record<string, number> = {};
    ventas.forEach((v) => { if (!v.esConsig || v.vendedor_id === vendedorId || v.vendedor_compartido_id === vendedorId) acc[v.moneda_venta] = (acc[v.moneda_venta] || 0) + Number(v.precio_venta); });
    return acc;
  }, [ventas, vendedorId]);

  const comisionTotalPorMoneda = useMemo(() => {
    const acc: Record<string, number> = {};
    ventas.forEach((v) => Object.entries(v.comisionPorMoneda).forEach(([m, monto]) => { acc[m] = (acc[m] || 0) + (monto as number); }));
    return acc;
  }, [ventas]);

  const consignaciones = useMemo(() => ventas.filter((v) => v.esConsig), [ventas]);
  const vendedorActual = vendedores.find((v) => v.id === vendedorId);
  const nombreVendedorActual = vendedorId === miId ? miNombre : vendedorActual?.nombre || "";

  const descargarReporte = async () => {
    setGenerandoReporte(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margen = 18;
      let y = 20;
      const anchoTexto = 210 - margen * 2;

      const linea = (texto: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
        doc.setFontSize(opts.size || 10);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        const splitLines = doc.splitTextToSize(texto, anchoTexto);
        doc.text(splitLines, margen, y);
        y += splitLines.length * (opts.size ? opts.size * 0.42 : 4.6) + (opts.gap ?? 2);
      };

      linea(`Reporte de ${rango.label} — ${nombreVendedorActual}`, { size: 14, bold: true, gap: 6 });

      if (tier) linea(`Tier del mes: ${tier.tier_emoji} ${tier.tier_actual} (${tier.pct_actual}x) — ${tier.ventas_equivalentes} ventas equivalentes`, { gap: 3 });

      linea(`Ventas: ${ventas.length}`, { gap: 1 });
      linea(`Facturado: ${Object.entries(facturadoPorMoneda).map(([m, n]) => fmt(n, m)).join(" + ") || "—"}`, { gap: 1 });
      linea(`Comisión total: ${Object.entries(comisionTotalPorMoneda).map(([m, n]) => fmt(n, m)).join(" + ") || "—"}`, { gap: 1 });
      if (comisionesPendientes.cantidad > 0) {
        linea(`Comisiones pendientes de cobro: ${comisionesPendientes.cantidad} — ${Object.entries(comisionesPendientes.totalPorMoneda).map(([m, n]) => fmt(n, m)).join(" + ")}`, { gap: 1 });
      }
      linea(`Consignaciones traídas: ${consignaciones.length}`, { gap: 6 });

      const miRanking = ranking.find((r) => r.vendedor_id === vendedorId);
      if (miRanking) linea(`Ranking del mes: #${miRanking.posicion} de ${ranking.length}`, { gap: 1 });
      linea(`Funnel del mes: ${funnel.leads} leads · ${funnel.contactados} contactados · ${funnel.vendidos} vendidos`, { gap: 1 });
      linea(`Reseñas pedidas: ${pctResenas}%`, { gap: 6 });

      if (ventas.length > 0) {
        linea("Detalle de ventas", { bold: true, gap: 2 });
        ventas.forEach((v) => {
          linea(`${new Date(v.fecha_cierre + "T12:00:00Z").toLocaleDateString("es-AR", { timeZone: "UTC" })} — ${v.vehiculo_marca} ${v.vehiculo_modelo} — ${fmt(Number(v.precio_venta), v.moneda_venta)} — ${v.rol} — ${Object.entries(v.comisionPorMoneda).map(([m, n]) => fmt(n as number, m)).join(" + ") || "—"} (${v.estadoComision})`, { size: 9, gap: 1 });
        });
      }

      doc.save(`reporte-${nombreVendedorActual.replace(/\s+/g, "-").toLowerCase()}-${desdeStr}.pdf`);
    } catch (e) {
      alert("No se pudo generar el reporte.");
    } finally {
      setGenerandoReporte(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Performance del equipo</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setModalRecibo(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors">
            <DollarSign className="w-4 h-4" /> Nuevo Recibo
          </button>
          <button onClick={() => setModalBoleto(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors">
            <FileText className="w-4 h-4" /> Nuevo Boleto
          </button>
          {esAdmin && vendedores.length > 1 && (
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-slate-400 font-semibold">Viendo:</span>
              {vendedores.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVendedorId(v.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${vendedorId === v.id ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}
                >
                  {v.id === miId ? miNombre : v.nombre}
                </button>
              ))}
            </div>
          )}
          <button onClick={descargarReporte} disabled={generandoReporte} className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">
            {generandoReporte ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Reporte del mes
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#141414] p-6 space-y-6">
        {tier && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Objetivo mensual — {hoy.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
              {tier.siguiente_tier && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{tier.ventas_para_siguiente} ventas para "{tier.siguiente_tier}"</p>}
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
              {tier.tier_emoji} {tier.tier_actual} — {tier.ventas_equivalentes} {tier.ventas_equivalentes === 1 ? "venta" : "ventas"}
            </p>
            <div className="w-full h-2 bg-emerald-100 dark:bg-white/10 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${tier.siguiente_tier ? Math.min(100, (tier.ventas_equivalentes / (tier.ventas_equivalentes + tier.ventas_para_siguiente)) * 100) : 100}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              <span>{tier.ventas_equivalentes} ventas</span>
              {tier.siguiente_tier && <span>{tier.ventas_equivalentes + tier.ventas_para_siguiente} ventas</span>}
            </div>

            {esUltimoDiaDelMes && (
              <div className="bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Liquidación de fin de mes</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">Último día del mes</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Comisión efectiva: {tier.pct_actual}x — {tier.ventas_equivalentes} ventas en {tier.tier_actual}</p>
                {bonoProyectado > 0 && tier.siguiente_tier && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5">✨ Si llegás a {tier.siguiente_tier}, tu bono retroactivo proyectado sería <strong>USD {Math.round(bonoProyectado).toLocaleString("es-AR")}</strong> sobre las ventas que ya tenés en el mes.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[{ nombre: "Arrancando", emoji: "🌱" }, { nombre: "En ritmo", emoji: "🚀" }, { nombre: "Top Seller", emoji: "🏆" }].map((t) => (
                <div key={t.nombre} className={`rounded-xl p-3 text-center ${tier.tier_actual === t.nombre ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-white/50 dark:bg-white/5"}`}>
                  <p className="text-lg">{t.emoji}</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.nombre}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`bg-white dark:bg-white/[0.02] border-2 rounded-2xl p-4 ${periodo === "mes" ? "border-rose-500" : "border-slate-200 dark:border-white/5"}`}>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => { setPeriodo("mes"); setMesOffset((o) => o - 1); }} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPeriodo("mes")} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest"><Calendar className="w-3.5 h-3.5" /> {rangoMes.label}</button>
              <button onClick={() => { setPeriodo("mes"); setMesOffset((o) => o + 1); }} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{ventas.length} {ventas.length === 1 ? "venta" : "ventas"}</p>
            {periodo === "mes" && <p className="text-[11px] text-rose-500 font-bold mt-1">↑ filtro activo</p>}
          </div>
          <button onClick={() => setPeriodo("anio")} className={`bg-white dark:bg-white/[0.02] border-2 rounded-2xl p-4 text-left ${periodo === "anio" ? "border-rose-500" : "border-slate-200 dark:border-white/5"}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2"><Calendar className="w-3.5 h-3.5" /> Este año</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{periodo === "anio" ? ventas.length : "—"} ventas</p>
          </button>
          <button onClick={() => setPeriodo("historico")} className={`bg-white dark:bg-white/[0.02] border-2 rounded-2xl p-4 text-left ${periodo === "historico" ? "border-rose-500" : "border-slate-200 dark:border-white/5"}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2"><Trophy className="w-3.5 h-3.5" /> Histórico</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{periodo === "historico" ? ventas.length : "—"} ventas</p>
          </button>
        </div>

        {comisionesPendientes.cantidad > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
            <Hourglass className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{comisionesPendientes.cantidad} comisión{comisionesPendientes.cantidad !== 1 ? "es" : ""} pendiente{comisionesPendientes.cantidad !== 1 ? "s" : ""} de cobro</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70">Total a cobrar: {Object.entries(comisionesPendientes.totalPorMoneda).map(([m, monto]) => fmt(monto, m)).join(" + ") || "—"}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Car className="w-3.5 h-3.5" /> Ventas</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{ventas.length}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5" /> Facturado</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{Object.entries(facturadoPorMoneda).map(([m, n]) => fmt(n, m)).join(" + ") || "—"}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Wallet className="w-3.5 h-3.5" /> Comisión total</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{Object.entries(comisionTotalPorMoneda).map(([m, n]) => fmt(n, m)).join(" + ") || "—"}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Star className="w-3.5 h-3.5" /> Comisión extra</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{bonoProyectado > 0 ? fmt(bonoProyectado, "USD") : "—"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4"><Calendar className="w-4 h-4" /> Resumen de {rango.label}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> Ranking del mes</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                #{ranking.find((r) => r.vendedor_id === vendedorId)?.posicion ?? "—"} <span className="text-sm text-slate-400 font-bold">/ {ranking.length}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{ranking.find((r) => r.vendedor_id === vendedorId)?.ventas_equivalentes ?? 0} ventas · {ranking.find((r) => r.vendedor_id === vendedorId)?.consignaciones ?? 0} consig</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><Star className="w-3 h-3" /> Calificaciones</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{pctResenas}%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">pedidas</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 flex items-center gap-1"><Hourglass className="w-3 h-3" /> Tiempo de respuesta</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{tiempoRespuesta ? tiempoRespuesta : "Sin leads"}</p>
            </div>
            <div className="bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-500/20 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-400 flex items-center gap-1"><Target className="w-3 h-3" /> Funnel del mes</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{funnel.leads} <span className="text-xs font-bold text-slate-400">leads</span></p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{funnel.contactados} contactados · {funnel.vendidos} vendidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
          <button onClick={() => setVentasAbierto((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Target className="w-4 h-4" /> Ventas ({ventas.length})</p>
            {ventasAbierto ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {ventasAbierto && (
            ventas.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center">
                <span className="text-3xl mb-2">📊</span>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No hay ventas en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Vehículo</th>
                      <th className="px-5 py-3">Precio</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Comisión</th>
                      <th className="px-5 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {ventas.map((v) => (
                      <tr key={v.id}>
                        <td className="px-5 py-3 text-[13px] text-slate-600 dark:text-slate-300">{new Date(v.fecha_cierre + "T12:00:00Z").toLocaleDateString("es-AR", { timeZone: "UTC" })}</td>
                        <td className="px-5 py-3 text-[13px] font-bold text-slate-900 dark:text-white">{v.vehiculo_marca} {v.vehiculo_modelo} {v.vehiculo_anio ? `(${v.vehiculo_anio})` : ""}</td>
                        <td className="px-5 py-3 text-[13px] text-slate-600 dark:text-slate-300">{fmt(Number(v.precio_venta), v.moneda_venta)}</td>
                        <td className="px-5 py-3"><span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">{v.rol}</span></td>
                        <td className="px-5 py-3 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{Object.entries(v.comisionPorMoneda).map(([m, n]) => fmt(n as number, m)).join(" + ") || "—"}</td>
                        <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${v.estadoComision === "Pendiente" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" : v.estadoComision === "Cobrada" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>{v.estadoComision}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
          <button onClick={() => setConsigAbierto((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">🚗 Consignaciones traídas ({consignaciones.length}/{consignaciones.length}) <span className="text-[11px] font-medium text-slate-400">· este {periodo === "mes" ? "mes" : periodo === "anio" ? "año" : "período"}</span></p>
            {consigAbierto ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {consigAbierto && (
            consignaciones.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center">
                <span className="text-3xl mb-2">🚗</span>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin consignaciones traídas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {consignaciones.map((v) => (
                  <div key={v.id} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{v.vehiculo_marca} {v.vehiculo_modelo}</p>
                    <p className="text-[12px] text-slate-400">{new Date(v.fecha_cierre + "T12:00:00Z").toLocaleDateString("es-AR", { timeZone: "UTC" })}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-amber-500" /> Premios por consignaciones — {hoy.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
          <div className="space-y-2.5">
            {premios.map((p) => (
              <div key={p.nombre} className={`bg-white dark:bg-white/[0.02] border rounded-2xl p-4 ${p.alcanzado ? "border-emerald-300 dark:border-emerald-500/40" : "border-slate-200 dark:border-white/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.emoji} {p.nombre} → USD {p.premio_usd}</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {p.consignaciones_min ? `${Math.max(0, p.consignaciones_min - p.faltan)}/${p.consignaciones_min}` : p.alcanzado ? "¡Líder!" : "—"}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mb-2">{p.alcanzado ? "¡Premio alcanzado!" : p.consignaciones_min ? `${p.faltan} consig. más para cobrar este premio` : "Empezá a traer consignaciones"}</p>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.alcanzado ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: p.consignaciones_min ? `${Math.min(100, (Math.max(0, p.consignaciones_min - p.faltan) / p.consignaciones_min) * 100)}%` : p.alcanzado ? "100%" : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalRecibo && <ReciboModal miNombre={nombreVendedorActual} onClose={() => setModalRecibo(false)} />}
      {modalBoleto && <BoletoModal tipo="venta" expediente={null} venta={null} checklist={[]} miNombre={nombreVendedorActual} onClose={() => setModalBoleto(false)} />}
    </div>
  );
}

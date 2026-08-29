"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { DollarSign, Plus, Filter, MessageSquare, Star, CheckCircle2, Clock, Wallet, Lock, Search, ShieldAlert, History } from "lucide-react";
import BonoModal from "./BonoModal";
import PagoParcialModal from "./PagoParcialModal";

export default function ComisionesClient({
  usuarioActualId,
  esAdminOFinanzas,
  configuracion,
  vendedores,
}: {
  usuarioActualId: string;
  esAdminOFinanzas: boolean;
  configuracion: any;
  vendedores: any[];
}) {
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [mesFiltro, setMesFiltro] = useState<string>("este_mes");
  const [vendedorFiltro, setVendedorFiltro] = useState<string>(esAdminOFinanzas ? "todos" : usuarioActualId);

  const [modalBono, setModalBono] = useState(false);
  const [comisionAPagar, setComisionAPagar] = useState<any>(null);

  const cargarComisiones = async () => {
    setCargando(true);
    let query = supabase2
      .from("comisiones")
      .select(`
        *,
        beneficiario:perfiles!comisiones_beneficiario_id_fkey(nombre),
        ventas (
          id, vehiculo_marca, vehiculo_modelo, vehiculo_patente, precio_venta, moneda_venta, comprador_telefono, propietario_telefono,
          venta_resenas_solicitudes (id, tipo, created_at, solicitado_por)
        )
      `)
      .order("created_at", { ascending: false });

    if (vendedorFiltro !== "todos") {
      query = query.eq("beneficiario_id", vendedorFiltro);
    }

    if (mesFiltro === "este_mes") {
      const hoy = new Date();
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      query = query.gte("created_at", primerDia);
    }

    const { data, error } = await query;
    if (!error && data) setComisiones(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarComisiones();
  }, [mesFiltro, vendedorFiltro]);

  // KPIs
  const totalACobrar = comisiones.reduce((acc, c) => acc + Number(c.monto), 0);
  const totalCobrado = comisiones.reduce((acc, c) => acc + Number(c.monto_pagado), 0);
  const totalPendiente = totalACobrar - totalCobrado;

  // Acciones
  const alternarEstado = async (c: any) => {
    try {
      if (c.estado === "pendiente") {
        const faltaResena = configuracion.exigir_resena_comision && c.ventas && c.tipo !== "bono" && 
          !c.ventas.venta_resenas_solicitudes?.some((r: any) => r.tipo === (c.tipo === "consignacion" ? "ex_dueno" : "comprador"));
        
        if (faltaResena) {
          if (!esAdminOFinanzas) {
            alert("Tenés que pedir la reseña primero para poder cobrar esta comisión.");
            return;
          }
          if (!confirm("Falta la reseña del cliente. ¿Forzar el pago como administrador?")) return;
        }

        const { error } = await supabase2.rpc("marcar_comision_cobrada", { p_comision_id: c.id, p_forzar_sin_resena: faltaResena && esAdminOFinanzas });
        if (error) throw error;
      } else {
        if (!esAdminOFinanzas) {
          alert("Una vez cobrada, solo Administración puede volverla a pendiente.");
          return;
        }
        const { error } = await supabase2.rpc("cambiar_estado_comision", { p_comision_id: c.id, p_nuevo_estado: "pendiente" });
        if (error) throw error;
      }
      cargarComisiones();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado.");
    }
  };

  const pedirResena = async (venta_id: string, tipo: string, telefono: string) => {
    try {
      await supabase2.from("venta_resenas_solicitudes").insert({
        venta_id,
        tipo,
        solicitado_por: usuarioActualId
      });
      // Abrimos WhatsApp con texto prearmado
      const texto = encodeURIComponent("¡Hola! Quería pedirte un favor enorme. ¿Nos dejarías una reseña en Google contando cómo te fue? Nos ayuda un montón. ¡Gracias!");
      window.open(`https://wa.me/${telefono}?text=${texto}`, "_blank");
      cargarComisiones();
    } catch (error) {
      console.error(error);
    }
  };

  if (!configuracion.paga_comisiones) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50 dark:bg-[#0A0A0A]">
        <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Comisiones deshabilitadas</h2>
        <p className="text-sm text-slate-500 max-w-md">La empresa no tiene habilitado el módulo de pago de comisiones por venta en este momento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fadeIn">
      {/* HEADER Y KPIS */}
      <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0 pt-6 px-6 pb-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Mis Comisiones</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control de pagos, bonos y reseñas</p>
            </div>
          </div>
          <button onClick={() => setModalBono(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> {esAdminOFinanzas ? "Cargar Comisión Manual" : "Pedir Comisión Manual"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total a cobrar</span>
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">US$ {totalACobrar.toLocaleString()}</span>
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Pendiente</span>
            <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 mt-1">US$ {totalPendiente.toLocaleString()}</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Ya cobrado</span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">US$ {totalCobrado.toLocaleString()}</span>
          </div>

          {/* FILTROS */}
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none">
              <option value="este_mes">Este mes</option>
              <option value="historico">Histórico completo</option>
            </select>
            {esAdminOFinanzas && (
              <select value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none">
                <option value="todos">Todos los vendedores</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* TABLA */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-4 pl-6 whitespace-nowrap">Fecha</th>
                  <th className="p-4 whitespace-nowrap">Beneficiario</th>
                  <th className="p-4 whitespace-nowrap">Concepto / Venta</th>
                  <th className="p-4 text-right whitespace-nowrap">Monto Total</th>
                  <th className="p-4 text-right whitespace-nowrap">Pagado / Restante</th>
                  <th className="p-4 text-center whitespace-nowrap">Reseñas</th>
                  <th className="p-4 text-center whitespace-nowrap">Estado</th>
                  <th className="p-4 pr-6 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {comisiones.map((c) => {
                  const restante = Number(c.monto) - Number(c.monto_pagado);
                  const reqResena = configuracion.exigir_resena_comision && c.tipo !== "bono";
                  const tipoReq = c.tipo === "consignacion" ? "ex_dueno" : "comprador";
                  const resenasHechas = c.ventas?.venta_resenas_solicitudes?.filter((r: any) => r.tipo === tipoReq) || [];
                  const tieneResena = resenasHechas.length > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="p-4 pl-6 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4 text-[13px] font-bold text-slate-800 dark:text-white">
                        {c.beneficiario?.nombre}
                        <span className="block text-[10px] text-slate-400 font-normal uppercase tracking-widest mt-0.5">{c.tipo.replace("_", " ")}</span>
                      </td>
                      <td className="p-4">
                        {c.tipo === "bono" ? (
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{c.concepto || "Bono Manual"}</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 dark:text-white">{c.ventas?.vehiculo_marca} {c.ventas?.vehiculo_modelo}</span>
                            <span className="text-[11px] text-slate-500">Base: {c.moneda} {c.ventas?.precio_venta?.toLocaleString()}</span>
                          </div>
                        )}
                        {c.aprobacion_pendiente && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Pendiente Aprobación</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                          {c.moneda} {Number(c.monto).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[12px] font-bold text-slate-700 dark:text-slate-300">Pagado: {Number(c.monto_pagado).toLocaleString()}</span>
                          {restante > 0 && <span className="font-mono text-[11px] text-rose-500 font-bold">Falta: {restante.toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {c.tipo !== "bono" ? (
                          <button
                            onClick={() => pedirResena(c.venta_id, tipoReq, c.tipo === "consignacion" ? c.ventas?.propietario_telefono : c.ventas?.comprador_telefono)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors group relative ${
                              tieneResena ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-white dark:hover:bg-white/10"
                            }`}
                            title={`Pedir reseña al ${c.tipo === "consignacion" ? "Consignante (ex-dueño)" : "Comprador"}`}
                          >
                            <Star className="w-3.5 h-3.5" />
                            {c.tipo === "consignacion" ? "E" : "C"} {tieneResena && `(x${resenasHechas.length})`}
                          </button>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alternarEstado(c)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                            c.estado === "cobrada" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {c.estado === "cobrada" ? <CheckCircle2 className="w-3.5 h-3.5" /> : reqResena && !tieneResena ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {c.estado}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {esAdminOFinanzas && c.estado === "pendiente" && (
                          <button
                            onClick={() => setComisionAPagar(c)}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors"
                            title="Pago parcial o externo"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {comisiones.length === 0 && !cargando && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 italic">No hay comisiones en este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalBono && <BonoModal vendedores={vendedores} usuarioActualId={usuarioActualId} esAdmin={esAdminOFinanzas} onClose={() => { setModalBono(false); cargarComisiones(); }} />}
      {comisionAPagar && <PagoParcialModal comision={comisionAPagar} onClose={() => { setComisionAPagar(null); cargarComisiones(); }} />}
    </div>
  );
}
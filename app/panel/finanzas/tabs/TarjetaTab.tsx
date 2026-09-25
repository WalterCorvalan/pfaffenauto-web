"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, X, Save, Pencil } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { hoyLocalISO } from "@/lib/panel/fechas";

export default function TarjetaTab({
  consumos, setConsumos, cuentas, setCuentas, setMovimientos, soyAdminOFinanzas,
}: { consumos: any[]; setConsumos: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void; soyAdminOFinanzas: boolean }) {
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [cuotasTotales, setCuotasTotales] = useState("1");
  const [cuotaActual, setCuotaActual] = useState("1");
  const [estado, setEstado] = useState("pendiente");
  const [cuentaId, setCuentaId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [pagando, setPagando] = useState<any | null>(null);
  const [pgCuentaId, setPgCuentaId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const pendientesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    consumos.filter((c) => c.estado === "pendiente").forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + Number(c.monto); });
    return map;
  }, [consumos]);

  const abrir = () => { setEditando(null); setConcepto(""); setMonto(""); setMoneda("ARS"); setFecha(hoyLocalISO()); setCuotasTotales("1"); setCuotaActual("1"); setEstado("pendiente"); setCuentaId(""); setShowNuevo(true); };

  // Solo se puede editar mientras el consumo sigue "pendiente" -- una vez
  // pagado ya generó el egreso real (movimiento_id) y no hay RPC de edición
  // que lo mantenga sincronizado, mismo criterio que ChequesTab.tsx.
  const abrirEditar = (c: any) => {
    setEditando(c);
    setConcepto(c.concepto); setMonto(String(c.monto)); setMoneda(c.moneda); setFecha(c.fecha);
    setCuotasTotales(String(c.cuotas_totales)); setCuotaActual(String(c.cuota_actual)); setEstado(c.estado); setCuentaId(c.cuenta_id || "");
    setShowNuevo(true);
  };

  const registrar = async () => {
    if (!soyAdminOFinanzas) return alert("No tenés permiso para esto.");
    if (!concepto.trim() || !monto) return alert("Completá concepto y monto.");
    if (estado === "pagado" && !cuentaId) return alert("Elegí la caja de origen para un consumo pagado.");
    setGuardando(true);
    try {
      if (editando) {
        const { data, error } = await supabase2.from("consumos_tarjeta").update({
          concepto: concepto.trim(), monto: Number(monto), moneda, fecha,
          cuotas_totales: Number(cuotasTotales) || 1, cuota_actual: Number(cuotaActual) || 1,
        }).eq("id", editando.id).select().single();
        if (error) throw error;
        setConsumos((prev: any[]) => prev.map((c) => (c.id === editando.id ? data : c)));
        setShowNuevo(false);
        return;
      }

      const { data: id, error } = await supabase2.rpc("crear_consumo_tarjeta", {
        p_concepto: concepto.trim(), p_monto: Number(monto), p_moneda: moneda, p_fecha: fecha,
        p_cuotas_totales: Number(cuotasTotales) || 1, p_cuota_actual: Number(cuotaActual) || 1, p_estado: estado, p_cuenta_id: cuentaId || null,
      });
      if (error) throw error;
      // El RPC no tiró error -- el consumo ya quedó registrado. Sin chequear
      // esto, "fresh" undefined entraba directo al array (crash de render)
      // y encima "fresh.movimiento_id" de abajo tiraba, cayendo al catch con
      // "no se pudo registrar" aunque sí se había registrado.
      const { data: fresh, error: errorFresh } = await supabase2.from("consumos_tarjeta").select("*").eq("id", id).maybeSingle();
      if (errorFresh || !fresh) { alert("El consumo se registró, pero no se pudo refrescar la lista -- recargá la página."); setShowNuevo(false); return; }
      setConsumos((prev: any[]) => [fresh, ...prev]);

      if (fresh.movimiento_id) {
        const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
          supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
          supabase2.rpc("saldo_cuenta", { p_cuenta_id: cuentaId }),
        ]);
        if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
        setCuentas((prev: any[]) => prev.map((c) => (c.id === cuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      }
      setShowNuevo(false);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el gasto.");
    } finally { setGuardando(false); }
  };

  const abrirPago = (c: any) => { setPagando(c); setPgCuentaId(cuentas.find((x) => x.moneda === c.moneda)?.id || ""); };

  const confirmarPago = async () => {
    if (!soyAdminOFinanzas) return alert("No tenés permiso para esto.");
    if (!pagando || !pgCuentaId) return alert("Elegí la caja.");
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("marcar_consumo_tarjeta_pagado", { p_id: pagando.id, p_cuenta_id: pgCuentaId });
      if (error) throw error;
      const { data: fresh, error: errorFresh } = await supabase2.from("consumos_tarjeta").select("*").eq("id", pagando.id).maybeSingle();
      if (errorFresh || !fresh) { alert("El pago se registró, pero no se pudo refrescar la lista -- recargá la página."); setPagando(null); return; }
      setConsumos((prev: any[]) => prev.map((c) => (c.id === pagando.id ? fresh : c)));
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: pgCuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === pgCuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setPagando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo marcar como pagado.");
    } finally { setGuardando(false); }
  };

  const eliminar = (c: any) => {
    if (!soyAdminOFinanzas) return alert("No tenés permiso para esto.");
    setConfirmDialog({
      mensaje: `¿Eliminar "${c.concepto}"? ${c.estado === "pagado" ? "Se revierte el egreso en la caja." : ""}`,
      accion: async () => {
        try {
          // supabase-js no tira excepción por un error de RPC -- sin
          // chequear "error" acá, si el RPC fallaba el consumo desaparecía
          // igual de la UI mientras seguía existiendo en la base con su
          // movimiento intacto.
          const { error } = await supabase2.rpc("eliminar_consumo_tarjeta", { p_id: c.id });
          if (error) { alert(error.message || "No se pudo eliminar."); return; }
          setConsumos((prev: any[]) => prev.filter((x) => x.id !== c.id));
          if (c.movimiento_id && c.cuenta_id) {
            const { data: nuevoSaldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: c.cuenta_id });
            setCuentas((prev: any[]) => prev.map((x) => (x.id === c.cuenta_id ? { ...x, saldo: Number(nuevoSaldo) || 0 } : x)));
          }
        } catch (err: any) { alert(err.message || "No se pudo eliminar."); }
      },
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-rose-500">Total pendiente</p>
          {Object.keys(pendientesPorMoneda).length === 0 ? <p className="text-sm">—</p> : Object.entries(pendientesPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total registros</p><p className="text-lg font-black">{consumos.length}</p></div>
      </div>

      <button onClick={abrir} className="flex items-center gap-1.5 px-4 py-2 mb-4 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo Gasto</button>

      {consumos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin consumos registrados</p></div>
      ) : (
        <TablaResponsiva<any>
          filas={consumos}
          keyExtractor={(c) => c.id}
          encabezadoMobile={(c) => <p className="font-bold">{c.concepto}</p>}
          columnas={
            [
              { key: "fecha", header: "Fecha", cell: (c) => c.fecha },
              { key: "concepto", header: "Concepto", cell: (c) => c.concepto, claseTd: "font-bold", ocultarEnMobile: true },
              { key: "monto", header: "Monto", cell: (c) => fmt(c.monto, c.moneda), claseTd: "font-mono font-bold" },
              { key: "cuota", header: "Cuota", cell: (c) => (c.cuotas_totales > 1 ? `${c.cuota_actual}/${c.cuotas_totales}` : "Contado"), claseTd: "text-slate-400" },
              { key: "estado", header: "Estado", cell: (c) => <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.estado === "pagado" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700"}`}>{c.estado}</span> },
            ] as ColumnaTabla<any>[]
          }
          acciones={(c) => (
            <>
              {c.estado === "pendiente" && <button onClick={() => abrirPago(c)} className="text-emerald-600 font-bold">Pagar</button>}
              {c.estado === "pendiente" && <button onClick={() => abrirEditar(c)} className="text-slate-400 hover:text-[#0145F2]"><Pencil className="w-3.5 h-3.5 inline" /></button>}
              <button onClick={() => eliminar(c)} className="text-rose-500 font-bold">Eliminar</button>
            </>
          )}
        />
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar gasto" : "Nuevo gasto"}</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">{editando ? "Solo se puede editar mientras sigue Pendiente -- para marcarlo pagado usá el botón \"Pagar\"." : "Registrá un consumo de tarjeta. Si lo cargás como Pagado, se debita la caja y se crea un movimiento auto-generado."}</p>
            <label className={labelClass}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="text" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} placeholder="147000" className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Cuotas totales</label><input type="number" value={cuotasTotales} onChange={(e) => setCuotasTotales(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cuota actual</label><input type="number" value={cuotaActual} onChange={(e) => setCuotaActual(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Estado *</label><select value={estado} disabled={!!editando} onChange={(e) => setEstado(e.target.value)} className={inputClass + (editando ? " opacity-50 cursor-not-allowed" : "")}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></div>
            </div>
            {estado === "pagado" && !editando && (
              <><label className={labelClass + " mt-3"}>Caja origen *</label><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></>
            )}
            {!editando && <p className="text-[10px] text-slate-400 mt-2">{estado === "pendiente" ? "Pendiente solo registra el consumo; no toca caja ni Finanzas hasta que pase a Pagado." : "Se debita la caja elegida al instante."}</p>}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={registrar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Registrar gasto"}</button></div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Marcar pagado</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-2">{pagando.concepto} — {fmt(pagando.monto, pagando.moneda)}</p>
            <label className={labelClass}>Caja *</label>
            <select value={pgCuentaId} onChange={(e) => setPgCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === pagando.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarPago} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!confirmDialog}
        mensaje={confirmDialog?.mensaje || ""}
        onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }}
        onCancelar={() => setConfirmDialog(null)}
      />
    </div>
  );
}

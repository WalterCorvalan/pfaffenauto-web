"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { List, Receipt as ReceiptIcon, Building2, RefreshCw, Trash2, Plus } from "lucide-react";
import TransferenciasTab from "./TransferenciasTab";
import LiquidacionMensualTab from "./LiquidacionMensualTab";
import ResumenAgenciaTab from "./ResumenAgenciaTab";
import TransferenciaModal from "./TransferenciaModal";
import { fmt } from "./shared";

export default function LiquidacionesClient({
  miId, miNombre, puedeVerLiquidacion, soyAdmin, soyAdminOFinanzas, gananciasOcultas, liquidacionesIniciales, vendedores, config,
}: {
  miId: string; miNombre: string; puedeVerLiquidacion: boolean; soyAdmin: boolean; soyAdminOFinanzas: boolean; gananciasOcultas: boolean;
  liquidacionesIniciales: any[]; vendedores: any[]; config: { comisionFija: number; pctGestora: number; pctAgencia: number };
}) {
  const [tab, setTab] = useState<"transferencias" | "mensual" | "resumen">("transferencias");
  const [liquidaciones, setLiquidaciones] = useState(liquidacionesIniciales);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);

  const ingresoAgenciaTotal = useMemo(() => liquidaciones.filter((l) => l.estado === "terminado").reduce((a, l) => a + Number(l.ingreso_agencia), 0), [liquidaciones]);

  if (!puedeVerLiquidacion) {
    return <div className="p-6 max-w-2xl mx-auto text-center py-24"><p className="text-sm font-bold">No tenés acceso a Liquidaciones.</p><p className="text-xs text-slate-400 mt-1">Es para Finanzas, Gestoría y Admin.</p></div>;
  }

  const guardarFila = (row: any) => {
    setLiquidaciones((prev: any[]) => {
      const existe = prev.some((x) => x.id === row.id);
      return existe ? prev.map((x) => (x.id === row.id ? row : x)) : [row, ...prev];
    });
  };

  const abrirNueva = () => { setEditando(null); setShowModal(true); };
  const abrirEditar = (row: any) => { setEditando(row); setShowModal(true); };

  const sync = async () => {
    setSincronizando(true);
    try {
      const sinExpediente = liquidaciones.filter((l) => !l.expediente_id);
      let actualizadas = 0;
      for (const l of sinExpediente) {
        const { data } = await supabase2
          .from("expedientes")
          .select("id, venta:ventas(propietario_nombre, comprador_nombre, vehiculo_marca, vehiculo_modelo, vehiculo_anio, vendedor_id, vehiculo_patente)")
          .eq("archivado", false).order("fecha_apertura", { ascending: false }).limit(80);
        const match = (data || []).find((e: any) => (e.venta?.vehiculo_patente || "").toLowerCase() === (l.dominio || "").toLowerCase());
        if (match) {
          const v: any = match.venta;
          const patch: any = { expediente_id: match.id };
          if (!l.cliente_vendedor) patch.cliente_vendedor = v?.propietario_nombre || null;
          if (!l.cliente_comprador) patch.cliente_comprador = v?.comprador_nombre || null;
          if (!l.marca) patch.marca = v?.vehiculo_marca || null;
          if (!l.modelo) patch.modelo = v?.vehiculo_modelo || null;
          if (!l.vendedor_interno_id) patch.vendedor_interno_id = v?.vendedor_id || null;
          await supabase2.from("liquidaciones_gestoria").update(patch).eq("id", l.id);
          actualizadas++;
        }
      }
      if (actualizadas > 0) {
        const { data: fresh } = await supabase2.from("liquidaciones_gestoria").select("*, expediente:expedientes(titulo_transferido_url), vendedor:perfiles!liquidaciones_gestoria_vendedor_interno_id_fkey(nombre)").order("created_at", { ascending: false }).limit(500);
        setLiquidaciones(fresh || []);
      }
      alert(`Auto-sync con expedientes: ${actualizadas} actualizadas.`);
    } finally { setSincronizando(false); }
  };

  const limpiarDuplicadas = async () => {
    if (!confirm("¿Eliminar transferencias duplicadas (mismo dominio y mes), dejando solo la más reciente?")) return;
    setLimpiando(true);
    try {
      const { data: n, error } = await supabase2.rpc("limpiar_duplicadas_liquidaciones");
      if (error) throw error;
      const { data: fresh } = await supabase2.from("liquidaciones_gestoria").select("*, expediente:expedientes(titulo_transferido_url), vendedor:perfiles!liquidaciones_gestoria_vendedor_interno_id_fkey(nombre)").order("created_at", { ascending: false }).limit(500);
      setLiquidaciones(fresh || []);
      alert(`${n} duplicadas eliminadas.`);
    } catch (err: any) {
      alert(err.message || "No se pudo limpiar duplicadas.");
    } finally { setLimpiando(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div><h1 className="text-xl font-bold">Liquidaciones de gestoría</h1><p className="text-sm text-slate-400">{liquidaciones.length} operación{liquidaciones.length === 1 ? "" : "es"} cargada{liquidaciones.length === 1 ? "" : "s"}</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Ingreso agencia (filtro): <b className="text-slate-700 dark:text-white">{gananciasOcultas ? "—" : fmt(ingresoAgenciaTotal)}</b></span>
          <button onClick={sync} disabled={sincronizando} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? "animate-spin" : ""}`} /> Sync con expedientes</button>
          {soyAdminOFinanzas && <button onClick={limpiarDuplicadas} disabled={limpiando} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> Limpiar duplicadas</button>}
          <button onClick={abrirNueva} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva transferencia</button>
        </div>
      </div>

      <div className="flex items-center gap-1 my-4 border-b border-slate-200 dark:border-white/10">
        <button onClick={() => setTab("transferencias")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === "transferencias" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500"}`}><List className="w-4 h-4" /> Transferencias</button>
        <button onClick={() => setTab("mensual")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === "mensual" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500"}`}><ReceiptIcon className="w-4 h-4" /> Liquidación mensual</button>
        <button onClick={() => setTab("resumen")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === "resumen" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500"}`}><Building2 className="w-4 h-4" /> Resumen agencia</button>
      </div>

      {tab === "transferencias" && <TransferenciasTab liquidaciones={liquidaciones} setLiquidaciones={setLiquidaciones} gananciasOcultas={gananciasOcultas} onEditar={abrirEditar} />}
      {tab === "mensual" && <LiquidacionMensualTab liquidaciones={liquidaciones} setLiquidaciones={setLiquidaciones} gananciasOcultas={gananciasOcultas} soyAdminOFinanzas={soyAdminOFinanzas} />}
      {tab === "resumen" && <ResumenAgenciaTab liquidaciones={liquidaciones} gananciasOcultas={gananciasOcultas} />}

      {showModal && (
        <TransferenciaModal
          editando={editando} vendedores={vendedores} config={config} soyAdmin={soyAdmin} soyAdminOFinanzas={soyAdminOFinanzas} miId={miId}
          onClose={() => setShowModal(false)} onSaved={guardarFila}
        />
      )}
    </div>
  );
}

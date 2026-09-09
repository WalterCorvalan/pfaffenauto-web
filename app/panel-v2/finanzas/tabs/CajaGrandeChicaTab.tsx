"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, ArrowLeftRight, Landmark, Wallet, Paperclip, Search } from "lucide-react";
import { inputClass, labelClass, fmt, CATEGORIAS_CAJA_CHICA } from "./shared";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

// Caja Grande / Caja Chica -- no son tablas nuevas: cada una es una fila más
// de `cuentas` (tipo="Efectivo", con sucursal_id + rol_caja), y la reposición
// Grande→Chica (o la devolución Chica→Grande) es una `crear_transferencia`
// como cualquier otra -- crea 2 movimientos linkeados, descuenta de una y
// acredita en la otra automáticamente. Arqueos/Cierre de caja/Libros
// contables ya funcionan solos apenas estas cuentas existen.

const MEDIOS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta", "Otro"];

function inicioSemana(d: Date) { const x = new Date(d); const dia = x.getDay(); x.setDate(x.getDate() - (dia === 0 ? 6 : dia - 1)); x.setHours(0, 0, 0, 0); return x; }

interface Props {
  miId: string; soyAdmin: boolean;
  cuentas: any[]; setCuentas: (fn: any) => void;
  movimientos: any[]; setMovimientos: (fn: any) => void;
  sucursales: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
}

export default function CajaGrandeChicaTab({ miId, soyAdmin, cuentas, setCuentas, movimientos, setMovimientos, sucursales, vendedores }: Props) {
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id || "");
  const [rol, setRol] = useState<"grande" | "chica">("grande");
  const [creandoCaja, setCreandoCaja] = useState(false);

  const [rango, setRango] = useState<"hoy" | "semana" | "mes" | "todo">("hoy");
  const [busqueda, setBusqueda] = useState("");
  const [responsableFiltro, setResponsableFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [showRegistrar, setShowRegistrar] = useState(false);
  const [rTipoMov, setRTipoMov] = useState("manual");
  const [rTipo, setRTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [rConcepto, setRConcepto] = useState("");
  const [rCategoria, setRCategoria] = useState(CATEGORIAS_CAJA_CHICA[0]);
  const [rMonto, setRMonto] = useState("");
  const [rFecha, setRFecha] = useState(new Date().toISOString().slice(0, 10));
  const [rMedioPago, setRMedioPago] = useState("Efectivo");
  const [rSucursalDestino, setRSucursalDestino] = useState("");
  const [rCuentaBanco, setRCuentaBanco] = useState("");
  const [rObs, setRObs] = useState("");
  const [rArchivo, setRArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  const sucursalActual = sucursales.find((s) => s.id === sucursalId);
  const cuenta = cuentas.find((c) => c.sucursal_id === sucursalId && c.rol_caja === rol);
  const cajaGrandeDeEstaSucursal = cuentas.find((c) => c.sucursal_id === sucursalId && c.rol_caja === "grande");
  const cuentasBanco = cuentas.filter((c) => c.tipo === "Banco");
  const otrasCajasGrandes = cuentas.filter((c) => c.rol_caja === "grande" && c.sucursal_id !== sucursalId);

  const movimientosCaja = useMemo(() => (cuenta ? movimientos.filter((m) => m.cuenta_id === cuenta.id) : []), [movimientos, cuenta]);

  const filtrados = useMemo(() => {
    let l = movimientosCaja;
    const hoy = new Date();
    if (rango === "hoy") { const h = hoy.toISOString().slice(0, 10); l = l.filter((m) => m.fecha === h); }
    else if (rango === "semana") { const ini = inicioSemana(hoy).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    else if (rango === "mes") { const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((m) => [m.observaciones, m.tipo_movimiento].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    if (responsableFiltro) l = l.filter((m) => m.vendedor_id === responsableFiltro);
    if (categoriaFiltro) l = l.filter((m) => m.tipo_movimiento === categoriaFiltro);
    return [...l].sort((a, b) => (b.fecha + b.created_at).localeCompare(a.fecha + a.created_at));
  }, [movimientosCaja, rango, busqueda, responsableFiltro, categoriaFiltro]);

  const ingresosPeriodo = filtrados.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + Number(m.monto), 0);
  const egresosPeriodo = filtrados.filter((m) => m.tipo === "egreso").reduce((a, m) => a + Number(m.monto), 0);
  const saldoActual = cuenta?.saldo ?? 0;
  const saldoAntesDelPeriodo = saldoActual - ingresosPeriodo + egresosPeriodo;

  const crearCaja = async () => {
    if (!sucursalActual) return;
    setCreandoCaja(true);
    try {
      const payload: any = {
        nombre: `Caja ${rol === "grande" ? "Grande" : "Chica"} — ${sucursalActual.nombre}`,
        tipo: "Efectivo", moneda: "ARS", saldo_inicial: 0, activa: true,
        sucursal_id: sucursalId, rol_caja: rol,
      };
      if (rol === "chica" && cajaGrandeDeEstaSucursal) payload.caja_grande_id = cajaGrandeDeEstaSucursal.id;
      const { data, error } = await supabase2.from("cuentas").insert(payload).select("*").single();
      if (error) throw error;
      setCuentas((prev: any[]) => [...prev, { ...data, saldo: 0 }]);
    } catch (err: any) {
      alert(err.message || "No se pudo crear la caja.");
    } finally {
      setCreandoCaja(false);
    }
  };

  const abrirRegistrar = (tipoMov: string, tipo: "ingreso" | "egreso") => {
    setRTipoMov(tipoMov); setRTipo(tipo); setRConcepto(""); setRMonto(""); setRObs(""); setRArchivo(null);
    setRCategoria(CATEGORIAS_CAJA_CHICA[0]); setRSucursalDestino(""); setRCuentaBanco("");
    setShowRegistrar(true);
  };

  const registrar = async () => {
    if (!cuenta || !rMonto || Number(rMonto) <= 0) return alert("Completá el monto.");
    setGuardando(true);
    try {
      const esTransferencia = rTipoMov !== "manual" && rTipoMov !== "gasto";

      if (esTransferencia) {
        let cuentaOrigenId = cuenta.id, cuentaDestinoId = "";
        if (rTipoMov === "desde-banco") { if (!rCuentaBanco) throw new Error("Elegí la cuenta de banco."); cuentaOrigenId = rCuentaBanco; cuentaDestinoId = cuenta.id; }
        else if (rTipoMov === "hacia-banco") { if (!rCuentaBanco) throw new Error("Elegí la cuenta de banco."); cuentaOrigenId = cuenta.id; cuentaDestinoId = rCuentaBanco; }
        else if (rTipoMov === "otra-sucursal") { if (!rSucursalDestino) throw new Error("Elegí la sucursal destino."); cuentaDestinoId = rSucursalDestino; cuentaOrigenId = cuenta.id; }
        else if (rTipoMov === "desde-grande") { if (!cuenta.caja_grande_id) throw new Error("Esta caja chica no tiene una Caja Grande vinculada."); cuentaOrigenId = cuenta.caja_grande_id; cuentaDestinoId = cuenta.id; }
        else if (rTipoMov === "hacia-grande") { if (!cuenta.caja_grande_id) throw new Error("Esta caja chica no tiene una Caja Grande vinculada."); cuentaOrigenId = cuenta.id; cuentaDestinoId = cuenta.caja_grande_id; }
        else if (rTipoMov === "envio-chica") {
          const cajaChica = cuentas.find((c) => c.sucursal_id === sucursalId && c.rol_caja === "chica");
          if (!cajaChica) throw new Error("Todavía no existe la Caja Chica de esta sucursal — creala primero desde la pestaña Caja Chica.");
          cuentaOrigenId = cuenta.id; cuentaDestinoId = cajaChica.id;
        }

        const { error } = await supabase2.rpc("crear_transferencia", {
          p_cuenta_origen_id: cuentaOrigenId, p_cuenta_destino_id: cuentaDestinoId,
          p_monto_origen: Number(rMonto), p_monto_destino: Number(rMonto), p_fecha: rFecha,
          p_notas: rConcepto || rObs || null,
        });
        if (error) throw error;
        window.location.reload();
        return;
      }

      const categoria = rTipoMov === "gasto" ? rCategoria : (rConcepto || (rTipo === "ingreso" ? "Ingreso" : "Egreso"));
      const { data: movId, error } = await supabase2.rpc("registrar_movimiento_caja", {
        p_tipo: rTipo, p_monto: Number(rMonto), p_cuenta_id: cuenta.id, p_fecha: rFecha,
        p_categoria: categoria, p_forma_pago: rMedioPago, p_observaciones: rConcepto || rObs || null,
      });
      if (error) throw error;

      let comprobanteUrl: string | null = null;
      if (rArchivo) {
        const formData = new FormData();
        formData.append("file", rArchivo);
        formData.append("carpeta", "finanzas");
        const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) comprobanteUrl = data.publicUrl;
      }

      const { data: actualizado } = await supabase2
        .from("movimientos_caja")
        .update({ vendedor_id: miId, comprobante_url: comprobanteUrl, observaciones: rObs || rConcepto || null })
        .eq("id", movId)
        .select("*, cuenta:cuentas(nombre, moneda), vendedor:vendedor_id(nombre)")
        .single();
      if (actualizado) setMovimientos((prev: any[]) => [actualizado, ...prev]);
      setShowRegistrar(false);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  };

  const opcionesTipoMov = rol === "grande"
    ? [
        { v: "manual-ingreso", l: "Ingreso manual", tipo: "ingreso" as const, tm: "manual" },
        { v: "manual-egreso", l: "Egreso manual", tipo: "egreso" as const, tm: "manual" },
        { v: "desde-banco", l: "Entrada desde Banco", tipo: "ingreso" as const, tm: "desde-banco" },
        { v: "hacia-banco", l: "Salida hacia Banco", tipo: "egreso" as const, tm: "hacia-banco" },
        { v: "otra-sucursal", l: "Transferencia a otra sucursal", tipo: "egreso" as const, tm: "otra-sucursal" },
        { v: "hacia-grande", l: "Envío a Caja Chica", tipo: "egreso" as const, tm: "hacia-grande" },
      ]
    : [
        { v: "manual-ingreso", l: "Ingreso manual", tipo: "ingreso" as const, tm: "manual" },
        { v: "gasto", l: "Gasto (con categoría)", tipo: "egreso" as const, tm: "gasto" },
        { v: "desde-banco", l: "Entrada desde Banco", tipo: "ingreso" as const, tm: "desde-banco" },
        { v: "desde-grande", l: "Entrada desde Caja Grande", tipo: "ingreso" as const, tm: "desde-grande" },
        { v: "hacia-banco", l: "Salida hacia Banco", tipo: "egreso" as const, tm: "hacia-banco" },
        { v: "hacia-grande", l: "Devolución a Caja Grande", tipo: "egreso" as const, tm: "hacia-grande" },
      ];
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-bold text-slate-400">Sucursal:</span>
        <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <div className="flex gap-1 ml-2">
          <button onClick={() => setRol("grande")} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${rol === "grande" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}><Landmark className="w-3.5 h-3.5" /> Caja Grande</button>
          <button onClick={() => setRol("chica")} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${rol === "chica" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}><Wallet className="w-3.5 h-3.5" /> Caja Chica</button>
        </div>
      </div>

      {!cuenta ? (
        <div className="bg-white dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl py-12 text-center">
          <p className="text-sm font-bold mb-1">Todavía no existe la Caja {rol === "grande" ? "Grande" : "Chica"} de {sucursalActual?.nombre}.</p>
          <p className="text-xs text-slate-400 mb-4">Se crea como una cuenta de efectivo más — arqueos, cierre de caja y libros contables la toman sola apenas exista.</p>
          <button onClick={crearCaja} disabled={creandoCaja} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50">{creandoCaja ? "Creando..." : `Crear Caja ${rol === "grande" ? "Grande" : "Chica"}`}</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Saldo inicial ({rango === "todo" ? "cuenta" : rango === "hoy" ? "hoy" : rango === "semana" ? "semana" : "mes"})</p>
              <p className="text-lg font-black">{fmt(saldoAntesDelPeriodo, cuenta.moneda)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Total ingresos</p>
              <p className="text-lg font-black">{fmt(ingresosPeriodo, cuenta.moneda)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase text-rose-500">Total egresos</p>
              <p className="text-lg font-black">{fmt(egresosPeriodo, cuenta.moneda)}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase text-indigo-600">Saldo actual</p>
              <p className="text-lg font-black">{fmt(saldoActual, cuenta.moneda)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {[{ v: "hoy", l: "Hoy" }, { v: "semana", l: "Esta semana" }, { v: "mes", l: "Este mes" }, { v: "todo", l: "Todo" }].map((r) => (
              <button key={r.v} onClick={() => setRango(r.v as any)} className={`px-2.5 py-1 rounded-full text-xs font-bold ${rango === r.v ? "bg-slate-800 dark:bg-white/20 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>{r.l}</button>
            ))}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por concepto" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none" />
            </div>
            <select value={responsableFiltro} onChange={(e) => setResponsableFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
              <option value="">Todos los responsables</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
            {rol === "chica" && (
              <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
                <option value="">Todas las categorías</option>
                {CATEGORIAS_CAJA_CHICA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {opcionesTipoMov.map((op) => (
              <button
                key={op.v}
                onClick={() => abrirRegistrar(op.tm === "hacia-grande" && rol === "grande" ? "envio-chica" : op.tm, op.tipo)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
              >
                {op.v.includes("banco") || op.v === "otra-sucursal" || op.v.includes("grande") ? <ArrowLeftRight className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {op.l}
              </button>
            ))}
          </div>

          {filtrados.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin movimientos en este período.</p></div>
          ) : (
            <TablaResponsiva<any>
              filas={filtrados}
              keyExtractor={(m) => m.id}
              encabezadoMobile={(m) => <p className="text-sm font-semibold">{m.observaciones || m.tipo_movimiento || "—"}</p>}
              columnas={
                [
                  { key: "fecha", header: "Fecha", cell: (m) => m.fecha, claseTd: "text-sm whitespace-nowrap" },
                  { key: "concepto", header: "Concepto", cell: (m) => m.observaciones || m.tipo_movimiento || "—", claseTd: "text-sm font-semibold", ocultarEnMobile: true },
                  { key: "categoria", header: "Categoría", cell: (m) => <>{m.tipo_movimiento || "—"}{m.transferencia_grupo_id && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1">Transf.</span>}</>, claseTd: "text-sm text-slate-500" },
                  { key: "responsable", header: "Responsable", cell: (m) => m.vendedor?.nombre || "—", claseTd: "text-sm text-slate-500" },
                  { key: "medio", header: "Medio de pago", cell: (m) => m.forma_pago || "—", claseTd: "text-sm text-slate-500" },
                  { key: "comprobante", header: "Comprobante", cell: (m) => m.comprobante_url ? <a href={m.comprobante_url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold flex items-center gap-1"><Paperclip className="w-3 h-3" /> Ver</a> : "—" },
                  { key: "monto", header: "Monto", cell: (m) => <span className={`text-sm font-bold ${m.tipo === "ingreso" ? "text-emerald-600" : "text-rose-600"}`}>{m.tipo === "ingreso" ? "+" : "-"}{fmt(m.monto, m.cuenta?.moneda)}</span> },
                ] as ColumnaTabla<any>[]
              }
            />
          )}
        </>
      )}

      {showRegistrar && cuenta && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRegistrar(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Registrar movimiento</h3><button onClick={() => setShowRegistrar(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">{cuenta.nombre}</p>

            {(rTipoMov === "desde-banco" || rTipoMov === "hacia-banco") && (
              <div className="mb-3"><label className={labelClass}>Cuenta de banco *</label>
                <select value={rCuentaBanco} onChange={(e) => setRCuentaBanco(e.target.value)} className={inputClass}>
                  <option value="">— Elegí —</option>
                  {cuentasBanco.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
                </select>
              </div>
            )}
            {rTipoMov === "otra-sucursal" && (
              <div className="mb-3"><label className={labelClass}>Sucursal destino *</label>
                <select value={rSucursalDestino} onChange={(e) => setRSucursalDestino(e.target.value)} className={inputClass}>
                  <option value="">— Elegí —</option>
                  {otrasCajasGrandes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
            {rTipoMov === "envio-chica" && (
              <p className="text-xs text-slate-500 mb-3 bg-slate-50 dark:bg-white/5 rounded-lg p-2.5">Va directo a la Caja Chica de {sucursalActual?.nombre}.</p>
            )}
            {(rTipoMov === "desde-grande" || (rTipoMov === "hacia-grande" && rol === "chica")) && (
              <p className="text-xs text-slate-500 mb-3 bg-slate-50 dark:bg-white/5 rounded-lg p-2.5">{rTipoMov === "desde-grande" ? "Se descuenta de" : "Va directo a"} la Caja Grande de {sucursalActual?.nombre}.</p>
            )}

            {rTipoMov === "gasto" && (
              <div className="mb-3"><label className={labelClass}>Categoría de gasto *</label>
                <select value={rCategoria} onChange={(e) => setRCategoria(e.target.value)} className={inputClass}>
                  {CATEGORIAS_CAJA_CHICA.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}

            <label className={labelClass}>Concepto {rTipoMov === "manual" ? "*" : ""}</label>
            <input value={rConcepto} onChange={(e) => setRConcepto(e.target.value)} placeholder={rTipoMov === "gasto" ? rCategoria : "Descripción del movimiento"} className={inputClass} />

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={rMonto} onChange={(e) => setRMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={rFecha} onChange={(e) => setRFecha(e.target.value)} className={inputClass} /></div>
            </div>

            {(rTipoMov === "manual" || rTipoMov === "gasto") && (
              <div className="mt-3"><label className={labelClass}>Medio de pago</label>
                <select value={rMedioPago} onChange={(e) => setRMedioPago(e.target.value)} className={inputClass}>
                  {MEDIOS_PAGO.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            )}

            <label className={labelClass + " mt-3"}>Observaciones</label>
            <textarea value={rObs} onChange={(e) => setRObs(e.target.value)} rows={2} className={inputClass} />

            {(rTipoMov === "manual" || rTipoMov === "gasto") && (
              <>
                <label className={labelClass + " mt-3 flex items-center gap-1.5"}><Paperclip className="w-3.5 h-3.5" /> Comprobante (opcional)</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer">
                  {rArchivo ? rArchivo.name : "Adjuntar archivo"}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setRArchivo(e.target.files?.[0] || null)} />
                </label>
              </>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowRegistrar(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button
                onClick={() => registrar()}
                disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

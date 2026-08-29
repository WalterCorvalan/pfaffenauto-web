"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, ChevronDown, MoreVertical, Lock, MessageCircle, Check, Upload } from "lucide-react";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";
import BoletoModal from "./BoletoModal";

const SECTORES = [
  { value: "ventas", label: "Ventas" }, { value: "gestoria", label: "Gestoría" }, { value: "finanzas", label: "Finanzas" },
  { value: "taller", label: "Taller" }, { value: "recepcion", label: "Recepción" }, { value: "admin", label: "Admin" },
];

const TABS = ["Resumen", "Documentos", "Parte Vendedora", "Parte Compradora", "Permuta", "Gastos", "Gestoría", "Consignación", "Cuentas Registro", "Liquidación", "Comprobantes", "Historial"];

const PRIORIDAD_COLOR: Record<string, string> = { Baja: "text-slate-500", Media: "text-amber-500", Alta: "text-rose-500" };

interface Props {
  expedienteId: string;
  miId: string;
  perfiles: { id: string; nombre: string; roles: string[] }[];
  soyAdmin: boolean;
  puedeOperacionCaida: boolean;
  puedeVerLiquidacion: boolean;
  gananciasOcultas: boolean;
  onClose: () => void;
  onActualizado: (e: any) => void;
  onEliminado: (id: string) => void;
}

export default function ExpedienteDetalleModal({ expedienteId, miId, perfiles, soyAdmin, puedeOperacionCaida, puedeVerLiquidacion, gananciasOcultas, onClose, onActualizado, onEliminado }: Props) {
  const [expediente, setExpediente] = useState<any>(null);
  const [venta, setVenta] = useState<any>(null);
  const [hitos, setHitos] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [senas, setSenas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoTitulo, setSubiendoTitulo] = useState(false);
  const [boletoTipo, setBoletoTipo] = useState<"venta" | "compra" | null>(null);
  const [tab, setTab] = useState("Resumen");
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [sectorPedido, setSectorPedido] = useState("");
  const [mensajePedido, setMensajePedido] = useState("");
  const [mostrarCaida, setMostrarCaida] = useState(false);
  const [senaQuedaAgencia, setSenaQuedaAgencia] = useState(true);
  const [nuevaObs, setNuevaObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [estado, setEstado] = useState("abierto");
  const [consignador, setConsignador] = useState("");
  const [fechaApertura, setFechaApertura] = useState("");
  const [comentarioGestoria, setComentarioGestoria] = useState("");
  const [comentarioFinanzas, setComentarioFinanzas] = useState("");
  const [precioPropietario, setPrecioPropietario] = useState("");
  const [precioPropietarioMoneda, setPrecioPropietarioMoneda] = useState("USD");
  const [vencimiento, setVencimiento] = useState("");

  const cargar = async () => {
    const { data: e } = await supabase2.from("expedientes").select("*, venta:ventas(*)").eq("id", expedienteId).single();
    if (!e) { setCargando(false); return; }
    setExpediente(e);
    setVenta(e.venta);
    setTitulo(e.titulo || `EXP — ${e.venta?.vehiculo_marca || ""} ${e.venta?.vehiculo_modelo || ""} (${e.venta?.vehiculo_anio || ""})`);
    setEstado(e.estado);
    setConsignador(e.venta?.responsable_consignacion_id || "");
    setFechaApertura(e.fecha_apertura || "");
    setComentarioGestoria(e.venta?.comentario_gestoria || "");
    setComentarioFinanzas(e.venta?.comentario_finanzas || "");
    setPrecioPropietario(e.precio_propietario != null ? String(e.precio_propietario) : "");
    setPrecioPropietarioMoneda(e.precio_propietario_moneda || "USD");
    setVencimiento(e.vencimiento || "");

    const [{ data: h }, { data: cl }, { data: o }, { data: s }] = await Promise.all([
      supabase2.from("expediente_hitos").select("*").eq("expediente_id", expedienteId).order("orden"),
      supabase2.from("expediente_checklist").select("*").eq("expediente_id", expedienteId).order("parte,orden"),
      supabase2.from("expediente_observaciones").select("*, autor:perfiles(nombre)").eq("expediente_id", expedienteId).order("created_at", { ascending: false }),
      e.venta ? supabase2.from("venta_senas").select("*").eq("venta_id", e.venta.id) : Promise.resolve({ data: [] }),
    ]);
    setHitos(h || []);
    setChecklist(cl || []);
    setObservaciones(o || []);
    setSenas(s || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [expedienteId]);

  const toggleHito = async (h: any) => {
    const nuevo = !h.completado;
    await supabase2.from("expediente_hitos").update({ completado: nuevo, completado_en: nuevo ? new Date().toISOString() : null }).eq("id", h.id);
    setHitos((prev) => prev.map((x) => (x.id === h.id ? { ...x, completado: nuevo } : x)));
  };

  const toggleChecklistItem = async (item: any) => {
    const nuevo = !item.completado;
    await supabase2.rpc("expediente_checklist_tildar", { p_item_id: item.id, p_completado: nuevo });
    setChecklist((prev) => prev.map((x) => (x.id === item.id ? { ...x, completado: nuevo } : x)));
  };

  const subirTitulo = async (file: File) => {
    setSubiendoTitulo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("carpeta", "expedientes");
      const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo el archivo");
      const { data: upd } = await supabase2.from("expedientes").update({ titulo_transferido_url: data.publicUrl }).eq("id", expedienteId).select("*, venta:ventas(*)").single();
      if (upd) { setExpediente(upd); onActualizado(upd); }
    } catch (e: any) {
      alert(e?.message || "No se pudo subir el archivo.");
    } finally {
      setSubiendoTitulo(false);
    }
  };

  const confirmarParte = async (parte: "comprador" | "consignacion") => {
    const payload = parte === "comprador"
      ? { confirmado_comprador: true, confirmado_comprador_en: new Date().toISOString(), confirmado_comprador_por: miId }
      : { confirmado_consignacion: true, confirmado_consignacion_en: new Date().toISOString(), confirmado_consignacion_por: miId };
    const { data } = await supabase2.from("expedientes").update(payload).eq("id", expedienteId).select("*, venta:ventas(*)").single();
    if (data) { setExpediente(data); onActualizado(data); }
  };

  const agregarObservacion = async () => {
    if (!nuevaObs.trim()) return;
    await supabase2.from("expediente_observaciones").insert({ expediente_id: expedienteId, texto: nuevaObs.trim(), autor_id: miId });
    setNuevaObs("");
    const { data } = await supabase2.from("expediente_observaciones").select("*, autor:perfiles(nombre)").eq("expediente_id", expedienteId).order("created_at", { ascending: false });
    setObservaciones(data || []);
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const { data } = await supabase2.from("expedientes").update({
        titulo: titulo.trim() || null, estado, fecha_apertura: fechaApertura || null, vencimiento: vencimiento || null,
        precio_propietario: precioPropietario ? Number(precioPropietario) : null, precio_propietario_moneda: precioPropietarioMoneda,
      }).eq("id", expedienteId).select("*, venta:ventas(*)").single();

      if (venta) {
        await supabase2.from("ventas").update({ responsable_consignacion_id: consignador || null, comentario_gestoria: comentarioGestoria || null, comentario_finanzas: comentarioFinanzas || null }).eq("id", venta.id);
      }

      if (data) { setExpediente(data); onActualizado(data); }
      await cargar();
    } catch {
      alert("No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (nuevo: string) => {
    setEstado(nuevo);
    const { data } = await supabase2.from("expedientes").update({ estado: nuevo }).eq("id", expedienteId).select("*, venta:ventas(*)").single();
    if (data) { setExpediente(data); onActualizado(data); }
    setMostrarMenu(false);
  };

  const marcarReventa = async () => {
    const fecha = prompt("¿Fecha prevista para retomar? (opcional, AAAA-MM-DD)");
    const { data } = await supabase2.from("expedientes").update({ es_reventa: true, reventa_fecha_prevista: fecha || null }).eq("id", expedienteId).select("*, venta:ventas(*)").single();
    if (data) { setExpediente(data); onActualizado(data); }
    setMostrarMenu(false);
  };

  const marcarCaida = async () => {
    if (!venta) return;
    setGuardando(true);
    const { error } = await supabase2.rpc("marcar_operacion_caida", { p_venta_id: venta.id, p_sena_queda_en_agencia: senaQuedaAgencia });
    setGuardando(false);
    setMostrarCaida(false);
    if (error) { alert(error.message || "No se pudo marcar la operación caída."); return; }
    await cargar();
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar este expediente? No se puede deshacer.")) return;
    const { error, count } = await supabase2.from("expedientes").delete({ count: "exact" }).eq("id", expedienteId);
    if (error || !count) { alert("No se pudo eliminar."); return; }
    onEliminado(expedienteId);
    onClose();
  };

  const pedirAtencion = async () => {
    if (!sectorPedido) return;
    await supabase2.from("expediente_observaciones").insert({
      expediente_id: expedienteId, texto: mensajePedido.trim() || `Pedido de atención a ${sectorPedido}`, tipo: "pedido_atencion", sector: sectorPedido, autor_id: miId,
    });
    setMostrarPedido(false);
    setSectorPedido("");
    setMensajePedido("");
    await cargar();
  };

  if (cargando || !expediente) {
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>;
  }

  const totalSenas = senas.reduce((acc, s) => acc + (venta && s.moneda === venta.moneda_venta ? Number(s.monto) : 0), 0);
  const senasOtraMoneda = senas.filter((s) => venta && s.moneda !== venta.moneda_venta);
  const totalesSenasOtraMoneda = senasOtraMoneda.reduce((acc: Record<string, number>, s) => { acc[s.moneda] = (acc[s.moneda] || 0) + Number(s.monto); return acc; }, {});
  const saldoComprador = venta ? Number(venta.precio_venta) - totalSenas : 0;
  const aPagarVendedor = precioPropietario ? Number(precioPropietario) : null;
  const monedasCoinciden = venta && precioPropietarioMoneda === venta.moneda_venta;
  const margen = venta && aPagarVendedor != null && monedasCoinciden ? Number(venta.precio_venta) - aPagarVendedor : null;
  const pendienteConfirmacion = !expediente.confirmado_comprador || !expediente.confirmado_consignacion;

  const whatsapp = (telefono: string | null | undefined, nombre: string, mensaje: string) =>
    telefono ? `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}` : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-end px-5 pt-4 sticky top-0 bg-white dark:bg-[#111] z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${PRIORIDAD_COLOR[expediente.prioridad]}`}>🟡 {expediente.prioridad}</span>
            {expediente.vencimiento && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">📅 Vence: {fmtFechaLocal(expediente.vencimiento)}</span>}
          </div>

          {expediente.pedido_atencion_sector && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">🔔 Pedido de atención a {SECTORES.find((s) => s.value === expediente.pedido_atencion_sector)?.label || expediente.pedido_atencion_sector}</p>
              {expediente.pedido_atencion_mensaje && <p className="text-xs text-indigo-700/80 dark:text-indigo-300/70 mt-0.5">{expediente.pedido_atencion_mensaje}</p>}
            </div>
          )}

          {pendienteConfirmacion && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">⚠️ Confirmación pendiente</p>
                <span className="text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">Sin confirmar</span>
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-1">La operación necesita el OK de las dos partes (comprador + consignación) antes de liberarse a Gestoría / Tesorería.</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white dark:bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">Parte compradora <span>{expediente.confirmado_comprador ? "confirmado" : "pendiente"}</span></p>
                  {!expediente.confirmado_comprador && <button onClick={() => confirmarParte("comprador")} className="w-full mt-1.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Confirmar comprador</button>}
                </div>
                <div className="bg-white dark:bg-white/5 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">Parte consignación <span>{expediente.confirmado_consignacion ? "confirmado" : "pendiente"}</span></p>
                  {!expediente.confirmado_consignacion && <button onClick={() => confirmarParte("consignacion")} className="w-full mt-1.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Confirmar consignación</button>}
                </div>
              </div>
            </div>
          )}

          <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2">💬 Contactar partes por WhatsApp</p>
            {[{ titulo: "Mensaje de Gestoría", desc: "Presentación como gestora asignada al trámite de transferencia." }, { titulo: "Mensaje de Finanzas", desc: "Presentación como administrativa asignada a la gestión del pago." }].map((bloque) => (
              <div key={bloque.titulo} className="mb-2 last:mb-0">
                <p className="text-[10px] font-bold uppercase text-slate-400">{bloque.titulo}</p>
                <p className="text-[11px] text-slate-400 mb-1.5">{bloque.desc}</p>
                <div className="flex gap-2">
                  <a href={whatsapp(venta?.propietario_telefono, venta?.propietario_nombre, `Hola ${venta?.propietario_nombre || ""}, te contacto por la venta de tu ${venta?.vehiculo_marca} ${venta?.vehiculo_modelo}.`) || undefined} target="_blank" rel="noreferrer"
                    className={`flex-1 text-center text-xs font-bold px-3 py-2 rounded-lg border ${venta?.propietario_telefono ? "border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50" : "border-slate-100 dark:border-white/10 text-slate-300 pointer-events-none"}`}>
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Contactar vendedor {!venta?.propietario_telefono && "— sin teléfono"}
                  </a>
                  <a href={whatsapp(venta?.comprador_telefono, venta?.comprador_nombre, `Hola ${venta?.comprador_nombre || ""}, te contacto por la compra del ${venta?.vehiculo_marca} ${venta?.vehiculo_modelo}.`) || undefined} target="_blank" rel="noreferrer"
                    className={`flex-1 text-center text-xs font-bold px-3 py-2 rounded-lg ${venta?.comprador_telefono ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-300 pointer-events-none"}`}>
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Contactar comprador · {venta?.comprador_nombre}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-2 text-xs font-bold whitespace-nowrap border-b-2 -mb-px ${tab === t ? "border-rose-600 text-rose-600" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>{t}</button>
            ))}
          </div>

          {tab === "Resumen" && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">{venta?.vehiculo_marca} {venta?.vehiculo_modelo}</p>
                    <p className="text-xs text-slate-400">{venta?.vehiculo_anio} · 🛣 {venta?.km ? Number(venta.km).toLocaleString("es-AR") : "—"} km · 🪪 {venta?.vehiculo_patente || "s/patente"} · 🏛 Vendedor: {venta?.vendedor_id ? perfiles.find((p) => p.id === venta.vendedor_id)?.nombre : "—"}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">{estado === "cerrado" ? "Finalizado" : "En proceso"}</span>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">Hitos transferencia <span>{hitos.filter((h) => h.completado).length}/{hitos.length}</span></p>
                  <div className="flex items-center">
                    {hitos.map((h, i) => (
                      <div key={h.id} className="flex items-center flex-1 last:flex-none">
                        <button onClick={() => toggleHito(h)} title={h.nombre} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${h.completado ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>
                          {h.completado ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </button>
                        {i < hitos.length - 1 && <div className={`h-0.5 flex-1 ${hitos[i + 1]?.completado || h.completado ? "bg-emerald-300" : "bg-slate-200 dark:bg-white/10"}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2">📋 Liquidación de la operación</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-white dark:bg-white/5 rounded-lg p-2.5">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Total a cobrar al comprador</p>
                    <p className="text-lg font-black text-blue-600">{venta?.moneda_venta} {venta ? Number(venta.precio_venta).toLocaleString("es-AR") : "—"}</p>
                    <p className="text-[10px] text-amber-600">Saldo: {venta?.moneda_venta} {saldoComprador.toLocaleString("es-AR")} ⏳ pendiente</p>
                    {Object.entries(totalesSenasOtraMoneda).map(([m, t]) => (
                      <p key={m} className="text-[10px] text-orange-600 mt-0.5">⚠️ + {m} {t.toLocaleString("es-AR")} en señas (no se resta del saldo — moneda distinta a la venta)</p>
                    ))}
                  </div>
                  {puedeVerLiquidacion ? (
                    <>
                      <div className="bg-white dark:bg-white/5 rounded-lg p-2.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400">A pagar al vendedor</p>
                        {aPagarVendedor != null ? <p className="text-lg font-black text-purple-600">{precioPropietarioMoneda} {aPagarVendedor.toLocaleString("es-AR")}</p> : <p className="text-xs text-slate-400 mt-1.5">Sin precio cargado por finanzas</p>}
                        <div className="flex gap-1 mt-1.5">
                          <select value={precioPropietarioMoneda} onChange={(e) => setPrecioPropietarioMoneda(e.target.value)} className="text-[10px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-1"><option>USD</option><option>ARS</option></select>
                          <input type="number" value={precioPropietario} onChange={(e) => setPrecioPropietario(e.target.value)} placeholder="Precio con propietario" className="flex-1 text-[10px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-1.5 py-1" />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-white/5 rounded-lg p-2.5">
                        <p className="text-[9px] font-bold uppercase text-slate-400">Margen neto agencia</p>
                        {gananciasOcultas ? (
                          <p className="text-xs text-slate-400 mt-1.5">Oculto para tu usuario</p>
                        ) : margen != null ? (
                          <p className="text-lg font-black text-emerald-600">{venta?.moneda_venta} {margen.toLocaleString("es-AR")}</p>
                        ) : aPagarVendedor != null && !monedasCoinciden ? (
                          <p className="text-xs text-orange-600 mt-1.5">⚠️ No calculable: venta en {venta?.moneda_venta}, precio al propietario en {precioPropietarioMoneda}. Convertí a la misma moneda para ver el margen.</p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1.5">No calculable. Faltan datos de precio.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 bg-white dark:bg-white/5 rounded-lg p-2.5 flex items-center justify-center text-xs text-slate-400"><Lock className="w-3.5 h-3.5 mr-1.5" /> Solo Admin, Finanzas y Gestoría ven este detalle.</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Título del expediente</label>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Dominio (patente)</label>
                  <input value={venta?.vehiculo_patente || ""} disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm opacity-70" />
                  <p className="text-[10px] text-slate-400 mt-1">Se deriva del vehículo vinculado</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm">
                    <option value="abierto">Abierto</option><option value="en_tramite">En trámite</option><option value="cerrado">Cerrado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Vehículo</label>
                  <input value={`${venta?.vehiculo_marca || ""} ${venta?.vehiculo_modelo || ""} (${venta?.vehiculo_anio || ""})`} disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm opacity-70" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Operación vinculada (vínculo fijo)</label>
                  <input value={`${venta?.vehiculo_marca || ""} ${venta?.vehiculo_modelo || ""} — ${venta?.comprador_nombre || ""} (${venta?.estado || ""})`} disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm opacity-70" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Trámite de Gestoría vinculado</label>
                  <select disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm opacity-70"><option>— Sin trámite de gestoría —</option></select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Consignador (vendedor que trajo el auto)</label>
                  <select value={consignador} onChange={(e) => setConsignador(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm">
                    <option value="">— Sin asignar —</option>
                    {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Fecha de apertura</label>
                  <input type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">📝 Notas generales · bitácora compartida (queda fecha + autor)</p>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Agregar observación</p>
                  <textarea value={nuevaObs} onChange={(e) => setNuevaObs(e.target.value)} rows={2} placeholder="Contexto, cambios, acuerdos con el cliente, trabas de gestoría, etc." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex justify-end mt-1.5"><button onClick={agregarObservacion} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">+ Agregar entrada</button></div>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 mb-1.5">Historial</p>
                {observaciones.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-xl py-6 text-center">
                    <p className="text-xs text-slate-400">Sin observaciones todavía.</p>
                    <p className="text-[10px] text-slate-300">Agregá la primera entrada para empezar la bitácora del expediente.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {observaciones.map((o) => (
                      <div key={o.id} className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between"><span className="text-xs font-bold">{o.autor?.nombre || "Sistema"}</span><span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleString("es-AR")}</span></div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{o.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Comentario para gestoría</label><textarea value={comentarioGestoria} onChange={(e) => setComentarioGestoria(e.target.value)} rows={2} placeholder="Transferencia, documentación, condiciones especiales del propietario..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Comentario para finanzas</label><textarea value={comentarioFinanzas} onChange={(e) => setComentarioFinanzas(e.target.value)} rows={2} placeholder="Forma de pago al propietario, plazos, retenciones..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const vendedora = checklist.filter((x) => x.parte === "vendedora");
                  const compradora = checklist.filter((x) => x.parte === "compradora");
                  const pctV = vendedora.length ? Math.round((vendedora.filter((x) => x.completado).length / vendedora.length) * 100) : 0;
                  const pctC = compradora.length ? Math.round((compradora.filter((x) => x.completado).length / compradora.length) * 100) : 0;
                  return (
                    <>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
                        <p className="text-xs font-bold flex items-center justify-between">Docs Vendedor <span className="text-slate-400">{vendedora.filter((x) => x.completado).length}/{vendedora.length}</span></p>
                        <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5"><div className="h-1.5 bg-rose-500 rounded-full" style={{ width: `${pctV}%` }} /></div>
                        <p className="text-[10px] text-slate-400 mt-1">{pctV}% completado</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
                        <p className="text-xs font-bold flex items-center justify-between">Docs Comprador <span className="text-slate-400">{compradora.filter((x) => x.completado).length}/{compradora.length}</span></p>
                        <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5"><div className="h-1.5 bg-rose-500 rounded-full" style={{ width: `${pctC}%` }} /></div>
                        <p className="text-[10px] text-slate-400 mt-1">{pctC}% completado</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {tab === "Gestoría" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Vencimiento del trámite</label>
                <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className="w-full sm:w-56 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
                <p className="text-[10px] text-slate-400 mt-1">Se usa para las alertas de "vencidos" / "vencen 7 días" del tablero de Gestoría. Guardá los cambios abajo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["vendedora", "compradora"].map((parte) => {
                  const items = checklist.filter((x) => x.parte === parte);
                  return (
                    <div key={parte} className={`border rounded-xl p-3 ${parte === "vendedora" ? "bg-purple-50/60 dark:bg-purple-500/5 border-purple-100 dark:border-purple-500/20" : "bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"}`}>
                      <p className="text-xs font-bold mb-2">{parte === "vendedora" ? "🔑 Parte Vendedora" : `👤 ${venta?.comprador_nombre || "Parte Compradora"}`} <span className="text-[10px] font-normal text-slate-400">{items.filter((x) => x.completado).length}/{items.length}</span></p>
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <button key={item.id} onClick={() => toggleChecklistItem(item)} className="flex items-center gap-1.5 w-full text-left">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${item.completado ? "bg-emerald-500" : "bg-amber-400"}`} />
                            <span className={`text-xs ${item.completado ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{item.nombre}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Título del automotor transferido</p>
                <p className="text-[10px] text-slate-400 mb-2">Mismo comprobante que exige Liquidaciones para finalizar la transferencia y cobrar. Se sincroniza solo entre las dos secciones.</p>
                {expediente.titulo_transferido_url ? (
                  <a href={expediente.titulo_transferido_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">✅ Ver título subido</a>
                ) : (
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 px-3 py-2 rounded-lg cursor-pointer">
                    {subiendoTitulo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Subir título
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && subirTitulo(e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          )}

          {tab !== "Resumen" && tab !== "Gestoría" && (
            <div className="py-12 text-center text-sm text-slate-400">Pestaña "{tab}" — todavía no construida, llega en la próxima entrega.</div>
          )}

          {mostrarPedido && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Notificamos al sector elegido con un mensaje opcional. Aparece en la campana y en el expediente como pendiente hasta que lo cierren.</p>
              <select value={sectorPedido} onChange={(e) => setSectorPedido(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm">
                <option value="">— Elegí un sector —</option>
                {SECTORES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <textarea value={mensajePedido} onChange={(e) => setMensajePedido(e.target.value.slice(0, 200))} rows={2} placeholder="Ej: Falta confirmar el pago del libre deuda — revisá si tenemos el comprobante." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
              <p className="text-[10px] text-slate-400">Hasta 200 caracteres.</p>
              <div className="flex justify-end gap-2"><button onClick={() => setMostrarPedido(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button onClick={pedirAtencion} disabled={!sectorPedido} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">🔔 Enviar pedido</button></div>
            </div>
          )}

          {mostrarCaida && (
            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Marcar operación caída</p>
              <p className="text-[11px] text-orange-700/80 dark:text-orange-300/70">Cancela la venta, devuelve el auto a stock como Disponible y anula las cuotas pendientes.</p>
              <label className="flex items-center gap-2 text-xs font-semibold text-orange-700 dark:text-orange-300"><input type="checkbox" checked={senaQuedaAgencia} onChange={(e) => setSenaQuedaAgencia(e.target.checked)} className="w-4 h-4 accent-orange-600" /> La seña queda en la agencia</label>
              {!senaQuedaAgencia && <p className="text-[10px] text-orange-700/70 dark:text-orange-300/60">Si le devolvés la plata al comprador, acordate de cargar el egreso en Finanzas.</p>}
              <div className="flex justify-end gap-2"><button onClick={() => setMostrarCaida(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button onClick={marcarCaida} disabled={guardando} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold disabled:opacity-50">Confirmar</button></div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 p-4 sticky bottom-0 bg-white dark:bg-[#111] flex flex-wrap items-center gap-2">
          <button onClick={() => setMostrarPedido((v) => !v)} className="px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">🔔 Pedir atención</button>
          <div className="relative">
            <button onClick={() => setMostrarMenu((v) => !v)} className="p-2 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1"><MoreVertical className="w-4 h-4" /> <ChevronDown className="w-3 h-3" /></button>
            {mostrarMenu && (
              <div className="absolute bottom-full mb-1 left-0 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl w-48 py-1 z-20">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">Cambiar status</p>
                {["abierto", "en_tramite", "cerrado"].filter((s) => s !== estado).map((s) => (
                  <button key={s} onClick={() => cambiarEstado(s)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5">→ {s === "cerrado" ? "Cerrado" : s === "en_tramite" ? "En trámite" : "Abierto"}</button>
                ))}
                <div className="border-t border-slate-100 dark:border-white/10 my-1" />
                {!expediente.es_reventa && <button onClick={marcarReventa} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5">↗ Marcar como reventa</button>}
                {puedeOperacionCaida && <button onClick={() => { setMostrarMenu(false); setMostrarCaida(true); }} className="w-full text-left px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10">↘ Operación caída</button>}
                {soyAdmin && <button onClick={eliminar} className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">🗑 Eliminar</button>}
              </div>
            )}
          </div>
          <button disabled title="Todavía no construido" className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-300 opacity-60 cursor-not-allowed">Editar venta</button>
          <button onClick={() => setBoletoTipo("compra")} className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">Boleto compra</button>
          <button onClick={() => setBoletoTipo("venta")} className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">Boleto venta</button>
          <button disabled title="Todavía no construido" className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-300 opacity-60 cursor-not-allowed">Reseña comprador</button>
          <button disabled title="Todavía no construido" className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-300 opacity-60 cursor-not-allowed">Reseña ex-dueño</button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-500">Cerrar</button>
          <button onClick={guardarCambios} disabled={guardando} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">{guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Guardar Cambios</button>
        </div>
      </div>

      {boletoTipo && (
        <BoletoModal
          tipo={boletoTipo}
          expediente={expediente}
          venta={venta}
          checklist={checklist}
          miNombre={perfiles.find((p) => p.id === miId)?.nombre || ""}
          onClose={() => setBoletoTipo(null)}
        />
      )}
    </div>
  );
}

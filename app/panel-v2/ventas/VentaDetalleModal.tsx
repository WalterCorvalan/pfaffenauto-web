"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import Link from "next/link";
import { X, Loader2, Pencil, Trash2, ChevronDown, AlertTriangle, ShieldAlert, Check, Car, User, DollarSign, Percent, KeyRound, FolderKanban, History } from "lucide-react";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", activa: "Activa", reserva: "Reserva", cerrada: "Cerrada", caida: "Caída", cancelada: "Cancelada",
};
const ESTADO_COLOR: Record<string, string> = {
  borrador: "text-slate-500", activa: "text-blue-600", reserva: "text-amber-600", cerrada: "text-emerald-600", caida: "text-orange-600", cancelada: "text-rose-600",
};

const TRANSICIONES: Record<string, string[]> = {
  borrador: ["activa", "cancelada"],
  activa: ["reserva", "cerrada", "cancelada"],
  reserva: ["cerrada", "cancelada"],
  cerrada: [],
  caida: [],
  cancelada: [],
};
const ESTADO_CON_AVISO = new Set(["cerrada", "cancelada"]);

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2">{valor ?? "—"}</p>
    </div>
  );
}

function Seccion({ icono: Icono, titulo, accion, children }: { icono: any; titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Icono className="w-3.5 h-3.5" /> {titulo}</p>
        {accion}
      </div>
      <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
        {children}
      </div>
    </div>
  );
}

function idCorto(id: string) {
  return `#${id.slice(0, 8)}`;
}

interface Props {
  ventaId: string;
  miId: string;
  soyAdmin: boolean;
  puedeOperacionCaida: boolean;
  perfilMap: Record<string, string>;
  onClose: () => void;
  onActualizado: (v: any) => void;
  onEliminado: (id: string) => void;
  onEditar: (v: any) => void;
}

export default function VentaDetalleModal({ ventaId, miId, soyAdmin, puedeOperacionCaida, perfilMap, onClose, onActualizado, onEliminado, onEditar }: Props) {
  const [venta, setVenta] = useState<any>(null);
  const [senas, setSenas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [expediente, setExpediente] = useState<any>(null);
  const [mandato, setMandato] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarStatus, setMostrarStatus] = useState(false);
  const [mostrarCaida, setMostrarCaida] = useState(false);
  const [senaQuedaAgencia, setSenaQuedaAgencia] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [editandoComision, setEditandoComision] = useState(false);
  const [comisionVendedorPct, setComisionVendedorPct] = useState("");
  const [comisionConsignacionPct, setComisionConsignacionPct] = useState("");
  const [guardandoComision, setGuardandoComision] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const cargar = async () => {
    const [{ data: v }, { data: s }, { data: h }, { data: exp }] = await Promise.all([
      supabase2.from("ventas").select("*").eq("id", ventaId).single(),
      supabase2.from("venta_senas").select("*").eq("venta_id", ventaId).order("fecha"),
      supabase2.from("venta_estado_historial").select("*, autor:perfiles(nombre)").eq("venta_id", ventaId).order("created_at", { ascending: false }),
      supabase2.from("expedientes").select("id, estado").eq("venta_id", ventaId).maybeSingle(),
    ]);
    setVenta(v);
    setSenas(s || []);
    setHistorial(h || []);
    setExpediente(exp || null);

    if (v?.vehiculo_id) {
      const { data: veh } = await supabase2.from("vehiculos").select("mandato_id").eq("id", v.vehiculo_id).maybeSingle();
      if (veh?.mandato_id) {
        const { data: m } = await supabase2.from("mandatos").select("mandante_nombre, tipo_tramite, valor, moneda").eq("id", veh.mandato_id).maybeSingle();
        setMandato(m || null);
      } else {
        setMandato(null);
      }
    } else {
      setMandato(null);
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [ventaId]);

  const abrirEdicionComision = () => {
    setComisionVendedorPct(String(venta.comision_vendedor_pct ?? 0));
    setComisionConsignacionPct(String(venta.comision_consignacion_pct ?? 0));
    setEditandoComision(true);
    setSolicitudEnviada(false);
  };

  const guardarComision = async () => {
    setGuardandoComision(true);
    try {
      const nuevoVendedor = Number(comisionVendedorPct) || 0;
      const nuevoConsignacion = Number(comisionConsignacionPct) || 0;
      if (soyAdmin) {
        const { data, error } = await supabase2.from("ventas").update({ comision_vendedor_pct: nuevoVendedor, comision_consignacion_pct: nuevoConsignacion }).eq("id", ventaId).select().single();
        if (error) throw error;
        setVenta(data);
        onActualizado(data);
        setEditandoComision(false);
      } else {
        const { error } = await supabase2.from("autorizaciones").insert({
          tipo: "editar_comision_venta",
          riesgo: "alto",
          requiere_pin: true,
          descripcion: `Editar comisión de la venta de ${venta.comprador_nombre} (${venta.vehiculo_marca} ${venta.vehiculo_modelo})`,
          entidad_tabla: "ventas",
          entidad_id: ventaId,
          datos_antes: { comision_vendedor_pct: venta.comision_vendedor_pct, comision_consignacion_pct: venta.comision_consignacion_pct },
          datos_despues: { comision_vendedor_pct: nuevoVendedor, comision_consignacion_pct: nuevoConsignacion },
          solicitado_por: miId,
        });
        if (error) throw error;
        setSolicitudEnviada(true);
      }
    } catch {
      alert("No se pudo guardar el cambio de comisión.");
    } finally {
      setGuardandoComision(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    setProcesando(true);
    const { data, error } = await supabase2.from("ventas").update({ estado: nuevoEstado }).eq("id", ventaId).select().single();
    setProcesando(false);
    setMostrarStatus(false);
    if (error) { alert("No se pudo cambiar el estado."); return; }
    setVenta(data);
    onActualizado(data);
    await cargar();
  };

  const marcarCaida = async () => {
    setProcesando(true);
    const { error } = await supabase2.rpc("marcar_operacion_caida", { p_venta_id: ventaId, p_sena_queda_en_agencia: senaQuedaAgencia });
    setProcesando(false);
    setMostrarCaida(false);
    if (error) { alert(error.message || "No se pudo marcar la operación como caída."); return; }
    await cargar();
    const { data } = await supabase2.from("ventas").select("*").eq("id", ventaId).single();
    if (data) onActualizado(data);
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar esta venta? No se puede deshacer.")) return;
    const { error, count } = await supabase2.from("ventas").delete({ count: "exact" }).eq("id", ventaId);
    if (error || !count) { alert("No se pudo eliminar (sin permiso o ya no existe)."); return; }
    onEliminado(ventaId);
    onClose();
  };

  if (cargando || !venta) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const totalSenas = senas.reduce((acc, s) => acc + (s.moneda === venta.moneda_venta ? Number(s.monto) : 0), 0);
  const comisionPct = Number(venta.comision_vendedor_pct || 0) + Number(venta.comision_consignacion_pct || 0);
  const comisionMonto = (Number(venta.precio_venta) * comisionPct) / 100;
  const transicionesDisponibles = TRANSICIONES[venta.estado] || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-end px-5 pt-4 sticky top-0 bg-white dark:bg-[#111] z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold flex items-center gap-1.5 ${ESTADO_COLOR[venta.estado]}`}>
              <span className={`w-2 h-2 rounded-full ${ESTADO_COLOR[venta.estado].replace("text-", "bg-")}`} /> {ESTADO_LABEL[venta.estado]}
            </span>
            {senas.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300">Con seña</span>}
            {mandato?.tipo_tramite === "Consignación" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300">Consignación</span>}
            {expediente && (
              <Link href="/panel-v2/expedientes" className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center gap-1 hover:underline">
                <FolderKanban className="w-3 h-3" /> Expediente {idCorto(expediente.id)}
              </Link>
            )}
          </div>

<Seccion icono={Car} titulo="Vehículo">
            <Fila label="Descripción" valor={[venta.vehiculo_marca, venta.vehiculo_modelo, venta.vehiculo_anio].filter(Boolean).join(" ") || "—"} />
            <Fila label="Patente" valor={venta.vehiculo_patente} />
            {venta.vehiculo_id && <Fila label="ID de stock" valor={<span className="font-mono text-xs text-slate-400">{idCorto(venta.vehiculo_id)}</span>} />}
            <Fila label="Km" valor={venta.km ? Number(venta.km).toLocaleString("es-AR") : null} />
          </Seccion>

          <Seccion icono={User} titulo="Comprador">
            <Fila label="Nombre" valor={venta.comprador_nombre} />
            <Fila label="Teléfono" valor={venta.comprador_telefono} />
            <Fila label="Email" valor={venta.comprador_email} />
            <Fila label="DNI" valor={venta.comprador_dni} />
            {venta.cliente_id && <Fila label="Cliente CRM" valor={<span className="font-mono text-xs text-slate-400">{idCorto(venta.cliente_id)}</span>} />}
          </Seccion>

          <Seccion icono={DollarSign} titulo="Financiero">
            <Fila label="Precio" valor={`${venta.moneda_venta} ${Number(venta.precio_venta).toLocaleString("es-AR")}`} />
            <Fila label="Adelanto / seña" valor={totalSenas > 0 ? `${venta.moneda_venta} ${totalSenas.toLocaleString("es-AR")}` : null} />
            <Fila label="Método de pago" valor={venta.metodo_pago} />
            <Fila label="Cuotas" valor={venta.cuotas_plazo} />
            <Fila label="Fecha de venta" valor={fmtFechaLocal(venta.fecha_cierre)} />
            <Fila label="Fecha de entrega" valor={venta.fecha_entrega ? fmtFechaLocal(venta.fecha_entrega) : null} />
          </Seccion>

          {mandato && (
            <Seccion icono={KeyRound} titulo="Consignación">
              <Fila label="Precio con propietario" valor={mandato.valor ? `${mandato.moneda} ${Number(mandato.valor).toLocaleString("es-AR")}` : null} />
              <Fila label="Tipo" valor={mandato.tipo_tramite} />
              <Fila label="Propietario" valor={mandato.mandante_nombre} />
              <Fila label="Responsable" valor={venta.responsable_consignacion_id ? perfilMap[venta.responsable_consignacion_id] : null} />
            </Seccion>
          )}

          <Seccion
            icono={Percent}
            titulo="Comisión"
            accion={!editandoComision && (
              <button onClick={abrirEdicionComision} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"><Pencil className="w-3 h-3" /> Editar</button>
            )}
          >
            <Fila label="Vendedor" valor={venta.vendedor_id ? perfilMap[venta.vendedor_id] : null} />
            <Fila label="Comisión" valor={comisionMonto > 0 ? <span className="text-emerald-600 font-bold">{venta.moneda_venta} {comisionMonto.toLocaleString("es-AR")} <span className="font-normal text-slate-400">({comisionPct}%)</span></span> : null} />
            <Fila label="Responsable consignación" valor={venta.responsable_consignacion_id ? perfilMap[venta.responsable_consignacion_id] : null} />
            <Fila label="Gestor asignado" valor={venta.gestor_asignado_id ? perfilMap[venta.gestor_asignado_id] : null} />

            {editandoComision && (
              <div className="mt-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-2">
                {!soyAdmin && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-semibold"><ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Este cambio necesita aprobación del admin — no se aplica solo.</p>
                )}
                {solicitudEnviada ? (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Solicitud enviada, queda pendiente de aprobación en Autorizaciones.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Comisión vendedor (%)</label>
                        <input type="number" step="0.1" value={comisionVendedorPct} onChange={(e) => setComisionVendedorPct(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Comisión consignación (%)</label>
                        <input type="number" step="0.1" value={comisionConsignacionPct} onChange={(e) => setComisionConsignacionPct(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-sm outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditandoComision(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button>
                      <button onClick={guardarComision} disabled={guardandoComision} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50">
                        {guardandoComision ? "Guardando..." : soyAdmin ? "Guardar" : "Enviar solicitud"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Seccion>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Historial de estados ({historial.length})</p>
            <div className="space-y-1.5">
              {historial.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg px-3 py-2">
                  <span className={`text-xs font-bold ${ESTADO_COLOR[h.estado]}`}>{ESTADO_LABEL[h.estado] || h.estado}</span>
                  <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString("es-AR")} {h.autor?.nombre ? `· ${h.autor.nombre}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 p-4 sticky bottom-0 bg-white dark:bg-[#111] space-y-2">
          {mostrarStatus && (
            <div className="flex flex-col gap-1 bg-slate-50 dark:bg-white/5 rounded-xl p-2">
              {transicionesDisponibles.length === 0 && <p className="text-xs text-slate-400 px-2 py-1">Sin transiciones disponibles desde este estado.</p>}
              {transicionesDisponibles.map((e) => (
                <button key={e} onClick={() => cambiarEstado(e)} disabled={procesando} className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-white/10 text-left">
                  <span className="flex items-center gap-1.5">→ {ESTADO_LABEL[e]}</span>
                  {ESTADO_CON_AVISO.has(e) && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </button>
              ))}
              {puedeOperacionCaida && venta.estado !== "caida" && venta.estado !== "cancelada" && (
                <button onClick={() => { setMostrarStatus(false); setMostrarCaida(true); }} className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-white/10 text-left text-orange-600">
                  <span className="flex items-center gap-1.5">→ Operación caída</span> <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {mostrarCaida && (
            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Marcar operación caída</p>
              <p className="text-[11px] text-orange-700/80 dark:text-orange-300/70">Cancela la venta, devuelve el auto a stock como Disponible y anula las cuotas pendientes.</p>
              <label className="flex items-center gap-2 text-xs font-semibold text-orange-700 dark:text-orange-300">
                <input type="checkbox" checked={senaQuedaAgencia} onChange={(e) => setSenaQuedaAgencia(e.target.checked)} className="w-4 h-4 accent-orange-600" /> La seña queda en la agencia
              </label>
              {!senaQuedaAgencia && <p className="text-[10px] text-orange-700/70 dark:text-orange-300/60">Si le devolvés la plata al comprador, acordate de cargar el egreso en Finanzas — esto no toca la caja solo.</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setMostrarCaida(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancelar</button>
                <button onClick={marcarCaida} disabled={procesando} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50">Confirmar</button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-500">Cerrar</button>
            <button onClick={() => setMostrarStatus((v) => !v)} disabled={transicionesDisponibles.length === 0 && !puedeOperacionCaida} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40">
              → Cambiar status <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1" />
            <button onClick={() => onEditar(venta)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Pencil className="w-3.5 h-3.5" /> Editar</button>
            {soyAdmin && <button onClick={eliminar} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

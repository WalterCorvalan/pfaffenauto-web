"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import Link from "next/link";
import { X, Loader2, Pencil, Trash2, ChevronDown, AlertTriangle, ShieldAlert, Check, Car, User, DollarSign, Percent, KeyRound, FolderKanban, History, Copy, Printer } from "lucide-react";
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
  cuentas: any[];
  perfilMap: Record<string, string>;
  onClose: () => void;
  onActualizado: (v: any) => void;
  onEliminado: (id: string) => void;
  onEditar: (v: any) => void;
}

export default function VentaDetalleModal({ ventaId, miId, soyAdmin, puedeOperacionCaida, cuentas, perfilMap, onClose, onActualizado, onEliminado, onEditar }: Props) {
  const [venta, setVenta] = useState<any>(null);
  const [senas, setSenas] = useState<any[]>([]);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [cuotaParaCobrar, setCuotaParaCobrar] = useState<any>(null);
  const [cuentaCobroCuota, setCuentaCobroCuota] = useState("");
  const [cobrandoCuota, setCobrandoCuota] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [permutas, setPermutas] = useState<any[]>([]);
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
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  const cargar = async () => {
    const [{ data: v }, { data: s }, { data: h }, { data: exp }, { data: c }, { data: perm }] = await Promise.all([
      supabase2.from("ventas").select("*").eq("id", ventaId).single(),
      supabase2.from("venta_senas").select("*").eq("venta_id", ventaId).order("fecha"),
      supabase2.from("venta_estado_historial").select("*, autor:perfiles(nombre)").eq("venta_id", ventaId).order("created_at", { ascending: false }),
      supabase2.from("expedientes").select("id, estado").eq("venta_id", ventaId).maybeSingle(),
      supabase2.from("venta_cuotas").select("*").eq("venta_id", ventaId).order("numero"),
      supabase2.from("venta_permutas").select("*").eq("venta_id", ventaId),
    ]);
    setVenta(v);
    setSenas(s || []);
    setHistorial(h || []);
    setExpediente(exp || null);
    setCuotas(c || []);
    setPermutas(perm || []);

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

  const copiarCodigo = () => {
    navigator.clipboard.writeText(venta.codigo_seguimiento);
    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 1800);
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar esta venta? No se puede deshacer.")) return;
    const { error, count } = await supabase2.from("ventas").delete({ count: "exact" }).eq("id", ventaId);
    if (error || !count) { alert("No se pudo eliminar (sin permiso o ya no existe)."); return; }
    onEliminado(ventaId);
    onClose();
  };

  const confirmarCobroCuota = async () => {
    if (!cuotaParaCobrar || !cuentaCobroCuota) return alert("Elegí de qué cuenta entra el pago.");
    setCobrandoCuota(true);
    try {
      const { error } = await supabase2.rpc("cobrar_venta_cuota", { p_cuota_id: cuotaParaCobrar.id, p_cuenta_id: cuentaCobroCuota });
      if (error) throw error;
      setCuotas((prev) => prev.map((c) => (c.id === cuotaParaCobrar.id ? { ...c, estado: "pagada", fecha_pago: new Date().toISOString().slice(0, 10) } : c)));
      setCuotaParaCobrar(null);
    } catch (err: any) {
      alert(err.message || "No se pudo cobrar la cuota.");
    } finally {
      setCobrandoCuota(false);
    }
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
            {venta.codigo_seguimiento && (
              <button onClick={copiarCodigo} title="Copiar código de seguimiento — pasáselo al cliente para /seguimiento" className={`flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-xs font-bold font-mono transition-colors ${codigoCopiado ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"}`}>
                {codigoCopiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {codigoCopiado ? "Copiado" : venta.codigo_seguimiento}
              </button>
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
            <Fila label="Celular" valor={venta.comprador_telefono_celular} />
            <Fila label="Email" valor={venta.comprador_email} />
            <Fila label="DNI" valor={venta.comprador_dni} />
            <Fila label="CUIT/CUIL" valor={venta.comprador_cuit_cuil} />
            <Fila label="Fecha de nacimiento" valor={venta.comprador_fecha_nacimiento ? fmtFechaLocal(venta.comprador_fecha_nacimiento) : null} />
            <Fila label="Estado civil" valor={venta.comprador_estado_civil} />
            <Fila label="Profesión" valor={venta.comprador_profesion} />
            <Fila label="Domicilio" valor={[venta.comprador_calle && `${venta.comprador_calle} ${venta.comprador_numero || ""}`.trim(), venta.comprador_depto, venta.comprador_localidad, venta.comprador_provincia, venta.comprador_codigo_postal].filter(Boolean).join(", ") || null} />
            {venta.cliente_id && <Fila label="Cliente CRM" valor={<span className="font-mono text-xs text-slate-400">{idCorto(venta.cliente_id)}</span>} />}
          </Seccion>

          <Seccion icono={DollarSign} titulo="Financiero">
            <Fila label="Precio" valor={`${venta.moneda_venta} ${Number(venta.precio_venta).toLocaleString("es-AR")}`} />
            <Fila label="Adelanto / seña" valor={totalSenas > 0 ? `${venta.moneda_venta} ${totalSenas.toLocaleString("es-AR")}` : null} />
            <Fila label="Método de pago" valor={venta.metodo_pago} />
            <Fila label="Cuotas" valor={venta.cuotas_plazo} />
            <Fila label="En efectivo $ (ARS)" valor={venta.pago_efectivo_ars ? `$ ${Number(venta.pago_efectivo_ars).toLocaleString("es-AR")}` : null} />
            <Fila label="En efectivo u$s" valor={venta.pago_efectivo_usd ? `u$s ${Number(venta.pago_efectivo_usd).toLocaleString("es-AR")}` : null} />
            <Fila label="Tipo de cambio" valor={venta.tipo_cambio ? `$ ${Number(venta.tipo_cambio).toLocaleString("es-AR")}` : null} />
            <Fila label="Patent. / Transf." valor={venta.patentamiento_transferencia_monto ? `$ ${Number(venta.patentamiento_transferencia_monto).toLocaleString("es-AR")}` : null} />
            <Fila label="Fecha de venta" valor={fmtFechaLocal(venta.fecha_cierre)} />
            <Fila label="Fecha de entrega" valor={venta.fecha_entrega ? fmtFechaLocal(venta.fecha_entrega) : null} />
          </Seccion>

          {(venta.prenda_banco || venta.prenda_monto) && (
            <Seccion icono={DollarSign} titulo="Prenda">
              <Fila label="Banco" valor={venta.prenda_banco} />
              <Fila label="Prenda" valor={venta.prenda_monto ? `$ ${Number(venta.prenda_monto).toLocaleString("es-AR")}` : null} />
              <Fila label="Cuota de prenda" valor={venta.prenda_cuota_monto ? `$ ${Number(venta.prenda_cuota_monto).toLocaleString("es-AR")}` : null} />
              <Fila label="Seguro de prenda" valor={venta.prenda_seguro_monto ? `$ ${Number(venta.prenda_seguro_monto).toLocaleString("es-AR")}` : null} />
            </Seccion>
          )}

          {venta.seguro_contratado && (
            <Seccion icono={ShieldAlert} titulo="Seguro contratado">
              <Fila label="Compañía" valor={venta.seguro_compania} />
              <Fila label="Importe mensual" valor={venta.seguro_importe_mensual ? `$ ${Number(venta.seguro_importe_mensual).toLocaleString("es-AR")}` : null} />
            </Seccion>
          )}

          {permutas.map((p, i) => (
            <Seccion key={p.id} icono={Car} titulo={`Permuta${permutas.length > 1 ? ` #${i + 1}` : ""}`}>
              <Fila label="Vehículo" valor={[p.marca, p.modelo, p.anio].filter(Boolean).join(" ") || null} />
              <Fila label="Patente" valor={p.patente} />
              <Fila label="Valor tomado" valor={p.valor ? `${p.moneda} ${Number(p.valor).toLocaleString("es-AR")}` : null} />
              <Fila label="Precio publicación" valor={p.precio_publicacion ? `${p.moneda} ${Number(p.precio_publicacion).toLocaleString("es-AR")}` : null} />
              <Fila label="Segmento / Tipo" valor={[p.segmento, p.tipo].filter(Boolean).join(" · ") || null} />
              <Fila label="Combustible" valor={p.combustible} />
              <Fila label="Motor" valor={[p.marca_motor, p.numero_motor].filter(Boolean).join(" · ") || null} />
              <Fila label="Chasis" valor={[p.marca_chasis, p.numero_chasis].filter(Boolean).join(" · ") || null} />
              <Fila label="Radicado" valor={[p.radicado_localidad, p.radicado_provincia].filter(Boolean).join(", ") || null} />
              <Fila label="Tasado en" valor={p.tasado_en} />
              <Fila label="Dueño" valor={p.dueno_nombre} />
              {p.vehiculo_creado_id && <Fila label="Cargado a Stock" valor={<span className="font-mono text-xs text-emerald-500">{idCorto(p.vehiculo_creado_id)}</span>} />}
            </Seccion>
          ))}

          {cuotas.length > 0 && (
            <Seccion icono={DollarSign} titulo={`Cuotas (${cuotas.filter((c) => c.estado === "pagada").length}/${cuotas.length} cobradas)`}>
              {cuotas.map((c) => (
                <div key={c.id} className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0 items-center">
                  <p className="text-sm text-slate-800 dark:text-white col-span-1">Cuota N° {c.numero} {c.vencimiento ? `· vence ${fmtFechaLocal(c.vencimiento)}` : ""}</p>
                  <p className="text-sm text-slate-800 dark:text-white col-span-1">{c.moneda} {Number(c.monto).toLocaleString("es-AR")}</p>
                  <div className="col-span-1 text-right">
                    {c.estado === "pagada" ? (
                      <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">Cobrada {c.fecha_pago ? fmtFechaLocal(c.fecha_pago) : ""}</span>
                    ) : (
                      <button
                        onClick={() => { setCuotaParaCobrar(c); setCuentaCobroCuota(cuentas.find((x) => x.moneda === c.moneda)?.id || ""); }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20"
                      >
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Seccion>
          )}

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
            <Link href={`/panel-v2/ventas/imprimir/${venta.id}`} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg"><Printer className="w-3.5 h-3.5" /> Recibo</Link>
            <button onClick={() => onEditar(venta)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Pencil className="w-3.5 h-3.5" /> Editar</button>
            {soyAdmin && <button onClick={eliminar} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>}
          </div>
        </div>
      </div>

      {cuotaParaCobrar && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setCuotaParaCobrar(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Cobrar cuota N° {cuotaParaCobrar.numero}</h3><button onClick={() => setCuotaParaCobrar(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Entra {cuotaParaCobrar.moneda} {Number(cuotaParaCobrar.monto).toLocaleString("es-AR")} a la cuenta que elijas.</p>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Cuenta *</label>
            <select value={cuentaCobroCuota} onChange={(e) => setCuentaCobroCuota(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="">— Elegí —</option>
              {cuentas.filter((c) => c.moneda === cuotaParaCobrar.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCuotaParaCobrar(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={confirmarCobroCuota} disabled={cobrandoCuota} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">{cobrandoCuota ? "Guardando..." : "Confirmar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

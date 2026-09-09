"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { hoyLocalISO } from "@/lib/panelV2/fechas";
import { X, UserPlus, Trash2 } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";
const helpClass = "text-[11px] text-slate-400 mt-1";

interface Vehiculo { id: string; marca: string; modelo: string; patente: string | null }

export default function NuevaInfraccionModal({ infraccion, vehiculos, onClose, onGuardada }: { infraccion?: any; vehiculos: Vehiculo[]; onClose: () => void; onGuardada: (i: any) => void }) {
  const isEditing = !!infraccion?.id;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [fecha, setFecha] = useState(infraccion?.fecha || hoyLocalISO());
  const [mesEditadoManual, setMesEditadoManual] = useState(!!infraccion);
  const [mes, setMes] = useState(infraccion?.mes ? infraccion.mes.slice(0, 7) : hoyLocalISO().slice(0, 7));
  const [jurisdiccion, setJurisdiccion] = useState(infraccion?.jurisdiccion || "");
  const [estado, setEstado] = useState(infraccion?.estado || "Pendiente");

  const [clienteNombre, setClienteNombre] = useState(infraccion?.cliente_nombre || "");
  const [dominioDni, setDominioDni] = useState(infraccion?.dominio_dni || "");

  const [deudaArs, setDeudaArs] = useState(infraccion?.deuda_ars != null ? String(infraccion.deuda_ars) : "");
  const [pagoClienteArs, setPagoClienteArs] = useState(infraccion?.pago_cliente_ars != null ? String(infraccion.pago_cliente_ars) : "");
  const [pagoRealArs, setPagoRealArs] = useState(infraccion?.pago_real_ars != null ? String(infraccion.pago_real_ars) : "");
  const [medioPago, setMedioPago] = useState(infraccion?.medio_pago || "");

  const [planilla, setPlanilla] = useState(infraccion?.planilla || "");
  const [gestor, setGestor] = useState(infraccion?.gestor || "");
  const [vehiculoId, setVehiculoId] = useState(infraccion?.vehiculo_id || "");
  const [comentarios, setComentarios] = useState(infraccion?.comentarios || "");

  const cambiarFecha = (val: string) => {
    setFecha(val);
    if (!mesEditadoManual && val) setMes(val.slice(0, 7));
  };

  const guardar = async () => {
    if (estado === "Pagado" && (!pagoClienteArs || !pagoRealArs)) {
      setError('Para marcar como "Pagado" completá el pago del cliente y el pago real.');
      return;
    }
    setCargando(true);
    setError("");
    try {
      const payload = {
        fecha,
        mes: `${mes}-01`,
        jurisdiccion: jurisdiccion || null,
        estado,
        cliente_nombre: clienteNombre || null,
        dominio_dni: dominioDni || null,
        deuda_ars: deudaArs ? Number(deudaArs) : null,
        pago_cliente_ars: pagoClienteArs ? Number(pagoClienteArs) : null,
        pago_real_ars: pagoRealArs ? Number(pagoRealArs) : null,
        medio_pago: medioPago || null,
        planilla: planilla || null,
        gestor: gestor || null,
        vehiculo_id: vehiculoId || null,
        comentarios: comentarios || null,
      };
      const { data, error: err } = isEditing
        ? await supabase2.from("infracciones").update(payload).eq("id", infraccion.id).select().single()
        : await supabase2.from("infracciones").insert(payload).select().single();
      if (err) throw err;
      onGuardada(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo guardar la infracción.");
    } finally {
      setCargando(false);
    }
  };

  const borrar = async () => {
    if (!confirm("¿Eliminar esta infracción? Esta acción no se puede deshacer.")) return;
    setCargando(true);
    try {
      const { error: err } = await supabase2.from("infracciones").delete().eq("id", infraccion.id);
      if (err) throw err;
      onGuardada({ ...infraccion, _eliminada: true });
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar (puede que solo admin pueda borrar infracciones).");
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Registrá una multa a gestionar por la planilla correspondiente.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 ml-3"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-5">
          {error && <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Identificación</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Mes (YYYY-MM) *</label>
                <input type="month" value={mes} onChange={(e) => { setMes(e.target.value); setMesEditadoManual(true); }} className={inputClass} />
                <p className={helpClass}>Se sincroniza con la fecha hasta que lo edites.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className={labelClass}>Jurisdicción</label><input value={jurisdiccion} onChange={(e) => setJurisdiccion(e.target.value)} placeholder="PBA" className={inputClass} /></div>
              <div>
                <label className={labelClass}>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  {["Pendiente", "En trámite", "Pagado", "Cancelado"].map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Nombre del cliente</label><input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre y apellido" className={inputClass} /></div>
              <div><label className={labelClass}>Dominio / DNI</label><input value={dominioDni} onChange={(e) => setDominioDni(e.target.value)} placeholder="AB123CD o DNI" className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Pagos</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>Deuda (ARS)</label><input type="number" value={deudaArs} onChange={(e) => setDeudaArs(e.target.value)} placeholder="0" className={inputClass} /></div>
              <div><label className={labelClass}>Pago del cliente (ARS)</label><input type="number" value={pagoClienteArs} onChange={(e) => setPagoClienteArs(e.target.value)} placeholder="0" className={inputClass} /></div>
              <div><label className={labelClass}>Pago real (ARS)</label><input type="number" value={pagoRealArs} onChange={(e) => setPagoRealArs(e.target.value)} placeholder="0" className={inputClass} /></div>
            </div>
            <div className="mt-3"><label className={labelClass}>Medio de pago</label><input value={medioPago} onChange={(e) => setMedioPago(e.target.value)} placeholder="Transferencia, Efectivo, M..." className={inputClass} /></div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Gestión</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Planilla</label>
                <input value={planilla} onChange={(e) => setPlanilla(e.target.value)} placeholder="Nombre de la administrativa..." className={inputClass} />
                <p className={helpClass}>Administrativa a cargo. Escribí el nombre — si es nueva, queda como planilla propia.</p>
              </div>
              <div><label className={labelClass}>Gestor</label><input value={gestor} onChange={(e) => setGestor(e.target.value)} placeholder="Quién la gestiona (opcional)" className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Vehículo vinculado (opcional)</p>
            <label className={labelClass}>Vehículo</label>
            <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Sin vincular</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.patente ? ` — ${v.patente}` : ""}</option>)}
            </select>
            <p className={helpClass}>Elegí un vehículo del stock o dejá vacío si aún no se detectó.</p>
          </div>

          <div>
            <label className={labelClass}>Comentarios</label>
            <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={3} placeholder="Detalles de gestión, comprobantes, etc." className={inputClass} />
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          {isEditing && (
            <button onClick={borrar} disabled={cargando} className="mr-auto p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50" title="Eliminar infracción">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} disabled={cargando} className={`px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 ${!isEditing && "ml-auto"}`}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            <UserPlus className="w-4 h-4" /> {cargando ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear infracción"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Wallet, Save, X } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-white/10 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5";

// Edición liviana: corrige los datos que suelen tener errores de tipeo
// (nombre, DNI, contacto, monto) sin volver a disparar los efectos
// colaterales de la carga inicial (estado del vehículo, movimiento de caja,
// notificaciones) — esos ya pasaron y no hay que repetirlos al corregir un
// dato mal cargado.
export default function EditarSenaModal({ sena, vendedores, sucursales, onClose, onGuardado }: {
  sena: any; vendedores: any[]; sucursales: any[]; onClose: () => void; onGuardado: (s: any) => void;
}) {
  const [guardando, setGuardando] = useState(false);
  const [apellido, setApellido] = useState(sena.apellido || "");
  const [nombre, setNombre] = useState(sena.nombre || "");
  const [dni, setDni] = useState(sena.dni || "");
  const [telefono, setTelefono] = useState(sena.telefono_celular || "");
  const [email, setEmail] = useState(sena.correo_electronico || "");
  const [sucursalId, setSucursalId] = useState(sena.sucursal_id || "");
  const [vendedorId, setVendedorId] = useState(sena.vendedor_id || "");
  const [marca, setMarca] = useState(sena.marca || "");
  const [modelo, setModelo] = useState(sena.modelo || "");
  const [ventaArs, setVentaArs] = useState(sena.venta_ars != null ? String(sena.venta_ars) : "");
  const [ventaUsd, setVentaUsd] = useState(sena.venta_usd != null ? String(sena.venta_usd) : "");
  const [senaArs, setSenaArs] = useState(sena.sena_ars != null ? String(sena.sena_ars) : "");
  const [senaUsd, setSenaUsd] = useState(sena.sena_usd != null ? String(sena.sena_usd) : "");
  const [observaciones, setObservaciones] = useState(sena.notas || "");

  const guardar = async () => {
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("senas").update({
        apellido: apellido || null, nombre: nombre || null,
        cliente_nombre: `${apellido || ""} ${nombre || ""}`.trim() || sena.cliente_nombre,
        dni: dni || null, telefono_celular: telefono || null, correo_electronico: email || null,
        sucursal_id: sucursalId || null, vendedor_id: vendedorId || null,
        marca: marca || null, modelo: modelo || null,
        venta_ars: ventaArs ? Number(ventaArs) : null, venta_usd: ventaUsd ? Number(ventaUsd) : null,
        sena_ars: senaArs ? Number(senaArs) : null, sena_usd: senaUsd ? Number(senaUsd) : null,
        monto: senaArs ? Number(senaArs) : (senaUsd ? Number(senaUsd) : null),
        moneda: senaUsd && !senaArs ? "USD" : "ARS",
        notas: observaciones || null,
      }).eq("id", sena.id).select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre )").single();
      if (error) throw error;
      onGuardado(data);
      onClose();
    } catch {
      alert("No se pudo guardar el cambio.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { if (!guardando && window.innerWidth >= 768) onClose(); }} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Wallet className="w-5 h-5 text-rose-600" /> Editar Seña {sena.numero ? `N° ${sena.numero}` : ""}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Apellido</label><input className={inputClass} value={apellido} onChange={(e) => setApellido(e.target.value)} /></div>
            <div><label className={labelClass}>Nombre</label><input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div><label className={labelClass}>DNI</label><input className={inputClass} value={dni} onChange={(e) => setDni(e.target.value)} /></div>
            <div><label className={labelClass}>Teléfono</label><input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
            <div className="col-span-2"><label className={labelClass}>Email</label><input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Sucursal</label><select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}><option value="">—</option>{sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
            <div><label className={labelClass}>Vendedor</label><select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="">—</option>{vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Marca</label><input className={inputClass} value={marca} onChange={(e) => setMarca(e.target.value)} /></div>
            <div><label className={labelClass}>Modelo</label><input className={inputClass} value={modelo} onChange={(e) => setModelo(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Venta ($)</label><input type="number" step="0.01" className={inputClass} value={ventaArs} onChange={(e) => setVentaArs(e.target.value)} /></div>
            <div><label className={labelClass}>Venta (US$)</label><input type="number" step="0.01" className={inputClass} value={ventaUsd} onChange={(e) => setVentaUsd(e.target.value)} /></div>
            <div><label className={labelClass}>Seña ($)</label><input type="number" step="0.01" className={inputClass} value={senaArs} onChange={(e) => setSenaArs(e.target.value)} /></div>
            <div><label className={labelClass}>Seña (US$)</label><input type="number" step="0.01" className={inputClass} value={senaUsd} onChange={(e) => setSenaUsd(e.target.value)} /></div>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Si corregís el monto de la seña acá, no se ajusta solo el movimiento ya registrado en Finanzas (si lo hubo) — avisá a Tesorería si hace falta.</p>

          <div><label className={labelClass}>Observaciones</label><textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div>
        </div>

        <div className="flex gap-2 p-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          <button type="button" onClick={onClose} disabled={guardando} className="ml-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

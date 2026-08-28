"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Trash2 } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

const inputClass = "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-full";

export default function NuevaOtModal({ mecanicos, onClose }: { mecanicos: any[]; onClose: () => void }) {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    cuando: "Ingresa ahora",
    tipo_orden: "externo",
    moneda: "USD",
    cliente_nombre: "",
    cliente_telefono: "",
    marca: "",
    modelo: "",
    patente: "",
    anio: "",
    km_ingreso: "",
    mecanico_id: "",
    motivo_ingreso: "",
    combustible_pct: "",
    objetos_dejados: "",
  });

  const [danos, setDanos] = useState<{ zona: string; detalle: string }[]>([
    { zona: "", detalle: "" }
  ]);

  const guardarOT = async () => {
    if (!formData.cliente_nombre.trim() || !formData.marca.trim() || !formData.modelo.trim()) {
      alert("Faltan datos obligatorios: Cliente, Marca y Modelo.");
      return;
    }
    setCargando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      
      const payload = {
        origen: "taller",
        tipo_orden: formData.tipo_orden,
        moneda: formData.moneda,
        cliente_nombre: formData.cliente_nombre,
        cliente_telefono: formData.cliente_telefono,
        marca: formData.marca,
        modelo: formData.modelo,
        patente: formData.patente,
        anio: formData.anio ? parseInt(formData.anio) : null,
        km_ingreso: formData.km_ingreso ? parseFloat(formData.km_ingreso) : null,
        mecanico_id: formData.mecanico_id || null,
        motivo_ingreso: formData.motivo_ingreso,
        combustible_pct: formData.combustible_pct ? parseInt(formData.combustible_pct) : null,
        objetos_dejados: formData.objetos_dejados,
        danos_ingreso: danos.filter(d => d.zona.trim() !== ""),
        creado_por: user?.id
      };

      const { error } = await supabase2.from("taller_ordenes").insert(payload);
      if (error) throw error;
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al crear la OT.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-6 pb-0 shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-[13px] text-slate-500 dark:text-slate-400">
              Ingreso del auto al taller: cliente, vehículo y estado de recepción.
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">¿Cuándo?</label>
              <select className={inputClass} value={formData.cuando} onChange={(e) => setFormData({ ...formData, cuando: e.target.value })}>
                <option value="Ingresa ahora">Ingresa ahora</option>
                <option value="Programado">Programado</option>
              </select>
            </div>
            <div className="opacity-0 hidden" /> {/* Espaciador si fuera necesario */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Tipo de orden</label>
              <select className={inputClass} value={formData.tipo_orden} onChange={(e) => setFormData({ ...formData, tipo_orden: e.target.value })}>
                <option value="externo">Cliente externo (de la calle)</option>
                <option value="stock">Vehículo de stock</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Moneda</label>
              <select className={inputClass} value={formData.moneda} onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}>
                <option value="USD">USD (dólares)</option>
                <option value="ARS">ARS (pesos)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Cliente <span className="text-rose-500">*</span></label>
              <input className={inputClass} placeholder="Nombre y apellido" value={formData.cliente_nombre} onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Teléfono</label>
              <input className={inputClass} placeholder="11 2345 6789" value={formData.cliente_telefono} onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Marca <span className="text-rose-500">*</span></label>
              <select className={inputClass} value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })}>
                <option value="">Elegí la marca...</option>
                <option value="Toyota">Toyota</option>
                <option value="Volkswagen">Volkswagen</option>
                <option value="Ford">Ford</option>
                {/* ... resto de marcas ... */}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Modelo <span className="text-rose-500">*</span></label>
              <input className={inputClass} value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Patente</label>
              <input className={inputClass} value={formData.patente} onChange={(e) => setFormData({ ...formData, patente: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Año</label>
              <input className={inputClass} placeholder="2018" value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Km al ingresar</label>
              <input className={inputClass} placeholder="85000" type="number" value={formData.km_ingreso} onChange={(e) => setFormData({ ...formData, km_ingreso: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Mecánico a cargo</label>
              <select className={inputClass} value={formData.mecanico_id} onChange={(e) => setFormData({ ...formData, mecanico_id: e.target.value })}>
                <option value="">Sin asignar</option>
                {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Motivo de ingreso (lo que dice el cliente)</label>
            <textarea 
              className={`${inputClass} resize-none`} 
              rows={3} 
              placeholder="Hace ruido al frenar, luz de check encendida..." 
              value={formData.motivo_ingreso} 
              onChange={(e) => setFormData({ ...formData, motivo_ingreso: e.target.value })} 
            />
          </div>

          {/* Ficha de Ingreso */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Ficha de ingreso</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Combustible (%)</label>
                <input className={inputClass} placeholder="50" type="number" value={formData.combustible_pct} onChange={(e) => setFormData({ ...formData, combustible_pct: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Objetos dejados en el auto</label>
                <input className={inputClass} placeholder="Documentos, llave de rueda..." value={formData.objetos_dejados} onChange={(e) => setFormData({ ...formData, objetos_dejados: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-600">Daños / observaciones al ingresar</label>
                <button onClick={() => setDanos([...danos, { zona: "", detalle: "" }])} className="text-rose-600 text-xs font-medium hover:underline">+ Agregar</button>
              </div>
              {danos.map((dano, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input className={inputClass} placeholder="Zona (ej. paragolpes del.)" value={dano.zona} onChange={(e) => { const n = [...danos]; n[index].zona = e.target.value; setDanos(n); }} />
                  <input className={inputClass} placeholder="Detalle (ej. rayón)" value={dano.detalle} onChange={(e) => { const n = [...danos]; n[index].detalle = e.target.value; setDanos(n); }} />
                  <button onClick={() => setDanos(danos.filter((_, i) => i !== index))} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div>
               <label className="text-xs text-slate-600 mb-1.5 block">Fotos del estado de ingreso (máx 20)</label>
               <input type="file" multiple className="text-xs" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl text-slate-700">Cancelar</button>
          <button onClick={guardarOT} disabled={cargando} className="px-6 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl shadow-sm hover:bg-rose-700">Crear OT</button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";

const inputClass = "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-full";

export default function TallerConfigModal({
  configuracion,
  mecanicos: mecanicosIniciales,
  servicios: serviciosIniciales,
  onClose
}: {
  configuracion: any;
  mecanicos: any[];
  servicios: any[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const [config, setConfig] = useState({
    capacidad_diaria: configuracion?.capacidad_diaria || "",
    iva_pct: configuracion?.iva_pct || "",
    extra_vendedor_pct: configuracion?.extra_vendedor_pct ?? 50,
    garantia_dias: configuracion?.garantia_dias || "",
    garantia_km: configuracion?.garantia_km || "",
    validez_presupuesto_dias: configuracion?.validez_presupuesto_dias || "",
    condiciones_pago: configuracion?.condiciones_pago || "",
  });

  const [mecanicos, setMecanicos] = useState(
    mecanicosIniciales.map(m => ({ ...m, _estado: 'db' }))
  );
  const [servicios, setServicios] = useState(
    serviciosIniciales.map(s => ({ ...s, _estado: 'db' }))
  );

  const [mecanicosBorrados, setMecanicosBorrados] = useState<string[]>([]);
  const [serviciosBorrados, setServiciosBorrados] = useState<string[]>([]);

  const agregarMecanico = () => {
    setMecanicos([...mecanicos, { id: crypto.randomUUID(), nombre: "", _estado: 'nuevo' }]);
  };

  const eliminarMecanico = (id: string, estado: string) => {
    if (estado === 'db') setMecanicosBorrados([...mecanicosBorrados, id]);
    setMecanicos(mecanicos.filter(m => m.id !== id));
  };

  const agregarServicio = () => {
    setServicios([...servicios, { id: crypto.randomUUID(), nombre: "", precio: "", moneda: "USD", _estado: 'nuevo' }]);
  };

  const eliminarServicio = (id: string, estado: string) => {
    if (estado === 'db') setServiciosBorrados([...serviciosBorrados, id]);
    setServicios(servicios.filter(s => s.id !== id));
  };

  const guardar = async () => {
    setCargando(true);
    try {
      // 1. Configuración principal
      const payloadConfig = {
        id: "default",
        capacidad_diaria: config.capacidad_diaria ? parseInt(config.capacidad_diaria) : 0,
        iva_pct: config.iva_pct ? parseFloat(config.iva_pct) : null,
        extra_vendedor_pct: config.extra_vendedor_pct ? parseFloat(config.extra_vendedor_pct) : 50,
        garantia_dias: config.garantia_dias ? parseInt(config.garantia_dias) : null,
        garantia_km: config.garantia_km ? parseInt(config.garantia_km) : null,
        validez_presupuesto_dias: config.validez_presupuesto_dias ? parseInt(config.validez_presupuesto_dias) : 0,
        condiciones_pago: config.condiciones_pago || null,
        updated_at: new Date().toISOString()
      };
      await supabase2.from("taller_config").upsert(payloadConfig);

      // 2. Mecánicos
      const validMecanicos = mecanicos.filter(m => m.nombre.trim());
      if (validMecanicos.length > 0) {
        await supabase2.from("taller_mecanicos").upsert(
          validMecanicos.map(m => ({ id: m._estado === 'nuevo' ? undefined : m.id, nombre: m.nombre, activo: true }))
        );
      }
      if (mecanicosBorrados.length > 0) {
        await supabase2.from("taller_mecanicos").update({ activo: false }).in("id", mecanicosBorrados);
      }

      // 3. Servicios
      const validServicios = servicios.filter(s => s.nombre.trim());
      if (validServicios.length > 0) {
        await supabase2.from("taller_servicios").upsert(
          validServicios.map(s => ({
            id: s._estado === 'nuevo' ? undefined : s.id,
            nombre: s.nombre,
            precio: s.precio ? parseFloat(s.precio) : null,
            moneda: s.moneda,
            activo: true
          }))
        );
      }
      if (serviciosBorrados.length > 0) {
        await supabase2.from("taller_servicios").update({ activo: false }).in("id", serviciosBorrados);
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la configuración.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-6 pb-0 shrink-0 flex items-start justify-between">
          <h2 className="text-[13px] text-slate-500 dark:text-slate-400">
            Mecánicos, servicios, capacidad y garantía por defecto.
          </h2>
          <button onClick={onClose} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-6 custom-scrollbar">
          
          {/* Bloque Mecánicos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mecánicos</h3>
              <button onClick={agregarMecanico} className="text-rose-600 text-[13px] font-medium hover:underline">+ Agregar</button>
            </div>
            {mecanicos.length === 0 ? (
              <p className="text-[13px] text-slate-500 mb-2">Sin mecánicos cargados.</p>
            ) : (
              <div className="space-y-2">
                {mecanicos.map((m, i) => (
                  <div key={m.id} className="flex gap-2 items-center">
                    <input 
                      className={inputClass} 
                      placeholder="Nombre del mecánico" 
                      value={m.nombre} 
                      onChange={(e) => { const n = [...mecanicos]; n[i].nombre = e.target.value; setMecanicos(n); }} 
                    />
                    <button onClick={() => eliminarMecanico(m.id, m._estado)} className="p-2 text-slate-400 hover:text-rose-600 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloque Servicios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Servicios (precio base)</h3>
              <button onClick={agregarServicio} className="text-rose-600 text-[13px] font-medium hover:underline">+ Agregar</button>
            </div>
            {servicios.length === 0 ? (
              <p className="text-[13px] text-slate-500 mb-2">Sin servicios en el catálogo.</p>
            ) : (
              <div className="space-y-2">
                {servicios.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <input 
                      className={`${inputClass} flex-1`} 
                      placeholder="Ej. Service completo" 
                      value={s.nombre} 
                      onChange={(e) => { const n = [...servicios]; n[i].nombre = e.target.value; setServicios(n); }} 
                    />
                    <input 
                      className={`${inputClass} !w-24 shrink-0`} 
                      type="number" 
                      placeholder="Precio" 
                      value={s.precio} 
                      onChange={(e) => { const n = [...servicios]; n[i].precio = e.target.value; setServicios(n); }} 
                    />
                    <select 
                      className={`${inputClass} !w-20 shrink-0`} 
                      value={s.moneda} 
                      onChange={(e) => { const n = [...servicios]; n[i].moneda = e.target.value; setServicios(n); }}
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                    </select>
                    <button onClick={() => eliminarServicio(s.id, s._estado)} className="p-2 text-slate-400 hover:text-rose-600 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-white/10" />

          {/* Grilla Configuración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Capacidad diaria (autos)</label>
              <input className={inputClass} placeholder="0 = sin tope" type="number" value={config.capacidad_diaria} onChange={e => setConfig({...config, capacidad_diaria: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">IVA (%)</label>
              <input className={inputClass} type="number" value={config.iva_pct} onChange={e => setConfig({...config, iva_pct: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Extra vendedor (% para el vendedor)</label>
              <input className={inputClass} type="number" value={config.extra_vendedor_pct} onChange={e => setConfig({...config, extra_vendedor_pct: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Garantía por defecto (días)</label>
              <input className={inputClass} type="number" value={config.garantia_dias} onChange={e => setConfig({...config, garantia_dias: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Garantía por defecto (km)</label>
              <input className={inputClass} type="number" value={config.garantia_km} onChange={e => setConfig({...config, garantia_km: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Validez del presupuesto (días · 0 = no mostrar)</label>
              <input className={inputClass} type="number" value={config.validez_presupuesto_dias} onChange={e => setConfig({...config, validez_presupuesto_dias: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Condiciones de pago (se muestran al cliente en el presupuesto)</label>
            <textarea 
              className={`${inputClass} resize-none`} 
              rows={3} 
              placeholder="Ej: 50% de anticipo · efectivo o transferencia · precios + IVA" 
              value={config.condiciones_pago} 
              onChange={e => setConfig({...config, condiciones_pago: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300">Cancelar</button>
          <button onClick={guardar} disabled={cargando} className="px-6 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl shadow-sm hover:bg-rose-700 disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}
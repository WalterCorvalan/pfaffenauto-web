"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Camera } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";
import { crearAlerta } from "@/lib/panelV2/alertas";

interface Props {
  miId: string;
  onClose: () => void;
  onCreado: (compra: any) => void;
}

export default function EscanearBoletoModal({ miId, onClose, onCreado }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [dominio, setDominio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [fechaVenta, setFechaVenta] = useState(hoyLocalISO());
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    if (!nombre.trim()) {
      setError("Falta el nombre del comprador.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase2
        .from("postventa_compras")
        .insert({
          comprador_nombre: nombre.trim(), comprador_telefono: telefono || null, comprador_dni: dni || null,
          vehiculo_dominio: dominio || null, vehiculo_marca: marca || null, vehiculo_modelo: modelo || null,
          vehiculo_anio: anio ? Number(anio) : null, fecha_venta: fechaVenta,
          precio: precio ? Number(precio) : null, moneda,
          origen: "escaneo_boleto", creado_por: miId || null,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      if (miId) {
        crearAlerta(supabase2, miId, `Nueva compra registrada — ${data.comprador_nombre}`, {
          mensaje: `${data.vehiculo_marca || ""} ${data.vehiculo_modelo || ""} (postventa).`,
          link: "/panel-v2/postventa", tipo: "cliente", prioridad: "novedad",
        });
      }
      onCreado(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la compra.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Sacá una foto del boleto y revisá los datos antes de guardar.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <label title="Necesita OCR (Google Vision), todavía no conectado — cargá los datos a mano abajo" className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl py-8 mb-4 opacity-60 cursor-not-allowed">
          <input type="file" accept="image/*" capture="environment" disabled className="hidden" />
          <Camera className="w-6 h-6 text-slate-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sacar foto / elegir imagen del boleto</p>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Nombre del comprador *</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Teléfono</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>DNI</label><input value={dni} onChange={(e) => setDni(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Dominio / Patente</label><input value={dominio} onChange={(e) => setDominio(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Marca</label><input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Modelo</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Año</label><input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Fecha de venta</label><input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Precio</label><input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className={inputClass} /></div>
          <div>
            <label className={labelClass}>Moneda</label>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select>
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2 mt-3">{error}</p>}

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cerrar</button>
          <button type="button" onClick={guardar} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}

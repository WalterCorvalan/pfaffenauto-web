"use client";

import { useState } from "react";
import { Car, Check, X, Pencil } from "lucide-react";

export interface VehiculoDatos {
  vehiculo_id: string | null;
  dominio: string;
  segmento: string;
  marca: string;
  modelo: string;
  tipo: string;
  marca_motor: string;
  numero_motor: string;
  marca_chasis: string;
  numero_chasis: string;
  modelo_anio: string;
  color: string;
  kilometros: string;
  combustible: string;
}

const VACIO: VehiculoDatos = {
  vehiculo_id: null, dominio: "", segmento: "", marca: "", modelo: "", tipo: "",
  marca_motor: "", numero_motor: "", marca_chasis: "", numero_chasis: "",
  modelo_anio: "", color: "", kilometros: "", combustible: "",
};

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400";

export default function VehiculoSelector({
  vehiculos,
  datos,
  onCambiar,
}: {
  vehiculos: any[];
  datos: VehiculoDatos | null;
  onCambiar: (datos: VehiculoDatos | null) => void;
}) {
  const [modoManual, setModoManual] = useState(false);

  const seleccionarDeStock = (id: string) => {
    if (!id) return;
    const v = vehiculos.find((x) => x.id === id);
    if (!v) return;
    onCambiar({
      vehiculo_id: v.id,
      dominio: v.patente || "",
      segmento: v.segmento || "",
      marca: v.marca || "",
      modelo: v.modelo || "",
      tipo: v.tipo || "",
      marca_motor: v.marca || "",
      numero_motor: v.numero_motor || "",
      marca_chasis: v.marca || "",
      numero_chasis: v.numero_chasis || "",
      modelo_anio: String(v.anio || ""),
      color: v.color || "",
      kilometros: String(v.kilometraje || ""),
      combustible: v.tipo_combustible || "",
    });
  };

  if (datos && !modoManual) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
            <Check className="w-4 h-4 shrink-0" /> {datos.marca} {datos.modelo} {datos.dominio ? `(${datos.dominio})` : ""}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">{datos.modelo_anio || "—"} · {datos.color || "—"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setModoManual(true)} className="text-emerald-600 hover:text-emerald-800 bg-white border border-emerald-200 p-2 rounded-lg transition-colors" title="Editar campos">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onCambiar(null)} className="text-emerald-600 hover:text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors">
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  if (modoManual) {
    const d = datos || VACIO;
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Datos del vehículo</span>
          <button type="button" onClick={() => setModoManual(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Dominio" value={d.dominio} onChange={(e) => onCambiar({ ...d, dominio: e.target.value })} />
          <input className={inputClass} placeholder="Segmento" value={d.segmento} onChange={(e) => onCambiar({ ...d, segmento: e.target.value })} />
          <input className={inputClass} placeholder="Marca *" value={d.marca} onChange={(e) => onCambiar({ ...d, marca: e.target.value })} />
          <input className={inputClass} placeholder="Modelo *" value={d.modelo} onChange={(e) => onCambiar({ ...d, modelo: e.target.value })} />
          <input className={inputClass} placeholder="Tipo" value={d.tipo} onChange={(e) => onCambiar({ ...d, tipo: e.target.value })} />
          <input className={inputClass} placeholder="Año" value={d.modelo_anio} onChange={(e) => onCambiar({ ...d, modelo_anio: e.target.value })} />
          <input className={inputClass} placeholder="Color" value={d.color} onChange={(e) => onCambiar({ ...d, color: e.target.value })} />
          <input className={inputClass} placeholder="Kilómetros" value={d.kilometros} onChange={(e) => onCambiar({ ...d, kilometros: e.target.value })} />
          <input className={inputClass} placeholder="Combustible" value={d.combustible} onChange={(e) => onCambiar({ ...d, combustible: e.target.value })} />
          <input className={inputClass} placeholder="Marca de motor" value={d.marca_motor} onChange={(e) => onCambiar({ ...d, marca_motor: e.target.value })} />
          <input className={inputClass} placeholder="Número de motor" value={d.numero_motor} onChange={(e) => onCambiar({ ...d, numero_motor: e.target.value })} />
          <input className={inputClass} placeholder="Marca de chasis" value={d.marca_chasis} onChange={(e) => onCambiar({ ...d, marca_chasis: e.target.value })} />
          <input className={inputClass} placeholder="Número de chasis" value={d.numero_chasis} onChange={(e) => onCambiar({ ...d, numero_chasis: e.target.value })} />
        </div>
        <button
          type="button"
          onClick={() => setModoManual(false)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest transition-colors"
        >
          Listo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        onChange={(e) => seleccionarDeStock(e.target.value)}
        defaultValue=""
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 cursor-pointer text-slate-900"
      >
        <option value="">Elegir del stock...</option>
        {vehiculos.map((v) => (
          <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.patente ? `— ${v.patente}` : ""}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setModoManual(true)}
        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-[12px] font-bold"
      >
        <Car className="w-3.5 h-3.5" /> Cargar vehículo manualmente
      </button>
    </div>
  );
}

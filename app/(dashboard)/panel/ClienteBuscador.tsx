"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Search, UserPlus, X, Check } from "lucide-react";

export interface ClienteSeleccionado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  cuit_cuil: string | null;
  telefono_celular: string | null;
  telefono_linea: string | null;
  correo_electronico: string | null;
  calle: string | null;
  numero: string | null;
  depto: string | null;
  localidad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  estado_civil: string | null;
  profesion: string | null;
  fecha_nacimiento: string | null;
}

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400";

export default function ClienteBuscador({
  clientes,
  seleccionado,
  onSeleccionar,
}: {
  clientes: any[];
  seleccionado: ClienteSeleccionado | null;
  onSeleccionar: (cliente: ClienteSeleccionado | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "", apellido: "", dni: "", cuit_cuil: "", telefono_celular: "", telefono_linea: "",
    correo_electronico: "", calle: "", numero: "", depto: "", localidad: "", codigo_postal: "",
    provincia: "", estado_civil: "", profesion: "", fecha_nacimiento: "",
  });

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return !q || `${c.nombre} ${c.apellido} ${c.dni || ""}`.toLowerCase().includes(q);
  });

  const guardarNuevoCliente = async () => {
    if (!nuevo.nombre.trim() || !nuevo.apellido.trim()) {
      alert("Nombre y apellido son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert({ ...nuevo, fecha_nacimiento: nuevo.fecha_nacimiento || null })
        .select("*")
        .single();
      if (error) throw error;
      onSeleccionar(data);
      setCreandoNuevo(false);
    } catch (err) {
      alert("Error al crear el cliente.");
    } finally {
      setGuardando(false);
    }
  };

  if (seleccionado) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
            <Check className="w-4 h-4 shrink-0" /> {seleccionado.nombre} {seleccionado.apellido}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {seleccionado.dni ? `DNI ${seleccionado.dni}` : "Sin DNI"} · {seleccionado.telefono_celular || "Sin teléfono"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSeleccionar(null)}
          className="shrink-0 text-emerald-600 hover:text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors"
        >
          Cambiar
        </button>
      </div>
    );
  }

  if (creandoNuevo) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nuevo cliente</span>
          <button type="button" onClick={() => setCreandoNuevo(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Nombre *" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <input className={inputClass} placeholder="Apellido *" value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} />
          <input className={inputClass} placeholder="DNI" value={nuevo.dni} onChange={(e) => setNuevo({ ...nuevo, dni: e.target.value })} />
          <input className={inputClass} placeholder="CUIT/CUIL" value={nuevo.cuit_cuil} onChange={(e) => setNuevo({ ...nuevo, cuit_cuil: e.target.value })} />
          <input className={inputClass} placeholder="Teléfono celular" value={nuevo.telefono_celular} onChange={(e) => setNuevo({ ...nuevo, telefono_celular: e.target.value })} />
          <input className={inputClass} placeholder="Teléfono de línea" value={nuevo.telefono_linea} onChange={(e) => setNuevo({ ...nuevo, telefono_linea: e.target.value })} />
          <input className={inputClass} placeholder="Correo electrónico" value={nuevo.correo_electronico} onChange={(e) => setNuevo({ ...nuevo, correo_electronico: e.target.value })} />
          <input className={inputClass} type="date" placeholder="Fecha de nacimiento" value={nuevo.fecha_nacimiento} onChange={(e) => setNuevo({ ...nuevo, fecha_nacimiento: e.target.value })} />
          <input className={inputClass} placeholder="Calle" value={nuevo.calle} onChange={(e) => setNuevo({ ...nuevo, calle: e.target.value })} />
          <input className={inputClass} placeholder="Número" value={nuevo.numero} onChange={(e) => setNuevo({ ...nuevo, numero: e.target.value })} />
          <input className={inputClass} placeholder="Depto" value={nuevo.depto} onChange={(e) => setNuevo({ ...nuevo, depto: e.target.value })} />
          <input className={inputClass} placeholder="Localidad" value={nuevo.localidad} onChange={(e) => setNuevo({ ...nuevo, localidad: e.target.value })} />
          <input className={inputClass} placeholder="Código postal" value={nuevo.codigo_postal} onChange={(e) => setNuevo({ ...nuevo, codigo_postal: e.target.value })} />
          <input className={inputClass} placeholder="Provincia" value={nuevo.provincia} onChange={(e) => setNuevo({ ...nuevo, provincia: e.target.value })} />
          <input className={inputClass} placeholder="Estado civil" value={nuevo.estado_civil} onChange={(e) => setNuevo({ ...nuevo, estado_civil: e.target.value })} />
          <input className={inputClass} placeholder="Profesión" value={nuevo.profesion} onChange={(e) => setNuevo({ ...nuevo, profesion: e.target.value })} />
        </div>
        <button
          type="button"
          onClick={guardarNuevoCliente}
          disabled={guardando}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {guardando ? "Guardando..." : "Usar este cliente"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Buscar cliente por nombre, apellido o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      {busqueda && (
        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtrados.slice(0, 20).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSeleccionar(c)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-800">{c.nombre} {c.apellido}</span>
              <span className="text-[11px] text-slate-400">{c.dni || "Sin DNI"}</span>
            </button>
          ))}
          {filtrados.length === 0 && (
            <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setCreandoNuevo(true)}
        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-[12px] font-bold"
      >
        <UserPlus className="w-3.5 h-3.5" /> Cargar cliente nuevo
      </button>
    </div>
  );
}

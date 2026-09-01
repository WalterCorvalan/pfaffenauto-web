"use client";

import { useRef, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { buscarClienteDuplicado } from "@/lib/panelV2/clienteDedupe";
import { Search, UserPlus, X, Check, ScanLine, Loader2 } from "lucide-react";

export interface ClienteSeleccionado {
  id: string;
  nombre: string;
  apellido: string | null;
  dni_cuit: string | null;
  cuit_cuil: string | null;
  telefono: string | null;
  telefono_linea: string | null;
  email: string | null;
  calle: string | null;
  numero_calle: string | null;
  depto: string | null;
  localidad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  estado_civil: string | null;
  profesion: string | null;
  fecha_nacimiento: string | null;
}

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-white/10 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400";

export default function ClienteBuscador({
  clientes, seleccionado, onSeleccionar,
}: { clientes: any[]; seleccionado: ClienteSeleccionado | null; onSeleccionar: (cliente: ClienteSeleccionado | null) => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState("");
  const inputDniRef = useRef<HTMLInputElement>(null);
  const [nuevo, setNuevo] = useState({
    nombre: "", apellido: "", dni_cuit: "", cuit_cuil: "", telefono: "", telefono_linea: "",
    email: "", calle: "", numero_calle: "", depto: "", localidad: "", codigo_postal: "",
    provincia: "", estado_civil: "", profesion: "", fecha_nacimiento: "",
  });

  const escanearDNI = async (file: File) => {
    setErrorEscaneo("");
    setEscaneando(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/panel-v2/ocr-dni", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo leer el DNI.");
      setNuevo((prev) => ({
        ...prev,
        nombre: data.nombre || prev.nombre,
        apellido: data.apellido || prev.apellido,
        dni_cuit: data.dni || prev.dni_cuit,
        fecha_nacimiento: data.fecha_nacimiento || prev.fecha_nacimiento,
        calle: data.domicilio_calle || prev.calle,
        numero_calle: data.domicilio_numero || prev.numero_calle,
        localidad: data.localidad || prev.localidad,
        provincia: data.provincia || prev.provincia,
        codigo_postal: data.codigo_postal || prev.codigo_postal,
      }));
    } catch (err) {
      setErrorEscaneo(err instanceof Error ? err.message : "Error al escanear el DNI.");
    } finally {
      setEscaneando(false);
      if (inputDniRef.current) inputDniRef.current.value = "";
    }
  };

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return !q || `${c.nombre} ${c.apellido || ""} ${c.dni_cuit || ""}`.toLowerCase().includes(q);
  });

  const guardarNuevoCliente = async () => {
    if (!nuevo.nombre.trim() || !nuevo.apellido.trim()) {
      alert("Nombre y apellido son obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      const existente = await buscarClienteDuplicado(supabase2, nuevo);
      if (existente) {
        if (!confirm(`Ya existe un cliente con ese DNI/teléfono: ${existente.nombre} ${existente.apellido || ""}. ¿Usar ese en vez de crear uno nuevo?`)) {
          setGuardando(false);
          return;
        }
        onSeleccionar(existente as any);
        setCreandoNuevo(false);
        setGuardando(false);
        return;
      }
      const { data, error } = await supabase2
        .from("clientes")
        .insert({ ...nuevo, fecha_nacimiento: nuevo.fecha_nacimiento || null })
        .select("*")
        .single();
      if (error) throw error;
      onSeleccionar(data as any);
      setCreandoNuevo(false);
    } catch (err) {
      alert("Error al crear el cliente.");
    } finally {
      setGuardando(false);
    }
  };

  if (seleccionado) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <Check className="w-4 h-4 shrink-0" /> {seleccionado.nombre} {seleccionado.apellido}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-0.5">
            {seleccionado.dni_cuit ? `DNI ${seleccionado.dni_cuit}` : "Sin DNI"} · {seleccionado.telefono || "Sin teléfono"}
          </p>
        </div>
        <button type="button" onClick={() => onSeleccionar(null)} className="shrink-0 text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors">
          Cambiar
        </button>
      </div>
    );
  }

  if (creandoNuevo) {
    return (
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Nuevo cliente</span>
          <button type="button" onClick={() => setCreandoNuevo(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>

        <button type="button" onClick={() => inputDniRef.current?.click()} disabled={escaneando}
          className="w-full flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors">
          {escaneando ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Leyendo DNI...</> : <><ScanLine className="w-3.5 h-3.5" /> Escanear DNI (foto)</>}
        </button>
        <input ref={inputDniRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && escanearDNI(e.target.files[0])} />
        {errorEscaneo && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errorEscaneo}</p>}
        <p className="text-[10px] text-slate-400 -mt-1">Sacale foto al frente (nombre, DNI) y después al dorso (domicilio) — completa lo que falte, no pisa lo que ya escaneaste.</p>

        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Nombre *" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <input className={inputClass} placeholder="Apellido *" value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} />
          <input className={inputClass} placeholder="DNI" value={nuevo.dni_cuit} onChange={(e) => setNuevo({ ...nuevo, dni_cuit: e.target.value })} />
          <input className={inputClass} placeholder="CUIT/CUIL" value={nuevo.cuit_cuil} onChange={(e) => setNuevo({ ...nuevo, cuit_cuil: e.target.value })} />
          <input className={inputClass} placeholder="Teléfono celular" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
          <input className={inputClass} placeholder="Teléfono de línea" value={nuevo.telefono_linea} onChange={(e) => setNuevo({ ...nuevo, telefono_linea: e.target.value })} />
          <input className={inputClass} placeholder="Correo electrónico" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
          <input className={inputClass} type="date" value={nuevo.fecha_nacimiento} onChange={(e) => setNuevo({ ...nuevo, fecha_nacimiento: e.target.value })} />
          <input className={inputClass} placeholder="Calle" value={nuevo.calle} onChange={(e) => setNuevo({ ...nuevo, calle: e.target.value })} />
          <input className={inputClass} placeholder="Número" value={nuevo.numero_calle} onChange={(e) => setNuevo({ ...nuevo, numero_calle: e.target.value })} />
          <input className={inputClass} placeholder="Depto" value={nuevo.depto} onChange={(e) => setNuevo({ ...nuevo, depto: e.target.value })} />
          <input className={inputClass} placeholder="Localidad" value={nuevo.localidad} onChange={(e) => setNuevo({ ...nuevo, localidad: e.target.value })} />
          <input className={inputClass} placeholder="Código postal" value={nuevo.codigo_postal} onChange={(e) => setNuevo({ ...nuevo, codigo_postal: e.target.value })} />
          <input className={inputClass} placeholder="Provincia" value={nuevo.provincia} onChange={(e) => setNuevo({ ...nuevo, provincia: e.target.value })} />
          <input className={inputClass} placeholder="Estado civil" value={nuevo.estado_civil} onChange={(e) => setNuevo({ ...nuevo, estado_civil: e.target.value })} />
          <input className={inputClass} placeholder="Profesión" value={nuevo.profesion} onChange={(e) => setNuevo({ ...nuevo, profesion: e.target.value })} />
        </div>
        <button type="button" onClick={guardarNuevoCliente} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors">
          {guardando ? "Guardando..." : "Usar este cliente"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputClass} pl-9`} placeholder="Buscar cliente por nombre, apellido o DNI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>
      {busqueda && (
        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/10">
          {filtrados.slice(0, 20).map((c) => (
            <button key={c.id} type="button" onClick={() => onSeleccionar(c)} className="w-full text-left px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800 dark:text-white">{c.nombre} {c.apellido || ""}</span>
              <span className="text-[11px] text-slate-400">{c.dni_cuit || "Sin DNI"}</span>
            </button>
          ))}
          {filtrados.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>}
        </div>
      )}
      <button type="button" onClick={() => setCreandoNuevo(true)} className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-[12px] font-bold">
        <UserPlus className="w-3.5 h-3.5" /> Cargar cliente nuevo
      </button>
    </div>
  );
}

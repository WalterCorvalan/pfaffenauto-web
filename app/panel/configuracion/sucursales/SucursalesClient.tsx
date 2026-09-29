"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, X, MapPin, Phone, Clock } from "lucide-react";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface Sucursal {
  id: string;
  nombre: string;
  slug: string | null;
  direccion: string | null;
  telefono_encargado: string | null;
  encargado_nombre: string | null;
  google_maps_url: string | null;
  imagen_url: string | null;
  horario_texto: string | null;
  horario_dia_desde: number;
  horario_dia_hasta: number;
  horario_hora_desde: number;
  horario_hora_hasta: number;
  latitude: number | null;
  longitude: number | null;
}

function slugificar(texto: string): string {
  return texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const VACIO: Omit<Sucursal, "id"> = {
  nombre: "", slug: "", direccion: "", telefono_encargado: "", encargado_nombre: "",
  google_maps_url: "", imagen_url: "", horario_texto: "",
  horario_dia_desde: 1, horario_dia_hasta: 6, horario_hora_desde: 9, horario_hora_hasta: 19,
  latitude: null, longitude: null,
};

export default function SucursalesClient({ sucursalesIniciales }: { sucursalesIniciales: Sucursal[] }) {
  const [sucursales, setSucursales] = useState(sucursalesIniciales);
  const [editando, setEditando] = useState<Sucursal | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Omit<Sucursal, "id">>(VACIO);
  const [slugTocadoAMano, setSlugTocadoAMano] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const abrirNuevo = () => {
    setForm(VACIO);
    setSlugTocadoAMano(false);
    setError("");
    setNuevo(true);
  };

  const abrirEditar = (s: Sucursal) => {
    setForm({ ...s });
    setSlugTocadoAMano(true);
    setError("");
    setEditando(s);
  };

  const cerrar = () => { setNuevo(false); setEditando(null); };

  const cambiarNombre = (nombre: string) => {
    setForm((f) => ({ ...f, nombre, slug: slugTocadoAMano ? f.slug : slugificar(nombre) }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("Falta el nombre.");
    if (!form.slug?.trim()) return setError("Falta el slug (se usa en la URL pública /sucursales/...).");
    setGuardando(true);
    setError("");
    const payload = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      direccion: form.direccion?.trim() || null,
      telefono_encargado: form.telefono_encargado?.trim() || null,
      encargado_nombre: form.encargado_nombre?.trim() || null,
      google_maps_url: form.google_maps_url?.trim() || null,
      imagen_url: form.imagen_url?.trim() || null,
      horario_texto: form.horario_texto?.trim() || null,
      horario_dia_desde: form.horario_dia_desde,
      horario_dia_hasta: form.horario_dia_hasta,
      horario_hora_desde: form.horario_hora_desde,
      horario_hora_hasta: form.horario_hora_hasta,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    if (editando) {
      const { data, error: err } = await supabase2.from("sucursales").update(payload).eq("id", editando.id).select().single();
      setGuardando(false);
      if (err) return setError(err.message.includes("duplicate") ? "Ya existe una sucursal con ese slug." : "No se pudo guardar.");
      setSucursales((prev) => prev.map((s) => (s.id === editando.id ? data : s)));
      cerrar();
    } else {
      const { data, error: err } = await supabase2.from("sucursales").insert(payload).select().single();
      setGuardando(false);
      if (err) return setError(err.message.includes("duplicate") ? "Ya existe una sucursal con ese slug." : "No se pudo crear.");
      setSucursales((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      cerrar();
    }
  };

  const eliminar = (s: Sucursal) => {
    setConfirmDialog({
      mensaje: `¿Eliminar "${s.nombre}"? Si tiene vehículos, usuarios o ventas asignados, no se va a poder borrar hasta reasignarlos.`,
      accion: async () => {
        const { error: err } = await supabase2.from("sucursales").delete().eq("id", s.id);
        if (err) {
          alert(err.code === "23503" ? "No se puede eliminar: todavía hay vehículos, usuarios u otros registros asignados a esta sucursal." : "No se pudo eliminar.");
          return;
        }
        setSucursales((prev) => prev.filter((x) => x.id !== s.id));
      },
    });
  };

  const modalAbierto = nuevo || !!editando;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><img src="/icons/panel/configuracion.png" alt="" className="w-5 h-5 object-contain shrink-0" /> Configuración</h1>
          <p className="text-sm text-slate-400">Sucursales: nombre, dirección, contacto, horario y ubicación.</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva sucursal</button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        <Link href="/panel/configuracion" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Colaboradores</Link>
        <Link href="/panel/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Empresa</Link>
        <Link href="/panel/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">WhatsApp</Link>
        <Link href="/panel/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Instagram</Link>
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-[#0145F2] text-[#0145F2] whitespace-nowrap">Sucursales</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sucursales.map((s) => (
          <div key={s.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-slate-900 dark:text-white">{s.nombre}</p>
                <p className="text-[11px] text-slate-400 font-mono">/sucursales/{s.slug}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrirEditar(s)} className="p-2 text-slate-400 hover:text-[#0145F2] hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => eliminar(s)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {s.direccion && <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {s.direccion}</p>}
            {s.telefono_encargado && <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {s.telefono_encargado}{s.encargado_nombre ? ` — ${s.encargado_nombre}` : ""}</p>}
            {s.horario_texto && <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {s.horario_texto}</p>}
          </div>
        ))}
        {sucursales.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
            <p className="text-[13px] font-medium text-slate-500">Sin sucursales cargadas todavía.</p>
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && cerrar()} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editando ? "Editar sucursal" : "Nueva sucursal"}</h2>
              <button onClick={cerrar} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</p>}

              <div>
                <label className={labelClass}>Nombre <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.nombre} onChange={(e) => cambiarNombre(e.target.value)} placeholder="Ej: Pilar" />
              </div>
              <div>
                <label className={labelClass}>Slug (URL pública: /sucursales/...) <span className="text-rose-500">*</span></label>
                <input className={`${inputClass} font-mono`} value={form.slug || ""} onChange={(e) => { setSlugTocadoAMano(true); setForm((f) => ({ ...f, slug: e.target.value })); }} placeholder="pilar" />
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <input className={inputClass} value={form.direccion || ""} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} placeholder="Calle 1234, Localidad, Provincia" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Teléfono del encargado</label>
                  <input className={inputClass} value={form.telefono_encargado || ""} onChange={(e) => setForm((f) => ({ ...f, telefono_encargado: e.target.value }))} placeholder="11 2345 6789" />
                </div>
                <div>
                  <label className={labelClass}>Nombre del encargado</label>
                  <input className={inputClass} value={form.encargado_nombre || ""} onChange={(e) => setForm((f) => ({ ...f, encargado_nombre: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Link de Google Maps (botón &quot;Cómo llegar&quot;)</label>
                <input className={inputClass} value={form.google_maps_url || ""} onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))} placeholder="https://maps.app.goo.gl/..." />
              </div>
              <div>
                <label className={labelClass}>URL de la imagen de portada (página pública)</label>
                <input className={inputClass} value={form.imagen_url || ""} onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Horario (texto que se muestra)</label>
                <input className={inputClass} value={form.horario_texto || ""} onChange={(e) => setForm((f) => ({ ...f, horario_texto: e.target.value }))} placeholder="Lun a Sáb - 9:00 a 19:00hs" />
              </div>
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rango real para &quot;Abierto ahora&quot; en la web</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Desde (día)</label>
                    <select className={inputClass} value={form.horario_dia_desde} onChange={(e) => setForm((f) => ({ ...f, horario_dia_desde: Number(e.target.value) }))}>
                      {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Hasta (día)</label>
                    <select className={inputClass} value={form.horario_dia_hasta} onChange={(e) => setForm((f) => ({ ...f, horario_dia_hasta: Number(e.target.value) }))}>
                      {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Hora de apertura</label>
                    <input type="number" min={0} max={23} className={inputClass} value={form.horario_hora_desde} onChange={(e) => setForm((f) => ({ ...f, horario_hora_desde: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Hora de cierre</label>
                    <input type="number" min={0} max={23} className={inputClass} value={form.horario_hora_hasta} onChange={(e) => setForm((f) => ({ ...f, horario_hora_hasta: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latitud (opcional, para el mapa)</label>
                  <input type="number" step="any" className={inputClass} value={form.latitude ?? ""} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? Number(e.target.value) : null }))} placeholder="-34.4889306" />
                </div>
                <div>
                  <label className={labelClass}>Longitud (opcional)</label>
                  <input type="number" step="any" className={inputClass} value={form.longitude ?? ""} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? Number(e.target.value) : null }))} placeholder="-58.6614257" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Para conseguir la latitud/longitud: buscá la dirección en Google Maps, click derecho sobre el pin → &quot;¿Qué hay aquí?&quot; → copiá los dos números que aparecen abajo.</p>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={cerrar} className="px-4 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl shadow-sm disabled:opacity-50">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editando ? "Guardar cambios" : "Crear sucursal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!confirmDialog}
        mensaje={confirmDialog?.mensaje || ""}
        onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }}
        onCancelar={() => setConfirmDialog(null)}
      />
    </div>
  );
}

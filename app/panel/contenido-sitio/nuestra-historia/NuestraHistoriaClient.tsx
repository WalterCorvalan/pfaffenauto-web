"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, X, Landmark, Users } from "lucide-react";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

// ================= HERO (badge + bajada, en configuracion_empresa) =================
function HeroSection() {
  const [config, setConfig] = useState<{ nosotros_badge: string | null; nosotros_bajada: string | null } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/panel/configuracion-empresa").then((r) => r.json()).then((data) => setConfig(data.config)).finally(() => setCargando(false));
  }, []);

  const guardar = async (patch: Record<string, string | null>) => {
    if (!config) return;
    setConfig({ ...config, ...patch } as any);
    setMensaje("");
    const res = await fetch("/api/panel/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  if (cargando || !config) return <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Landmark className="w-4 h-4 text-[#0145F2]" /> Encabezado de la página</p>
      <div>
        <label className={labelClass}>Etiqueta (arriba del título)</label>
        <input className={inputClass} defaultValue={config.nosotros_badge || ""} placeholder="Nuestra Historia" onBlur={(e) => guardar({ nosotros_badge: e.target.value.trim() || null })} />
      </div>
      <div>
        <label className={labelClass}>Bajada</label>
        <textarea className={`${inputClass} min-h-[70px] resize-y`} defaultValue={config.nosotros_bajada || ""} placeholder="Desde nuestros primeros pasos..." onBlur={(e) => guardar({ nosotros_bajada: e.target.value.trim() || null })} />
      </div>
      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

// ================= TIMELINE =================
interface TimelineItem { id: string; anio: string; titulo: string; texto: string; imagen1_url: string | null; imagen2_url: string | null; orden: number }
const VACIO_TIMELINE: Omit<TimelineItem, "id"> = { anio: "", titulo: "", texto: "", imagen1_url: "", imagen2_url: "", orden: 0 };

function TimelineSection() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<TimelineItem | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Omit<TimelineItem, "id">>(VACIO_TIMELINE);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const cargar = async () => {
    const { data } = await supabase2.from("nosotros_timeline").select("*").order("orden", { ascending: true });
    setItems(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ ...VACIO_TIMELINE, orden: items.length ? Math.max(...items.map((i) => i.orden)) + 1 : 0 });
    setError("");
    setNuevo(true);
  };
  const abrirEditar = (i: TimelineItem) => { setForm({ ...i }); setError(""); setEditando(i); };
  const cerrar = () => { setNuevo(false); setEditando(null); };

  const guardar = async () => {
    if (!form.anio.trim() || !form.titulo.trim() || !form.texto.trim()) return setError("Año, título y texto son obligatorios.");
    setGuardando(true);
    setError("");
    const payload = { anio: form.anio.trim(), titulo: form.titulo.trim(), texto: form.texto.trim(), imagen1_url: form.imagen1_url?.trim() || null, imagen2_url: form.imagen2_url?.trim() || null, orden: form.orden };
    if (editando) {
      const { error: err } = await supabase2.from("nosotros_timeline").update(payload).eq("id", editando.id);
      setGuardando(false);
      if (err) return setError("No se pudo guardar.");
    } else {
      const { error: err } = await supabase2.from("nosotros_timeline").insert(payload);
      setGuardando(false);
      if (err) return setError("No se pudo crear.");
    }
    await cargar();
    cerrar();
  };

  const eliminar = (i: TimelineItem) => {
    setConfirmDialog({
      mensaje: `¿Eliminar "${i.anio} — ${i.titulo}"?`,
      accion: async () => {
        const { error: err } = await supabase2.from("nosotros_timeline").delete().eq("id", i.id);
        if (err) return alert("No se pudo eliminar.");
        setItems((prev) => prev.filter((x) => x.id !== i.id));
      },
    });
  };

  const modalAbierto = nuevo || !!editando;

  if (cargando) return <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Línea de tiempo</p>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-3.5 h-3.5" /> Nuevo hito</button>
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{i.anio} — {i.titulo}</p>
              <p className="text-xs text-slate-400 truncate max-w-md">{i.texto}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => abrirEditar(i)} className="p-1.5 text-slate-400 hover:text-[#0145F2] hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => eliminar(i)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic py-4 text-center">Sin hitos cargados todavía.</p>}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && cerrar()} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editando ? "Editar hito" : "Nuevo hito"}</h2>
              <button onClick={cerrar} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</p>}
              <div>
                <label className={labelClass}>Año / etiqueta <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.anio} onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))} placeholder="Ej: 2010, o 'Hoy'" />
              </div>
              <div>
                <label className={labelClass}>Título <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Texto <span className="text-rose-500">*</span></label>
                <textarea className={`${inputClass} min-h-[90px] resize-y`} value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Imagen 1 (URL)</label>
                <input className={inputClass} value={form.imagen1_url || ""} onChange={(e) => setForm((f) => ({ ...f, imagen1_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Imagen 2 (URL, opcional)</label>
                <input className={inputClass} value={form.imagen2_url || ""} onChange={(e) => setForm((f) => ({ ...f, imagen2_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Orden</label>
                <input type="number" className={inputClass} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={cerrar} className="px-4 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl shadow-sm disabled:opacity-50">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editando ? "Guardar cambios" : "Crear hito"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog abierto={!!confirmDialog} mensaje={confirmDialog?.mensaje || ""} onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }} onCancelar={() => setConfirmDialog(null)} />
    </div>
  );
}

// ================= EQUIPO =================
interface EquipoMiembro { id: string; nombre: string; rol: string; imagen_url: string | null; orden: number }
const VACIO_EQUIPO: Omit<EquipoMiembro, "id"> = { nombre: "", rol: "", imagen_url: "", orden: 0 };

function EquipoSection() {
  const [items, setItems] = useState<EquipoMiembro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<EquipoMiembro | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Omit<EquipoMiembro, "id">>(VACIO_EQUIPO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const cargar = async () => {
    const { data } = await supabase2.from("nosotros_equipo").select("*").order("orden", { ascending: true });
    setItems(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setForm({ ...VACIO_EQUIPO, orden: items.length ? Math.max(...items.map((i) => i.orden)) + 1 : 0 });
    setError("");
    setNuevo(true);
  };
  const abrirEditar = (i: EquipoMiembro) => { setForm({ ...i }); setError(""); setEditando(i); };
  const cerrar = () => { setNuevo(false); setEditando(null); };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.rol.trim()) return setError("Nombre y rol son obligatorios.");
    setGuardando(true);
    setError("");
    const payload = { nombre: form.nombre.trim(), rol: form.rol.trim(), imagen_url: form.imagen_url?.trim() || null, orden: form.orden };
    if (editando) {
      const { error: err } = await supabase2.from("nosotros_equipo").update(payload).eq("id", editando.id);
      setGuardando(false);
      if (err) return setError("No se pudo guardar.");
    } else {
      const { error: err } = await supabase2.from("nosotros_equipo").insert(payload);
      setGuardando(false);
      if (err) return setError("No se pudo crear.");
    }
    await cargar();
    cerrar();
  };

  const eliminar = (i: EquipoMiembro) => {
    setConfirmDialog({
      mensaje: `¿Eliminar a "${i.nombre}" del equipo?`,
      accion: async () => {
        const { error: err } = await supabase2.from("nosotros_equipo").delete().eq("id", i.id);
        if (err) return alert("No se pudo eliminar.");
        setItems((prev) => prev.filter((x) => x.id !== i.id));
      },
    });
  };

  const modalAbierto = nuevo || !!editando;

  if (cargando) return <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Equipo</p>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-3.5 h-3.5" /> Nuevo integrante</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{i.nombre}</p>
              <p className="text-xs text-slate-400 truncate">{i.rol}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => abrirEditar(i)} className="p-1.5 text-slate-400 hover:text-[#0145F2] hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => eliminar(i)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic py-4 text-center col-span-full">Sin integrantes cargados todavía.</p>}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && cerrar()} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editando ? "Editar integrante" : "Nuevo integrante"}</h2>
              <button onClick={cerrar} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</p>}
              <div>
                <label className={labelClass}>Nombre <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Rol / cargo <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))} placeholder="Ej: Fundador y Director Ejecutivo" />
              </div>
              <div>
                <label className={labelClass}>Foto (URL)</label>
                <input className={inputClass} value={form.imagen_url || ""} onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Orden</label>
                <input type="number" className={inputClass} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={cerrar} className="px-4 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl shadow-sm disabled:opacity-50">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editando ? "Guardar cambios" : "Crear integrante"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog abierto={!!confirmDialog} mensaje={confirmDialog?.mensaje || ""} onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }} onCancelar={() => setConfirmDialog(null)} />
    </div>
  );
}

export default function NuestraHistoriaClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-[#0145F2]" /> Nuestra Historia</h2>
        <p className="text-sm text-slate-400 mt-1">Contenido de la página pública /nosotros: encabezado, línea de tiempo y equipo.</p>
      </div>
      <HeroSection />
      <TimelineSection />
      <EquipoSection />
    </div>
  );
}

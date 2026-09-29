"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2, X, ImagePlay, Camera, ArrowUpDown, EyeOff } from "lucide-react";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

interface Entrega {
  id: string;
  tipo: "foto" | "video";
  src: string;
  titulo: string;
  link: string | null;
  orden: number;
  activo: boolean;
}

const VACIO: Omit<Entrega, "id"> = { tipo: "foto", src: "", titulo: "", link: "", orden: 0, activo: true };

export default function EntregasClient({ entregasIniciales }: { entregasIniciales: Entrega[] }) {
  const [entregas, setEntregas] = useState(entregasIniciales);
  const [editando, setEditando] = useState<Entrega | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Omit<Entrega, "id">>(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const abrirNuevo = () => {
    setForm({ ...VACIO, orden: entregas.length ? Math.max(...entregas.map((e) => e.orden)) + 1 : 0 });
    setError("");
    setNuevo(true);
  };

  const abrirEditar = (e: Entrega) => {
    setForm({ ...e });
    setError("");
    setEditando(e);
  };

  const cerrar = () => { setNuevo(false); setEditando(null); };

  const guardar = async () => {
    if (!form.titulo.trim()) return setError("Falta el título.");
    if (!form.src.trim()) return setError("Falta la URL de la imagen o el video.");
    setGuardando(true);
    setError("");
    const payload = {
      tipo: form.tipo,
      src: form.src.trim(),
      titulo: form.titulo.trim(),
      link: form.link?.trim() || null,
      orden: form.orden,
      activo: form.activo,
    };

    if (editando) {
      const { data, error: err } = await supabase2.from("entregas_realizadas").update(payload).eq("id", editando.id).select().single();
      setGuardando(false);
      if (err) return setError("No se pudo guardar.");
      setEntregas((prev) => prev.map((x) => (x.id === editando.id ? data : x)).sort((a, b) => a.orden - b.orden));
      cerrar();
    } else {
      const { data, error: err } = await supabase2.from("entregas_realizadas").insert(payload).select().single();
      setGuardando(false);
      if (err) return setError("No se pudo crear.");
      setEntregas((prev) => [...prev, data].sort((a, b) => a.orden - b.orden));
      cerrar();
    }
  };

  const eliminar = (e: Entrega) => {
    setConfirmDialog({
      mensaje: `¿Eliminar "${e.titulo}"?`,
      accion: async () => {
        const { error: err } = await supabase2.from("entregas_realizadas").delete().eq("id", e.id);
        if (err) return alert("No se pudo eliminar.");
        setEntregas((prev) => prev.filter((x) => x.id !== e.id));
      },
    });
  };

  const modalAbierto = nuevo || !!editando;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Camera className="w-5 h-5 text-[#0145F2]" /> Entregas</h1>
          <p className="text-sm text-slate-400">Historias/videos cortos de entregas reales que se muestran en la home pública. Solo se muestran las marcadas como activas.</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva entrega</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entregas.map((e) => (
          <div key={e.id} className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden ${!e.activo ? "opacity-50" : ""}`}>
            <div className="relative aspect-[9/16] bg-slate-100 dark:bg-white/5">
              {e.tipo === "video" ? (
                <video src={e.src} muted className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.src} alt={e.titulo} className="w-full h-full object-cover" />
              )}
              <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest">
                {e.tipo === "video" ? <ImagePlay className="w-3 h-3" /> : <Camera className="w-3 h-3" />} {e.tipo}
              </span>
              {!e.activo && (
                <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest">
                  <EyeOff className="w-3 h-3" /> Oculta
                </span>
              )}
              <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold"><ArrowUpDown className="w-3 h-3" /> {e.orden}</span>
            </div>
            <div className="p-3 flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{e.titulo}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrirEditar(e)} className="p-1.5 text-slate-400 hover:text-[#0145F2] hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => eliminar(e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {entregas.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
            <p className="text-[13px] font-medium text-slate-500">Sin entregas cargadas todavía.</p>
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && cerrar()} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/5">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{editando ? "Editar entrega" : "Nueva entrega"}</h2>
              <button onClick={cerrar} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 space-y-4">
              {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</p>}

              <div>
                <label className={labelClass}>Tipo</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tipo: "foto" }))} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border ${form.tipo === "foto" ? "bg-[#0145F2] text-white border-[#0145F2]" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}><Camera className="w-4 h-4" /> Foto</button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tipo: "video" }))} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border ${form.tipo === "video" ? "bg-[#0145F2] text-white border-[#0145F2]" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}><ImagePlay className="w-4 h-4" /> Video</button>
                </div>
              </div>
              <div>
                <label className={labelClass}>URL {form.tipo === "video" ? "del video (.mp4)" : "de la imagen"} <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.src} onChange={(e) => setForm((f) => ({ ...f, src: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Título <span className="text-rose-500">*</span></label>
                <input className={inputClass} value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Entrega Toyota Hilux 2023" />
              </div>
              <div>
                <label className={labelClass}>Link al posteo de Instagram (opcional)</label>
                <input className={inputClass} value={form.link || ""} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://instagram.com/p/..." />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className={labelClass}>Orden</label>
                  <input type="number" className={inputClass} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
                </div>
                <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} className="w-4 h-4 rounded accent-[#0145F2]" /> Visible en la web
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={cerrar} className="px-4 py-2 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl shadow-sm disabled:opacity-50">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editando ? "Guardar cambios" : "Crear entrega"}
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

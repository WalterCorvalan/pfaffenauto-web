"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase/client";
import { Settings, Plus, X, Save, Trash2, Star, Pencil, Eye, EyeOff, ExternalLink } from "lucide-react";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export default function ResenasClient() {
  const [resenas, setResenas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [rating, setRating] = useState(5);
  const [fechaTexto, setFechaTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  useEffect(() => {
    supabase2.from("resenas_manuales").select("*").order("orden").order("created_at", { ascending: false }).then(({ data }) => {
      setResenas(data || []);
      setCargando(false);
    });
  }, []);

  const abrirNuevo = () => { setEditando(null); setNombre(""); setTexto(""); setRating(5); setFechaTexto(""); setShowForm(true); };
  const abrirEditar = (r: any) => { setEditando(r); setNombre(r.nombre); setTexto(r.texto); setRating(r.rating); setFechaTexto(r.fecha_texto || ""); setShowForm(true); };

  const guardar = async () => {
    if (!nombre.trim() || !texto.trim()) return alert("Completá nombre y el texto de la reseña.");
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), texto: texto.trim(), rating, fecha_texto: fechaTexto.trim() || null };
      if (editando) {
        const { data, error } = await supabase2.from("resenas_manuales").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setResenas((prev) => prev.map((r) => (r.id === editando.id ? data : r)));
      } else {
        const { data, error } = await supabase2.from("resenas_manuales").insert(payload).select().single();
        if (error) throw error;
        setResenas((prev) => [data, ...prev]);
      }
      setShowForm(false);
    } catch (err: any) { alert(err?.message ? `No se pudo guardar: ${err.message}` : "No se pudo guardar."); } finally { setGuardando(false); }
  };

  const toggleActivo = async (r: any) => {
    const nuevo = !r.activo;
    await supabase2.from("resenas_manuales").update({ activo: nuevo }).eq("id", r.id);
    setResenas((prev) => prev.map((x) => (x.id === r.id ? { ...x, activo: nuevo } : x)));
  };

  const eliminar = (r: any) => {
    setConfirmDialog({
      mensaje: `¿Eliminar la reseña de "${r.nombre}"?`,
      accion: async () => {
        await supabase2.from("resenas_manuales").delete().eq("id", r.id);
        setResenas((prev) => prev.filter((x) => x.id !== r.id));
      },
    });
  };

  const activas = resenas.filter((r) => r.activo).length;
  if (cargando) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Configuración</h1>
          <p className="text-sm text-slate-400">Reseñas que se muestran en la web — cargadas a mano, sin conectar la API de Google.</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva reseña</button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        <Link href="/panel/configuracion" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Colaboradores</Link>
        <Link href="/panel/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Empresa</Link>
        <Link href="/panel/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">WhatsApp</Link>
        <Link href="/panel/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Instagram</Link>
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-[#0145F2] text-[#0145F2] whitespace-nowrap">Reseñas</span>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300">
        💡 Copiá y pegá reseñas reales desde Google Maps (perfil del negocio → Reseñas). La web muestra solo las <b>activas</b> y las va rotando entre visitas para no repetir siempre las mismas 6. {activas} activa{activas === 1 ? "" : "s"} de {resenas.length}.
      </div>

      {resenas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">Sin reseñas cargadas</p>
          <p className="text-xs text-slate-400 mt-1">La web va a mostrar las reseñas de respaldo hasta que cargues al menos una acá.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resenas.map((r) => (
            <div key={r.id} className={`bg-white dark:bg-white/5 border rounded-xl p-4 ${r.activo ? "border-slate-200 dark:border-white/10" : "border-slate-100 dark:border-white/5 opacity-50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{r.nombre}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-white/10"}`} />)}
                    {r.fecha_texto && <span className="text-[10px] text-slate-400 ml-1">{r.fecha_texto}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleActivo(r)} title={r.activo ? "Ocultar de la web" : "Mostrar en la web"} className="p-1.5 text-slate-400 hover:text-[#0145F2]">{r.activo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                  <button onClick={() => abrirEditar(r)} className="p-1.5 text-slate-400 hover:text-[#0145F2]"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => eliminar(r)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">&quot;{r.texto}&quot;</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar reseña" : "Nueva reseña"}</h3><button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">Pegala tal cual está en <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">Google Maps <ExternalLink className="w-3 h-3" /></a>.</p>
            <label className={labelClass}>Nombre del cliente *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Claudia Adari" className={inputClass} />
            <label className={labelClass + " mt-3"}>Texto de la reseña *</label>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} placeholder="El trámite fue muy sencillo..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Estrellas</label><select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={inputClass}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></div>
              <div><label className={labelClass}>Fecha (como en Google)</label><input value={fechaTexto} onChange={(e) => setFechaTexto(e.target.value)} placeholder="Hace 2 semanas" className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Crear"}</button></div>
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

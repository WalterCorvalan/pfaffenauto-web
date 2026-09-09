"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save } from "lucide-react";

export default function CargarRespuestaModal({ clientes, vendedores, esAdminORecepcion, miId, onClose }: { clientes: any[], vendedores: any[], esAdminORecepcion: boolean, miId: string, onClose: () => void }) {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: "",
    vendedor_id: esAdminORecepcion ? "" : miId,
    contexto: "post-venta",
    puntaje: "10",
    comentario: ""
  });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await supabase2.from("nps_respuestas").insert({
        cliente_id: formData.cliente_id || null,
        vendedor_id: formData.vendedor_id || null,
        contexto: formData.contexto,
        puntaje: Number(formData.puntaje),
        comentario: formData.comentario || null,
        origen: "manual",
        creado_por: miId
      });
      onClose();
    } catch (error) {
      alert("Error al cargar la respuesta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        <div className="p-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cargar Respuesta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={guardar} className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Puntaje (0-10)</label>
              <input required type="number" min="0" max="10" value={formData.puntaje} onChange={e => setFormData({...formData, puntaje: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xl font-black text-center outline-none text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="w-2/3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Contexto</label>
              <select required value={formData.contexto} onChange={e => setFormData({...formData, contexto: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer h-[46px]">
                <option value="post-venta">Post-Venta</option>
                <option value="post-visita">Post-Visita de Salón</option>
                <option value="post-entrega">Post-Entrega</option>
                <option value="post-cotizacion">Post-Cotización</option>
              </select>
            </div>
          </div>
          {esAdminORecepcion && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Vendedor a evaluar</label>
                <select value={formData.vendedor_id} onChange={e => setFormData({...formData, vendedor_id: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
                  <option value="">(Ninguno)</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Cliente</label>
                <select value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
                  <option value="">(Anónimo)</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Comentario (opcional)</label>
            <textarea rows={3} placeholder="¿Qué dijo el cliente?" value={formData.comentario} onChange={e => setFormData({...formData, comentario: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white resize-none" />
          </div>
          <button type="submit" disabled={cargando} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50">
            {cargando ? "Guardando..." : "Guardar Respuesta"}
          </button>
        </form>
      </div>
    </div>
  );
}
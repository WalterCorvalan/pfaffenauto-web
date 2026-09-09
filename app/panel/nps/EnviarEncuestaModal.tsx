"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Send } from "lucide-react";

export default function EnviarEncuestaModal({ clientes, configuracion, miId, onClose }: { clientes: any[], configuracion: any, miId: string, onClose: () => void }) {
  const [clienteId, setClienteId] = useState("");
  const [contexto, setContexto] = useState("post-venta");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;
    setCargando(true);

    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente || !cliente.telefono) {
        alert("El cliente seleccionado no tiene teléfono cargado.");
        return;
      }

      // Elegir mensaje según config
      let msg = "";
      if (contexto === "post-venta") msg = configuracion.nps_msg_post_venta;
      if (contexto === "post-visita") msg = configuracion.nps_msg_post_visita;
      if (contexto === "post-entrega") msg = configuracion.nps_msg_post_entrega;
      if (contexto === "post-cotizacion") msg = configuracion.nps_msg_post_cotizacion;

      // Registrar envío
      await supabase2.from("nps_envios").insert({
        cliente_id: cliente.id,
        vendedor_id: cliente.vendedor_id,
        contexto,
        enviado_por: miId
      });

      // Abrir WA
      window.open(`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
      onClose();
    } catch (error) {
      alert("Error al registrar envío.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        <div className="p-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Send className="w-5 h-5 text-indigo-600" /> Enviar Encuesta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={enviar} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Cliente</label>
            <select required value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Contexto</label>
            <select required value={contexto} onChange={e => setContexto(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
              <option value="post-venta">Post-Venta</option>
              <option value="post-visita">Post-Visita de Salón</option>
              <option value="post-entrega">Post-Entrega del Auto</option>
              <option value="post-cotizacion">Post-Cotización</option>
            </select>
          </div>
          <button type="submit" disabled={cargando} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50">
            {cargando ? "Abriendo..." : "Abrir WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Send, Search, Check } from "lucide-react";

export default function EnviarEncuestaModal({ clientes, configuracion, miId, onClose }: { clientes: any[], configuracion: any, miId: string, onClose: () => void }) {
  const [clienteId, setClienteId] = useState("");
  // Buscador en vivo -- el <select> con `clientes` completo (page.tsx corría
  // sin .limit(), PostgREST corta en 1000 igual) dejaba inalcanzable
  // cualquier cliente después del corte. Mismo patrón que NuevoPedidoModal.tsx.
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteDropdownAbierto, setClienteDropdownAbierto] = useState(false);
  const [resultadosClienteVivo, setResultadosClienteVivo] = useState<any[] | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2) { setResultadosClienteVivo(null); return; }
    setBuscandoCliente(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase2.from("clientes").select("id, nombre, telefono, vendedor_id").or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`).order("nombre").limit(20);
      setResultadosClienteVivo(data || []);
      setBuscandoCliente(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);
  const clientesFiltrados = resultadosClienteVivo ?? clientes.filter((c) => {
    const q = busquedaCliente.trim().toLowerCase();
    return q && c.nombre.toLowerCase().includes(q);
  });
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  const elegirCliente = (c: any | null) => {
    setClienteId(c?.id || "");
    setClienteSeleccionado(c);
    setClienteDropdownAbierto(false);
    setBusquedaCliente(c ? c.nombre : "");
  };
  const [contexto, setContexto] = useState("post-venta");
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;
    setCargando(true);

    try {
      const cliente = clienteSeleccionado;
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
          <div className="relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Cliente</label>
            {clienteId ? (
              <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                  <Check className="w-3.5 h-3.5 shrink-0" /> {busquedaCliente}
                </span>
                <button type="button" onClick={() => elegirCliente(null)} className="shrink-0 text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-[11px] font-bold uppercase tracking-widest">
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="Buscar por nombre o teléfono..."
                  value={busquedaCliente}
                  onChange={(e) => { setBusquedaCliente(e.target.value); setClienteDropdownAbierto(true); }}
                  onFocus={() => setClienteDropdownAbierto(true)}
                  onBlur={() => setTimeout(() => setClienteDropdownAbierto(false), 150)}
                />
              </div>
            )}
            {!clienteId && clienteDropdownAbierto && busquedaCliente && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-white/10">
                {clientesFiltrados.slice(0, 20).map((c) => (
                  <button key={c.id} type="button" onMouseDown={() => elegirCliente(c)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.nombre}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{c.telefono || "sin teléfono"}</span>
                  </button>
                ))}
                {buscandoCliente ? (
                  <p className="px-3 py-3 text-[13px] text-slate-400 italic">Buscando...</p>
                ) : clientesFiltrados.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>}
              </div>
            )}
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
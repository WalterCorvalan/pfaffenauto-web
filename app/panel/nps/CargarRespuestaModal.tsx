"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Save, Search, Check } from "lucide-react";
import { crearAlerta } from "@/lib/panel/alertas";

export default function CargarRespuestaModal({ clientes, vendedores, esAdminORecepcion, miId, onClose }: { clientes: any[], vendedores: any[], esAdminORecepcion: boolean, miId: string, onClose: () => void }) {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: "",
    vendedor_id: esAdminORecepcion ? "" : miId,
    contexto: "post-venta",
    puntaje: "10",
    comentario: ""
  });
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
  const elegirCliente = (c: any | null) => {
    setFormData((prev) => ({ ...prev, cliente_id: c?.id || "" }));
    setClienteDropdownAbierto(false);
    setBusquedaCliente(c ? c.nombre : "");
  };

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

      // Categoría "nps" de Mi Espacio → Notificaciones prometía avisar en
      // nota baja, pero nada lo hacía -- esta es la única vía de carga que
      // existe hoy (no hay encuesta pública), así que se avisa acá mismo al
      // guardar, no hace falta un cron aparte.
      if (Number(formData.puntaje) <= 6) {
        const cliente = clientes.find((c) => c.id === formData.cliente_id);
        const { data: admins } = await supabase2.from("perfiles").select("id").eq("activo", true).contains("roles", ["admin"]);
        for (const admin of admins ?? []) {
          await crearAlerta(supabase2, admin.id, `NPS con nota baja${cliente ? `: ${cliente.nombre}` : ""}`, {
            mensaje: `Puntaje ${formData.puntaje}/10 (${formData.contexto}).${formData.comentario ? ` "${formData.comentario}"` : ""}`,
            link: "/panel/nps",
            tipo: "nps_nota_baja",
            prioridad: "alta",
            categoriaNotif: "nps",
          });
        }
      }
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
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-widest">Cliente</label>
                {formData.cliente_id ? (
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
                      placeholder="Buscar por nombre o teléfono... (o dejalo anónimo)"
                      value={busquedaCliente}
                      onChange={(e) => { setBusquedaCliente(e.target.value); setClienteDropdownAbierto(true); }}
                      onFocus={() => setClienteDropdownAbierto(true)}
                      onBlur={() => setTimeout(() => setClienteDropdownAbierto(false), 150)}
                    />
                  </div>
                )}
                {!formData.cliente_id && clienteDropdownAbierto && busquedaCliente && (
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
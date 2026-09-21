"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Loader2, Megaphone } from "lucide-react";
import { hoyLocalISO } from "@/lib/panel/fechas";
import { crearAlerta } from "@/lib/panel/alertas";
import { buscarLeadsPorTexto, LEAD_ORIGEN_LABEL, type LeadEncontrado } from "@/lib/panel/buscarLeads";

interface Perfil { id: string; nombre: string; roles: string[] }
interface Cliente { id: string; nombre: string; telefono: string | null }

const ESTADOS = [
  { value: "pendiente_contacto", label: "Pendiente contacto" },
  { value: "contactado", label: "Contactado" },
  { value: "agendado", label: "Agendado" },
  { value: "ingreso_local", label: "Ingresó al local" },
  { value: "publicado", label: "Publicado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "consignado", label: "Consignado" },
];

export default function NuevaConsignacionModal({ perfiles, clientes, miId, onClose, onCreado }: { perfiles: Perfil[]; clientes: Cliente[]; miId: string; onClose: () => void; onCreado: (c: any) => void }) {
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [leadsEncontrados, setLeadsEncontrados] = useState<LeadEncontrado[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const buscadorRef = useRef<HTMLDivElement>(null);

  const [vehiculoDescripcion, setVehiculoDescripcion] = useState("");
  const [vendedorId, setVendedorId] = useState(miId);
  const [estado, setEstado] = useState("pendiente_contacto");
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [ultimoContacto, setUltimoContacto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Búsqueda en vivo contra la base (en vez de filtrar solo el array local
  // "clientes", que llega una sola vez por prop y con >1000 clientes queda
  // cortado por el límite default de PostgREST -- mismo bug que ya se
  // encontró y arregló en NuevaVentaModal). De paso suma leads (WhatsApp/
  // Instagram/Rodi/manual) que todavía no son un cliente cargado.
  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) { setResultados([]); setLeadsEncontrados([]); return; }
    setBuscandoCliente(true);
    const timer = setTimeout(async () => {
      const [{ data }, leads] = await Promise.all([
        supabase2.from("clientes").select("id, nombre, telefono").or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`).order("nombre").limit(20),
        buscarLeadsPorTexto(supabase2, q),
      ]);
      setResultados(data || clientes.filter((c) => c.nombre.toLowerCase().includes(q.toLowerCase()) || (c.telefono || "").includes(q)).slice(0, 8));
      setLeadsEncontrados(leads);
      setBuscandoCliente(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, clientes]);

  const elegirLead = (l: LeadEncontrado) => {
    setClienteId("");
    setClienteNombre(l.nombre);
    setClienteTelefono(l.telefono || "");
    setBusqueda(l.nombre);
    setMostrarResultados(false);
  };

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) setMostrarResultados(false); };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const elegirCliente = (c: Cliente | null) => {
    if (c) {
      setClienteId(c.id);
      setClienteNombre(c.nombre);
      setClienteTelefono(c.telefono || "");
      setBusqueda(c.nombre);
    } else {
      setClienteId("");
    }
    setMostrarResultados(false);
  };

  const guardar = async () => {
    setError("");
    if (!clienteNombre.trim()) { setError("Falta el nombre del cliente."); return; }
    if (!vehiculoDescripcion.trim()) { setError("Falta la descripción del vehículo."); return; }
    if (!fecha) { setError("Falta la fecha."); return; }

    setGuardando(true);
    try {
      const { data, error: err } = await supabase2
        .from("consignaciones")
        .insert({
          cliente_id: clienteId || null, cliente_nombre: clienteNombre.trim(), cliente_telefono: clienteTelefono.trim() || null,
          vehiculo_descripcion: vehiculoDescripcion.trim(), vendedor_id: vendedorId || null, estado,
          fecha_alta: fecha, ultimo_contacto: ultimoContacto || null, observaciones: observaciones.trim() || null,
          creado_por: miId || null,
        })
        .select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )")
        .single();
      if (err) throw err;
      onCreado(data);
      for (const p of perfiles.filter((p) => (p.roles?.includes("admin") || p.roles?.includes("encargado")) && p.id !== miId)) {
        crearAlerta(supabase2, p.id, `Nueva consignación — ${clienteNombre.trim()}`, {
          mensaje: `${vehiculoDescripcion.trim()} (vendedor: ${data.vendedor?.nombre || "sin asignar"}).`,
          link: "/panel/consignaciones", tipo: "consignacion", prioridad: "novedad", categoriaNotif: "consignacion",
        });
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la consignación.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => { if (!guardando) onClose(); }}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#111] z-10">
          <p className="text-xs text-slate-500 dark:text-slate-400 pr-4">Datos iniciales del vehículo que el cliente quiere consignar. Una vez que ingrese al local podés actualizar el estado desde el detalle.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative col-span-2 sm:col-span-1" ref={buscadorRef}>
                <label className={labelClass}>Nombre del cliente *</label>
                <input
                  value={busqueda || clienteNombre}
                  onChange={(e) => { setBusqueda(e.target.value); setClienteNombre(e.target.value); setClienteId(""); setMostrarResultados(true); }}
                  onFocus={() => setMostrarResultados(true)}
                  placeholder="Empezá a tipear o elegí uno existente"
                  className={inputClass}
                />
                {mostrarResultados && (resultados.length > 0 || leadsEncontrados.length > 0 || buscandoCliente) && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {resultados.map((c) => (
                      <button key={c.id} onClick={() => elegirCliente(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/10 last:border-0">
                        <p className="text-xs font-bold">{c.nombre}</p>
                        {c.telefono && <p className="text-[10px] text-slate-400">{c.telefono}</p>}
                      </button>
                    ))}
                    {leadsEncontrados.map((l) => (
                      <button key={`${l.origen}-${l.id}`} onClick={() => elegirLead(l)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border-b border-slate-100 dark:border-white/10 last:border-0 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold flex items-center gap-1.5 min-w-0 truncate"><Megaphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> <span className="truncate">{l.nombre}</span></p>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-300 shrink-0">{LEAD_ORIGEN_LABEL[l.origen]}</span>
                      </button>
                    ))}
                    {buscandoCliente && <p className="px-3 py-2.5 text-[11px] text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</p>}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="+54 9 11 5555 5555" className={inputClass} />
                <p className="text-[10px] text-slate-400 mt-1">Se autopobla si elegís un cliente existente.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Vehículo a consignar</p>
            <label className={labelClass}>Descripción *</label>
            <textarea value={vehiculoDescripcion} onChange={(e) => setVehiculoDescripcion(e.target.value)} rows={2} placeholder="Ej: Toyota Hilux 4x4 SRX 2022, 45.000 km, blanca, único dueño" className={inputClass} />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Seguimiento</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Vendedor</label>
                <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={inputClass}>
                  <option value="">Sin asignar</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
                  {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha *</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClass}>Último contacto</label>
              <input type="date" value={ultimoContacto} onChange={(e) => setUltimoContacto(e.target.value)} className={inputClass} />
              <p className="text-[10px] text-slate-400 mt-1">Usado para el contador de días sin contacto.</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} placeholder="Notas internas sobre la consignación." className={inputClass} />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#111]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white disabled:opacity-50 flex items-center gap-2">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Crear consignación
          </button>
        </div>
      </div>
    </div>
  );
}

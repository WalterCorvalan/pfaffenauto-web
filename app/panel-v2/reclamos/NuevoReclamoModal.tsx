"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Search } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

const TIPOS = ["Transferencia", "Pago", "Gestoría", "Documentación", "Administrativo", "Otro"];
const PRIORIDADES = ["Baja", "Normal", "Alta", "Urgente"];

interface Perfil { id: string; nombre: string; roles: string[] }
interface ClienteResultado { id: string; nombre: string; telefono: string | null; email: string | null }

interface Props {
  perfiles: Perfil[];
  miId: string;
  onClose: () => void;
  onCreado: (reclamo: any) => void;
}

export default function NuevoReclamoModal({ perfiles, miId, onClose, onCreado }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("Administrativo");
  const [prioridad, setPrioridad] = useState("Normal");
  const [asignadoA, setAsignadoA] = useState("");
  const [referencia, setReferencia] = useState("");

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const buscadorRef = useRef<HTMLDivElement>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase2
        .from("clientes")
        .select("id, nombre, telefono, email, dni_cuit")
        .or(`nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,dni_cuit.ilike.%${busqueda}%`)
        .limit(8);
      setResultados(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) setMostrarResultados(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const elegirCliente = (c: ClienteResultado | null) => {
    if (c) {
      setClienteId(c.id);
      setClienteNombre(c.nombre);
      setClienteTelefono(c.telefono || "");
      setClienteEmail(c.email || "");
      setBusqueda(c.nombre);
    } else {
      setClienteId(null);
      setBusqueda("");
    }
    setMostrarResultados(false);
  };

  const guardar = async () => {
    setError(null);
    if (!titulo.trim()) { setError("Falta el título."); return; }
    if (!clienteNombre.trim()) { setError("Falta el nombre del cliente."); return; }

    setGuardando(true);
    try {
      const { data, error: err } = await supabase2
        .from("reclamos")
        .insert({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          tipo,
          prioridad,
          asignado_a: asignadoA || null,
          referencia: referencia.trim() || null,
          cliente_id: clienteId,
          cliente_nombre: clienteNombre.trim(),
          cliente_telefono: clienteTelefono.trim() || null,
          cliente_email: clienteEmail.trim() || null,
          creado_por: miId,
        })
        .select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)")
        .single();

      if (err || !data) throw err;

      const autor = perfiles.find((p) => p.id === miId)?.nombre || "Alguien";
      await supabase2.from("reclamo_seguimiento").insert({
        reclamo_id: data.id,
        autor_id: miId,
        tipo: "creacion",
        texto: asignadoA ? `Reclamo creado y asignado a ${perfiles.find((p) => p.id === asignadoA)?.nombre || ""}` : "Reclamo creado sin asignar",
      });

      if (asignadoA && asignadoA !== miId) {
        await crearAlerta(supabase2, asignadoA, `${autor} te asignó un reclamo`, {
          mensaje: titulo.trim(),
          link: `/panel-v2/reclamos?reclamo=${data.id}`,
          tipo: "reclamo_asignado",
          prioridad: prioridad === "Urgente" || prioridad === "Alta" ? "alta" : "media",
        });
      }

      onCreado(data);
      onClose();
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el reclamo.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";
  const seccionClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-2";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#111] z-10">
          <div>
            <h2 className="text-base font-bold">Nuevo reclamo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Registrá el reclamo del cliente, asignalo a alguien y hacele seguimiento.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className={seccionClass}>El reclamo</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Título / asunto *</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Falta transferir el auto patente AB123CD" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Descripción del problema</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Contá el detalle del reclamo: qué pasó, qué reclama el cliente, qué se prometió..." className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Prioridad</label>
                  <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={inputClass}>
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Asignar a</label>
                  <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)} className={inputClass}>
                    <option value="">— Sin asignar —</option>
                    {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Le llega una notificación</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Referencia (venta / expediente / patente)</label>
                <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Opcional — ej: Venta de Juan Pérez, patente AB123CD" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative col-span-2 sm:col-span-1" ref={buscadorRef}>
                <label className={labelClass}>Vincular cliente del CRM</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setClienteId(null); setMostrarResultados(true); }}
                    onFocus={() => setMostrarResultados(true)}
                    placeholder="Buscar por nombre, teléfono o DNI"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                {mostrarResultados && busqueda.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    <button
                      onClick={() => elegirCliente(null)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/10"
                    >
                      — Cargar a mano
                    </button>
                    {resultados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => elegirCliente(c)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/10 last:border-0"
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{c.nombre}</p>
                        <p className="text-[10px] text-slate-400">{[c.telefono, c.email].filter(Boolean).join(" · ")}</p>
                      </button>
                    ))}
                    {resultados.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">Sin coincidencias.</p>}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Nombre del cliente *</label>
                <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#111]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-2">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Cargar reclamo
          </button>
        </div>
      </div>
    </div>
  );
}

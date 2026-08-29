"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2 } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

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

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultados([]); return; }
    const q = busqueda.trim().toLowerCase();
    setResultados(clientes.filter((c) => c.nombre.toLowerCase().includes(q) || (c.telefono || "").includes(q)).slice(0, 8));
  }, [busqueda, clientes]);

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
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
                {mostrarResultados && resultados.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {resultados.map((c) => (
                      <button key={c.id} onClick={() => elegirCliente(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/10 last:border-0">
                        <p className="text-xs font-bold">{c.nombre}</p>
                        {c.telefono && <p className="text-[10px] text-slate-400">{c.telefono}</p>}
                      </button>
                    ))}
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
          <button onClick={guardar} disabled={guardando} className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-2">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Crear consignación
          </button>
        </div>
      </div>
    </div>
  );
}

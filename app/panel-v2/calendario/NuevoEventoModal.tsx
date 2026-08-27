"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2 } from "lucide-react";

export const TIPOS_EVENTO = ["Reunión", "Turno", "Entrega", "Vencimiento", "Recordatorio", "Otro"];
export const SECTORES = ["Ventas", "Gestoría", "Finanzas", "Administración", "Recepción"];
export const COLORES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];

interface Perfil {
  id: string;
  nombre: string;
  roles: string[];
}

interface Props {
  fechaInicial?: string;
  perfiles: Perfil[];
  miId: string;
  onClose: () => void;
  onCreado: (evento: any) => void;
}

export default function NuevoEventoModal({ fechaInicial, perfiles, miId, onClose, onCreado }: Props) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Reunión");
  const [fecha, setFecha] = useState(fechaInicial || new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("");
  const [color, setColor] = useState(COLORES[0]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [descripcionVehiculo, setDescripcionVehiculo] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [visibilidad, setVisibilidad] = useState<"equipo" | "privado">("equipo");
  const [notificarPor, setNotificarPor] = useState<"sector" | "personas">("sector");
  const [sectores, setSectores] = useState<string[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const toggleSector = (s: string) => {
    setSectores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const togglePersona = (id: string) => {
    setPersonas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fecha) {
      setError("Completá título, fecha y tipo.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase2
        .from("eventos_calendario")
        .insert({
          titulo: titulo.trim(),
          tipo,
          fecha,
          hora: hora || null,
          color,
          nombre_cliente: nombreCliente || null,
          telefono_cliente: telefonoCliente || null,
          descripcion_vehiculo: descripcionVehiculo || null,
          responsable_id: responsableId || null,
          visibilidad,
          notificar_por: notificarPor,
          sectores: notificarPor === "sector" ? sectores : [],
          personas_notificadas: notificarPor === "personas" ? personas : [],
          descripcion: descripcion || null,
          creado_por: miId,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      onCreado(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el evento.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo evento</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completá título, fecha y tipo. El resto es opcional.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-5 mt-5">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Detalles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Título *</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Reunión con cliente, entrega Hilux" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                  {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Fecha *</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Hora (opcional)</label>
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
                <p className="text-[10px] text-slate-400 mt-1">Dejá vacío para eventos de día entero</p>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">Color</label>
              <div className="flex gap-2">
                {COLORES.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-slate-900 dark:border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Vinculación</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Nombre cliente</label>
                <input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Se autocompleta al elegir cliente" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Teléfono cliente</label>
                <input value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} placeholder="+54 11 5555 5555" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Descripción del vehículo</label>
                <input value={descripcionVehiculo} onChange={(e) => setDescripcionVehiculo(e.target.value)} placeholder="Autocompleta al elegir del stock; editable" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
                <p className="text-[10px] text-slate-400 mt-1">El selector de Stock se conecta cuando construyamos ese módulo — por ahora es texto libre.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/10 pt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Asignación y avisos</h4>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Responsable</label>
              <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                <option value="">Sin responsable asignado</option>
                {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Persona a cuyo nombre se carga el evento — siempre recibe el aviso</p>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">¿Quién puede ver este evento?</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setVisibilidad("equipo")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${visibilidad === "equipo" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>Todo el equipo</button>
                <button type="button" onClick={() => setVisibilidad("privado")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${visibilidad === "privado" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>Privado</button>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">¿A quién le avisamos?</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setNotificarPor("sector")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${notificarPor === "sector" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>Por sector</button>
                <button type="button" onClick={() => setNotificarPor("personas")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${notificarPor === "personas" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>Por personas</button>
              </div>

              {notificarPor === "sector" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {SECTORES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSector(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${sectores.includes(s) ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{s}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Le llega la notificación a todos los del sector. Podés elegir más de uno.</p>
                  {sectores.length === 0 && <p className="text-[10px] text-amber-500 mt-1">Sin sectores elegidos: no se manda ningún aviso (más allá del responsable).</p>}
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {perfiles.map((p) => (
                      <button key={p.id} type="button" onClick={() => togglePersona(p.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${personas.includes(p.id) ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{p.nombre}</button>
                    ))}
                  </div>
                  {personas.length === 0 && <p className="text-[10px] text-amber-500 mt-1">Sin personas elegidas: no se manda ningún aviso (más allá del responsable).</p>}
                </>
              )}
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Descripción / notas</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Detalles del evento, agenda, contexto..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none" />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

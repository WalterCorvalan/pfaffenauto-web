"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Loader2, CalendarCheck, Search, Check } from "lucide-react";

interface Sucursal { id: string; nombre: string }
interface Vehiculo { id: string; marca: string; modelo: string; patente: string | null }
interface Cliente { id: string; nombre: string; telefono: string | null }
interface Perfil { id: string; nombre: string; roles?: string[] }

interface Props {
  sucursales: Sucursal[];
  vehiculos: Vehiculo[];
  clientes: Cliente[];
  perfiles: Perfil[];
  miId: string;
  onClose: () => void;
  onCreada: (v: any) => void;
}

const franjasHorario = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";

export default function NuevaVisitaModal({ sucursales, vehiculos, clientes, perfiles, miId, onClose, onCreada }: Props) {
  // Auditoría de filtros 29/9: "Vendedor asignado" solo ventas/encargado.
  const vendedores = perfiles.filter((p) => p.roles?.includes("ventas") || p.roles?.includes("encargado"));
  const [clienteId, setClienteId] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  // Buscador en vivo -- el <select> con `clientes` completo (page.tsx sin
  // .limit(), PostgREST corta en 1000 igual) dejaba inalcanzable cualquier
  // cliente después del corte. Mismo patrón que NuevoPedidoModal.tsx.
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteDropdownAbierto, setClienteDropdownAbierto] = useState(false);
  const [resultadosClienteVivo, setResultadosClienteVivo] = useState<Cliente[] | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2) { setResultadosClienteVivo(null); return; }
    setBuscandoCliente(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase2.from("clientes").select("id, nombre, telefono").or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`).order("nombre").limit(20);
      setResultadosClienteVivo(data || []);
      setBuscandoCliente(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);
  const clientesFiltrados = resultadosClienteVivo ?? clientes.filter((c) => {
    const q = busquedaCliente.trim().toLowerCase();
    return q && c.nombre.toLowerCase().includes(q);
  });
  const [vehiculoId, setVehiculoId] = useState("");
  const [sucursal, setSucursal] = useState(sucursales[0]?.nombre || "");
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState("");
  const [vendedorId, setVendedorId] = useState(miId || "");
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sucursal || !fecha) { setHorariosOcupados([]); return; }
    supabase2.rpc("visitas_horarios_ocupados", { p_sucursal: sucursal, p_fecha: fecha }).then(({ data }) => {
      setHorariosOcupados((data || []).map((d: any) => d.horario_visita));
    });
  }, [sucursal, fecha]);

  const elegirCliente = (c: Cliente | null) => {
    setClienteId(c?.id || "");
    setClienteDropdownAbierto(false);
    if (c) {
      setBusquedaCliente(c.nombre);
      setNombreCliente(c.nombre);
      setTelefonoCliente(c.telefono || "");
    } else {
      setBusquedaCliente("");
    }
  };

  const guardar = async () => {
    if (!nombreCliente.trim() || !telefonoCliente.trim() || !sucursal || !fecha || !horario) {
      setError("Completá cliente, teléfono, sucursal, fecha y horario.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { data, error: err } = await supabase2
        .from("visitas")
        .insert({
          cliente_id: clienteId || null,
          nombre_cliente: nombreCliente.trim(),
          telefono_cliente: telefonoCliente.trim(),
          vehiculo_id: vehiculoId || null,
          sucursal,
          fecha_visita: fecha,
          horario_visita: horario,
          vendedor_id: vendedorId || null,
          creado_por: miId || null,
        })
        .select()
        .single();
      if (err) throw err;
      onCreada(data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ? `No se pudo agendar la visita: ${err.message}` : "No se pudo agendar la visita.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-rose-600" /> Nueva visita</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          {error && <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

          <div className="relative">
            <label className={labelClass}>Cliente existente (opcional)</label>
            {clienteId ? (
              <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                  <Check className="w-3.5 h-3.5 shrink-0" /> {busquedaCliente}
                </span>
                <button type="button" onClick={() => elegirCliente(null)} className="shrink-0 text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-[11px] font-bold uppercase tracking-widest">
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Buscar por nombre, o cargalo a mano abajo..."
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
                    <span className="text-[11px] text-slate-400 shrink-0">{c.telefono || ""}</span>
                  </button>
                ))}
                {buscandoCliente ? (
                  <p className="px-3 py-3 text-[13px] text-slate-400 italic">Buscando...</p>
                ) : clientesFiltrados.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Nombre del cliente *</label><input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Teléfono *</label><input value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} className={inputClass} /></div>
          </div>

          <div>
            <label className={labelClass}>Auto de interés (opcional)</label>
            <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">— Visita general, sin auto puntual —</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.patente ? ` (${v.patente})` : ""}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Sucursal *</label>
            <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} className={`${inputClass} cursor-pointer`}>
              {sucursales.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fecha *</label>
              <input type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setHorario(""); }} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Horario *</label>
              <select value={horario} onChange={(e) => setHorario(e.target.value)} disabled={!fecha} className={`${inputClass} cursor-pointer disabled:opacity-50`}>
                <option value="">Elegir...</option>
                {franjasHorario.map((f) => <option key={f} value={f} disabled={horariosOcupados.includes(f)}>{f} {horariosOcupados.includes(f) ? "(ocupado)" : ""}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Vendedor asignado</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">— Sin asignar —</option>
              {vendedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          <button onClick={onClose} disabled={guardando} className="ml-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl transition-colors disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />} {guardando ? "Agendando..." : "Agendar visita"}
          </button>
        </div>
      </div>
    </div>
  );
}

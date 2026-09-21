"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Loader2, Save, Search, Check, Megaphone } from "lucide-react";
import { hoyLocalISO } from "@/lib/panel/fechas";
import { crearAlerta } from "@/lib/panel/alertas";
import { buscarLeadsPorTexto, LEAD_ORIGEN_LABEL, type LeadEncontrado } from "@/lib/panel/buscarLeads";

interface Cliente { id: string; nombre: string; apellido: string | null; telefono: string | null; dni_cuit: string | null }
interface Vehiculo { id: string; marca: string; modelo: string; anio: number; patente: string | null; precio_venta: number; moneda_venta: string; estado: string }
interface Perfil { id: string; nombre: string }

interface Props {
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  perfiles: Perfil[];
  miId: string;
  miNombre: string;
  editando?: any;
  onClose: () => void;
  onCreado: (cotizacion: any) => void;
}

const CONDICIONES = ["Excelente", "Muy bueno", "Bueno", "Regular"];

export default function NuevaCotizacionModal({ clientes, vehiculos, perfiles, miId, miNombre, editando, onClose, onCreado }: Props) {
  const esEdicion = !!editando;
  const [clienteId, setClienteId] = useState(editando?.cliente_id || "");
  const [clienteNombre, setClienteNombre] = useState(editando?.cliente_nombre || "");
  const [vehiculoId, setVehiculoId] = useState(editando?.vehiculo_id || "");
  const [vehiculoDescripcion, setVehiculoDescripcion] = useState(editando?.vehiculo_descripcion || "");
  const [vendedorNombre] = useState(miNombre);

  const [permutaMarca, setPermutaMarca] = useState(editando?.permuta_marca || "");
  const [permutaModelo, setPermutaModelo] = useState(editando?.permuta_modelo || "");
  const [permutaAnio, setPermutaAnio] = useState(editando?.permuta_anio ? String(editando.permuta_anio) : "");
  const [permutaKm, setPermutaKm] = useState(editando?.permuta_km ? String(editando.permuta_km) : "");
  const [permutaEstado, setPermutaEstado] = useState(editando?.permuta_estado || "Bueno");
  const [permutaPatente, setPermutaPatente] = useState(editando?.permuta_patente || "");
  const [permutaTasacion, setPermutaTasacion] = useState<number | null>(editando?.permuta_tasacion ?? null);

  const [precioSugerido, setPrecioSugerido] = useState(editando?.precio_sugerido ? String(editando.precio_sugerido) : "");
  const [moneda, setMoneda] = useState(editando?.moneda || "USD");
  const [fechaEmision, setFechaEmision] = useState(editando?.fecha_emision || hoyLocalISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(editando?.fecha_vencimiento || "");
  const [condicionesPago, setCondicionesPago] = useState(editando?.condiciones_pago || "");
  const [notas, setNotas] = useState(editando?.notas || "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // "Cliente" y "Vehículo" eran <select> con el array completo recibido por
  // prop (fetch server-side de una sola vez, sin .limit() explícito) --
  // mismo bug ya corregido en Ventas/Señas/Presupuestos (P1-11 y el fix de
  // VehiculoSelector.tsx): con miles de filas, PostgREST corta en 1000 y un
  // cliente/vehículo agregado en la misma sesión no aparecía hasta
  // recargar. Mismo patrón acá: filtro local instantáneo con 1 carácter,
  // consulta real server-side (debounce 300ms) desde 2 caracteres.
  const [busquedaCliente, setBusquedaCliente] = useState(editando?.cliente_nombre || "");
  const [dropdownClienteAbierto, setDropdownClienteAbierto] = useState(false);
  const [resultadosClienteVivo, setResultadosClienteVivo] = useState<Cliente[] | null>(null);
  const [leadsEncontrados, setLeadsEncontrados] = useState<LeadEncontrado[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2) { setResultadosClienteVivo(null); setLeadsEncontrados([]); return; }
    setBuscandoCliente(true);
    const timer = setTimeout(async () => {
      const [{ data }, leads] = await Promise.all([
        supabase2
          .from("clientes")
          .select("id, nombre, apellido, telefono, dni_cuit")
          .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,dni_cuit.ilike.%${q}%`)
          .order("nombre")
          .limit(20),
        buscarLeadsPorTexto(supabase2, q),
      ]);
      setResultadosClienteVivo(data || []);
      setLeadsEncontrados(leads);
      setBuscandoCliente(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);
  const clientesFiltrados = resultadosClienteVivo ?? clientes.filter((c) => {
    const q = busquedaCliente.toLowerCase();
    return !q || `${c.nombre} ${c.apellido || ""} ${c.dni_cuit || ""}`.toLowerCase().includes(q);
  });

  const [busquedaVehiculo, setBusquedaVehiculo] = useState(editando?.vehiculo_descripcion || "");
  const [dropdownVehiculoAbierto, setDropdownVehiculoAbierto] = useState(false);
  const [resultadosVehiculoVivo, setResultadosVehiculoVivo] = useState<Vehiculo[] | null>(null);
  const [buscandoVehiculo, setBuscandoVehiculo] = useState(false);
  useEffect(() => {
    const q = busquedaVehiculo.trim();
    if (q.length < 2) { setResultadosVehiculoVivo(null); return; }
    setBuscandoVehiculo(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase2
        .from("vehiculos")
        .select("id, marca, modelo, anio, patente, precio_venta, moneda_venta, estado")
        .eq("estado", "disponible")
        .or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`)
        .order("marca")
        .limit(20);
      setResultadosVehiculoVivo(data || []);
      setBuscandoVehiculo(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaVehiculo]);
  const vehiculosFiltrados = resultadosVehiculoVivo ?? vehiculos.filter((v) => {
    const q = busquedaVehiculo.toLowerCase();
    return !q || `${v.marca} ${v.modelo} ${v.patente || ""}`.toLowerCase().includes(q);
  });

  const elegirCliente = (c: Cliente | null) => {
    setClienteId(c?.id || "");
    setDropdownClienteAbierto(false);
    if (c) {
      const nombreCompleto = `${c.nombre} ${c.apellido || ""}`.trim();
      setBusquedaCliente(nombreCompleto);
      setClienteNombre(nombreCompleto);
    } else {
      setBusquedaCliente("");
    }
  };

  // Igual que en Ventas: cliente_nombre es texto libre en la cotización, así
  // que un lead se vuelca directo sin necesidad de crear un cliente real.
  const elegirLead = (l: LeadEncontrado) => {
    setClienteId("");
    setDropdownClienteAbierto(false);
    setBusquedaCliente(l.nombre);
    setClienteNombre(l.nombre);
  };

  const elegirVehiculo = (v: Vehiculo | null) => {
    setVehiculoId(v?.id || "");
    setDropdownVehiculoAbierto(false);
    if (v) {
      const descripcion = `${v.marca} ${v.modelo} ${v.anio}`;
      setBusquedaVehiculo(descripcion);
      setVehiculoDescripcion(descripcion);
      setPrecioSugerido(String(v.precio_venta));
      setMoneda(v.moneda_venta);
    } else {
      setBusquedaVehiculo("");
    }
  };

  const guardar = async (enviarWhatsapp: boolean) => {
    if (!clienteNombre.trim() || !precioSugerido) {
      setError("Completá el nombre del cliente y el precio sugerido.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const payload = {
        cliente_id: clienteId || null, cliente_nombre: clienteNombre.trim(),
        vehiculo_id: vehiculoId || null, vehiculo_descripcion: vehiculoDescripcion || null,
        permuta_marca: permutaMarca || null, permuta_modelo: permutaModelo || null,
        permuta_anio: permutaAnio ? Number(permutaAnio) : null, permuta_km: permutaKm ? Number(permutaKm) : null,
        permuta_estado: (permutaMarca || permutaModelo) ? permutaEstado : null, permuta_patente: permutaPatente || null,
        permuta_tasacion: permutaTasacion,
        precio_sugerido: Number(precioSugerido), moneda,
        fecha_emision: fechaEmision, fecha_vencimiento: fechaVencimiento || null,
        condiciones_pago: condicionesPago || null, notas: notas || null,
      };
      // Editar una cotización ya aprobada (solo un admin llega a este botón,
      // ver CotizacionDetalleModal.tsx) podía cambiar precio/vehículo/permuta
      // sin volver a pasar por la aprobación -- precio_aprobado quedaba
      // congelado con el valor viejo, divergiendo en silencio del nuevo
      // precio_sugerido (Ventas usa precio_aprobado ?? precio_sugerido para
      // precargar la venta). Si se edita algo de una aprobada, vuelve a
      // pendiente y hay que re-aprobarla.
      const eraAprobada = esEdicion && editando.estado === "aprobada";
      const payloadFinal: Record<string, unknown> = { ...payload };
      if (eraAprobada) {
        payloadFinal.estado = "pendiente";
        payloadFinal.precio_aprobado = null;
        payloadFinal.historial = [...(editando.historial || []), { estado: "pendiente (editada, requiere re-aprobación)", actor_nombre: miNombre, created_at: new Date().toISOString() }];
      }
      const { data, error: dbError } = esEdicion
        ? await supabase2.from("cotizaciones").update({ ...payloadFinal, updated_at: new Date().toISOString() }).eq("id", editando.id).select().maybeSingle()
        : await supabase2.from("cotizaciones").insert({ ...payload, vendedor_id: miId || null, creado_por: miId || null }).select().maybeSingle();
      if (dbError) throw dbError;
      if (!data) throw new Error("No se pudo confirmar el guardado (no se pudo releer la cotización). Verificá permisos y volvé a intentar.");
      if (!esEdicion && miId) {
        // Antes notificaba a miId -- el mismo vendedor que acaba de crearla,
        // avisándole de algo que ya sabe. Tiene que avisarle a admin/encargados.
        const { data: destinatarios } = await supabase2.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true).neq("id", miId);
        for (const d of destinatarios || []) {
          crearAlerta(supabase2, d.id, `Nueva cotización — ${data.cliente_nombre}`, {
            mensaje: `${miNombre} creó una cotización por ${data.moneda} ${Number(data.precio_sugerido).toLocaleString("es-AR")}.`,
            link: "/panel/cotizaciones", tipo: "cotizacion", prioridad: "novedad", categoriaNotif: "cotizaciones",
          });
        }
      }
      onCreado(data);
      if (enviarWhatsapp) {
        const cliente = clientes.find((c) => c.id === clienteId);
        const tel = (cliente?.telefono || "").replace(/\D/g, "");
        const texto = encodeURIComponent(
          `Hola ${clienteNombre}! Te paso la cotización:\n${vehiculoDescripcion || "Vehículo a confirmar"}\nPrecio: ${moneda} ${Number(precioSugerido).toLocaleString("es-AR")}${condicionesPago ? `\nCondiciones: ${condicionesPago}` : ""}`
        );
        window.open(tel ? `https://wa.me/${tel}?text=${texto}` : `https://wa.me/?text=${texto}`, "_blank");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ? `No se pudo guardar la cotización: ${err.message}` : "No se pudo guardar la cotización.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";
  const seccionClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-6 pb-0 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 pr-4">{esEdicion ? "Editando cotización — el estado se maneja desde la lista." : "Se crea en estado Pendiente. El cambio de estado se maneja desde el detalle."}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-5 px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <div>
            <p className={seccionClass}>👤 Cliente y vehículo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className={labelClass}>Cliente (del CRM)</label>
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
                      className={`${inputClass} pl-9`}
                      placeholder="Buscar por nombre, teléfono o DNI..."
                      value={busquedaCliente}
                      onChange={(e) => { setBusquedaCliente(e.target.value); setDropdownClienteAbierto(true); }}
                      onFocus={() => setDropdownClienteAbierto(true)}
                      onBlur={() => setTimeout(() => setDropdownClienteAbierto(false), 150)}
                    />
                  </div>
                )}
                {!clienteId && dropdownClienteAbierto && busquedaCliente && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-white/10">
                    {clientesFiltrados.slice(0, 20).map((c) => (
                      <button key={c.id} type="button" onMouseDown={() => elegirCliente(c)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.nombre} {c.apellido || ""}</span>
                        <span className="text-[11px] text-slate-400 shrink-0">{c.telefono || c.dni_cuit || ""}</span>
                      </button>
                    ))}
                    {leadsEncontrados.map((l) => (
                      <button key={`${l.origen}-${l.id}`} type="button" onMouseDown={() => elegirLead(l)} className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5 min-w-0 truncate"><Megaphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> <span className="truncate">{l.nombre}</span></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-300 shrink-0">{LEAD_ORIGEN_LABEL[l.origen]}</span>
                      </button>
                    ))}
                    {buscandoCliente ? (
                      <p className="px-3 py-3 text-[13px] text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</p>
                    ) : clientesFiltrados.length === 0 && leadsEncontrados.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Elegí uno o dejá vacío y completá el nombre libre</p>
              </div>
              <div><label className={labelClass}>Nombre del cliente *</label><input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Se pre-llena al elegir del selector" className={inputClass} /></div>
              <div className="relative">
                <label className={labelClass}>Vehículo (del stock)</label>
                {vehiculoId ? (
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                      <Check className="w-3.5 h-3.5 shrink-0" /> {busquedaVehiculo}
                    </span>
                    <button type="button" onClick={() => elegirVehiculo(null)} className="shrink-0 text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-[11px] font-bold uppercase tracking-widest">
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className={`${inputClass} pl-9`}
                      placeholder="Buscar por marca, modelo o patente..."
                      value={busquedaVehiculo}
                      onChange={(e) => { setBusquedaVehiculo(e.target.value); setDropdownVehiculoAbierto(true); }}
                      onFocus={() => setDropdownVehiculoAbierto(true)}
                      onBlur={() => setTimeout(() => setDropdownVehiculoAbierto(false), 150)}
                    />
                  </div>
                )}
                {!vehiculoId && dropdownVehiculoAbierto && busquedaVehiculo && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-white/10">
                    {vehiculosFiltrados.slice(0, 20).map((v) => (
                      <button key={v.id} type="button" onMouseDown={() => elegirVehiculo(v)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{v.marca} {v.modelo} {v.anio}</span>
                        <span className="text-[11px] text-slate-400 shrink-0">{v.patente || "s/patente"}</span>
                      </button>
                    ))}
                    {buscandoVehiculo ? (
                      <p className="px-3 py-3 text-[13px] text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</p>
                    ) : vehiculosFiltrados.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-400 italic">Sin resultados.</p>}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Opcional — usalo si el cliente ya eligió uno</p>
              </div>
              <div>
                <label className={labelClass}>Descripción del vehículo (libre)</label>
                <input value={vehiculoDescripcion} onChange={(e) => setVehiculoDescripcion(e.target.value)} placeholder="Ej. Toyota Hilux 2022 SRX 4x4" className={inputClass} />
                <p className="text-[10px] text-slate-400 mt-1">Si no está en el stock, describilo acá</p>
              </div>
              <div><label className={labelClass}>Vendedor</label><input disabled value={vendedorNombre} className={`${inputClass} opacity-60 cursor-not-allowed`} /></div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>🔄 Auto que el cliente entrega en permuta</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className={labelClass}>Marca</label><input value={permutaMarca} onChange={(e) => setPermutaMarca(e.target.value)} placeholder="BMW, Audi, Toyota..." className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={permutaModelo} onChange={(e) => setPermutaModelo(e.target.value)} placeholder="X3, A4, Hilux..." className={inputClass} /></div>
              <div><label className={labelClass}>Año</label><input type="number" value={permutaAnio} onChange={(e) => setPermutaAnio(e.target.value)} placeholder="2020" className={inputClass} /></div>
              <div><label className={labelClass}>Kilómetros</label><input type="text" inputMode="numeric" value={permutaKm} onChange={(e) => setPermutaKm(e.target.value.replace(/\D/g, ""))} placeholder="50000" className={inputClass} /></div>
              <div>
                <label className={labelClass}>Estado general</label>
                <select value={permutaEstado} onChange={(e) => setPermutaEstado(e.target.value)} className={inputClass}>{CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div><label className={labelClass}>Patente / Dominio</label><input value={permutaPatente} onChange={(e) => setPermutaPatente(e.target.value)} placeholder="AB123CD" className={inputClass} /></div>
            </div>
            {permutaTasacion !== null && <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">Tasación de referencia: {moneda} {permutaTasacion.toLocaleString("es-AR")}</p>}
          </div>

          <div>
            <p className={seccionClass}>📄 Precio y condiciones</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Precio sugerido *</label>
                <div className="flex gap-1">
                  <input type="text" inputMode="numeric" value={precioSugerido} onChange={(e) => setPrecioSugerido(e.target.value.replace(/\D/g, ""))} placeholder="15000000" className={`${inputClass} flex-1 min-w-0`} />
                  <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={`${inputClass} !w-20 shrink-0`}><option value="USD">USD</option><option value="ARS">ARS</option></select>
                </div>
              </div>
              <div><label className={labelClass}>Fecha de emisión *</label><input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Vence (opcional)</label><input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="mt-3">
              <label className={labelClass}>Condiciones de pago</label>
              <textarea value={condicionesPago} onChange={(e) => setCondicionesPago(e.target.value)} rows={2} placeholder="Ej. 30% con refuerzo a 30 días, saldo a la entrega" className={`${inputClass} resize-none`} />
            </div>
            <div className="mt-3">
              <label className={labelClass}>Notas</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cancelar</button>
          <button type="button" onClick={() => guardar(false)} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {esEdicion ? "Guardar cambios" : "Crear cotización"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

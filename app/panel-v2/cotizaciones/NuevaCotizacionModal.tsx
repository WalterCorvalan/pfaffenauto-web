"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Save, Calculator } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";
import TasarUsadoModal from "./TasarUsadoModal";
import { crearAlerta } from "@/lib/panelV2/alertas";

interface Cliente { id: string; nombre: string; telefono: string | null; dni_cuit: string | null }
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
  const [modalTasar, setModalTasar] = useState(false);

  const [precioSugerido, setPrecioSugerido] = useState(editando?.precio_sugerido ? String(editando.precio_sugerido) : "");
  const [moneda, setMoneda] = useState(editando?.moneda || "USD");
  const [fechaEmision, setFechaEmision] = useState(editando?.fecha_emision || hoyLocalISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(editando?.fecha_vencimiento || "");
  const [condicionesPago, setCondicionesPago] = useState(editando?.condiciones_pago || "");
  const [notas, setNotas] = useState(editando?.notas || "");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const elegirCliente = (id: string) => {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) setClienteNombre(c.nombre);
  };

  const elegirVehiculo = (id: string) => {
    setVehiculoId(id);
    const v = vehiculos.find((x) => x.id === id);
    if (v) {
      setVehiculoDescripcion(`${v.marca} ${v.modelo} ${v.anio}`);
      setPrecioSugerido(String(v.precio_venta));
      setMoneda(v.moneda_venta);
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
      const { data, error: dbError } = esEdicion
        ? await supabase2.from("cotizaciones").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editando.id).select().single()
        : await supabase2.from("cotizaciones").insert({ ...payload, vendedor_id: miId || null, creado_por: miId || null }).select().single();
      if (dbError) throw dbError;
      if (!esEdicion && miId) {
        crearAlerta(supabase2, miId, `Nueva cotización — ${data.cliente_nombre}`, {
          mensaje: `${miNombre} creó una cotización por ${data.moneda} ${Number(data.precio_sugerido).toLocaleString("es-AR")}.`,
          link: "/panel-v2/cotizaciones", tipo: "cotizacion", prioridad: "novedad",
        });
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
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la cotización.");
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
              <div>
                <label className={labelClass}>Cliente (del CRM)</label>
                <select value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className={inputClass}>
                  <option value="">— Buscar por nombre, teléfono o DNI... —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Elegí uno o dejá vacío y completá el nombre libre</p>
              </div>
              <div><label className={labelClass}>Nombre del cliente *</label><input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Se pre-llena al elegir del selector" className={inputClass} /></div>
              <div>
                <label className={labelClass}>Vehículo (del stock)</label>
                <select value={vehiculoId} onChange={(e) => elegirVehiculo(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio} · {v.patente || "s/patente"}</option>)}
                </select>
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
            <div className="flex items-center justify-between mb-2">
              <p className={seccionClass}>🔄 Auto que el cliente entrega en permuta</p>
              <button type="button" onClick={() => setModalTasar(true)} className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-2.5 py-1.5"><Calculator className="w-3.5 h-3.5" /> Tasar este usado</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className={labelClass}>Marca</label><input value={permutaMarca} onChange={(e) => setPermutaMarca(e.target.value)} placeholder="BMW, Audi, Toyota..." className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={permutaModelo} onChange={(e) => setPermutaModelo(e.target.value)} placeholder="X3, A4, Hilux..." className={inputClass} /></div>
              <div><label className={labelClass}>Año</label><input type="number" value={permutaAnio} onChange={(e) => setPermutaAnio(e.target.value)} placeholder="2020" className={inputClass} /></div>
              <div><label className={labelClass}>Kilómetros</label><input type="number" value={permutaKm} onChange={(e) => setPermutaKm(e.target.value)} placeholder="50000" className={inputClass} /></div>
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
                  <input type="number" value={precioSugerido} onChange={(e) => setPrecioSugerido(e.target.value)} className={`${inputClass} flex-1 min-w-0`} />
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
          <button type="button" onClick={() => guardar(false)} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {esEdicion ? "Guardar cambios" : "Crear cotización"}</>}
          </button>
        </div>
      </div>

      {modalTasar && (
        <TasarUsadoModal
          marcaInicial={permutaMarca} modeloInicial={permutaModelo} anioInicial={permutaAnio} kmInicial={permutaKm}
          onClose={() => setModalTasar(false)}
          onTasado={(valor) => { setPermutaTasacion(valor); setModalTasar(false); }}
        />
      )}
    </div>
  );
}

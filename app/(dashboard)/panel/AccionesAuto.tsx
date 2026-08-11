"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, DollarSign, User, CreditCard, CheckCircle2 } from "lucide-react";

interface AccionesAutoProps {
  autoId: string;
  estadoActual: string;
  puedeGestionar: boolean;
}

export default function AccionesAuto({ autoId, estadoActual, puedeGestionar }: AccionesAutoProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [precioFinal, setPrecioFinal] = useState("");
  const [compradorNombre, setCompradorNombre] = useState("");
  const [compradorApellido, setCompradorApellido] = useState("");
  const [formaPago, setFormaPago] = useState("Contado");

  const manejarCambioSelect = async (nuevoEstadoVisual: string) => {
    if (!puedeGestionar) return;
    const estadoReal = nuevoEstadoVisual === "Señado" ? "Reservado" : nuevoEstadoVisual;
    if (estadoReal === "Vendido") {
      setShowModal(true);
    } else {
      await ejecutarTransaccion(estadoReal);
    }
  };

  const ejecutarTransaccion = async (nuevoEstado: string, datosVenta?: any) => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fechaActual = new Date().toISOString().split("T")[0];

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos",
        registro_id: autoId,
        campo_modificado: "estado",
        valor_anterior: estadoActual,
        valor_nuevo: nuevoEstado,
        usuario_id: user?.id,
      });

      if (nuevoEstado === "Vendido" && datosVenta) {
        let clienteId = null;
        const { data: clienteInsertado, error: errCliente } = await supabase
          .from("clientes")
          .insert({ nombre: datosVenta.compradorNombre, apellido: datosVenta.compradorApellido })
          .select("id")
          .single();

        if (!errCliente && clienteInsertado) clienteId = clienteInsertado.id;
        else if (errCliente) console.error("Error creando cliente:", errCliente);

        const { error: errAuto } = await supabase
          .from("vehiculos")
          .update({
            estado: "Vendido",
            precio_venta_final_ars: datosVenta.precioFinal,
            forma_pago: datosVenta.formaPago,
            fecha_venta: fechaActual,
          })
          .eq("id", autoId);

        if (errAuto) throw errAuto;

        const { error: errVenta } = await supabase.from("ventas").insert({
          vehiculo_id: autoId,
          cliente_id: clienteId,
          vendedor_id: user?.id,
          precio_final_ars: datosVenta.precioFinal,
          forma_pago: datosVenta.formaPago,
          fecha_venta: fechaActual,
        });

        if (errVenta) throw errVenta;
      } else {
        const { error: errAutoBasico } = await supabase
          .from("vehiculos")
          .update({ estado: nuevoEstado })
          .eq("id", autoId);
        if (errAutoBasico) throw errAutoBasico;
      }

      setShowModal(false);
      setPrecioFinal("");
      setCompradorNombre("");
      setCompradorApellido("");
      router.refresh();
    } catch (error) {
      console.error("Error procesando transacción:", error);
      alert("Hubo un error al guardar la transacción.");
    } finally {
      setCargando(false);
    }
  };

  const confirmarVenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!precioFinal || !compradorNombre || !compradorApellido) {
      alert("Por favor completá el precio final, nombre y apellido del comprador.");
      return;
    }
    ejecutarTransaccion("Vendido", {
      precioFinal: Number(precioFinal),
      compradorNombre,
      compradorApellido,
      formaPago,
    });
  };

  const estadoVisual = estadoActual === "Reservado" ? "Señado" : estadoActual;

  const colorClasses = `
    ${estadoVisual === "Borrador" ? "bg-slate-100 text-slate-600 border-slate-200" : ""}
    ${estadoVisual === "Disponible" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
    ${estadoVisual === "Señado" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
    ${estadoVisual === "Vendido" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : ""}
    ${estadoVisual === "Archivado" ? "bg-rose-50 text-rose-700 border-rose-200" : ""}
  `;

  if (!puedeGestionar) {
    return (
      <div className={`inline-flex items-center justify-center text-[10px] md:text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm cursor-default uppercase tracking-wider ${colorClasses}`}>
        {estadoVisual}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={estadoVisual}
          onChange={(e) => manejarCambioSelect(e.target.value)}
          disabled={cargando}
          className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border outline-none appearance-none transition-all shadow-sm
            ${cargando ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
            ${colorClasses}
          `}
        >
          <option value="Disponible" className="bg-white text-slate-900">Disponible</option>
          <option value="Señado" className="bg-white text-slate-900">Señado</option>
          <option value="Vendido" className="bg-white text-slate-900">Vendido</option>
          <option value="Archivado" className="bg-white text-slate-900">Archivado</option>
        </select>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Cierre de Venta
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">Ingresá los datos reales de la operación.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarVenta} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Precio Final Acordado (ARS)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                  <DollarSign className="w-4 h-4 text-slate-400 mr-2" />
                  <input type="number" required value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} placeholder="Ej: 24500000" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                    <User className="w-4 h-4 text-slate-400 mr-2" />
                    <input type="text" required value={compradorNombre} onChange={(e) => setCompradorNombre(e.target.value)} placeholder="Nombre" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Apellido</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                    <input type="text" required value={compradorApellido} onChange={(e) => setCompradorApellido(e.target.value)} placeholder="Apellido" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Forma de Pago</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                  <CreditCard className="w-4 h-4 text-slate-400 mr-2" />
                  <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none appearance-none cursor-pointer">
                    <option value="Contado">Contado (Transf. o Efectivo)</option>
                    <option value="Financiado">Financiado (Crédito/Prenda)</option>
                    <option value="Permuta">Permuta (Usado como pago)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {cargando ? "Guardando..." : "Confirmar Venta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
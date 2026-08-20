"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, DollarSign, User, CreditCard, CheckCircle2 } from "lucide-react";

interface AccionesAutoProps {
  autoId: string;
  autoMarca?: string;
  autoModelo?: string;
  vendedorAsignadoId?: string | null;
  estadoActual: string;
  puedeGestionar: boolean;
}

export default function AccionesAuto({ autoId, autoMarca, autoModelo, vendedorAsignadoId, estadoActual, puedeGestionar }: AccionesAutoProps) {
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

      const nombreAuto = `${autoMarca || ""} ${autoModelo || ""}`.trim() || "un auto";
      fetch("/api/vehiculos/notificar-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoId,
          vendedorAsignadoId: vendedorAsignadoId || null,
          actorId: user?.id || null,
          mensaje: `El ${nombreAuto} pasó de ${estadoActual} a ${nuevoEstado}.`,
          tipo: "estado_actualizado",
        }),
      }).catch((err) => console.error("Error notificando cambio de estado:", err));

      if (nuevoEstado === "Vendido" && datosVenta) {
        let clienteId = null;
        const { data: clienteInsertado, error: errCliente } = await supabase
          .from("clientes")
          .insert({ nombre: datosVenta.compradorNombre, apellido: datosVenta.compradorApellido })
          .select("id")
          .single();

        if (!errCliente && clienteInsertado) clienteId = clienteInsertado.id;
        else if (errCliente) console.error("Error creando cliente:", errCliente);

        const { data: autoActualizado, error: errAuto } = await supabase
          .from("vehiculos")
          .update({
            estado: "Vendido",
            precio_venta_final_ars: datosVenta.precioFinal,
            forma_pago: datosVenta.formaPago,
            fecha_venta: fechaActual,
          })
          .eq("id", autoId)
          .select("marca, modelo, patente, color, anio, numero_motor, numero_chasis")
          .single();

        if (errAuto) throw errAuto;

        const { data: ultimoBoleto } = await supabase.from("boletos_venta").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
        const siguienteNumero = (ultimoBoleto?.numero || 0) + 1;

        const { error: errVenta } = await supabase.from("boletos_venta").insert({
          numero: siguienteNumero,
          fecha: fechaActual,
          vehiculo_id: autoId,
          cliente_id: clienteId,
          nombre: datosVenta.compradorNombre,
          apellido: datosVenta.compradorApellido,
          vendedor_id: user?.id,
          venta_ars: datosVenta.precioFinal,
          saldo_abonar_ars: 0,
          marca: autoActualizado?.marca,
          modelo: autoActualizado?.modelo,
          dominio: autoActualizado?.patente,
          color: autoActualizado?.color,
          modelo_anio: autoActualizado?.anio,
          numero_motor: autoActualizado?.numero_motor,
          numero_chasis: autoActualizado?.numero_chasis,
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
    ${estadoVisual === "Borrador" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Disponible" ? "bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-sky-300 border-blue-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Señado" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Vendido" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Archivado" ? "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-[#0a2a6b]" : ""}
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
          <option value="Disponible" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Disponible</option>
          <option value="Señado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Señado</option>
          <option value="Vendido" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vendido</option>
          <option value="Archivado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Archivado</option>
        </select>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Cierre de Venta
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Ingresá los datos reales de la operación.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarVenta} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Precio Final Acordado (ARS)</label>
                <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                  <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2" />
                  <input type="number" required value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} placeholder="Ej: 24500000" className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2" />
                    <input type="text" required value={compradorNombre} onChange={(e) => setCompradorNombre(e.target.value)} placeholder="Nombre" className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                    <input type="text" required value={compradorApellido} onChange={(e) => setCompradorApellido(e.target.value)} placeholder="Apellido" className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Forma de Pago</label>
                <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                  <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2" />
                  <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer">
                    <option value="Contado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Contado (Transf. o Efectivo)</option>
                    <option value="Financiado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Financiado (Crédito/Prenda)</option>
                    <option value="Permuta" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Permuta (Usado como pago)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
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
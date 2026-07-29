"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { X, DollarSign, User, CreditCard, CheckCircle2 } from "lucide-react";

interface AccionesAutoProps {
  autoId: string;
  estadoActual: string;
  puedeGestionar: boolean;
}

export default function AccionesAuto({
  autoId,
  estadoActual,
  puedeGestionar,
}: AccionesAutoProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [precioFinal, setPrecioFinal] = useState("");
  const [compradorNombre, setCompradorNombre] = useState("");
  const [compradorApellido, setCompradorApellido] = useState("");
  const [formaPago, setFormaPago] = useState("Contado");

  const manejarCambioSelect = async (nuevoEstadoVisual: string) => {
    if (!puedeGestionar) return;
    const estadoReal =
      nuevoEstadoVisual === "Señado" ? "Reservado" : nuevoEstadoVisual;

    if (estadoReal === "Vendido") {
      setShowModal(true);
    } else {
      await ejecutarTransaccion(estadoReal);
    }
  };

  const ejecutarTransaccion = async (nuevoEstado: string, datosVenta?: any) => {
    setCargando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fechaActual = new Date().toISOString().split("T")[0];

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos",
        registro_id: autoId,
        campo_modificado: "estado",
        valor_anterior: estadoActual,
        valor_nuevo: nuevoEstado,
        usuario_id: user?.id,
      });

      // ---------------------------------------------------------
      // LÓGICA SI ES UNA VENTA CERRADA
      // ---------------------------------------------------------
      if (nuevoEstado === "Vendido" && datosVenta) {
        // A. Crear el cliente para obtener el cliente_id
        let clienteId = null;

        const { data: clienteInsertado, error: errCliente } = await supabase
          .from("clientes")
          .insert({
            nombre: datosVenta.compradorNombre,
            apellido: datosVenta.compradorApellido,
          })
          .select("id")
          .single();

        if (!errCliente && clienteInsertado) {
          clienteId = clienteInsertado.id;
        } else if (errCliente) {
          console.error("Error creando cliente:", errCliente);
        }

        // B. Actualizar el Vehículo
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

        // C. Registrar en la tabla Ventas
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
      alert(
        "Por favor completá el precio final, nombre y apellido del comprador.",
      );
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

  // ESTILOS GLOBALES PARA LAS PÍLDORAS DE ESTADO
  const colorClasses = `
    ${estadoVisual === "Borrador" ? "bg-gray-800 text-gray-300 border-gray-600" : ""}
    ${estadoVisual === "Disponible" ? "bg-green-900/30 text-green-400 border-green-700/50" : ""}
    ${estadoVisual === "Señado" ? "bg-yellow-900/30 text-yellow-400 border-yellow-700/50" : ""}
    ${estadoVisual === "Vendido" ? "bg-blue-900/30 text-blue-400 border-blue-700/50" : ""}
    ${estadoVisual === "Archivado" ? "bg-red-900/30 text-red-400 border-red-700/50" : ""}
  `;

  // SI ES VENDEDOR (NO GESTIONA), DEVOLVEMOS SOLO TEXTO ESTÁTICO
  if (!puedeGestionar) {
    return (
      <div
        className={`inline-flex items-center justify-center text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm cursor-default ${colorClasses}`}
      >
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
          className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none appearance-none transition-all shadow-sm
            ${cargando ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
            ${colorClasses}
          `}
        >
          <option value="Disponible" className="bg-gray-900 text-white">
            Disponible
          </option>
          <option value="Señado" className="bg-gray-900 text-white">
            Señado
          </option>
          <option value="Vendido" className="bg-gray-900 text-white">
            Vendido
          </option>
          <option value="Archivado" className="bg-gray-900 text-white">
            Archivado
          </option>
        </select>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="relative bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl font-serif text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Cierre
                  de Venta
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ingresá los datos reales de la operación.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarVenta} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                  Precio Final Acordado (ARS)
                </label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                  <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="number"
                    required
                    value={precioFinal}
                    onChange={(e) => setPrecioFinal(e.target.value)}
                    placeholder="Ej: 24500000"
                    className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Datos del Comprador */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                    Nombre
                  </label>
                  <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                      type="text"
                      required
                      value={compradorNombre}
                      onChange={(e) => setCompradorNombre(e.target.value)}
                      placeholder="Nombre"
                      className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                    Apellido
                  </label>
                  <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                    <input
                      type="text"
                      required
                      value={compradorApellido}
                      onChange={(e) => setCompradorApellido(e.target.value)}
                      placeholder="Apellido"
                      className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                  Forma de Pago
                </label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="Contado" className="bg-[#121212]">
                      Contado (Transf. o Efectivo)
                    </option>
                    <option value="Financiado" className="bg-[#121212]">
                      Financiado (Crédito/Prenda)
                    </option>
                    <option value="Permuta" className="bg-[#121212]">
                      Permuta (Usado como pago)
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-[#0055A4] hover:bg-[#1E6FD9] text-white rounded-xl transition-colors shadow-lg shadow-[#0055A4]/20 disabled:opacity-50"
                >
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

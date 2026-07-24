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

export default function AccionesAuto({ autoId, estadoActual, puedeGestionar }: AccionesAutoProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  
  // Estados para controlar el Modal de Cierre de Venta
  const [showModal, setShowModal] = useState(false);
  const [precioFinal, setPrecioFinal] = useState("");
  const [comprador, setComprador] = useState("");
  const [formaPago, setFormaPago] = useState("Contado"); // Restringido a la BD ('Contado', 'Financiado', 'Permuta')

  // Interceptamos el cambio del select
  const manejarCambioSelect = async (nuevoEstado: string) => {
    if (!puedeGestionar) return;

    if (nuevoEstado === "Vendido") {
      setShowModal(true);
    } else {
      await ejecutarTransaccion(nuevoEstado);
    }
  };

  // Función principal adaptada AL ESQUEMA EXACTO DE TU BASE DE DATOS
  const ejecutarTransaccion = async (nuevoEstado: string, datosVenta?: any) => {
    setCargando(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD para la BD

      // ---------------------------------------------------------
      // 1. REGISTRAR HISTORIAL DE CAMBIOS (Auditoría exacta)
      // ---------------------------------------------------------
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
        
        // A. Crear el titular para obtener el cliente_id
        let clienteId = null;
        const { data: titularInsertado, error: errTitular } = await supabase
          .from("titulares")
          .insert({
            vehiculo_id: autoId,
            tipo_relacion: 'titular',
            nombre_completo: datosVenta.comprador,
          })
          .select("id")
          .single();
        
        if (!errTitular && titularInsertado) {
          clienteId = titularInsertado.id;
        }

        // B. Actualizar el Vehículo
        const { error: errAuto } = await supabase
          .from("vehiculos")
          .update({
            estado: 'Vendido',
            precio_venta_final_ars: datosVenta.precioFinal,
            forma_pago: datosVenta.formaPago,
            fecha_venta: fechaActual
          })
          .eq("id", autoId);

        if (errAuto) throw errAuto;

        // C. Registrar en la tabla Ventas
        const { error: errVenta } = await supabase
          .from("ventas")
          .insert({
            vehiculo_id: autoId,
            cliente_id: clienteId,
            vendedor_id: user?.id,
            precio_final_ars: datosVenta.precioFinal,
            forma_pago: datosVenta.formaPago,
            fecha_venta: fechaActual
          });

        if (errVenta) throw errVenta;

      } else {
        // LÓGICA SI SOLO ES CAMBIO DE ESTADO (Borrador, Disponible, Reservado)
        const { error: errAutoBasico } = await supabase
          .from("vehiculos")
          .update({ estado: nuevoEstado })
          .eq("id", autoId);
          
        if (errAutoBasico) throw errAutoBasico;
      }

      // Finalizamos
      setShowModal(false);
      setPrecioFinal("");
      setComprador("");
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
    if (!precioFinal || !comprador) {
      alert("Por favor completá el precio final y el comprador.");
      return;
    }
    
    ejecutarTransaccion("Vendido", {
      precioFinal: Number(precioFinal),
      comprador,
      formaPago
    });
  };

  return (
    <>
      {/* ================= SELECT DE ESTADO ================= */}
      <div className="flex items-center gap-2">
        <select
          value={estadoActual}
          onChange={(e) => manejarCambioSelect(e.target.value)}
          disabled={cargando || !puedeGestionar}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none appearance-none transition-all shadow-sm
            ${cargando || !puedeGestionar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            ${estadoActual === 'Borrador' ? 'bg-gray-800 text-gray-300 border-gray-600' : ''}
            ${estadoActual === 'Disponible' ? 'bg-green-900/30 text-green-400 border-green-700/50' : ''}
            ${estadoActual === 'Reservado' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : ''}
            ${estadoActual === 'Vendido' ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' : ''}
            ${estadoActual === 'Archivado' ? 'bg-red-900/30 text-red-400 border-red-700/50' : ''}
          `}
        >
          <option value="Borrador" className="bg-gray-900 text-white">Borrador</option>
          <option value="Disponible" className="bg-gray-900 text-white">Disponible</option>
          <option value="Reservado" className="bg-gray-900 text-white">Reservado</option>
          <option value="Vendido" className="bg-gray-900 text-white">Vendido</option>
          <option value="Archivado" className="bg-gray-900 text-white">Archivado</option>
        </select>
      </div>

      {/* ================= MODAL DE CIERRE DE VENTA ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
            
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl font-serif text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Cierre de Venta
                </h3>
                <p className="text-xs text-gray-400 mt-1">Ingresá los datos reales de la operación.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmarVenta} className="space-y-4">
              
              {/* Precio Final */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Precio Final Acordado (ARS)</label>
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
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre del Comprador</label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    type="text"
                    required
                    value={comprador}
                    onChange={(e) => setComprador(e.target.value)}
                    placeholder="Nombre completo o Razón Social"
                    className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Forma de Pago - Opciones adaptadas al esquema real */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Forma de Pago</label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="Contado" className="bg-[#121212]">Contado (Transf. o Efectivo)</option>
                    <option value="Financiado" className="bg-[#121212]">Financiado (Crédito/Prenda)</option>
                    <option value="Permuta" className="bg-[#121212]">Permuta (Usado como pago)</option>
                  </select>
                </div>
              </div>

              {/* Botón Guardar */}
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
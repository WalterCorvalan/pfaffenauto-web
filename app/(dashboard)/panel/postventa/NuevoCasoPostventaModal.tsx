"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Wrench } from "lucide-react";

export default function NuevoCasoPostventaModal({ vehiculos }: { vehiculos: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [nombreContacto, setNombreContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [tipo, setTipo] = useState("Service");
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase.from("postventa_casos").insert({
        nombre_contacto: nombreContacto,
        telefono_contacto: telefonoContacto,
        vehiculo_id: vehiculoId || null,
        tipo,
        descripcion,
        estado: "Pendiente",
        fecha: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
      setIsOpen(false);
      setNombreContacto(""); setTelefonoContacto(""); setVehiculoId(""); setDescripcion(""); setTipo("Service");
      router.refresh();
    } catch (err) {
      alert("Error al registrar el caso");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[12px] font-bold transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" /> Nuevo Caso
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Nuevo Caso de Postventa
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre del cliente</label>
                <input
                  type="text" required value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Teléfono</label>
                <input
                  type="tel" required value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Vehículo (opcional)</label>
                <select
                  value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sin especificar</option>
                  {vehiculos.map((v) => (<option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.patente ? `(${v.patente})` : ""}</option>))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Tipo</label>
                <select
                  value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Service">Service</option>
                  <option value="Reclamo">Reclamo</option>
                  <option value="Garantia">Garantía</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Descripción</label>
                <textarea
                  value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors resize-none"
                  placeholder="Detalle del reclamo o motivo del turno"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <button
                  type="submit" disabled={cargando}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 text-[11px] uppercase tracking-widest shadow-sm transition-colors"
                >
                  {cargando ? "Guardando..." : "Registrar Caso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

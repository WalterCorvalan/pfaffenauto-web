"use client";

import React, { useState } from "react";
import { CalendarDays, X, CheckCircle2, Loader2, MapPin, Clock, CarFront, User, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Ajustá la ruta si tu supabase client está en otro lado

interface AgendarVisitaProps {
  auto: any;
  isMobile?: boolean;
}

export default function AgendarVisita({ auto, isMobile = false }: AgendarVisitaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState("10:00");

  const sucursalNombre = auto?.sucursales?.nombre || "Casa Central";
  const autoNombre = `${auto.marca} ${auto.modelo}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono || !fecha || !horario) return;

    setLoading(true);

    try {
      // Guardar en Supabase
      const { error } = await supabase
        .from('visitas_agendadas')
        .insert([{
          vehiculo_id: auto.id,
          nombre_cliente: nombre.trim(),
          telefono_cliente: telefono.trim(),
          fecha_visita: fecha,
          horario_visita: horario,
          sucursal: sucursalNombre,
          estado: 'Pendiente'
        }]);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setNombre(""); setTelefono(""); setFecha(""); setHorario("10:00");
      }, 4000);

    } catch (error) {
      console.error("Error al agendar:", error);
      alert("Hubo un error al agendar la visita. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Obtener fecha de mañana para el input min (no pueden agendar para el pasado)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <>
      {/* BOTÓN DISPARADOR */}
      <button
        onClick={() => setIsOpen(true)}
        className={
          isMobile
            ? "flex-1 bg-white border border-slate-200 text-navy font-black text-[10px] sm:text-xs uppercase tracking-widest text-center py-4 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            : "block w-full bg-white border border-slate-200 text-navy font-black text-xs uppercase tracking-widest text-center py-4 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-blue-200 hover:text-[#0145F2] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
        }
      >
        <CalendarDays className="w-4 h-4 text-[#0145F2] group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Agendar </span>Visita
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !loading && !success && setIsOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all flex flex-col max-h-[95vh]">
            
            {/* Header del Modal */}
            <div className="bg-[#0b1329] p-6 relative shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-[#0145F2]" /> Agendar Visita
              </h3>
              <p className="text-xs text-sky-200 mt-1 font-medium">Reservá tu turno para ver la unidad en persona.</p>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-navy mb-2">¡Turno Confirmado!</h4>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Te esperamos el <strong>{fecha.split('-').reverse().join('/')}</strong> a las <strong>{horario} hs</strong> en nuestra sucursal de {sucursalNombre}. Un asesor se contactará con vos para reconfirmar.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Resumen del auto a ver */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <CarFront className="w-6 h-6 text-[#0145F2]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad de interés</p>
                      <p className="font-black text-navy text-sm">{autoNombre}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#0145F2]" /> Sucursal {sucursalNombre}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Nombre completo</label>
                      <input 
                        type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Celular</label>
                      <input 
                        type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="Ej: 11 0000 0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Día</label>
                      <input 
                        type="date" required min={minDate} value={fecha} onChange={(e) => setFecha(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Hora aprox.</label>
                      <select 
                        required value={horario} onChange={(e) => setHorario(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="09:00">09:00 hs (Mañana)</option>
                        <option value="10:00">10:00 hs</option>
                        <option value="11:00">11:00 hs</option>
                        <option value="12:00">12:00 hs</option>
                        <option value="14:00">14:00 hs (Tarde)</option>
                        <option value="15:00">15:00 hs</option>
                        <option value="16:00">16:00 hs</option>
                        <option value="17:00">17:00 hs</option>
                        <option value="18:00">18:00 hs</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-[2] py-4 bg-[#0145F2] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Agendando..." : "Confirmar Visita"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
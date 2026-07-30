"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Phone, Clock, MessageSquareShare, User, CarFront } from "lucide-react";
import { motion } from "framer-motion";

// Definimos las columnas del Pipeline (Basado en lo que pidió el jefe)
// Nota: Usamos "Pendiente" como "Nuevo" porque así está por defecto en tu BD.
const COLUMNAS = ["Pendiente", "Contactado", "Interesado", "Prueba de manejo", "Negociación", "Perdido"];

export default function KanbanBoard({ leadsIniciales }: { leadsIniciales: any[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadsIniciales);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Funciones nativas de Drag & Drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    // Necesario para Firefox
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permite que se pueda soltar aquí
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    const leadActual = leads.find((l) => l.id === draggedLeadId);
    if (!leadActual || leadActual.estado === nuevoEstado) {
      setDraggedLeadId(null);
      return;
    }

    // 1. Actualización Optimista (Visual al instante)
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedLeadId ? { ...lead, estado: nuevoEstado } : lead
      )
    );
    setDraggedLeadId(null);

    // 2. Actualización en Supabase
    try {
      const { error } = await supabase
        .from("cotizaciones")
        .update({ estado: nuevoEstado })
        .eq("id", draggedLeadId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error moviendo lead:", error);
      alert("Hubo un error al mover el cliente. Se revertirá el cambio.");
      // Revertir si falla
      setLeads(leadsIniciales); 
    }
  };

  // Colores dinámicos por estado
  const getColumnaColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
      case "Contactado": return "border-purple-500/50 bg-purple-500/10 text-purple-400";
      case "Interesado": return "border-amber-500/50 bg-amber-500/10 text-amber-400";
      case "Prueba de manejo": return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
      case "Negociación": return "border-orange-500/50 bg-orange-500/10 text-orange-400";
      case "Perdido": return "border-red-500/50 bg-red-500/10 text-red-400";
      default: return "border-slate-500/50 bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-8 min-h-[70vh] items-start w-full">
      {COLUMNAS.map((columna) => {
        const leadsEnColumna = leads.filter((l) => (l.estado || "Pendiente") === columna);

        return (
          <div
            key={columna}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, columna)}
            className="flex flex-col min-w-[280px] w-[280px] shrink-0 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden"
          >
            {/* Cabecera de la columna */}
            <div className={`px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40`}>
              <h3 className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getColumnaColor(columna)}`}>
                {columna === "Pendiente" ? "Nuevo" : columna}
              </h3>
              <span className="text-slate-500 font-bold text-sm bg-slate-800 px-2 py-0.5 rounded-md">
                {leadsEnColumna.length}
              </span>
            </div>

            {/* Zona de soltar tarjetas */}
            <div className="p-3 flex flex-col gap-3 min-h-[150px] flex-1 transition-colors">
              {leadsEnColumna.map((lead) => (
                <motion.div
                  layoutId={lead.id}
                  key={lead.id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, lead.id)}
                  className={`bg-[#0b1329] border border-slate-700/60 p-4 rounded-xl cursor-grab active:cursor-grabbing shadow-lg hover:border-[#0ea5e9]/50 transition-colors ${draggedLeadId === lead.id ? "opacity-50 scale-95" : "opacity-100"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${lead.tipo_peritaje === 'consignacion' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50' : 'bg-blue-900/30 text-blue-400 border-blue-700/50'}`}>
                      {lead.tipo_peritaje}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-2 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {lead.nombre}
                  </h4>

                  <p className="text-xs text-[#0ea5e9] font-medium flex items-center gap-2 truncate mb-4">
                    <CarFront className="w-3.5 h-3.5 shrink-0" />
                    {lead.marca} {lead.modelo}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-xs font-mono text-slate-400">
                      {lead.precio_sugerido ? `$${lead.precio_sugerido.toLocaleString("es-AR")}` : "A tasar"}
                    </span>
                    <a
                      href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${lead.nombre}! Somos de Pfaffen Autos. Vimos tu interés en el ${lead.marca} ${lead.modelo}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] p-1.5 rounded-lg transition-colors"
                      title="Abrir WhatsApp"
                      onClick={(e) => e.stopPropagation()} // Evita arrastrar al hacer clic
                    >
                      <MessageSquareShare className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}

              {leadsEnColumna.length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-600 font-bold uppercase tracking-widest text-center px-4">
                    Arrastrar aquí
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
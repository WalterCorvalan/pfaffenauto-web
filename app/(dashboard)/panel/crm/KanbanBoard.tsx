"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Clock, MessageSquareShare, User, CarFront, Filter, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const COLUMNAS = ["Pendiente", "Contactado", "Interesado", "Perdido"];

export default function KanbanBoard({ leadsIniciales }: { leadsIniciales: any[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadsIniciales);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  
  // Filtro activo: "todos" | "cotizacion" | "consignacion" | "dormidos"
  const [filtroActivo, setFiltroActivo] = useState<string>("todos");

  // Funciones nativas de Drag & Drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedLeadId ? { ...lead, estado: nuevoEstado } : lead
      )
    );
    setDraggedLeadId(null);

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
      setLeads(leadsIniciales); 
    }
  };

  const getColumnaColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
      case "Contactado": return "border-purple-500/50 bg-purple-500/10 text-purple-400";
      case "Interesado": return "border-amber-500/50 bg-amber-500/10 text-amber-400";
      case "Perdido": return "border-red-500/50 bg-red-500/10 text-red-400";
      default: return "border-slate-500/50 bg-slate-500/10 text-slate-400";
    }
  };

  // Filtrar los leads considerando la inactividad (>= 7 días)
  const leadsFiltrados = leads.filter((lead) => {
    const fechaLead = new Date(lead.created_at).getTime();
    const hoy = new Date().getTime();
    const diasInactivo = Math.floor((hoy - fechaLead) / (1000 * 60 * 60 * 24));

    if (filtroActivo === "dormidos") {
      return diasInactivo >= 7 && lead.estado !== "Perdido";
    }
    if (filtroActivo === "todos") return true;
    if (filtroActivo === "cotizacion" && (lead.tipo_peritaje === "online" || !lead.tipo_peritaje)) return true;
    return lead.tipo_peritaje === filtroActivo;
  });

  return (
    <div className="w-full">
      
      {/* ================= BARRA DE FILTROS ================= */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-[#0f172a] p-3 rounded-2xl border border-slate-800 w-fit">
        <div className="flex items-center gap-2 px-3 border-r border-slate-700 mr-1">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtrar:</span>
        </div>
        
        <button
          onClick={() => setFiltroActivo("todos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            filtroActivo === "todos" 
            ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroActivo("cotizacion")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            filtroActivo === "cotizacion" 
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Cotizaciones
        </button>
        <button
          onClick={() => setFiltroActivo("consignacion")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            filtroActivo === "consignacion" 
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          Consignaciones
        </button>
        <button
          onClick={() => setFiltroActivo("dormidos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
            filtroActivo === "dormidos" 
            ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20" 
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Dormidos (7d+)
        </button>
      </div>

      {/* ================= COLUMNAS KANBAN ================= */}
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-8 min-h-[65vh] items-start w-full">
        {COLUMNAS.map((columna) => {
          const leadsEnColumna = leadsFiltrados.filter((l) => (l.estado || "Pendiente") === columna);

          return (
            <div
              key={columna}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna)}
              className="flex flex-col min-w-[280px] w-[280px] shrink-0 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className={`px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40`}>
                <h3 className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getColumnaColor(columna)}`}>
                  {columna === "Pendiente" ? "Nuevo" : columna}
                </h3>
                <span className="text-slate-500 font-bold text-sm bg-slate-800 px-2 py-0.5 rounded-md">
                  {leadsEnColumna.length}
                </span>
              </div>

              <div className="p-3 flex flex-col gap-3 min-h-[150px] flex-1 transition-colors">
                {leadsEnColumna.map((lead) => {
                  
                  const esConsignacion = lead.tipo_peritaje === 'consignacion';
                  const etiqueta = esConsignacion ? "CONSIGNACIÓN" : "COTIZACIÓN";
                  const colorEtiqueta = esConsignacion 
                    ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/50" 
                    : "bg-blue-900/30 text-blue-400 border-blue-700/50";

                  // Cálculo de inactividad
                  const diasInactivo = Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  const esDormido = diasInactivo >= 7 && lead.estado !== "Perdido";

                  return (
                    <motion.div
                      layoutId={lead.id}
                      key={lead.id}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, lead.id)}
                      className={`bg-[#0b1329] border p-4 rounded-xl cursor-grab active:cursor-grabbing shadow-lg transition-colors ${
                        esDormido ? "border-rose-500/50 hover:border-rose-400" : "border-slate-700/60 hover:border-[#0ea5e9]/50"
                      } ${draggedLeadId === lead.id ? "opacity-50 scale-95" : "opacity-100"}`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border truncate ${colorEtiqueta}`}>
                          {etiqueta}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      {/* ADVERTENCIA DE CLIENTE DORMIDO */}
                      {esDormido && (
                        <div className="mb-2 bg-rose-950/40 border border-rose-800/60 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Sin contacto ({diasInactivo} días)
                        </div>
                      )}

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
                          title="Abrir WhatsApp para reactivar"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquareShare className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}

                {leadsEnColumna.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl min-h-[100px]">
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
    </div>
  );
}
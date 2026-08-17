"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search, Clock, MessageSquareText, CheckCircle2, CarFront, Filter, User } from "lucide-react";

export default function PedidosClient({ pedidosIniciales }: { pedidosIniciales: any[] }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    // Actualización optimista
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );

    try {
      const { error } = await supabase
        .from("pedidos_especiales")
        .update({ estado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert("No se pudo actualizar el estado.");
      setPedidos(pedidosIniciales);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroEstado === "Todos") return true;
    return p.estado === filtroEstado;
  });

  const getStatusStyles = (estado: string) => {
    switch (estado) {
      case "Buscando": return "bg-blue-500 text-white border-blue-500";
      case "Encontrado": return "bg-emerald-500 text-white border-emerald-500";
      case "Cerrado": return "bg-slate-400 text-white border-slate-400";
      case "Cancelado": return "bg-rose-500 text-white border-rose-500";
      default: return "bg-slate-400 text-white border-slate-400";
    }
  };

  const getBorderStyles = (estado: string) => {
    switch (estado) {
      case "Buscando": return "border-t-blue-400";
      case "Encontrado": return "border-t-emerald-400";
      case "Cerrado": return "border-t-slate-300";
      case "Cancelado": return "border-t-rose-400";
      default: return "border-t-slate-300";
    }
  };

  // ================= MÉTRICAS INTEGRADAS A LOS FILTROS =================
  const counts = {
    Todos: pedidos.length,
    Buscando: pedidos.filter((p) => p.estado === "Buscando").length,
    Encontrado: pedidos.filter((p) => p.estado === "Encontrado").length,
    Cerrado: pedidos.filter((p) => p.estado === "Cerrado").length,
    Cancelado: pedidos.filter((p) => p.estado === "Cancelado").length,
  };

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* ================= HEADER Y FILTROS ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-3.5 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Pedidos Especiales
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Búsqueda de vehículos específicos para clientes
            </p>
          </div>
        </div>

        {/* Filtros Minimalistas estilo Pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-2 shrink-0 hidden md:block" />
          {["Todos", "Buscando", "Encontrado", "Cerrado", "Cancelado"].map((est) => {
            const isActive = filtroEstado === est;
            return (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-slate-100 dark:bg-[#00246b] text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#00246b]"
                }`}
              >
                {est}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white dark:bg-[#001c55] text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-[#0a2a6b]' : 'bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400'}`}>
                  {counts[est as keyof typeof counts]}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE (TARJETAS DENSAS) ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all group ${getBorderStyles(pedido.estado)}`}
            >
              {/* Top: Estado y Fecha */}
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusStyles(pedido.estado)}`}>
                  {pedido.estado}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(pedido.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                </span>
              </div>

              {/* Info Cliente */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {pedido.nombre.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">
                  {pedido.nombre}
                </h3>
              </div>

              {/* Búsqueda del Vehículo */}
              <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] p-3 rounded-lg mb-4 flex-1">
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 block mb-1">
                  Vehículo Solicitado
                </span>
                <p className="text-[13px] font-semibold text-indigo-700 dark:text-sky-300 leading-tight">
                  {pedido.busqueda}
                </p>
              </div>

              {/* Footer: Acciones */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between gap-2 mt-auto">
                {/* Selector Compacto */}
                <select
                  value={pedido.estado}
                  onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                  className={`text-[11px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none transition-transform hover:scale-105 cursor-pointer flex-1 shadow-sm border ${getStatusStyles(pedido.estado)}`}
                >
                  <option value="Buscando" className="bg-white text-slate-900">Buscando</option>
                  <option value="Encontrado" className="bg-white text-slate-900">Encontrado</option>
                  <option value="Cerrado" className="bg-white text-slate-900">Cerrado</option>
                  <option value="Cancelado" className="bg-white text-slate-900">Cancelado</option>
                </select>

                {/* Botón WhatsApp Minimalista */}
                <a
                  href={`https://wa.me/${pedido.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${pedido.nombre}! Te contactamos de Pfaffen Autos respecto a tu búsqueda: ${pedido.busqueda}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-50 dark:bg-[#002a6e] hover:bg-green-100 dark:hover:bg-[#00246b] text-green-600 dark:text-green-300 p-1.5 rounded-md transition-colors shrink-0"
                  title="Contactar por WhatsApp"
                >
                  <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </a>
              </div>
            </div>
          ))}

          {/* Estado Vacío */}
          {pedidosFiltrados.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">No hay pedidos registrados</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Con este filtro seleccionado no se encontraron resultados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
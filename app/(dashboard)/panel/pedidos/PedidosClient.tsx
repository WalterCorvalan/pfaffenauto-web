"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Search, Clock, MessageSquareShare, CheckCircle2, CarFront, ListOrdered } from "lucide-react";

export default function PedidosClient({ pedidosIniciales }: { pedidosIniciales: any[] }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    // Actualización optimista para que las métricas cambien al instante
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

  const badgeEstado = (estado: string) => {
    switch (estado) {
      case "Buscando": return "bg-blue-900/30 text-blue-400 border-blue-700/50";
      case "Encontrado": return "bg-emerald-900/30 text-emerald-400 border-emerald-700/50";
      case "Cerrado": return "bg-purple-900/30 text-purple-400 border-purple-700/50";
      case "Cancelado": return "bg-rose-900/20 text-rose-400 border-rose-700/40";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  // ================= MÉTRICAS REACTIVAS =================
  const totalPedidos = pedidos.length;
  const buscando = pedidos.filter((p) => p.estado === "Buscando").length;
  const encontrados = pedidos.filter((p) => p.estado === "Encontrado").length;
  const cerrados = pedidos.filter((p) => p.estado === "Cerrado").length;

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                Pedidos Especiales
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Clientes que solicitaron un vehículo específico que no estaba en stock
              </p>
            </div>
          </div>

          {/* Filtros de Estado */}
          <div className="flex flex-wrap items-center gap-2">
            {["Todos", "Buscando", "Encontrado", "Cerrado", "Cancelado"].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  filtroEstado === est
                    ? "bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-sky-500/20"
                    : "bg-[#111827] text-slate-400 border-[#1e293b] hover:text-white"
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        {/* ================= TARJETAS DE MÉTRICAS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <ListOrdered className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Total Recibidos</p>
              <h3 className="text-xl font-black text-white">{totalPedidos}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Buscando</p>
              <h3 className="text-xl font-black text-amber-400">{buscando}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CarFront className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Encontrados</p>
              <h3 className="text-xl font-black text-emerald-400">{encontrados}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Cerrados (Venta)</p>
              <h3 className="text-xl font-black text-purple-400">{cerrados}</h3>
            </div>
          </div>
        </div>

        {/* ================= GRILLA DE PEDIDOS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-[#2d3d54] transition-colors"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(pedido.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeEstado(pedido.estado)}`}>
                    {pedido.estado}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base mb-1">{pedido.nombre}</h3>
                <div className="bg-[#0b1329] border border-[#1e293b] p-3 rounded-xl mb-4">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 block mb-0.5">Vehículo Solicitado:</span>
                  <p className="text-sm font-semibold text-[#0ea5e9]">{pedido.busqueda}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-2 mt-auto">
                <a
                  href={`https://wa.me/${pedido.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${pedido.nombre}! Te contactamos de Pfaffen Autos respecto a tu búsqueda del vehículo: ${pedido.busqueda}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquareShare className="w-4 h-4" /> WhatsApp
                </a>

                <div className="relative">
                  <select
                    value={pedido.estado}
                    onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                    className="bg-[#0b1329] border border-[#1e293b] text-xs font-bold text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-[#0ea5e9] transition-colors cursor-pointer"
                  >
                    <option value="Buscando">Buscando</option>
                    <option value="Encontrado">Encontrado</option>
                    <option value="Cerrado">Cerrado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {pedidosFiltrados.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-[#1e293b] rounded-2xl text-slate-500 text-sm">
              No hay pedidos especiales registrados con ese filtro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
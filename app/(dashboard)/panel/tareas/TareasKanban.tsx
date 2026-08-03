"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const COLUMNAS = ["Pendiente", "En Proceso", "Completado"];

export default function TareasKanban({ tareasIniciales }: { tareasIniciales: any[] }) {
  const router = useRouter();
  const [tareas, setTareas] = useState(tareasIniciales);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Estados del formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const taskActual = tareas.find((t) => t.id === draggedTaskId);
    if (!taskActual || taskActual.estado === nuevoEstado) {
      setDraggedTaskId(null);
      return;
    }

    setTareas((prev) =>
      prev.map((t) =>
        t.id === draggedTaskId ? { ...t, estado: nuevoEstado } : t
      )
    );
    setDraggedTaskId(null);

    try {
      const { error } = await supabase
        .from("tareas")
        .update({ estado: nuevoEstado })
        .eq("id", draggedTaskId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error moviendo tarea:", error);
      alert("Error al actualizar la tarea.");
      setTareas(tareasIniciales);
    }
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setLoading(true);

    try {
      const { data: nueva, error } = await supabase
        .from("tareas")
        .insert({
          titulo,
          descripcion,
          estado: "Pendiente"
        })
        .select("*")
        .single();

      if (error) throw error;

      setTareas([nueva, ...tareas]);
      setTitulo("");
      setDescripcion("");
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      console.error("Error creando tarea:", err);
      alert("Error al crear la tarea.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarTarea = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    setTareas(prev => prev.filter(t => t.id !== id));
    try {
      await supabase.from("tareas").delete().eq("id", id);
      router.refresh();
    } catch (err) {
      console.error("Error eliminando tarea", err);
      setTareas(tareasIniciales);
    }
  };

  const getColumnaColor = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "border-blue-500/50 bg-blue-500/10 text-blue-400";
      case "En Proceso": return "border-amber-500/50 bg-amber-500/10 text-amber-400";
      case "Completado": return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
      default: return "border-slate-500/50 bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div>
      {/* Botón Nueva Tarea */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0145F2] hover:bg-blue-600 transition-colors px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer text-white"
        >
          <Plus className="w-4 h-4" /> Nueva Tarea Manual
        </button>
      </div>

      {/* Tablero Kanban */}
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-8 min-h-[65vh] items-start w-full">
        {COLUMNAS.map((columna) => {
          const tareasEnColumna = tareas.filter((t) => (t.estado || "Pendiente") === columna);

          return (
            <div
              key={columna}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna)}
              className="flex flex-col min-w-[300px] w-[300px] shrink-0 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
                <h3 className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getColumnaColor(columna)}`}>
                  {columna}
                </h3>
                <span className="text-slate-500 font-bold text-sm bg-slate-800 px-2.5 py-0.5 rounded-md">
                  {tareasEnColumna.length}
                </span>
              </div>

              <div className="p-3 flex flex-col gap-3 min-h-[200px] flex-1 transition-colors">
                {tareasEnColumna.map((tarea) => (
                  <motion.div
                    layoutId={tarea.id}
                    key={tarea.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, tarea.id)}
                    className={`bg-[#0b1329] border border-slate-700/60 p-4 rounded-xl cursor-grab active:cursor-grabbing shadow-md hover:border-[#0ea5e9]/50 transition-colors relative group ${
                      draggedTaskId === tarea.id ? "opacity-50 scale-95" : "opacity-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(tarea.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                      </span>
                      <button
                        onClick={(e) => handleEliminarTarea(tarea.id, e)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1">
                      {tarea.titulo}
                    </h4>

                    {tarea.descripcion && (
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                        {tarea.descripcion}
                      </p>
                    )}
                  </motion.div>
                ))}

                {tareasEnColumna.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl min-h-[125px]">
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

      {/* Modal Crear Tarea */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}></div>
          
          <div className="relative bg-[#1A1B1E] border border-[#2C2E33] w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn text-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-[#2C2E33] pb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#339AF0]" /> Nueva Tarea Interna
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors bg-[#25262B] p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearTarea} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Título de la Tarea *</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Llamar a cliente de Toyota Hilux"
                  className="w-full bg-[#25262B] border border-[#373A40] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#339AF0] text-white transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Descripción (Opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales sobre la tarea..."
                  className="w-full bg-[#25262B] border border-[#373A40] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#339AF0] text-white transition-colors min-h-[100px] resize-y"
                />
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-[#25262B] hover:bg-[#373A40] text-slate-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-[#0145F2] hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Crear Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
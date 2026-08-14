"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, CheckCircle2, Trash2, CheckSquare, Circle, Timer } from "lucide-react";

const COLUMNAS = ["Pendiente", "En Proceso", "Completado"];

export default function TareasKanban({ tareasIniciales }: { tareasIniciales: any[] }) {
  const router = useRouter();
  // 1. Blindaje en el estado inicial
  const [tareas, setTareas] = useState<any[]>(tareasIniciales || []);
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

    const taskActual = (tareas || []).find((t) => t.id === draggedTaskId);
    if (!taskActual || taskActual.columna === nuevoEstado) {
      setDraggedTaskId(null);
      return;
    }

    // Actualización optimista blindada
    setTareas((prev) =>
      (prev || []).map((t) =>
        t.id === draggedTaskId ? { ...t, columna: nuevoEstado } : t
      )
    );
    setDraggedTaskId(null);

    try {
      const { error } = await supabase
        .from("tareas")
        .update({ columna: nuevoEstado })
        .eq("id", draggedTaskId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error moviendo tarea:", error);
      alert("Error al actualizar la tarea.");
      setTareas(tareasIniciales || []);
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
          columna: "Pendiente"
        })
        .select("*")
        .single();

      if (error) throw error;

      setTareas((prev) => [nueva, ...(prev || [])]);
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

    // Actualización optimista blindada
    setTareas(prev => (prev || []).filter(t => t.id !== id));
    try {
      await supabase.from("tareas").delete().eq("id", id);
      router.refresh();
    } catch (err) {
      console.error("Error eliminando tarea", err);
      setTareas(tareasIniciales || []);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* ================= HEADER FIJO ================= */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">
              Tablero de Tareas
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Organiza pendientes y flujo de trabajo del equipo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {/* 2. Blindaje al contar */}
            {(tareas || []).length} Tareas Activas
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-white shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nueva
          </button>
        </div>
      </header>

      {/* ================= TABLERO KANBAN ================= */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-[#F9FAFB] flex gap-5 custom-scrollbar">
        {COLUMNAS.map((columna, index) => {
          // 3. Blindaje crítico en el filter
          const tareasEnColumna = (tareas || []).filter((t) => (t.columna || "Pendiente") === columna);

          return (
            <div
              key={columna}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna)}
              className="flex flex-col min-w-[280px] w-[280px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
            >
              {/* Cabecera de la Columna */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/80 bg-slate-100/50">
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 uppercase tracking-wider">
                  {index === 0 && <Circle className="w-3.5 h-3.5 text-slate-400" />}
                  {index === 1 && <Timer className="w-3.5 h-3.5 text-amber-500" />}
                  {index === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {columna}
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                  {tareasEnColumna.length}
                </span>
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="p-3 flex flex-col gap-3 min-h-[150px] flex-1 overflow-y-auto custom-scrollbar">
                {tareasEnColumna.map((tarea) => (
                  <div
                    key={tarea.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, tarea.id)}
                    className={`bg-white border rounded-lg p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group ${
                      tarea.columna === "Completado" ? "opacity-70 hover:opacity-100 border-emerald-200" : "border-slate-200 hover:border-indigo-400/40"
                    } ${draggedTaskId === tarea.id ? "opacity-40 scale-[0.98] shadow-none" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${tarea.columna === "Completado" ? "text-emerald-600" : "text-slate-400"}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(tarea.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                      </span>
                      
                      <button
                        onClick={(e) => handleEliminarTarea(tarea.id, e)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1 -mt-1 -mr-1 opacity-0 group-hover:opacity-100"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className={`font-bold text-[14px] leading-tight mb-1.5 ${tarea.columna === "Completado" ? "text-slate-600 line-through" : "text-slate-900"}`}>
                      {tarea.titulo}
                    </h4>

                    {tarea.descripcion && (
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed line-clamp-3">
                        {tarea.descripcion}
                      </p>
                    )}
                  </div>
                ))}

                {/* Dropzone vacío */}
                {tareasEnColumna.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg min-h-[80px]">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
                      Mover aquí
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL CREAR TAREA (LIGHT THEME) ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" /> Nueva Tarea Interna
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearTarea} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Título de la Tarea *</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Llamar a cliente de Toyota Hilux"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:border-indigo-500 focus:bg-white text-slate-900 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Descripción (Opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales sobre la tarea..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-indigo-500 focus:bg-white text-slate-900 transition-colors min-h-[100px] resize-y custom-scrollbar"
                />
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
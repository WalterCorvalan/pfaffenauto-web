"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, Trash2 } from "lucide-react";

const CATEGORIAS_PERMITIDAS = [
  "Gestoría", "Mecánico", "Chapa y pintura", "Gomería", "Lavadero", 
  "Trapito", "Grúa", "Despachante", "Seguros", "Banco", 
  "Proveedor repuestos", "Servicios oficina", "Otro"
];

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";

export default function NuevoTelefonoModal({
  telefono,
  usuarioActualId,
  onClose,
  onSuccess,
}: {
  telefono?: any;
  usuarioActualId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!telefono?.id;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: telefono?.nombre || "",
    categoria: telefono?.categoria || "Otro",
    telefono: telefono?.telefono || "",
    whatsapp: telefono?.whatsapp || "",
    email: telefono?.email || "",
    notas: telefono?.notas || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardar = async () => {
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setCargando(true);
    setError("");

    try {
      const payload = {
        ...formData,
        actualizado_por: usuarioActualId,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error: err } = await supabase2
          .from("telefonos_utiles")
          .update(payload)
          .eq("id", telefono.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase2
          .from("telefonos_utiles")
          .insert({ ...payload, creado_por: usuarioActualId });
        if (err) throw err;
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar el contacto.");
    } finally {
      setCargando(false);
    }
  };

  const borrar = async () => {
    if (!confirm("¿Borrar este teléfono de la cartelera compartida?")) return;
    setCargando(true);
    try {
      const { error: err } = await supabase2
        .from("telefonos_utiles")
        .delete()
        .eq("id", telefono.id);
      if (err) throw err;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Error al borrar.");
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              La info se comparte con todos los miembros de la agencia.
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CAMPOS */}
        <div className="px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-4 custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan — Mecánico de confianza"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Categoría
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              {CATEGORIAS_PERMITIDAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                Teléfono
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="11 1234-5678"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
                WhatsApp (si difiere)
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="11 9876-5432"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contacto@ejemplo.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">
              Notas (opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              placeholder="Horarios, dirección, especialidad, etc."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          {isEditing && (
            <button
              onClick={borrar}
              disabled={cargando}
              className="mr-auto p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
              title="Eliminar teléfono"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            disabled={cargando}
            className={`px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 ${!isEditing && "ml-auto"}`}
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={cargando}
            className="px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {cargando ? "Guardando..." : (isEditing ? "Guardar" : "Crear")}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Plus, X, Receipt, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevoGastoModal({ 
  sucursales, 
  cuentas = [], 
  categorias = [] 
}: { 
  sucursales: any[]; 
  cuentas?: any[]; 
  categorias?: any[] 
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados Base
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [cuentaId, setCuentaId] = useState("");
  
  // Estados para Categorías
  const [categoriaId, setCategoriaId] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let finalCategoriaId = categoriaId;

      // Si el usuario decidió crear una nueva categoría sobre la marcha
      if (creandoCategoria && nuevaCategoriaNombre.trim()) {
        const { data: catData, error: catError } = await supabase
          .from("categorias_movimiento")
          .insert({ 
            nombre: nuevaCategoriaNombre.trim(),
            tipo: "egreso" // <--- LE DECIMOS EXPLÍCITAMENTE QUE ES UN EGRESO
          })
          .select("id")
          .single();

        if (catError) throw catError;
        finalCategoriaId = catData.id;
      }

      if (!finalCategoriaId) {
        alert("Debes seleccionar o crear una categoría.");
        setCargando(false);
        return;
      }

      const { error } = await supabase.from("movimientos_caja").insert({
        tipo: "egreso",
        monto: Number(monto),
        descripcion: descripcion || null, // Ahora es opcional/detalle extra
        sucursal_id: sucursalId,
        cuenta_id: cuentaId || null,
        categoria_id: finalCategoriaId, // <--- EL DATO CLAVE
        usuario_id: user?.id,
        forma_pago: "Efectivo",
        fecha: new Date().toISOString().split("T")[0]
      });

      if (error) throw error;
      setIsOpen(false);
      
      // Limpiar estados
      setMonto(""); 
      setDescripcion(""); 
      setCuentaId(""); 
      setCategoriaId("");
      setCreandoCategoria(false); 
      setNuevaCategoriaNombre("");
      
      router.refresh();
    } catch (err) {
      alert("Error al registrar el gasto");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-[#001c55] border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] p-6 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-[#002a6e] transition-all h-full shadow-sm group"
      >
        <div className="w-10 h-10 bg-rose-50 dark:bg-[#002a6e] border border-rose-100 dark:border-[#0a2a6b] rounded-full flex items-center justify-center mb-3 text-rose-500 group-hover:scale-110 transition-transform">
          <Plus className="w-5 h-5" />
        </div>
        <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 transition-colors">Registrar Gasto Manual</h3>
        <span className="text-[11px] text-slate-400 mt-1 font-medium">Luz, sueldos, gestoría</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto custom-scrollbar">

            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500"/> Nuevo Gasto
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Monto ($)</label>
                <input
                  type="number"
                  required
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] font-mono outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors placeholder:text-slate-400"
                  placeholder="Ej: 50000"
                />
              </div>

              {/* ===== NUEVA SECCIÓN: CATEGORÍA ===== */}
              <div className="bg-slate-50/50 dark:bg-[#002a6e]/30 p-4 rounded-xl border border-slate-100 dark:border-[#0a2a6b]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Categoría *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCreandoCategoria(!creandoCategoria);
                      if (!creandoCategoria) setCategoriaId(""); // Limpia el select si va a crear uno
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
                  >
                    {creandoCategoria ? "Cancelar" : "+ Nueva Categoría"}
                  </button>
                </div>
                
                {creandoCategoria ? (
                  <input
                    type="text"
                    required
                    value={nuevaCategoriaNombre}
                    onChange={e => setNuevaCategoriaNombre(e.target.value)}
                    className="w-full bg-white dark:bg-[#001c55] border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-rose-500 transition-colors placeholder:text-rose-300 dark:placeholder:text-rose-800"
                    placeholder="Escribí el nombre (Ej: Impuestos)"
                    autoFocus
                  />
                ) : (
                  <select
                    required
                    value={categoriaId}
                    onChange={e => setCategoriaId(e.target.value)}
                    className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar de la lista...</option>
                    {categorias.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Descripción (Detalle / Motivo)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors placeholder:text-slate-400"
                  placeholder="Ej: Boleta de luz mes Julio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">¿A qué sucursal afecta?</label>
                  <select
                    required
                    value={sucursalId}
                    onChange={e => setSucursalId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    {sucursales.map(s => <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>)}
                  </select>
                </div>

                {cuentas.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Cuenta (opcional)</label>
                    <select
                      value={cuentaId}
                      onChange={e => setCuentaId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin especificar</option>
                      {cuentas.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <button 
                  type="submit" 
                  disabled={cargando} 
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 text-[11px] uppercase tracking-widest shadow-sm transition-colors"
                >
                  {cargando ? "Guardando..." : "Registrar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Wallet, Wrench } from "lucide-react";
import CategoriaModal from "./CategoriaModal";

interface Categoria {
  id: string;
  nombre: string;
  sueldo_base: number;
  moneda_sueldo: string;
  tiene_comision: boolean;
  monto_por_auto_taller: number | null;
  moneda_taller: string;
  orden: number;
}

function fmt(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Number(n).toLocaleString("es-AR")}` : `${moneda} ${Number(n).toLocaleString("es-AR")}`;
}

export default function CategoriasClient({ categoriasIniciales }: { categoriasIniciales: Categoria[] }) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaAEditar, setCategoriaAEditar] = useState<Categoria | null>(null);

  const abrirNueva = () => { setCategoriaAEditar(null); setModalAbierto(true); };
  const abrirEdicion = (c: Categoria) => { setCategoriaAEditar(c); setModalAbierto(true); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Categorías de empleados</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sueldo base y comisiones por categoría — usadas por el liquidador de sueldos.</p>
        </div>
        <button
          onClick={abrirNueva}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        {categoriasIniciales.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center mt-4">
            <Tag className="w-8 h-8 text-slate-400 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Sin categorías cargadas</h3>
            <p className="text-[13px] font-medium text-slate-500 max-w-sm">
              Creá las categorías de empleados (ej: Vendedor, Administrativo, Mecánico) para usarlas en el liquidador de sueldos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoriasIniciales.map((c) => (
              <div
                key={c.id}
                onClick={() => abrirEdicion(c)}
                className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors cursor-pointer group"
              >
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {c.nombre}
                </h4>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Sueldo base: {fmt(c.sueldo_base, c.moneda_sueldo)}</span>
                  </div>
                  {c.tiene_comision && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Cobra comisión por venta</span>
                    </div>
                  )}
                  {c.monto_por_auto_taller != null && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{fmt(c.monto_por_auto_taller, c.moneda_taller)} por auto (taller)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <CategoriaModal
          categoria={categoriaAEditar}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => { setModalAbierto(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

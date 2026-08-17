"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Loader2 } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string | null;
  sucursalNombre: string | null;
}

export default function VendedorVisitaSelector({
  visitaId,
  visitaSucursal,
  vendedorActualId,
  vendedores,
}: {
  visitaId: string;
  visitaSucursal: string;
  vendedorActualId: string | null;
  vendedores: Vendedor[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deLaSucursal = vendedores.filter((v) => v.sucursalNombre === visitaSucursal);
  const otros = vendedores.filter((v) => v.sucursalNombre !== visitaSucursal);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoVendedor = e.target.value || null;
    if (nuevoVendedor === vendedorActualId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("visitas_agendadas")
        .update({ vendedor_id: nuevoVendedor })
        .eq("id", visitaId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al asignar vendedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      <select
        defaultValue={vendedorActualId || ""}
        onChange={handleChange}
        disabled={loading}
        className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-[11px] font-medium text-slate-700 dark:text-slate-200 rounded-md pl-1.5 pr-6 py-1 outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="">Sin vendedor</option>
        {deLaSucursal.length > 0 && (
          <optgroup label="Misma sucursal">
            {deLaSucursal.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
          </optgroup>
        )}
        {otros.length > 0 && (
          <optgroup label="Otras sucursales">
            {otros.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
          </optgroup>
        )}
      </select>
      {loading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
    </div>
  );
}

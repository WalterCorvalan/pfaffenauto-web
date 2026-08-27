"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { CHECKLIST_PERITAJE } from "@/lib/peritajeChecklist";
import { Plus, Search, X, CarFront, User, Loader2 } from "lucide-react";

interface Lead {
  id: string;
  nombre: string;
  telefono: string | null;
  marca: string;
  modelo: string;
  anio: number;
  tipo_peritaje: string | null;
  created_at: string;
}

const ETIQUETA_TIPO: Record<string, string> = {
  consignacion: "Consignación",
  venta: "Compra",
};

export default function NuevoPeritajeButton({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [creandoId, setCreandoId] = useState<string | null>(null);

  const leadsFiltrados = useMemo(() => {
    if (!query.trim()) return leads;
    const q = query.trim().toLowerCase();
    return leads.filter((l) =>
      `${l.nombre} ${l.marca} ${l.modelo}`.toLowerCase().includes(q)
    );
  }, [leads, query]);

  const iniciarPeritaje = async (lead: Lead) => {
    setCreandoId(lead.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: peritaje, error } = await supabase
        .from("peritajes")
        .insert({ cotizacion_id: lead.id, realizado_por: user?.id || null })
        .select("id")
        .single();
      if (error) throw error;

      const items = CHECKLIST_PERITAJE.flatMap((grupo) =>
        grupo.items.map((item, i) => ({ peritaje_id: peritaje.id, categoria: grupo.categoria, item, orden: i }))
      );
      const { error: errorItems } = await supabase.from("peritaje_items").insert(items);
      if (errorItems) throw errorItems;

      router.push(`/panel/peritajes/${peritaje.id}`);
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar el peritaje.");
      setCreandoId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shrink-0"
      >
        <Plus className="w-4 h-4" /> Nuevo peritaje
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAbierto(false)} />
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Elegí el lead a peritar</h3>
              <button
                onClick={() => setAbierto(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, marca o modelo..."
                className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {leadsFiltrados.length === 0 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                  {leads.length === 0
                    ? "No hay leads con vehículo pendientes de peritaje."
                    : "Ningún lead coincide con la búsqueda."}
                </p>
              )}
              {leadsFiltrados.map((l) => (
                <button
                  key={l.id}
                  disabled={creandoId !== null}
                  onClick={() => iniciarPeritaje(l)}
                  className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-[#0a2a6b] px-4 py-3 hover:border-indigo-300 dark:hover:border-sky-400/50 hover:bg-indigo-50/50 dark:hover:bg-[#00246b] transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CarFront className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      {l.marca} {l.modelo} · {l.anio}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3 h-3 shrink-0" /> {l.nombre}
                      {l.tipo_peritaje && ETIQUETA_TIPO[l.tipo_peritaje] && ` · ${ETIQUETA_TIPO[l.tipo_peritaje]}`}
                    </p>
                  </div>
                  {creandoId === l.id && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-sky-300 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

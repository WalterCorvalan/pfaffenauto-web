"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, Search, X, User, Loader2, MessageCircle, AtSign } from "lucide-react";

interface Lead {
  origen: "whatsapp" | "instagram";
  id: string;
  nombre: string;
  created_at: string;
}

export default function NuevoPeritajeModal({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [leadElegido, setLeadElegido] = useState<Lead | null>(null);
  const [vehiculoDescripcion, setVehiculoDescripcion] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  const leadsFiltrados = useMemo(() => {
    if (!query.trim()) return leads;
    const q = query.trim().toLowerCase();
    return leads.filter((l) => l.nombre.toLowerCase().includes(q));
  }, [leads, query]);

  const cerrar = () => {
    setAbierto(false);
    setLeadElegido(null);
    setVehiculoDescripcion("");
    setError("");
  };

  const iniciarPeritaje = async () => {
    if (!leadElegido) return;
    if (!vehiculoDescripcion.trim()) {
      setError("Contá qué vehículo va a peritar (marca, modelo, año).");
      return;
    }
    setCreando(true);
    setError("");
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { data: peritajeId, error: errRpc } = await supabase2.rpc("crear_peritaje_desde_lead", {
        p_cotizacion_id: null,
        p_whatsapp_conversacion_id: leadElegido.origen === "whatsapp" ? leadElegido.id : null,
        p_instagram_conversacion_id: leadElegido.origen === "instagram" ? leadElegido.id : null,
        p_realizado_por: user?.id || null,
      });
      if (errRpc) throw errRpc;

      const { error: errUpdate } = await supabase2
        .from("peritajes_lead")
        .update({ vehiculo_descripcion: vehiculoDescripcion.trim() })
        .eq("id", peritajeId);
      if (errUpdate) throw errUpdate;

      router.push(`/panel-v2/peritajes/${peritajeId}`);
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar el peritaje.");
      setCreando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" /> Nuevo peritaje
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !creando && cerrar()} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{leadElegido ? "Vehículo a peritar" : "Elegí el lead a peritar"}</h3>
              <button onClick={cerrar} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

            {!leadElegido ? (
              <>
                <div className="relative mb-4 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {leadsFiltrados.length === 0 && (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                      {leads.length === 0 ? "No hay leads de WhatsApp o AtSign pendientes de peritaje." : "Ningún lead coincide con la búsqueda."}
                    </p>
                  )}
                  {leadsFiltrados.map((l) => (
                    <button
                      key={`${l.origen}-${l.id}`}
                      onClick={() => setLeadElegido(l)}
                      className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        {l.origen === "whatsapp" ? <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AtSign className="w-4 h-4 text-fuchsia-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{l.nombre}</p>
                          <p className="text-[11px] text-slate-400">{new Date(l.created_at).toLocaleDateString("es-AR")}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3">
                  <User className="w-4 h-4 text-slate-400 shrink-0" /> {leadElegido.nombre}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block">Vehículo (marca, modelo, año)</label>
                  <input
                    autoFocus
                    value={vehiculoDescripcion}
                    onChange={(e) => setVehiculoDescripcion(e.target.value)}
                    placeholder="Ej: Toyota Corolla XEI 2019"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setLeadElegido(null)} disabled={creando} className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">
                    Atrás
                  </button>
                  <button onClick={iniciarPeritaje} disabled={creando} className="ml-auto flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
                    {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {creando ? "Iniciando..." : "Iniciar peritaje"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

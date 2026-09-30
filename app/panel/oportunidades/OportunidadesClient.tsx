"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink, Handshake, Loader2, MapPin } from "lucide-react";

// v1 de "Oportunidades": no guarda nada en la base -- busca en vivo contra
// la API pública de MercadoLibre (ver lib/ads/mercadolibreSearch.ts) cada
// vez que se aprieta "Buscar", así que siempre refleja publicaciones
// activas en ese momento (nunca un auto ya vendido o dado de baja). El
// filtro de provincia es client-side sobre lo que devolvió la búsqueda (no
// hay un parámetro de ubicación confiable armado en el fetch todavía).
const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] dark:focus:border-sky-400 text-slate-900 dark:text-white placeholder:text-slate-400";

interface PublicacionML {
  id: string; titulo: string; precio: number; moneda: string; link: string;
  thumbnail: string; ciudad: string | null; provincia: string | null;
}

function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

export default function OportunidadesClient() {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [provinciaFiltro, setProvinciaFiltro] = useState("");
  const [resultados, setResultados] = useState<PublicacionML[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const buscar = async () => {
    const query = [marca, modelo].filter(Boolean).join(" ").trim();
    if (!query) return;
    setBuscando(true);
    setError("");
    setProvinciaFiltro("");
    try {
      const res = await fetch(`/api/panel/oportunidades/buscar?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "No se pudo buscar."); setResultados(null); return; }
      setResultados(data.resultados);
    } catch {
      setError("No se pudo conectar con MercadoLibre.");
    } finally {
      setBuscando(false);
    }
  };

  const abrirComunidauto = () => {
    const query = [marca, modelo].filter(Boolean).join(" ").trim();
    if (!query) return;
    window.open(`https://comunidauto.com.ar/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };

  const provincias = useMemo(() => {
    if (!resultados) return [];
    return Array.from(new Set(resultados.map((r) => r.provincia).filter(Boolean))) as string[];
  }, [resultados]);

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return [];
    if (!provinciaFiltro) return resultados;
    return resultados.filter((r) => r.provincia === provinciaFiltro);
  }, [resultados, provinciaFiltro]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <img src="/icons/panel/oportunidades.png" alt="" className="w-5 h-5 object-contain shrink-0" /> Oportunidades
        </h1>
        <p className="text-sm text-slate-400">Buscá rápido si hay un auto disponible en otro lado cuando no lo tenés en stock.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl p-3.5">
          <Handshake className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
            Un cliente pide un auto que ahora mismo no tenés (o ya lo vendiste). Buscá acá antes de decirle que no —
            si aparece publicado en otro lado, se lo podés ofrecer igual comprándoselo y transfiriéndolo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Marca</label>
            <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Mercedes-Benz" className={inputClass} onKeyDown={(e) => e.key === "Enter" && buscar()} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Modelo</label>
            <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="C200" className={inputClass} onKeyDown={(e) => e.key === "Enter" && buscar()} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={buscar}
            disabled={buscando || (!marca.trim() && !modelo.trim())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-sm"
          >
            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar en MercadoLibre
          </button>
          <button
            onClick={abrirComunidauto}
            disabled={!marca.trim() && !modelo.trim()}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 rounded-xl"
          >
            Ver en Comunidauto <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</p>}
      </div>

      {resultados && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{resultadosFiltrados.length} publicaciones activas</p>
            {provincias.length > 1 && (
              <select value={provinciaFiltro} onChange={(e) => setProvinciaFiltro(e.target.value)} className="text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-slate-600 dark:text-slate-300 outline-none">
                <option value="">Todas las provincias</option>
                {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {resultadosFiltrados.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin resultados</p>
              <p className="text-xs text-slate-400 mt-1">No hay publicaciones activas para esa búsqueda ahora mismo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resultadosFiltrados.map((r) => (
                <a key={r.id} href={r.link} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 overflow-hidden">
                    {r.thumbnail ? <img src={r.thumbnail} alt={r.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : null}
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{r.titulo}</p>
                    <p className="text-base font-black text-[#0145F2] dark:text-sky-400">{fmtPrecio(r.precio, r.moneda)}</p>
                    {(r.ciudad || r.provincia) && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {[r.ciudad, r.provincia].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

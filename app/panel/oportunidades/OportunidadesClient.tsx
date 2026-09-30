"use client";

import { useState } from "react";
import { Search, ExternalLink, Handshake } from "lucide-react";

// v1 de "Oportunidades": no trae datos de Comunidauto a la base (eso
// requeriría scraping o un feed de partner, ver ARCHITECTURE.md) -- solo
// arma el link de búsqueda con marca/modelo ya cargados y lo abre en una
// pestaña nueva. Cubre el caso de uso real (cliente pide un auto que no
// tenés, buscás rápido si alguna agencia cercana lo tiene) sin depender de
// que el scraping funcione ni de resolver los términos de uso del sitio.
const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] dark:focus:border-sky-400 text-slate-900 dark:text-white placeholder:text-slate-400";

export default function OportunidadesClient() {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  const buscar = () => {
    const query = [marca, modelo].filter(Boolean).join(" ").trim();
    if (!query) return;
    const url = `https://comunidauto.com.ar/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <img src="/icons/panel/oportunidades.png" alt="" className="w-5 h-5 object-contain shrink-0" /> Oportunidades
        </h1>
        <p className="text-sm text-slate-400">Buscá rápido si otra agencia de la red tiene el auto que te pide un cliente.</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 rounded-xl p-3.5">
          <Handshake className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
            Un cliente pide un auto que ahora mismo no tenés (o ya lo vendiste). Buscá acá antes de decirle que no —
            si aparece en una agencia cercana, se lo podés ofrecer igual comprándoselo a ellos y transfiriéndolo.
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

        <button
          onClick={buscar}
          disabled={!marca.trim() && !modelo.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-sm"
        >
          <Search className="w-4 h-4" /> Buscar en Comunidauto <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </button>
        <p className="text-[11px] text-slate-400 text-center">Se abre en una pestaña nueva de comunidauto.com.ar.</p>
      </div>
    </div>
  );
}

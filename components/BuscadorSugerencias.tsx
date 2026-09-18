"use client";

import { useEffect, useRef, useState } from "react";
import { supabase2 as supabase } from "@/lib/supabase/client";
import { Search, ArrowRight } from "lucide-react";
import { getBusquedasRecientes } from "@/lib/busquedasRecientes";

interface Props {
  termino: string;
  enfocado: boolean;
  onSeleccionar: (texto: string) => void;
  className?: string;
}

function resaltarMatch(texto: string, termino: string) {
  const idx = texto.toLowerCase().indexOf(termino.toLowerCase());
  if (idx === -1) return texto;
  return (
    <>
      {texto.slice(0, idx)}
      <strong className="font-black">{texto.slice(idx, idx + termino.length)}</strong>
      {texto.slice(idx + termino.length)}
    </>
  );
}

// Autocompletado del buscador público (header y /catalogo). Con el input
// vacío y enfocado muestra las últimas búsquedas (localStorage, mismo
// patrón que MercadoLibre); al escribir 2+ caracteres, sugiere
// combinaciones marca+modelo reales del stock ("cor" -> "Toyota Corolla")
// para que la gente elija en vez de tipear algo que después no matchea
// nada -- reduce cuánto termina cayendo al fallback con IA de
// app/api/buscar-ia/route.ts.
export default function BuscadorSugerencias({ termino, enfocado, onSeleccionar, className = "" }: Props) {
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [recientes, setRecientes] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (enfocado) setRecientes(getBusquedasRecientes());
  }, [enfocado]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const texto = termino.trim();
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("vehiculos")
        .select("marca, modelo")
        .in("estado", ["disponible", "reservado"])
        .or(`marca.ilike.%${texto}%,modelo.ilike.%${texto}%`)
        .limit(40);

      const combos = Array.from(
        new Set((data || []).map((v) => `${v.marca} ${v.modelo}`.trim())),
      ).slice(0, 6);

      setSugerencias(combos);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [termino]);

  if (!enfocado) return null;

  const texto = termino.trim();
  const mostrandoRecientes = texto.length < 2;
  const items = mostrandoRecientes ? recientes : sugerencias;
  if (items.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 rounded-2xl shadow-xl overflow-hidden z-30 ${className}`}
    >
      <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {mostrandoRecientes ? "Búsquedas recientes" : "Resultados"}
      </p>
      {items.map((s) => (
        <button
          key={s}
          type="button"
          // onMouseDown (no onClick) -- corre antes del blur del input, si
          // no el blur cierra el dropdown antes de que el click registre.
          onMouseDown={(e) => { e.preventDefault(); onSeleccionar(s); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          {mostrandoRecientes ? (
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          {mostrandoRecientes ? s : resaltarMatch(s, texto)}
        </button>
      ))}
    </div>
  );
}

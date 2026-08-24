"use client";

import { useState } from "react";
import { Video, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GaleriaFotos({ urls }: { urls: string[] }) {
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(0);

  const abrir = (i: number) => {
    setIndice(i);
    setAbierto(true);
  };

  const siguiente = () => setIndice((i) => (i + 1) % urls.length);
  const anterior = () => setIndice((i) => (i - 1 + urls.length) % urls.length);

  return (
    <>
      <div className="flex -space-x-2 shrink-0">
        {urls.slice(0, 3).map((url, i) => (
          <button
            key={i}
            onClick={() => abrir(i)}
            className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200 z-0 hover:z-10 hover:scale-110 transition-transform"
          >
            {url.includes("mp4") ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video className="w-3 h-3 text-white" /></div>
            ) : (
              <img src={url} alt="Evidencia" className="w-full h-full object-cover" />
            )}
          </button>
        ))}
        {urls.length > 3 && (
          <button
            onClick={() => abrir(3)}
            className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 z-10"
          >
            +{urls.length - 3}
          </button>
        )}
      </div>

      {abierto && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setAbierto(false)}>
          <button
            onClick={() => setAbierto(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); anterior(); }}
              className="absolute left-2 sm:left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] w-full px-16" onClick={(e) => e.stopPropagation()}>
            {urls[indice].includes("mp4") ? (
              <video src={urls[indice]} controls autoPlay className="w-full max-h-[85vh] rounded-lg" />
            ) : (
              <img src={urls[indice]} alt="Evidencia" className="w-full max-h-[85vh] object-contain rounded-lg mx-auto" />
            )}
            <p className="text-center text-white/60 text-xs font-bold mt-3">{indice + 1} / {urls.length}</p>
          </div>

          {urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); siguiente(); }}
              className="absolute right-2 sm:right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

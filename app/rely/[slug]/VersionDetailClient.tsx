"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Version {
  code: string;
  slug: string;
  name: string;
  subtitle: string;
  load: string;
  text: string;
  specs: string[];
  image: string;
  images: string[];
}

const WHATSAPP_LINK =
  "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Rely%20R8";

export default function VersionDetailClient({ version }: { version: Version }) {
  const [indice, setIndice] = useState(0);
  const galeria = version.images.length > 0 ? version.images : [version.image];

  const siguiente = () => setIndice((i) => (i + 1) % galeria.length);
  const anterior = () => setIndice((i) => (i - 1 + galeria.length) % galeria.length);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12">
      {/* Galería */}
      <div>
        <div className="relative bg-[#eef0f2] rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
          <img src={galeria[indice]} alt={`${version.name} - foto ${indice + 1}`} className="w-full h-full object-cover" />

          {galeria.length > 1 && (
            <>
              <button
                onClick={anterior}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-md transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={siguiente}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-md transition-colors"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {galeria.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndice(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === indice ? "bg-[#1273b9]" : "bg-white/80"}`}
                    aria-label={`Ir a foto ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {galeria.length > 1 && (
          <div className="grid grid-cols-6 gap-2 mt-3 max-h-32 overflow-y-auto">
            {galeria.map((img, i) => (
              <button
                key={img}
                onClick={() => setIndice(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  i === indice ? "border-[#1273b9]" : "border-transparent hover:border-slate-300"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <span className="bg-[#1273b9] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 inline-block">
          Rely {version.code}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">{version.name}</h1>
        <p className="text-sm italic text-slate-500 font-medium mb-6">{version.subtitle}</p>
        <p className="text-slate-600 leading-relaxed mb-8">{version.text}</p>

        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm mb-8">
          {version.specs.map((spec, i) => (
            <div
              key={spec}
              className={`px-5 py-3.5 text-sm font-medium text-slate-700 border-b border-gray-100 last:border-0 ${
                i % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              {spec}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-[#25D366] hover:bg-[#1fbc59] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-md active:scale-95"
          >
            Reservar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

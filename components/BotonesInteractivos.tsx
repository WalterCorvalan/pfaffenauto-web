"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, Check } from "lucide-react";

export default function BotonesInteractivos({ auto }: { auto: any }) {
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Verificamos si ya está en favoritos
    const favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    if (favs.some((f: any) => f.id === auto.id)) {
      setIsFav(true);
    }

    // 2. REGISTRAMOS LA VISITA EN "VISTOS RECIENTEMENTE"
    try {
      let vistos = JSON.parse(localStorage.getItem("pfaffen_vistos") || "[]");
      // Si el auto ya estaba en la lista, lo sacamos para volver a ponerlo primero
      vistos = vistos.filter((v: any) => v.id !== auto.id);
      
      // Agregamos el auto al inicio del array
      vistos.unshift({
        id: auto.id,
        marca: auto.marca,
        modelo: auto.modelo,
        slug: auto.slug,
        precio_publicado_ars: auto.precio_publicado_ars,
        precio_publicado_usd: auto.precio_publicado_usd,
        imagen: auto.multimedia_vehiculos?.[0]?.url_archivo
      });
      
      // Guardamos solo los últimos 10 para no saturar la memoria
      vistos = vistos.slice(0, 10);
      localStorage.setItem("pfaffen_vistos", JSON.stringify(vistos));
    } catch (e) {
      console.error("Error guardando en vistos recientes", e);
    }
  }, [auto.id, auto.marca, auto.modelo, auto.slug, auto.precio_publicado_ars, auto.precio_publicado_usd, auto.multimedia_vehiculos]);

  const toggleFav = () => {
    let favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    
    if (isFav) {
      favs = favs.filter((f: any) => f.id !== auto.id);
      localStorage.setItem("pfaffen_favs", JSON.stringify(favs));
      setIsFav(false);
    } else {
      favs.push({
        id: auto.id,
        marca: auto.marca,
        modelo: auto.modelo,
        slug: auto.slug,
        precio_ars: auto.precio_publicado_ars,
        precio_usd: auto.precio_publicado_usd,
        imagen: auto.multimedia_vehiculos?.[0]?.url_archivo
      });
      localStorage.setItem("pfaffen_favs", JSON.stringify(favs));
      setIsFav(true);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${auto.marca} ${auto.modelo} - Pfaffen Autos`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        console.log("Error compartiendo", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={toggleFav}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
          isFav 
            ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isFav ? "fill-current" : ""}`} />
        {isFav ? "Guardado" : "Favorito"}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all"
      >
        {copied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
        {copied ? "¡Copiado!" : "Compartir"}
      </button>
    </div>
  );
}
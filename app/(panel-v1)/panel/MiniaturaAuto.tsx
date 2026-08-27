"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function MiniaturaAuto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setAbierta(true)}
        className={`${className} cursor-zoom-in hover:opacity-80 transition-opacity`}
      />
      {abierta && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setAbierta(false)}
        >
          <button
            onClick={() => setAbierta(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

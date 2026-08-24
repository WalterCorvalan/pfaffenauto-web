"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const KEY = "pfaffen_cookies_ok";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const aceptar = () => {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-4 sm:p-5">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-6 h-6 text-[#0145F2] dark:text-sky-300 shrink-0" />
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
          Usamos cookies propias y de terceros para mejorar tu experiencia y entender cómo se usa el sitio. Más
          info en nuestra{" "}
          <Link href="/privacidad" className="text-[#0145F2] dark:text-sky-300 font-semibold hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={aceptar}
            className="bg-[#0145F2] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
          >
            Entendido
          </button>
          <button
            onClick={aceptar}
            aria-label="Cerrar aviso de cookies"
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

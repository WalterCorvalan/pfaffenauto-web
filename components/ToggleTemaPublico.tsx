"use client";

import { Moon, Sun } from "lucide-react";
import { useTemaPublico } from "@/components/TemaPublicoContext";

export default function ToggleTemaPublico() {
  const { oscuro, toggleOscuro } = useTemaPublico();

  return (
    <button
      onClick={toggleOscuro}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="absolute top-22 right-4 lg:right-6 z-40 w-14 h-8 rounded-full bg-slate-100/90 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/15 shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center px-1 transition-colors"
    >
      <span
        className={`w-6 h-6 rounded-full bg-white dark:bg-[#0a0a0f] shadow-md flex items-center justify-center transition-transform duration-300 ${
          oscuro ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {oscuro ? <Moon className="w-3.5 h-3.5 text-sky-300" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
      </span>
    </button>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useTemaPublico } from "@/components/TemaPublicoContext";

export default function ToggleTemaPublico() {
  const { oscuro, toggleOscuro } = useTemaPublico();

  return (
    <button
      onClick={toggleOscuro}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="absolute top-22 right-4 lg:right-6 z-[55] p-3 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/15 text-navy dark:text-white shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:scale-110 transition-all"
    >
      {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

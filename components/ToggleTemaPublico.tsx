"use client";

import { Moon, Sun } from "lucide-react";
import { useTemaPublico } from "@/components/TemaPublicoContext";

export default function ToggleTemaPublico() {
  const { oscuro, toggleOscuro } = useTemaPublico();

  return (
    <button
      onClick={toggleOscuro}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="absolute top-22 right-4 lg:right-6 z-[55] p-3 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-navy shadow-lg hover:scale-110 transition-all"
    >
      {oscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

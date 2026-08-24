"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pfaffen_tema_publico";

const TemaPublicoContext = createContext<{ oscuro: boolean; toggleOscuro: () => void }>({
  oscuro: false,
  toggleOscuro: () => {},
});

// Tema oscuro del sitio público: opt-in por componente (solo los que tienen
// versión oscura hecha), no afecta el resto del sitio que sigue siempre claro.
export function TemaPublicoProvider({ children }: { children: React.ReactNode }) {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    // Sin preferencia guardada todavía: arranca según el modo del sistema/teléfono.
    const inicial = guardado !== null ? guardado === "1" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setOscuro(inicial);
  }, []);

  // El body vive por encima del wrapper que lleva la clase .dark, así que sin esto
  // su fondo (--background) nunca ve el override oscuro y queda blanco filtrándose
  // detrás de elementos translúcidos como el header (overscroll, bordes, blur).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
  }, [oscuro]);

  const toggleOscuro = () => {
    setOscuro((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <TemaPublicoContext.Provider value={{ oscuro, toggleOscuro }}>
      {children}
    </TemaPublicoContext.Provider>
  );
}

export function useTemaPublico() {
  return useContext(TemaPublicoContext);
}

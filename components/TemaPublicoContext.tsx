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
    setOscuro(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

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

"use client";

import { useTemaPublico } from "@/components/TemaPublicoContext";

// Aplica la clase .dark (mismo mecanismo que el panel: @custom-variant dark en
// globals.css) solo dentro del sitio público, scoped a este wrapper.
export default function TemaPublicoRoot({ children }: { children: React.ReactNode }) {
  const { oscuro } = useTemaPublico();
  return <div className={oscuro ? "dark" : undefined}>{children}</div>;
}

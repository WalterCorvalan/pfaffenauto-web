import type { Metadata } from "next";
import TrabajaConNosotrosClient from "./TrabajaConNosotrosClient";

// Formulario con Turnstile/estado local -- tiene que ser client component,
// por eso el metadata vive acá en un server component chico que lo envuelve.
export const metadata: Metadata = {
  title: "Trabajá con Nosotros | Pfaffen Cars",
  description: "Sumate al equipo de Pfaffen Cars. Buscamos personas proactivas para Ventas, Administración, Marketing, Taller y más. Postulate online.",
  alternates: { canonical: "https://www.pfaffencars.com/trabaja-con-nosotros" },
};

export default function TrabajaConNosotrosPage() {
  return <TrabajaConNosotrosClient />;
}

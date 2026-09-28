import type { Metadata } from "next";
import NosotrosClient from "./NosotrosClient";

export const metadata: Metadata = {
  title: "Nuestra Historia | Pfaffen Cars",
  description: "Conocé la historia de Pfaffen Cars, nuestro equipo y los valores que nos convirtieron en una concesionaria de referencia en Zona Norte.",
  alternates: { canonical: "https://www.pfaffencars.com/nosotros" },
};

export default function NosotrosPage() {
  return <NosotrosClient />;
}

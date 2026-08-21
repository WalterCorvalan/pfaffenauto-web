import type { Metadata } from "next";
import NosotrosClient from "./NosotrosClient";

export const metadata: Metadata = {
  title: "Nuestra Historia | Pfaffen Autos",
  description: "Conocé la historia de Pfaffen Autos, nuestro equipo y los valores que nos convirtieron en una concesionaria de referencia en Zona Norte.",
  alternates: { canonical: "https://pfaffenautos.com.ar/nosotros" },
};

export default function NosotrosPage() {
  return <NosotrosClient />;
}

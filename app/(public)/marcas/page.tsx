import type { Metadata } from "next";
import MarcasClient from "./MarcasClient";

export const metadata: Metadata = {
  title: "Todas las Marcas de Autos 0KM y Usados | Pfaffen Autos",
  description:
    "Descubrí todas las marcas de vehículos que tenemos disponibles: Volkswagen, Chevrolet, Toyota, Ford, Peugeot y más.",
  alternates: { canonical: "https://pfaffenautos.com.ar/marcas" },
};

export default function MarcasPage() {
  return <MarcasClient />;
}

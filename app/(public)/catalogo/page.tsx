import type { Metadata } from "next";
import CatalogoClient from "./CatalogoClient";

export const metadata: Metadata = {
  title: "Catálogo de Autos 0KM y Usados | Pfaffen Autos",
  description: "Explorá todo el stock de Pfaffen Autos: 0KM y usados seleccionados, con filtros por marca, tipo, precio y financiación.",
  alternates: { canonical: "https://pfaffenautos.com.ar/catalogo" },
};

export default function CatalogoPage() {
  return <CatalogoClient />;
}

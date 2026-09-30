import type { Metadata } from "next";
import MarcasClient from "./MarcasClient";
import { getBrandingSeo } from "@/lib/brandingSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Todas las Marcas de Autos 0KM y Usados | ${nombre}`,
    description: "Descubrí todas las marcas de vehículos que tenemos disponibles: Volkswagen, Chevrolet, Toyota, Ford, Peugeot y más.",
    alternates: { canonical: "https://www.pfaffencars.com/marcas" },
  };
}

export default function MarcasPage() {
  return <MarcasClient />;
}

import ConsignarForm from "@/components/forms/ConsignarForm";
import { getBrandingSeo } from "@/lib/brandingSeo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Consigná tu auto | ${nombre}`,
    description: "Dejanos tu vehículo en consignación. Nosotros nos encargamos de todo el proceso de venta para que obtengas la máxima rentabilidad sin estrés.",
    alternates: { canonical: "https://www.pfaffencars.com/consignacion" },
  };
}

export default function ConsignacionPage() {
  return <ConsignarForm />;
}
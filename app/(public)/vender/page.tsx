import VenderForm from "@/components/forms/VenderForm";
import { getBrandingSeo } from "@/lib/brandingSeo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Vendé tu auto | ${nombre}`,
    description: "Vendé tu vehículo con nosotros al mejor precio del mercado. Efectivo inmediato y transferencia segura.",
    alternates: { canonical: "https://www.pfaffencars.com/vender" },
  };
}

export default function VenderPage() {
  return <VenderForm />;
}
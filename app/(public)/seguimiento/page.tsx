import type { Metadata } from "next";
import Seguimiento from "@/components/Seguimiento";
import { getBrandingSeo } from "@/lib/brandingSeo";

// Página standalone del buscador de seguimiento (mismo componente que se usa
// en el home) — existe para que el link "Probar de nuevo" de
// /seguimiento/[codigo] (código inválido) tenga a dónde apuntar, y para
// poder compartir/bookmarkear la URL sin pasar por el home.
export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Seguimiento de tu Operación | ${nombre}`,
    description: "Consultá el estado de tu seña o venta con el código de seguimiento que te enviamos y subí la documentación pendiente.",
    alternates: { canonical: "https://www.pfaffencars.com/seguimiento" },
    robots: { index: false, follow: true }, // buscador vacío sin el código -- no hay contenido propio que indexar
  };
}

export default function SeguimientoPage() {
  return <Seguimiento />;
}

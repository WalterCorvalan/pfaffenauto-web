import type { Metadata } from "next";
import FavoritosClient from "./FavoritosClient";
import { getBrandingSeo } from "@/lib/brandingSeo";

// Contenido armado 100% client-side desde localStorage -- no hay nada que
// buscar server-side, por eso no lleva fetch acá. El metadata sí tiene que
// vivir en un server component (FavoritosClient es "use client" y no puede
// exportarlo), de ahí el split.
export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Mis Favoritos | ${nombre}`,
    description: "Guardá los vehículos que más te interesan de nuestro catálogo y consultá por todos juntos cuando quieras.",
    alternates: { canonical: "https://www.pfaffencars.com/favoritos" },
    robots: { index: false, follow: true }, // contenido personalizado por navegador (localStorage), no hay nada universal para indexar
  };
}

export default function FavoritosPage() {
  return <FavoritosClient />;
}

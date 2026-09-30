import type { Metadata } from "next";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import NosotrosClient from "./NosotrosClient";
import { getBrandingSeo } from "@/lib/brandingSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre, zona } = await getBrandingSeo();
  return {
    title: `Nuestra Historia | ${nombre}`,
    description: `Conocé la historia de ${nombre}, nuestro equipo y los valores que nos convirtieron en una concesionaria de referencia en ${zona}.`,
    alternates: { canonical: "https://www.pfaffencars.com/nosotros" },
  };
}

export const revalidate = 60;

export default async function NosotrosPage() {
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);

  const [{ data: timeline }, { data: equipo }, { data: config }] = await Promise.all([
    admin.from("nosotros_timeline").select("id, anio, titulo, texto, imagen1_url, imagen2_url").order("orden", { ascending: true }),
    admin.from("nosotros_equipo").select("id, nombre, rol, imagen_url").order("orden", { ascending: true }),
    admin.from("configuracion_empresa").select("nosotros_badge, nosotros_bajada").eq("id", true).maybeSingle(),
  ]);

  return <NosotrosClient timeline={timeline} equipo={equipo} heroBadge={config?.nosotros_badge} heroBajada={config?.nosotros_bajada} />;
}

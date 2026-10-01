import type { Metadata } from "next";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import TrabajaConNosotrosClient from "./TrabajaConNosotrosClient";
import { getBrandingSeo } from "@/lib/brandingSeo";

// Formulario con estado local -- tiene que ser client component, por eso el
// metadata vive acá en un server component chico que lo envuelve.
export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Trabajá con Nosotros | ${nombre}`,
    description: `Sumate al equipo de ${nombre}. Buscamos personas proactivas para Ventas, Administración, Marketing, Taller y más. Postulate online.`,
    alternates: { canonical: "https://www.pfaffencars.com/trabaja-con-nosotros" },
  };
}

export const revalidate = 60;

export default async function TrabajaConNosotrosPage() {
  let contenido;
  try {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    const { data } = await admin
      .from("configuracion_empresa")
      .select("rrhh_badge, rrhh_titulo_prefijo, rrhh_titulo_destacado, rrhh_bajada, rrhh_beneficio1_titulo, rrhh_beneficio1_texto, rrhh_beneficio2_titulo, rrhh_beneficio2_texto, rrhh_beneficio3_titulo, rrhh_beneficio3_texto, rrhh_puestos")
      .eq("id", true)
      .maybeSingle();
    if (data) {
      contenido = {
        badge: data.rrhh_badge,
        tituloPrefijo: data.rrhh_titulo_prefijo,
        tituloDestacado: data.rrhh_titulo_destacado,
        bajada: data.rrhh_bajada,
        beneficio1Titulo: data.rrhh_beneficio1_titulo,
        beneficio1Texto: data.rrhh_beneficio1_texto,
        beneficio2Titulo: data.rrhh_beneficio2_titulo,
        beneficio2Texto: data.rrhh_beneficio2_texto,
        beneficio3Titulo: data.rrhh_beneficio3_titulo,
        beneficio3Texto: data.rrhh_beneficio3_texto,
        puestos: data.rrhh_puestos,
      };
    }
  } catch {
    contenido = undefined;
  }

  return <TrabajaConNosotrosClient contenido={contenido} />;
}

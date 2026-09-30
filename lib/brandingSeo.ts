import { cache } from "react";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface BrandingSeo {
  nombre: string;
  zona: string;
}

const DEFAULT: BrandingSeo = { nombre: "Pfaffen Cars", zona: "Zona Norte, Buenos Aires" };

// Nombre de marca y zona para armar title/description de cada página --
// antes venían escritos a mano como "Pfaffen Cars"/"Zona Norte, Buenos
// Aires" en cada metadata de app/(public)/**/page.tsx (19 páginas). Ahora
// salen de configuracion_empresa (branding_nombre ya existía y es
// editable desde Configuración → Empresa → Branding; branding_zona es
// nuevo). cache() de React dedupea la consulta si más de un page.tsx la
// pide dentro del mismo request.
export const getBrandingSeo = cache(async (): Promise<BrandingSeo> => {
  try {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    const { data } = await admin.from("configuracion_empresa").select("branding_nombre, branding_zona").eq("id", true).maybeSingle();
    return {
      nombre: data?.branding_nombre || DEFAULT.nombre,
      zona: data?.branding_zona || DEFAULT.zona,
    };
  } catch {
    return DEFAULT;
  }
});

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Nombre, logo y color de la empresa para la pantalla de login (se pide ANTES de iniciar sesión, así que
// corre con la service role). Solo devuelve esos 3 datos públicos -- nada sensible de configuracion_empresa.
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
  const { data } = await supabase.from("configuracion_empresa").select("branding_nombre, branding_logo_url, branding_color_primario").eq("id", true).maybeSingle();
  return NextResponse.json(
    { nombre: data?.branding_nombre ?? null, logoUrl: data?.branding_logo_url ?? null, color: data?.branding_color_primario ?? null },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}

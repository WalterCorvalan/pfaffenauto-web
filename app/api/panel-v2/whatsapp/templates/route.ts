import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { crearPlantilla, TemplateError } from "@/lib/panel/whatsappTemplates";
import { z } from "zod";

const CrearSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  idioma: z.string().trim().min(2).max(10).default("es_AR"),
  categoria: z.enum(["UTILITY", "MARKETING"]).default("UTILITY"),
  cuerpo: z.string().trim().min(1).max(1024),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.includes("admin")) return null;
  return user;
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const parsed = CrearSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    const template = await crearPlantilla(parsed.data);
    return NextResponse.json({ ok: true, template });
  } catch (err) {
    if (err instanceof TemplateError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "not_connected" ? 409 : 422 });
    }
    return NextResponse.json({ error: "Error creando la plantilla." }, { status: 500 });
  }
}

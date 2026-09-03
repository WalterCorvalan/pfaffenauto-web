import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SECTORES = ["ventas", "recepcion", "finanzas", "gestoria", "taller", "cm"] as const;

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.includes("admin")) {
    return { error: NextResponse.json({ error: "Solo administradores." }, { status: 403 }) };
  }
  return { user };
}

function admin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

export async function GET() {
  const { error } = await verificarAdmin();
  if (error) return error;

  const sb = admin();
  const [{ data: modulos }, { data: visibilidad }] = await Promise.all([
    sb.from("modulos_config").select("*").order("modulo"),
    sb.from("visibilidad_sector").select("*"),
  ]);

  return NextResponse.json({ modulos: modulos || [], visibilidad: visibilidad || [] });
}

const ModuloSchema = z.object({ modulo: z.string(), activo: z.boolean() });
const VisibilidadSchema = z.object({ modulo: z.string(), sector: z.enum(SECTORES), visible: z.boolean() });

export async function PATCH(request: Request) {
  const { error } = await verificarAdmin();
  if (error) return error;

  const body = await request.json();
  const sb = admin();

  if (body.tipo === "modulo") {
    const parsed = ModuloSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const { error: updateError } = await sb.from("modulos_config").update({ activo: parsed.data.activo, updated_at: new Date().toISOString() }).eq("modulo", parsed.data.modulo);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.tipo === "visibilidad") {
    const parsed = VisibilidadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const { error: upsertError } = await sb.from("visibilidad_sector").upsert(parsed.data);
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
}

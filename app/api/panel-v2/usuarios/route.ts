import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const ROLES = ["admin", "ventas", "finanzas", "gestoria"] as const;

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
  const [{ data: perfiles }, { data: authList }] = await Promise.all([
    sb.from("perfiles").select("id, nombre, roles, activo, totp_enabled, created_at").order("created_at", { ascending: false }),
    sb.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailPorId = new Map(authList?.users.map((u) => [u.id, u.email]) || []);
  const usuarios = (perfiles || []).map((p) => ({ ...p, email: emailPorId.get(p.id) || "—" }));

  return NextResponse.json({ usuarios });
}

const CrearSchema = z.object({
  email: z.string().trim().email().max(150),
  nombre: z.string().trim().min(1).max(100),
  roles: z.array(z.enum(ROLES)).min(1),
});

export async function POST(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const { error } = await verificarAdmin();
  if (error) return error;

  const parsed = CrearSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { email, nombre, roles } = parsed.data;

  const sb = admin();
  const { data: nuevo, error: createError } = await sb.auth.admin.inviteUserByEmail(email);
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { error: upsertError } = await sb.from("perfiles").upsert({ id: nuevo.user.id, nombre, roles, activo: true });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: nuevo.user.id });
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(100).optional(),
  roles: z.array(z.enum(ROLES)).min(1).optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const { error } = await verificarAdmin();
  if (error) return error;

  const parsed = ActualizarSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { id, ...update } = parsed.data;

  const { error: updateError } = await admin().from("perfiles").update(update).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const { user, error } = await verificarAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  if (id === user!.id) return NextResponse.json({ error: "No podés eliminar tu propio usuario." }, { status: 400 });

  const sb = admin();
  const { error: deleteAuthError } = await sb.auth.admin.deleteUser(id);
  if (deleteAuthError) return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
  await sb.from("perfiles").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}

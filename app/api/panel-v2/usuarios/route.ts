import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

const ROLES = ["admin", "encargado", "ventas", "finanzas", "gestoria"] as const;

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
    sb.from("perfiles").select("id, nombre, roles, activo, sucursal_id, whatsapp, created_at").order("created_at", { ascending: false }),
    sb.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailPorId = new Map(authList?.users.map((u) => [u.id, u.email]) || []);
  const usuarios = (perfiles || []).map((p) => ({ ...p, email: emailPorId.get(p.id) || "—" }));

  return NextResponse.json({ usuarios });
}

const CrearSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(6).max(72),
  nombre: z.string().trim().min(1).max(100),
  roles: z.array(z.enum(ROLES)).min(1),
  sucursal_id: z.string().uuid().optional().nullable(),
  whatsapp: z.string().trim().regex(/^\d+$/).max(20).optional().nullable(),
});

export async function POST(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const { error } = await verificarAdmin();
  if (error) return error;

  const parsed = CrearSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { email, password, nombre, roles, sucursal_id, whatsapp } = parsed.data;

  const sb = admin();
  // Igual que v1 (app/api/usuarios) -- el admin carga la contraseña acá
  // mismo, no le llega invitación por mail al usuario nuevo.
  const { data: nuevo, error: createError } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  const { error: upsertError } = await sb.from("perfiles").upsert({ id: nuevo.user.id, nombre, roles, activo: true, sucursal_id: sucursal_id || null, whatsapp: whatsapp || null });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: nuevo.user.id });
}

const ActualizarSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(100).optional(),
  roles: z.array(z.enum(ROLES)).min(1).optional(),
  activo: z.boolean().optional(),
  sucursal_id: z.string().uuid().nullable().optional(),
  whatsapp: z.string().trim().regex(/^\d+$/).max(20).nullable().optional(),
});

export async function PATCH(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
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
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const { user, error } = await verificarAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  if (id === user!.id) return NextResponse.json({ error: "No podés eliminar tu propio usuario." }, { status: 400 });

  const sb = admin();

  const { error: deletePerfilError } = await sb.from("perfiles").delete().eq("id", id);
  if (deletePerfilError) {
    if (deletePerfilError.code === "23503") {
      return NextResponse.json(
        { error: "Este usuario tiene historial y no se puede eliminar, usá Inactivar." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: `No se pudo eliminar el perfil: ${deletePerfilError.message}` }, { status: 400 });
  }

  const { error: deleteAuthError } = await sb.auth.admin.deleteUser(id);
  if (deleteAuthError) {
    return NextResponse.json({ error: `No se pudo eliminar de Auth: ${deleteAuthError.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
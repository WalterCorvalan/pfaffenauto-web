import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const RolSchema = z.enum(["admin", "encargado", "vendedor", "taller", "gestoria"]);

const CrearUsuarioSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(6).max(72),
  nombre: z.string().trim().min(1).max(100),
  rol: RolSchema,
  sucursal_id: z.string().uuid().optional().nullable(),
});

const ActualizarUsuarioSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(1).max(100),
  rol: RolSchema,
  sucursal_id: z.string().uuid().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    
    // 1. Cliente normal (con cookies) para saber QUIÉN hace la petición
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. VERIFICACIÓN SERVER-SIDE DEL ROL
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfil?.rol !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado. Solo los administradores pueden crear usuarios." }, 
        { status: 403 }
      );
    }

    // 3. Cliente ADMIN (Service Role) para bypassear RLS y crear el usuario en Auth
    // IMPORTANTE: Asegurate de tener SUPABASE_SERVICE_ROLE_KEY en tu archivo .env.local
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    const parsed = CrearUsuarioSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de usuario inválidos." }, { status: 400 });
    }
    const { email, password, nombre, rol, sucursal_id } = parsed.data;

    // Crear usuario real en Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    // upsert, no update: si no hay un trigger que ya haya insertado la fila
    // en perfiles al crear el usuario en Auth, un UPDATE no matchea nada, no
    // tira error, y la fila queda sin crear — pasó justo eso con un usuario
    // de gestoría real (Auth lo tenía, perfiles no). Esto lo hace a prueba
    // de que exista o no ese trigger.
    const { error: upsertError } = await supabaseAdmin
      .from("perfiles")
      .upsert({ id: newUser.user.id, nombre, rol, sucursal_id, activo: true });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, user: newUser.user });
  } catch (error: any) {
    registrarError("api/usuarios POST", error);
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 400 });
  }
}

async function verificarAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") {
    return { error: NextResponse.json({ error: "Acceso denegado. Solo los administradores pueden gestionar usuarios." }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const { user, error } = await verificarAdmin();
    if (error) return error;

    const parsed = ActualizarUsuarioSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de usuario inválidos." }, { status: 400 });
    }
    const { id, nombre, rol, sucursal_id, activo } = parsed.data;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const update: Record<string, unknown> = { nombre, rol, sucursal_id: sucursal_id || null };
    if (typeof activo === "boolean") update.activo = activo;

    const { error: updateError } = await supabaseAdmin
      .from("perfiles")
      .update(update)
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    registrarError("api/usuarios PATCH", error);
    return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const { user, error } = await verificarAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta el id del usuario" }, { status: 400 });

    if (id === user!.id) {
      return NextResponse.json({ error: "No podés eliminar tu propio usuario." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteAuthError) throw deleteAuthError;

    await supabaseAdmin.from("perfiles").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    registrarError("api/usuarios DELETE", error);
    return NextResponse.json({ error: "No se pudo eliminar el usuario." }, { status: 400 });
  }
}
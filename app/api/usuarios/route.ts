import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js"; 

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { email, password, nombre, rol, sucursal_id } = body;

    // Crear usuario real en Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) throw createError;

    // Actualizar el perfil público vinculado a ese usuario
    const { error: updateError } = await supabaseAdmin
      .from("perfiles")
      .update({ nombre, rol, sucursal_id })
      .eq("id", newUser.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, user: newUser.user });
  } catch (error: any) {
    console.error("Error API Usuarios:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
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
    const { user, error } = await verificarAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, nombre, rol, sucursal_id } = body;
    if (!id) return NextResponse.json({ error: "Falta el id del usuario" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabaseAdmin
      .from("perfiles")
      .update({ nombre, rol, sucursal_id: sucursal_id || null })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error API Usuarios (PATCH):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
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
    console.error("Error API Usuarios (DELETE):", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
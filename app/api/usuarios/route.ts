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
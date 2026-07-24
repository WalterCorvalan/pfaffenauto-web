import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Usamos la service_role key para operaciones administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { email, password, nombre, rol, sucursal_id } = await request.json();

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Crear el usuario en Supabase Auth (Auto-confirmado para que pueda ingresar al toque)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insertar o actualizar el perfil en la tabla perfiles
    const { error: perfilError } = await supabaseAdmin
      .from("perfiles")
      .upsert({
        id: userId,
        nombre,
        rol,
        sucursal_id: sucursal_id || null,
      });

    if (perfilError) {
      return NextResponse.json({ error: perfilError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
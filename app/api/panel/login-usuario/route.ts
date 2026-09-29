import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// Traduce el "usuario" corto (ej: "Fede") al email real de Supabase Auth,
// para que app/panel/login/page.tsx pueda seguir llamando a
// signInWithPassword con un email de verdad sin que el empleado tenga que
// conocerlo ni escribirlo. No autentica nada acá -- solo resuelve el alias
// (ver migraciones/sql_perfiles_usuario.sql). Sin sesión: se llama ANTES de
// loguearse, así que corre con la service role, no con el cliente del browser.
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

const Schema = z.object({ usuario: z.string().trim().min(1).max(100) });

export async function POST(request: Request) {
  // Límite duro: este endpoint es, en los hechos, una búsqueda de usuarios
  // sin autenticar -- si no se limita fuerte, alguien podría usarlo para
  // enumerar qué "usuarios" existen probando strings al voleo.
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 15, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiados intentos. Esperá un minuto." }, { status: 429 });

  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 400 });

  const sb = admin();
  const { data: perfil } = await sb.from("perfiles").select("id").ilike("usuario", parsed.data.usuario).maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 404 });

  const { data: authUser, error } = await sb.auth.admin.getUserById(perfil.id);
  if (error || !authUser?.user?.email) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 404 });

  return NextResponse.json({ email: authUser.user.email });
}

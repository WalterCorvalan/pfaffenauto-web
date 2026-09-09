import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { z } from "zod";

// Self-service: cada usuario edita SU PROPIO perfil (nombre, whatsapp, foto)
// -- a diferencia de /api/panel-v2/usuarios que es admin-only y gestiona
// a otros (roles, sucursal, alta/baja).

function admin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

async function usuarioActual() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await usuarioActual();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data } = await admin().from("perfiles").select("id, nombre, whatsapp, foto_url, sucursal_id").eq("id", user.id).single();
  return NextResponse.json({ perfil: { ...data, email: user.email } });
}

const ActualizarSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  whatsapp: z.string().trim().regex(/^\d+$/).max(20).nullable().optional(),
  foto_url: z.string().trim().url().nullable().optional(),
});

export async function PATCH(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });

  const user = await usuarioActual();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const parsed = ActualizarSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });

  const { error } = await admin().from("perfiles").update(parsed.data).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

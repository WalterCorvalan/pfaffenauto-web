import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { MODULOS_CATALOGO, SECTORES } from "@/lib/panel/modulosCatalogo";

// Único permiso fino (no de visibilidad de módulo) con UI propia por ahora
// -- ver lib/panel/permisos.ts y app/panel/configuracion/ARCHITECTURE.md.
const ROLES_PERMISOS = ["encargado", "ventas", "finanzas", "gestoria"] as const;
const PERMISO_VER_LIQUIDACION = "ver_liquidacion";

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
  const [{ data: configRows }, { data: visibilidad }, { data: verLiquidacion }] = await Promise.all([
    sb.from("modulos_config").select("*"),
    sb.from("visibilidad_sector").select("*"),
    sb.from("rol_permisos").select("rol, otorgado").eq("permiso_clave", PERMISO_VER_LIQUIDACION),
  ]);

  // El catálogo completo del sidebar es la lista -- no lo que ya tenga
  // fila en modulos_config, porque la mayoría de los módulos (stock,
  // leads, ventas, calendario, dashboard...) nunca la tuvieron y antes
  // eran invisibles/imposibles de tocar acá aunque sí se pueden apagar
  // por sector. Sin fila = activo por default (mismo criterio que
  // moduloVisible() en layout.tsx).
  const activoPorModulo = new Map((configRows || []).map((m) => [m.modulo, m.activo]));
  const modulos = MODULOS_CATALOGO.map(({ modulo }) => ({ modulo, activo: activoPorModulo.get(modulo) ?? true }));

  // Sin fila en rol_permisos para ese rol -- tienePermiso() lo trata como
  // "no otorgado" (ver lib/panel/permisos.ts), no como "otorgado por
  // default" como pasa con visibilidad_sector. Mismo criterio acá.
  const otorgadoPorRol = new Map((verLiquidacion || []).map((r) => [r.rol, r.otorgado]));
  const permisoVerLiquidacion = ROLES_PERMISOS.map((rol) => ({ rol, otorgado: otorgadoPorRol.get(rol) ?? false }));

  return NextResponse.json({ modulos, visibilidad: visibilidad || [], permisoVerLiquidacion });
}

const ModuloSchema = z.object({ modulo: z.string(), activo: z.boolean() });
const VisibilidadSchema = z.object({ modulo: z.string(), sector: z.enum(SECTORES), visible: z.boolean() });
const PermisoVerLiquidacionSchema = z.object({ rol: z.enum(ROLES_PERMISOS), otorgado: z.boolean() });

export async function PATCH(request: Request) {
  const { error } = await verificarAdmin();
  if (error) return error;

  const body = await request.json();
  const sb = admin();

  if (body.tipo === "modulo") {
    const parsed = ModuloSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    // upsert, no update -- la mayoría de los módulos no tienen fila
    // todavía en modulos_config (ver comentario en GET), y un update
    // sobre 0 filas no tira error: el toggle no hacía nada y parecía roto.
    const { error: upsertError } = await sb.from("modulos_config").upsert({ modulo: parsed.data.modulo, activo: parsed.data.activo, updated_at: new Date().toISOString() });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.tipo === "visibilidad") {
    const parsed = VisibilidadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const { error: upsertError } = await sb.from("visibilidad_sector").upsert(parsed.data);
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.tipo === "permiso_ver_liquidacion") {
    const parsed = PermisoVerLiquidacionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const { error: upsertError } = await sb
      .from("rol_permisos")
      .upsert({ rol: parsed.data.rol, permiso_clave: PERMISO_VER_LIQUIDACION, otorgado: parsed.data.otorgado }, { onConflict: "rol,permiso_clave" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
}

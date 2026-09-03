import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase2/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

  const { data, error: fetchError } = await admin().from("configuracion_empresa").select("*").eq("id", true).single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
  return NextResponse.json({ config: data });
}

const ConfigEmpresaSchema = z.object({
  modo_comision: z.enum(["porcentaje", "fijo", "ninguna"]).optional(),
  comision_vendedor_pct_default: z.coerce.number().min(0).max(100).optional(),
  comision_consignacion_pct_default: z.coerce.number().min(0).max(100).optional(),
  monto_fijo_comision: z.coerce.number().min(0).optional(),
  comision_presets: z.array(z.coerce.number().min(0).max(100)).max(10).optional(),
  pct_toma_consignacion: z.coerce.number().min(0).max(100).optional(),
  exigir_resena_comision: z.boolean().optional(),
  sla_cotizacion_horas: z.coerce.number().min(1).optional(),
  stock_dias_estancado: z.coerce.number().min(1).optional(),
  plazo_recontacto_meses: z.coerce.number().min(1).optional(),
  asignar_al_enviar: z.boolean().optional(),
  reasignar_pedidos: z.boolean().optional(),
  plazo_reasignacion_pedidos_horas: z.coerce.number().min(1).optional(),
  plazo_reconfirmacion_pedidos_dias: z.coerce.number().min(1).optional(),
  lead_routing_activo: z.boolean().optional(),
  lead_routing_umbral_minutos: z.coerce.number().min(1).optional(),
  lead_routing_max_reasignaciones: z.coerce.number().min(1).optional(),
  cada_vendedor_ve_solo_sus_clientes: z.boolean().optional(),
  branding_nombre: z.string().trim().max(150).optional().nullable(),
  branding_domicilio: z.string().trim().max(200).optional().nullable(),
  branding_telefono: z.string().trim().max(40).optional().nullable(),
  branding_cuit: z.string().trim().max(20).optional().nullable(),
  resumen_diario_activo: z.boolean().optional(),
  resumen_diario_hora: z.coerce.number().min(0).max(23).optional(),
  resumen_diario_dias_expediente_atrasado: z.coerce.number().min(1).optional(),
  resumen_diario_nombre: z.string().trim().max(100).optional().nullable(),
  resumen_diario_whatsapp_activo: z.boolean().optional(),
  resumen_diario_telefono_dueno: z.string().trim().max(30).optional().nullable(),
  resumen_diario_plantilla_meta: z.string().trim().max(60).optional(),
  resumen_diario_idioma: z.string().trim().max(10).optional(),
});

export async function PATCH(request: Request) {
  const { error } = await verificarAdmin();
  if (error) return error;

  const parsed = ConfigEmpresaSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const { error: updateError } = await admin().from("configuracion_empresa").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", true);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

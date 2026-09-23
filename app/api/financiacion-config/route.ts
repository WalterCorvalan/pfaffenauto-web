import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  TOPES_FINANCIACION_DEFAULT, TOPE_0KM_DEFAULT, TNA_POR_PLAZO_DEFAULT,
  GASTOS_PCT_DEFAULT, UVA_DESCUENTO_PCT_DEFAULT,
} from "@/lib/financiacion";

// Público (sin login) -- el simulador de la ficha de auto lo necesita para
// calcular tope/cuota, y ese simulador no tiene sesión de staff. Solo expone
// los 5 campos de financiacion_* (nunca cuentas, ventas ni nada sensible),
// mismo criterio que /api/dolar-blue o /api/simulador-vehiculos.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("configuracion_empresa")
    .select("financiacion_topes, financiacion_tope_0km, financiacion_tna, financiacion_gastos_pct, financiacion_uva_descuento")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    // Sin fila o sin conexión: devolvemos los defaults en vez de romper el
    // simulador público -- son los mismos valores confirmados con decreditos.
    return NextResponse.json({
      financiacion_topes: TOPES_FINANCIACION_DEFAULT,
      financiacion_tope_0km: TOPE_0KM_DEFAULT,
      financiacion_tna: TNA_POR_PLAZO_DEFAULT,
      financiacion_gastos_pct: GASTOS_PCT_DEFAULT,
      financiacion_uva_descuento: UVA_DESCUENTO_PCT_DEFAULT,
    });
  }

  return NextResponse.json({
    financiacion_topes: data.financiacion_topes?.length ? data.financiacion_topes : TOPES_FINANCIACION_DEFAULT,
    financiacion_tope_0km: data.financiacion_tope_0km ?? TOPE_0KM_DEFAULT,
    financiacion_tna: Object.keys(data.financiacion_tna || {}).length ? data.financiacion_tna : TNA_POR_PLAZO_DEFAULT,
    financiacion_gastos_pct: data.financiacion_gastos_pct ?? GASTOS_PCT_DEFAULT,
    financiacion_uva_descuento: Object.keys(data.financiacion_uva_descuento || {}).length ? data.financiacion_uva_descuento : UVA_DESCUENTO_PCT_DEFAULT,
  });
}

const TopeSchema = z.object({ anioDesde: z.number(), anioHasta: z.number().nullable(), pct: z.number().min(0).max(100) });
const PatchSchema = z.object({
  financiacion_topes: z.array(TopeSchema).optional(),
  financiacion_tope_0km: z.coerce.number().min(0).max(100).optional(),
  financiacion_tna: z.record(z.string(), z.coerce.number()).optional(),
  financiacion_gastos_pct: z.coerce.number().min(0).optional(),
  financiacion_uva_descuento: z.record(z.string(), z.coerce.number()).optional(),
});

// PATCH sí requiere sesión -- a diferencia del GET (público, para el
// simulador de la web), acá se edita la tasa/tope real que usa la agencia.
// Gateado a admin/finanzas (antes vivía en Configuración → Empresa, que es
// admin-only en bloque para TODO -- branding, comisiones, SLAs -- pero acá
// solo tocamos financiacion_*, así que no corresponde exigir "admin").
export async function PATCH(request: Request) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { data: perfil } = await supabaseAuth.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.some((r: string) => r === "admin" || r === "finanzas")) {
    return NextResponse.json({ error: "Solo admin o finanzas." }, { status: 403 });
  }

  const parsed = PatchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const { error } = await supabase.from("configuracion_empresa").update(parsed.data).eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

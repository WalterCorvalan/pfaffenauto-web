import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { registrarError } from "@/lib/panel/logger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

// Mismo mapeo canal -> tabla/columna FK que LeadDetailModal.tsx
// (TABLA_POR_ORIGEN/CAMPO_FK_POR_ORIGEN) -- duplicado acá porque ese archivo
// es "use client" y este es una ruta de servidor. Si se agrega un 6° canal,
// actualizar los dos lugares (ver leads/ARCHITECTURE.md).
const TABLA_POR_ORIGEN: Record<string, string> = {
  whatsapp: "whatsapp_conversaciones", instagram: "instagram_conversaciones", messenger: "messenger_conversaciones", rodi: "rodi_conversaciones", manual: "leads_manuales",
};
const CAMPO_FK_POR_ORIGEN: Record<string, string> = {
  whatsapp: "whatsapp_conversacion_id", instagram: "instagram_conversacion_id", messenger: "messenger_conversacion_id", rodi: "rodi_conversacion_id", manual: "leads_manuales_id",
};

const Schema = z.object({
  origen: z.enum(["whatsapp", "instagram", "messenger", "rodi", "manual"]),
  leadId: z.string().uuid(),
  vendedorId: z.string().uuid().nullable(),
});

// Reasignar un lead/conversación a otro vendedor pasa siempre por acá (no
// por update directo del cliente a la tabla del canal, que dependía de que
// RLS lo permitiera para cualquier rol -- para "ventas" normalmente no lo
// permite, así que el selector de "Vendedor asignado" quedaba guardando en
// silencio sin avisar error real, o fallando directo). Regla de negocio
// (pedido 1/10): un vendedor (rol "ventas") solo puede reasignar a otro
// vendedor, nunca dejarlo sin asignar; un encargado puede reasignar a
// cualquier vendedor o encargado; admin a cualquiera, incluido sin asignar.
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE2_URL!,
      process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const { origen, leadId, vendedorId } = parsed.data;

    const { data: miPerfil } = await supabaseAdmin.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
    const misRoles: string[] = miPerfil?.roles || [];
    const soyAdmin = misRoles.includes("admin");
    const soyEncargado = misRoles.includes("encargado");
    const soyVentas = misRoles.includes("ventas");
    if (!soyAdmin && !soyEncargado && !soyVentas) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    if (!soyAdmin && !vendedorId) {
      return NextResponse.json({ error: "Solo admin puede dejar un lead sin asignar." }, { status: 403 });
    }

    if (!soyAdmin && vendedorId) {
      const { data: perfilDestino } = await supabaseAdmin.from("perfiles").select("roles").eq("id", vendedorId).maybeSingle();
      const rolesDestino: string[] = perfilDestino?.roles || [];
      if (soyEncargado) {
        if (!rolesDestino.includes("ventas") && !rolesDestino.includes("encargado")) {
          return NextResponse.json({ error: "Un encargado solo puede reasignar a vendedores o encargados." }, { status: 403 });
        }
      } else {
        // soyVentas
        if (!rolesDestino.includes("ventas")) {
          return NextResponse.json({ error: "Un vendedor solo puede reasignar a otro vendedor." }, { status: 403 });
        }
      }
    }

    const tabla = TABLA_POR_ORIGEN[origen];
    const campoFk = CAMPO_FK_POR_ORIGEN[origen];

    const { data: actualizado, error: errUpdate } = await supabaseAdmin
      .from(tabla)
      .update({ vendedor_id: vendedorId })
      .eq("id", leadId)
      .select("*")
      .maybeSingle();
    if (errUpdate) throw errUpdate;
    if (!actualizado) return NextResponse.json({ error: "Lead no encontrado." }, { status: 404 });

    const { data: vendedorNuevo } = vendedorId ? await supabaseAdmin.from("perfiles").select("nombre").eq("id", vendedorId).maybeSingle() : { data: null };
    await supabaseAdmin.from("eventos_lead").insert({
      [campoFk]: leadId,
      tipo: "asignacion",
      descripcion: vendedorId ? `Reasignado a ${vendedorNuevo?.nombre || "vendedor"}` : "Vendedor removido",
      creado_por: user.id,
    });

    return NextResponse.json({ ok: true, lead: actualizado });
  } catch (err) {
    registrarError("api/panel/leads/reasignar", err);
    return NextResponse.json({ error: "No se pudo reasignar el lead." }, { status: 500 });
  }
}

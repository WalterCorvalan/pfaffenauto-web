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

const Schema = z.object({
  vehiculoId: z.string().uuid(),
  precio: z.number().positive(),
  moneda: z.enum(["ARS", "USD"]),
});

// Editar precio del stock pasa siempre por acá (no por update directo del
// cliente a "vehiculos") para poder dejar registro de quién cambió el
// precio y cuándo en vehiculo_precio_historial -- ver stock/ARCHITECTURE.md.
// Sigue sincronizando precio_publicado_ars/usd en el mismo update, mismo
// criterio que el resto de los caminos que escriben precio_venta.
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
    const { vehiculoId, precio, moneda } = parsed.data;

    const { data: perfil } = await supabaseAdmin.from("perfiles").select("nombre").eq("id", user.id).maybeSingle();
    const { data: actual } = await supabaseAdmin.from("vehiculos").select("precio_venta, moneda_venta").eq("id", vehiculoId).maybeSingle();
    if (!actual) return NextResponse.json({ error: "Vehículo no encontrado." }, { status: 404 });

    const cambios = {
      precio_venta: precio,
      moneda_venta: moneda,
      precio_publicado_ars: moneda === "ARS" ? precio : null,
      precio_publicado_usd: moneda === "USD" ? precio : null,
    };

    const { error: errUpdate } = await supabaseAdmin.from("vehiculos").update(cambios).eq("id", vehiculoId);
    if (errUpdate) throw errUpdate;

    const { error: errHist } = await supabaseAdmin.from("vehiculo_precio_historial").insert({
      vehiculo_id: vehiculoId,
      precio_anterior: actual.precio_venta,
      moneda_anterior: actual.moneda_venta,
      precio_nuevo: precio,
      moneda_nueva: moneda,
      usuario_id: user.id,
      usuario_nombre: perfil?.nombre || null,
    });
    if (errHist) throw errHist;

    return NextResponse.json({ ok: true, cambios });
  } catch (err) {
    registrarError("api/panel/vehiculos/precio", err);
    return NextResponse.json({ error: "No se pudo actualizar el precio." }, { status: 500 });
  }
}

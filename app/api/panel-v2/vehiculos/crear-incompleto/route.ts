import { z } from "zod";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { registrarError } from "@/lib/panelV2/logger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const Schema = z.object({
  patente: z.string().trim().max(20).optional().nullable(),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(60),
  anio: z.coerce.number().int().optional().nullable(),
  color: z.string().trim().max(60).optional().nullable(),
  tipo: z.string().trim().max(60).optional().nullable(),
  tipo_combustible: z.string().trim().max(60).optional().nullable(),
  transmision: z.string().trim().max(60).optional().nullable(),
  traccion: z.string().trim().max(60).optional().nullable(),
  numero_motor: z.string().trim().max(60).optional().nullable(),
  numero_chasis: z.string().trim().max(60).optional().nullable(),
  marca_motor: z.string().trim().max(60).optional().nullable(),
  marca_chasis: z.string().trim().max(60).optional().nullable(),
  segmento: z.string().trim().max(60).optional().nullable(),
  sucursal_id: z.string().uuid().optional().nullable(),
  origen: z.string().trim().max(30).optional().nullable(),
});

// Crea una fila mínima en vehiculos cuando se carga a mano un auto que no
// está en stock (permuta o comprado) desde el selector de Señas/Presupuestos
// — vía service role porque RLS de "vehiculos" no deja insertar a cualquiera.
export async function POST(req: Request) {
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
    if (!parsed.success) {
      return NextResponse.json({ error: "Faltan datos obligatorios (marca y modelo)." }, { status: 400 });
    }
    const d = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("vehiculos")
      .insert({
        marca: d.marca,
        modelo: d.modelo,
        anio: d.anio || new Date().getFullYear(),
        patente: d.patente || null,
        color: d.color || null,
        combustible: d.tipo_combustible || null,
        transmision: d.transmision || null,
        traccion: d.traccion || null,
        numero_motor: d.numero_motor || null,
        numero_chasis: d.numero_chasis || null,
        marca_motor: d.marca_motor || null,
        marca_chasis: d.marca_chasis || null,
        segmento: d.segmento || null,
        sucursal_id: d.sucursal_id || null,
        precio_venta: 0,
        estado: "en_preparacion",
        stock_fisico: false,
        creado_por: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err) {
    registrarError("api/panel-v2/vehiculos/crear-incompleto", err);
    return NextResponse.json({ error: "Error al crear el vehículo." }, { status: 500 });
  }
}

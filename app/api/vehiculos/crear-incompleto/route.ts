import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const VehiculoIncompletoSchema = z.object({
  patente: z.string().trim().max(20).optional().nullable(),
  marca: z.string().trim().min(1).max(60),
  modelo: z.string().trim().min(1).max(60),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  tipo: z.string().trim().max(40).optional().nullable(),
  tipo_combustible: z.string().trim().max(40).optional().nullable(),
  numero_motor: z.string().trim().max(60).optional().nullable(),
  numero_chasis: z.string().trim().max(60).optional().nullable(),
  marca_motor: z.string().trim().max(60).optional().nullable(),
  marca_chasis: z.string().trim().max(60).optional().nullable(),
  segmento: z.string().trim().max(40).optional().nullable(),
  sucursal_id: z.string().uuid(),
  origen: z.string().trim().max(40).optional().nullable(),
});

const generarSlug = (marca: string, modelo: string, anio: number) => {
  const base = `${marca}-${modelo}-${anio}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString().slice(-4)}`;
};

export async function POST(req: Request) {
  const limite = rateLimit(ipDesdeRequest(req), { limite: 20, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const parsed = VehiculoIncompletoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Faltan marca, modelo o sucursal, o tienen formato inválido." }, { status: 400 });
  }
  const { patente, marca, modelo, anio, color, tipo, tipo_combustible, numero_motor, numero_chasis, marca_motor, marca_chasis, segmento, sucursal_id, origen } = parsed.data;

  const anioNum = anio ? Number(anio) : new Date().getFullYear();
  const slug = generarSlug(marca, modelo, anioNum);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase
    .from("vehiculos")
    .insert({
      patente: patente || null, marca, modelo, anio: anioNum, kilometraje: 0,
      color: color || null, tipo: tipo || null, tipo_combustible: tipo_combustible || null,
      numero_motor: numero_motor || null, numero_chasis: numero_chasis || null,
      marca_motor: marca_motor || null, marca_chasis: marca_chasis || null,
      segmento: segmento || null, sucursal_id, origen: origen || "Comprado",
      estado: "Incompleto", stock_fisico: true, destacado: false,
      vendedor_asignado_id: user.id, slug,
    })
    .select("id")
    .single();

  if (error) {
    registrarError("api/vehiculos/crear-incompleto", error);
    return NextResponse.json({ error: "No se pudo crear el vehículo." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

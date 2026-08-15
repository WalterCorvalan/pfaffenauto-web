import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json();
  const { patente, marca, modelo, anio, color, tipo, tipo_combustible, numero_motor, numero_chasis, marca_motor, marca_chasis, segmento, sucursal_id, origen } = body;

  if (!marca || !modelo || !sucursal_id) {
    return NextResponse.json({ error: "Faltan marca, modelo o sucursal." }, { status: 400 });
  }

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

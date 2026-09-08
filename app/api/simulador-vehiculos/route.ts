import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// El simulador de /financiacion (público, sin login) antes consultaba
// "vehiculos" directo desde el cliente con la anon key, trayendo
// precio_venta/moneda_venta (precio INTERNO, no el publicado) a la
// respuesta -- visible en la pestaña Network aunque no se mostrara en
// pantalla. Este endpoint resuelve el precio server-side (misma lógica
// que resolverPrecioArs en SimuladorReal.tsx) y devuelve solo el número
// final, nunca el precio interno crudo.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function resolverPrecioArs(v: any, dolarVenta: number | null): number {
  if (v.precio_publicado_ars) return v.precio_publicado_ars;
  if (v.precio_publicado_usd && dolarVenta) return Math.round(v.precio_publicado_usd * dolarVenta);
  if (v.precio_venta) {
    if (v.moneda_venta === "ARS") return v.precio_venta;
    if (v.moneda_venta === "USD" && dolarVenta) return Math.round(v.precio_venta * dolarVenta);
  }
  return 0;
}

export async function GET(req: Request) {
  const limite = await rateLimit(ipDesdeRequest(req), { limite: 30, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiadas búsquedas. Esperá un momento." }, { status: 429 });
  }

  const url = new URL(req.url);
  const busquedaRaw = (url.searchParams.get("q") || "").trim().slice(0, 100);
  // ".or()" de PostgREST usa "," y "()" como separadores propios.
  const busqueda = busquedaRaw.replace(/[,()]/g, " ").trim();
  const dolarVenta = Number(url.searchParams.get("dolar")) || null;

  let query = supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, km, precio_publicado_ars, precio_publicado_usd, precio_venta, moneda_venta, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
    .eq("estado", "disponible")
    .limit(6);

  query = busqueda.length >= 2
    ? query.or(`marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`)
    : query.order("destacado", { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Error al buscar." }, { status: 500 });

  const vehiculos = (data || []).map((v: any) => ({
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    km: v.km,
    sucursal: v.sucursales?.nombre ?? null,
    precioArs: resolverPrecioArs(v, dolarVenta),
  }));

  return NextResponse.json({ vehiculos });
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import EgresosClient from "./EgresosClient";

export default async function EgresosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: sucursales } = await supabase.from("sucursales").select("id, nombre").order("nombre");
  const { data: perfiles } = await supabase.from("perfiles").select("id, nombre").order("nombre");

  const [patentes, transferencias, repuestos, gastosVarios, sueldos] = await Promise.all([
    supabase.from("patentes").select("*, sucursales(nombre)").order("fecha", { ascending: false }),
    supabase.from("transferencias_patentamientos").select("*, sucursales(nombre)").order("fecha", { ascending: false }),
    supabase.from("repuestos_reparaciones").select("*, sucursales(nombre)").order("fecha", { ascending: false }),
    supabase.from("gastos_varios").select("*, sucursales(nombre)").order("fecha", { ascending: false }),
    supabase.from("sueldos").select("*, sucursales(nombre)").order("fecha", { ascending: false }),
  ]);

  return (
    <EgresosClient
      sucursales={sucursales || []}
      perfiles={perfiles || []}
      datosIniciales={{
        patentes: patentes.data || [],
        transferencias_patentamientos: transferencias.data || [],
        repuestos_reparaciones: repuestos.data || [],
        gastos_varios: gastosVarios.data || [],
        sueldos: sueldos.data || [],
      }}
    />
  );
}

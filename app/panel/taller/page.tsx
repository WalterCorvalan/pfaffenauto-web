import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import TallerClient from "./TallerClient";

export const metadata = { title: "Taller | Pfaffen Cars" };

export default async function TallerPage() {
  // Cambio clave acá: createClient en vez de createServerClient
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  // Esta página no tenía NINGÚN control de acceso (ni sesión) -- mismo
  // hallazgo que la auditoría de Finanzas (permisos #18), pero acá era peor
  // porque ni siquiera pedía estar logueado. puedeVerModulo() ya existía y
  // respeta modulos_config/visibilidad_sector (ver ROL_A_SECTOR en
  // permisosModulos.ts, ya tenía el mapeo taller->taller armado de antes).
  if (!(await puedeVerModulo(supabase, user.id, "taller"))) redirect("/panel");

  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  const puedeVerPlata = miPerfil?.roles?.some((r: string) => ["admin", "finanzas", "director"].includes(r)) ?? false;

  // Cobros vigentes del mes (la facturación del Resumen sale de acá) y los renglones de esas órdenes (para el costo).
  // Solo se piden si el usuario ve plata -- no viajan al navegador de quien no corresponde.
  const hoy = new Date(Date.now() - 3 * 3600000); // día de Argentina
  const inicioMes = `${hoy.getUTCFullYear()}-${String(hoy.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const cobrosMes = puedeVerPlata
    ? ((await supabase.from("taller_cobros").select("orden_id, monto, moneda").eq("anulado", false).gte("fecha", inicioMes)).data || [])
    : [];
  const ordenIdsCobradas = Array.from(new Set(cobrosMes.map((c: any) => c.orden_id)));
  const renglonesMes = puedeVerPlata && ordenIdsCobradas.length > 0
    ? ((await supabase.from("taller_renglones").select("orden_id, costo, aprobado_cliente").in("orden_id", ordenIdsCobradas)).data || [])
    : [];

  const [
    { data: ordenes },
    { data: mecanicos },
    { data: configuracion },
    { data: servicios }
  ] = await Promise.all([
    supabase.from("taller_ordenes").select("*").order("created_at", { ascending: false }),
    supabase.from("taller_mecanicos").select("*").eq("activo", true).order("nombre"),
    supabase.from("taller_config").select("*").maybeSingle(),
    supabase.from("taller_servicios").select("*").eq("activo", true).order("nombre")
  ]);

  return (
    <TallerClient
      ordenesIniciales={ordenes || []}
      mecanicos={mecanicos || []}
      servicios={servicios || []}
      configuracion={configuracion}
      cobrosMes={cobrosMes}
      renglonesMes={renglonesMes}
      puedeVerPlata={puedeVerPlata}
    />
  );
}
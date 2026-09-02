import { createClient } from "@/lib/supabase2/server";
import MiEspacioClient from "./MiEspacioClient";

export const metadata = { title: "Mi Espacio | Pfaffen Autos" };

export default async function MiEspacioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;

  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const finMes = new Date(inicioMes); finMes.setMonth(finMes.getMonth() + 1);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

  let agencia = null;
  if (soyAdmin) {
    const [{ count: stockDisponible }, { count: ventasDelMes }, { count: expedientesActivos }, { data: ingresos }] = await Promise.all([
      supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("estado", "disponible"),
      supabase.from("ventas").select("id", { count: "exact", head: true }).gte("fecha_cierre", inicioMes.toISOString().slice(0, 10)).lt("fecha_cierre", finMes.toISOString().slice(0, 10)),
      supabase.from("expedientes").select("id", { count: "exact", head: true }).neq("estado", "cerrado").eq("archivado", false),
      supabase.from("movimientos_caja").select("monto").eq("tipo", "ingreso").gte("created_at", inicioMes.toISOString()).lt("created_at", finMes.toISOString()),
    ]);
    agencia = {
      stockDisponible: stockDisponible || 0,
      ventasDelMes: ventasDelMes || 0,
      expedientesActivos: expedientesActivos || 0,
      ingresosDelMesUsd: (ingresos || []).reduce((a, m) => a + Number(m.monto), 0),
    };
  }

  const [{ data: urgentes }, { data: pagos }, prefs] = await Promise.all([
    supabase.from("espacio_urgentes").select("*").eq("perfil_id", user?.id || "").order("vencimiento"),
    supabase.from("espacio_pagos").select("*").eq("perfil_id", user?.id || "").order("fecha", { ascending: false }),
    user ? supabase.from("espacio_resumen_prefs").select("*").eq("perfil_id", user.id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
  ]);

  return (
    <MiEspacioClient
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || "Yo"}
      soyAdmin={soyAdmin}
      agencia={agencia}
      urgentesIniciales={urgentes || []}
      pagosIniciales={pagos || []}
      prefsIniciales={prefs}
    />
  );
}

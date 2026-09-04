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
      // Solo USD — nunca sumar junto con movimientos en ARS bajo una sola
      // etiqueta "USD" (bug encontrado acá: antes sumaba las dos monedas).
      supabase.from("movimientos_caja").select("monto").eq("tipo", "ingreso").eq("moneda", "USD").gte("created_at", inicioMes.toISOString()).lt("created_at", finMes.toISOString()),
    ]);
    agencia = {
      stockDisponible: stockDisponible || 0,
      ventasDelMes: ventasDelMes || 0,
      expedientesActivos: expedientesActivos || 0,
      ingresosDelMesUsd: (ingresos || []).reduce((a, m) => a + Number(m.monto), 0),
    };
  }

  const finMesStr = finMes.toISOString().slice(0, 10);
  const inicioMesStr = inicioMes.toISOString().slice(0, 10);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const en7diasStr = new Date(hoy.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: urgentes }, { data: pagos }, prefs, { data: cuotasCobrarMes }, { count: pendientesCount }, { count: eventosHoyCount }, { count: eventosSemanaCount }, { data: gastosFijos }] = await Promise.all([
    supabase.from("espacio_urgentes").select("*").eq("perfil_id", user?.id || "").order("vencimiento"),
    supabase.from("espacio_pagos").select("*").eq("perfil_id", user?.id || "").order("fecha", { ascending: false }),
    user ? supabase.from("espacio_resumen_prefs").select("*").eq("perfil_id", user.id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
    supabase.from("espacio_cuotas_cobrar").select("monto, monto_cobrado, moneda, cobrada").eq("perfil_id", user?.id || "").gte("vencimiento", inicioMesStr).lt("vencimiento", finMesStr),
    supabase.from("espacio_pendientes").select("id", { count: "exact", head: true }).eq("perfil_id", user?.id || "").eq("completada", false),
    supabase.from("espacio_eventos").select("id", { count: "exact", head: true }).eq("perfil_id", user?.id || "").eq("fecha", hoyStr),
    supabase.from("espacio_eventos").select("id", { count: "exact", head: true }).eq("perfil_id", user?.id || "").gte("fecha", hoyStr).lte("fecha", en7diasStr),
    supabase.from("espacio_gastos_fijos").select("monto, moneda").eq("perfil_id", user?.id || ""),
  ]);

  const aCobrarPorMoneda: Record<string, number> = {};
  const yaCobrePorMoneda: Record<string, number> = {};
  (cuotasCobrarMes || []).forEach((c: any) => {
    if (!c.cobrada) aCobrarPorMoneda[c.moneda] = (aCobrarPorMoneda[c.moneda] || 0) + (Number(c.monto) - Number(c.monto_cobrado));
    else yaCobrePorMoneda[c.moneda] = (yaCobrePorMoneda[c.moneda] || 0) + Number(c.monto_cobrado);
  });
  const gastosFijosPorMoneda: Record<string, number> = {};
  (gastosFijos || []).forEach((g: any) => { gastosFijosPorMoneda[g.moneda] = (gastosFijosPorMoneda[g.moneda] || 0) + Number(g.monto); });

  return (
    <MiEspacioClient
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || "Yo"}
      soyAdmin={soyAdmin}
      agencia={agencia}
      urgentesIniciales={urgentes || []}
      pagosIniciales={pagos || []}
      prefsIniciales={prefs}
      aCobrarPorMoneda={aCobrarPorMoneda}
      yaCobrePorMoneda={yaCobrePorMoneda}
      pendientesCount={pendientesCount ?? 0}
      eventosHoyCount={eventosHoyCount ?? 0}
      eventosSemanaCount={eventosSemanaCount ?? 0}
      gastosFijosPorMoneda={gastosFijosPorMoneda}
    />
  );
}

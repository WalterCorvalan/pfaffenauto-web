import { createClient } from "@/lib/supabase2/server";
import AutorizacionesClient from "./AutorizacionesClient";

export const metadata = { title: "Autorizaciones | Pfaffen Autos" };

export default async function AutorizacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [miPerfil, { data: pendientes }, { data: historico }, pinPropio, { data: usosPin }] = await Promise.all([
    user ? supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
    supabase.from("autorizaciones").select("*, solicitante:perfiles!autorizaciones_solicitado_por_fkey(nombre)").eq("estado", "pendiente").order("created_at", { ascending: false }),
    supabase.from("autorizaciones").select("*, solicitante:perfiles!autorizaciones_solicitado_por_fkey(nombre), resolutor:perfiles!autorizaciones_resuelto_por_fkey(nombre)").neq("estado", "pendiente").order("resuelto_en", { ascending: false }).limit(100),
    user ? supabase.from("autorizaciones_pin").select("perfil_id").eq("perfil_id", user.id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
    supabase.from("autorizaciones_pin_usos").select("*, pin_de:perfiles!autorizaciones_pin_usos_pin_de_perfil_id_fkey(nombre), usado_por_perfil:perfiles!autorizaciones_pin_usos_usado_por_fkey(nombre)").order("created_at", { ascending: false }).limit(50),
  ]);

  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;

  return (
    <AutorizacionesClient
      pendientesIniciales={pendientes || []}
      historicoInicial={historico || []}
      usosPinIniciales={usosPin || []}
      tienePin={!!pinPropio}
      soyAdmin={soyAdmin}
      miId={user?.id || ""}
    />
  );
}

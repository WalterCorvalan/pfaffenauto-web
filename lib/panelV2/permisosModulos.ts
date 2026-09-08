import type { SupabaseClient } from "@supabase/supabase-js";

// Única fuente de la verdad para "rol interno de perfiles -> sector de
// visibilidad_sector" -- antes vivía duplicado a mano en app/panel-v2/layout.tsx
// (sidebar) y en ningún lado más, así que una alerta podía avisarle a un
// destinatario sobre un módulo que su rol tiene apagado (ver moduloVisible()
// en layout.tsx). Server-safe: sin hooks, usable desde API routes y desde
// componentes cliente por igual.
export const ROL_A_SECTOR: Record<string, string> = {
  encargado: "encargado",
  ventas: "ventas",
  finanzas: "finanzas",
  gestoria: "gestoria",
  taller: "taller",
  recepcion: "recepcion",
};

// Mismo criterio que moduloVisible() en layout.tsx: admin nunca se filtra;
// sin fila en visibilidad_sector, el módulo es visible por default; con
// varios roles alcanza que UNO de los sectores lo vea.
export async function puedeVerModulo(supabase: SupabaseClient, perfilId: string, modulo: string): Promise<boolean> {
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", perfilId).single();
  const roles: string[] = perfil?.roles || [];
  if (roles.includes("admin")) return true;

  const { data: config } = await supabase.from("modulos_config").select("activo").eq("modulo", modulo).maybeSingle();
  if (config?.activo === false) return false;

  const sectores = roles.map((r) => ROL_A_SECTOR[r]).filter(Boolean);
  if (sectores.length === 0) return true;

  const { data: filas } = await supabase.from("visibilidad_sector").select("sector, visible").eq("modulo", modulo).in("sector", sectores);
  if (!filas || filas.length === 0) return true;
  return sectores.some((s) => filas.find((f) => f.sector === s)?.visible ?? true);
}

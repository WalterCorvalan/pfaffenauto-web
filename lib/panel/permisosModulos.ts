import type { SupabaseClient } from "@supabase/supabase-js";

// Única fuente de la verdad para "rol interno de perfiles -> sector de
// visibilidad_sector" -- antes vivía duplicado a mano en app/panel/layout.tsx
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
};

// Mismo criterio que moduloVisible() en layout.tsx: admin nunca se filtra;
// sin fila en visibilidad_sector, el módulo es visible por default; con
// varios roles alcanza que UNO de los sectores lo vea.
// Quién puede asignar un lead/conversación a quién. Usado en
// leads/page.tsx, whatsapp/page.tsx, instagram/page.tsx y rodi/page.tsx
// para armar la lista de "vendedores" que llega al selector de asignación
// de LeadDetailModal.tsx (compartido entre los 4 módulos) -- antes cada
// page.tsx duplicaba este filtro a mano, y leads/page.tsx en particular se
// había quedado corto (solo "ventas"+"admin" global, sin encargado y sin
// distinguir sucursal). Regla de negocio: un vendedor solo puede
// reasignar entre vendedores; un encargado puede asignar a cualquier
// encargado o a un vendedor de su propia sucursal; admin puede asignar a
// cualquiera.
export function filtrarVendedoresAsignables<T extends { roles?: string[] | null; sucursal_id?: string | null }>(
  perfiles: T[],
  { soyAdmin, soyEncargado, miSucursalId }: { soyAdmin: boolean; soyEncargado: boolean; miSucursalId: string | null }
): T[] {
  return perfiles.filter((p) => {
    if (soyAdmin) return p.roles?.includes("ventas") || p.roles?.includes("encargado") || p.roles?.includes("admin");
    if (soyEncargado) return p.roles?.includes("encargado") || (p.roles?.includes("ventas") && p.sucursal_id === miSucursalId);
    return p.roles?.includes("ventas");
  });
}

export async function puedeVerModulo(supabase: SupabaseClient, perfilId: string, modulo: string): Promise<boolean> {
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", perfilId).maybeSingle();
  // Sin perfil (lookup falló o el id no existe) no podemos confirmar ningún
  // rol -- antes esto caía a roles=[] y por el default de la línea de abajo
  // ("sin sector mapeado, visible") terminaba dando acceso a Tesorería/
  // Facturación/Finanzas/Reportes a un perfil que ni siquiera pudimos leer.
  // Denegar acá, no dejar pasar.
  if (!perfil) return false;
  const roles: string[] = perfil.roles || [];
  if (roles.includes("admin")) return true;

  const { data: config } = await supabase.from("modulos_config").select("activo").eq("modulo", modulo).maybeSingle();
  if (config?.activo === false) return false;

  // Mismo override que moduloVisible() en layout.tsx -- Clientes siempre
  // visible para todos los roles salvo taller, sin depender de
  // "Visibilidad por sector".
  if (modulo === "clientes" && roles.some((r) => ["ventas", "encargado", "finanzas", "gestoria"].includes(r))) return true;

  const sectores = roles.map((r) => ROL_A_SECTOR[r]).filter(Boolean);
  if (sectores.length === 0) return true;

  const { data: filas } = await supabase.from("visibilidad_sector").select("sector, visible").eq("modulo", modulo).in("sector", sectores);
  if (!filas || filas.length === 0) return true;
  return sectores.some((s) => filas.find((f) => f.sector === s)?.visible ?? true);
}

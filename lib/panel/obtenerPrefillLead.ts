import type { SupabaseClient } from "@supabase/supabase-js";

// Duplicado intencional de los mapas de LeadDetailModal.tsx -- ese es un
// componente "use client" con bastante JSX, no una lib, así que no
// conviene importarlo acá solo por estas dos constantes.
const TABLA_POR_ORIGEN: Record<string, string> = {
  whatsapp: "whatsapp_conversaciones", instagram: "instagram_conversaciones",
  messenger: "messenger_conversaciones", rodi: "rodi_conversaciones", manual: "leads_manuales",
};
const CONTACTO_TABLA_POR_ORIGEN: Record<string, string | null> = {
  whatsapp: "whatsapp_contactos", instagram: "instagram_contactos", messenger: "messenger_contactos", rodi: null, manual: null,
};

export interface PrefillLead {
  nombre: string;
  telefono: string;
  email: string;
  vehiculoId: string | null;
}

// Usado por los botones "Presupuesto / Seña / Venta" dentro de un lead
// (LeadDetailModal.tsx) para precargar el formulario de alta con los datos
// que ya se tienen del lead, en vez de que el vendedor tenga que
// retipearlos. Antes esos botones solo pasaban el id del lead por la URL
// y ningún formulario lo leía -- se abrían siempre en blanco.
export async function obtenerPrefillLead(
  supabase: SupabaseClient,
  origen: string,
  leadId: string
): Promise<PrefillLead | null> {
  const tabla = TABLA_POR_ORIGEN[origen];
  if (!tabla) return null;

  const { data: l } = await supabase.from(tabla).select("*").eq("id", leadId).maybeSingle();
  if (!l) return null;

  const contactoTabla = CONTACTO_TABLA_POR_ORIGEN[origen];
  const { data: c } = contactoTabla
    ? await supabase.from(contactoTabla).select("nombre_perfil, telefono, email").eq("id", l.contacto_id).maybeSingle()
    : { data: { nombre_perfil: l.nombre_contacto || l.nombre || "", telefono: l.telefono_contacto || l.telefono || "", email: l.email_contacto || l.email || "" } };

  return {
    nombre: c?.nombre_perfil || "",
    telefono: c?.telefono || "",
    email: c?.email || "",
    vehiculoId: l.vehiculo_id || null,
  };
}

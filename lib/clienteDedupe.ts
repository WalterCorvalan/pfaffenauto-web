import type { SupabaseClient } from "@supabase/supabase-js";

// Detecta un cliente ya cargado que probablemente sea la misma persona, aunque
// el DNI/teléfono no matcheen carácter por carácter (formato distinto, espacios,
// +54 9 al principio, etc.) o directamente falten y solo tengamos nombre+apellido.
export async function buscarClienteDuplicado(
  supabase: SupabaseClient,
  datos: { nombre: string; apellido: string; dni?: string | null; telefono_celular?: string | null }
) {
  const dni = (datos.dni || "").trim();
  const telefonoNormalizado = (datos.telefono_celular || "").replace(/\D/g, "");
  const telefonoUltimos8 = telefonoNormalizado.slice(-8); // ignora prefijos país/característica que varían

  // 1. Match exacto por DNI — el más confiable, corta acá si aparece.
  if (dni) {
    const { data } = await supabase.from("clientes").select("*").eq("dni", dni).maybeSingle();
    if (data) return data;
  }

  // 2. Match por teléfono ignorando formato (espacios, guiones, +54 9, 0, 15, etc.)
  if (telefonoUltimos8.length >= 8) {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .not("telefono_celular", "is", null)
      .ilike("telefono_celular", `%${telefonoUltimos8}`);
    const match = (data || []).find((c) => (c.telefono_celular || "").replace(/\D/g, "").endsWith(telefonoUltimos8));
    if (match) return match;
  }

  // 3. Fallback fuzzy: mismo nombre + apellido exacto (sin distinguir mayúsculas/tildes de más),
  // cuando no hubo DNI/teléfono para comparar — evita el caso "Enzo Valentin Corvalan" duplicado.
  if (!dni && telefonoUltimos8.length < 8 && datos.nombre.trim() && datos.apellido.trim()) {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .ilike("nombre", datos.nombre.trim())
      .ilike("apellido", datos.apellido.trim())
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

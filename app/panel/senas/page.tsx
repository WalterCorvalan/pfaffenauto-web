import { createClient } from "@/lib/supabase/server";
import SenasClient from "./SenasClient";

export const metadata = { title: "Señas | Pfaffen Autos" };

export default async function SenasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const miPerfil = user ? await supabase.from("perfiles").select("id, roles").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;

  const [{ data: senas }, { data: clientes }, { data: vehiculos }, { data: vendedores }, { data: sucursales }, { data: cuentas }] = await Promise.all([
    supabase.from("senas").select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre )").order("created_at", { ascending: false }).limit(100),
    // Antes select("*") sin límite sobre toda la tabla -- acá solo se usa
    // para elegir/autocompletar un cliente en la seña (ClienteBuscador +
    // el autofill de NuevaSenaModal), no hace falta traer columnas de
    // CRM (origen, pipeline_stage, observaciones, busca_*, etc.).
    supabase.from("clientes").select("id, nombre, apellido, dni_cuit, telefono, telefono_linea, email, fecha_nacimiento, calle, numero_calle, depto, localidad, codigo_postal, provincia, cuit_cuil, estado_civil, profesion").order("nombre").limit(5000),
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("marca"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true).order("nombre"),
  ]);

  return (
    <SenasClient
      senasIniciales={senas || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      vendedores={vendedores || []}
      sucursales={sucursales || []}
      cuentas={cuentas || []}
      miId={user?.id || ""}
      soyAdmin={soyAdmin}
    />
  );
}

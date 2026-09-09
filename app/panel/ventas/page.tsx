import { createClient } from "@/lib/supabase/server";
import VentasClient from "./VentasClient";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [ventasRes, perfilesRes, clientesRes, vehiculosRes, permutasRes, senasRes, miPerfil, cuentasRes] = await Promise.all([
    supabase.from("ventas").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, email, dni_cuit").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, anio, patente, km, precio_venta, moneda_venta, estado, color, condicion").in("estado", ["disponible", "reservado", "señado"]).order("marca"),
    supabase.from("venta_permutas").select("venta_id"),
    supabase.from("venta_senas").select("venta_id, monto, moneda"),
    user ? supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
  ]);
  const ventas = ventasRes.data;
  const perfiles = perfilesRes.data;
  const clientes = clientesRes.data;
  const vehiculos = vehiculosRes.data;
  const permutas = permutasRes.data;
  const senas = senasRes.data;

  const cuentasConSaldo = await Promise.all(
    (cuentasRes.data || []).map(async (c) => {
      const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
      return { ...c, saldo: Number(saldo) || 0 };
    })
  );

  const senasPorVenta: Record<string, number> = {};
  for (const s of senas || []) {
    senasPorVenta[s.venta_id] = (senasPorVenta[s.venta_id] || 0) + Number(s.monto);
  }

  return (
    <VentasClient
      ventasIniciales={ventas || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      ventaIdsConPermuta={Array.from(new Set((permutas || []).map((p) => p.venta_id)))}
      senasPorVenta={senasPorVenta}
      miId={user?.id || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
      puedeOperacionCaida={miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false}
      cuentas={cuentasConSaldo}
    />
  );
}

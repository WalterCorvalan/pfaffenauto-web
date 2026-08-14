import type { SupabaseClient } from "@supabase/supabase-js";

export async function getVentasPanel(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("boletos_venta")
    .select(
      `
      id, created_at, fecha, venta_ars, venta_usd, sena_ars, saldo_abonar_ars, prenda_monto, comision_ars, vendedor_id, vehiculo_id, apellido, nombre, dni,
      vehiculos ( id, marca, modelo, patente, sucursal_id, sucursales ( id, nombre ) ),
      perfiles ( nombre )
    `,
    )
    .order("fecha", { ascending: false });

  return (data || []).map((v: any) => ({
    id: v.id,
    created_at: v.created_at,
    fecha_venta: v.fecha,
    tipo_operacion: "Venta",
    precio_final_ars: v.venta_ars,
    precio_final_usd: v.venta_usd,
    "seña_ars": v.sena_ars,
    saldo_pendiente: v.saldo_abonar_ars,
    forma_pago: v.prenda_monto > 0 ? "Financiado" : "Contado",
    comision_ars: v.comision_ars,
    vendedor_id: v.vendedor_id,
    vehiculo_id: v.vehiculo_id,
    vehiculos: v.vehiculos,
    clientes: { nombre: v.nombre, apellido: v.apellido, dni: v.dni },
    perfiles: v.perfiles,
  })) as any[];
}

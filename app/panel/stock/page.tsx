import { createClient } from "@/lib/supabase/server";
import StockClient from "./StockClient";

export default async function StockPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: vehiculos }, { data: mandatos }, { data: perfiles }, { data: clientes }, { data: catalogoConfig }, { data: sucursales }, { data: config }, { data: chequesPendientes0km }] = await Promise.all([
    // Sin límite esto crecía sin tope con toda la historia de stock (vendido
    // incluido) -- 5000 da margen de sobra para años de operación real y
    // evita que la query quede literalmente sin techo.
    supabase.from("vehiculos").select("*, sucursal:sucursal_id ( nombre )").order("created_at", { ascending: false }).limit(5000),
    supabase.from("mandatos").select("*").order("created_at", { ascending: false }).limit(5000),
    supabase.from("perfiles").select("id, nombre, roles, sucursal_id").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, dni_cuit").order("nombre").limit(5000),
    supabase.from("catalogo_config").select("*").eq("id", "default").single(),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("configuracion_empresa").select("stock_dias_estancado").eq("id", true).maybeSingle(),
    // Cheques emitidos, todavía no cobrados (plata que TODAVÍA no salió de
    // ninguna cuenta), vinculados a un 0km del stock -- pedido de la reunión
    // del 22/9, para descontar del patrimonio la deuda pendiente por cheques
    // sin cobrar. "cobrado" es el ÚNICO estado que significa que la plata
    // salió de verdad -- antes filtraba solo "pendiente", así que un cheque
    // rechazado, endosado o depositado (todavía no cobrado, seguimos
    // debiéndolo) dejaba de contarse como deuda aunque siguiéramos
    // debiéndolo, e inflaba el "Patrimonio 0km neto". Si la columna
    // vehiculo_id todavía no existe (ver migraciones/sql_cheques_vehiculo_id.sql),
    // el error queda en "error" y "data" en null -- el fallback "|| []" de
    // abajo alcanza, no rompe el resto del stock.
    supabase.from("cheques").select("id, vehiculo_id, monto, moneda").eq("tipo", "emitido").neq("estado", "cobrado").not("vehiculo_id", "is", null),
  ]);

  return (
    <StockClient
      vehiculosIniciales={vehiculos || []}
      mandatosIniciales={mandatos || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      catalogoConfigInicial={catalogoConfig}
      sucursales={sucursales || []}
      miId={user?.id || ""}
      diasEstancado={config?.stock_dias_estancado || 90}
      chequesPendientes0km={chequesPendientes0km || []}
    />
  );
}

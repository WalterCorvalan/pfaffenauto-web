import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import FacturacionClient from "./FacturacionClient";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";

export const metadata = { title: "Facturación | Pfaffen Cars" };

export default async function FacturacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  // Auditoría de Finanzas del 24/9 (permisos #18): esta página no tenía
  // ningún control de rol -- exponía costo/factura de compra de vehículos a
  // cualquier usuario logueado que entrara por URL directa.
  if (!(await puedeVerModulo(supabase, user.id, "facturacion"))) redirect("/panel");

  // Paginado: PostgREST corta en 1000 filas y el stock histórico (vendidos
  // incluidos) puede pasarlas -- los vehículos de más allá del corte no
  // aparecían, ni en el listado ni en los totales por moneda.
  const vehiculos = await fetchPaginado(() => supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, patente, estado, moneda_compra, facturado, factura_importe, factura_numero, factura_emisor, factura_archivo_url, factura_fecha, factura_tipo_comprobante, factura_iva_pct")
    .order("facturado", { ascending: true })
    .order("marca", { ascending: true })
    .order("id", { ascending: true }));

  return <FacturacionClient vehiculosIniciales={vehiculos || []} />;
}

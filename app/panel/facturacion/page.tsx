import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import FacturacionClient from "./FacturacionClient";

export const metadata = { title: "Facturación | Pfaffen Autos" };

export default async function FacturacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  // Auditoría de Finanzas del 24/9 (permisos #18): esta página no tenía
  // ningún control de rol -- exponía costo/factura de compra de vehículos a
  // cualquier usuario logueado que entrara por URL directa.
  if (!(await puedeVerModulo(supabase, user.id, "facturacion"))) redirect("/panel");

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, patente, estado, moneda_compra, facturado, factura_importe, factura_numero, factura_emisor, factura_archivo_url")
    .order("facturado", { ascending: true })
    .order("marca", { ascending: true });

  return <FacturacionClient vehiculosIniciales={vehiculos || []} />;
}

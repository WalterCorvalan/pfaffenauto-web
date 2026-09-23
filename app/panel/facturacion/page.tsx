import { createClient } from "@/lib/supabase/server";
import FacturacionClient from "./FacturacionClient";

export const metadata = { title: "Facturación | Pfaffen Autos" };

export default async function FacturacionPage() {
  const supabase = await createClient();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, patente, estado, moneda_compra, facturado, factura_importe, factura_numero, factura_emisor, factura_archivo_url")
    .order("facturado", { ascending: true })
    .order("marca", { ascending: true });

  return <FacturacionClient vehiculosIniciales={vehiculos || []} />;
}

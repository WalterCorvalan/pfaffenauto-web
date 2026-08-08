import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import VentaForm from "./VentaForm";

export default async function NuevaVentaPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, patente, anio, precio_publicado_ars, estado, numero_motor, numero_chasis, segmento, tipo, color")
    .in("estado", ["Disponible", "Reservado"])
    .order("marca");

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, apellido, dni, cuit_cuil, telefono_celular, correo_electronico, calle, numero, localidad, provincia, estado_civil, profesion, fecha_nacimiento")
    .order("apellido");

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre");

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] overflow-hidden">
      <VentaForm 
        vehiculos={vehiculos || []} 
        clientes={clientes || []} 
        sucursales={sucursales || []} 
      />
    </div>
  );
}
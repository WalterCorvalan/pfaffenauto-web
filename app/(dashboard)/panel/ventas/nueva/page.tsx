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

  // 1. Traemos los autos disponibles o señados para vender
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, patente, anio, precio_publicado_ars, estado, numero_motor, numero_chasis, segmento, tipo, color")
    .in("estado", ["Disponible", "Reservado"])
    .order("marca");

  // 2. Traemos clientes guardados para autocompletar rápido
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, apellido, dni, cuit_cuil, telefono_celular, correo_electronico, calle, numero, localidad, provincia, estado_civil, profesion, fecha_nacimiento")
    .order("apellido");

  // 3. Traemos sucursales
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre");

  return (
    <div className="bg-[#0b1329] pt-4 pb-16 px-4 w-full min-h-screen text-slate-100 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        <VentaForm 
          vehiculos={vehiculos || []} 
          clientes={clientes || []} 
          sucursales={sucursales || []} 
        />
      </div>
    </div>
  );
}
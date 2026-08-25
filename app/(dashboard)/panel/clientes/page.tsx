import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: clientes } = await supabase
    .from("clientes")
    .select(
      "id, nombre, apellido, dni, telefono_celular, correo_electronico, localidad, created_at, sucursales ( nombre )"
    )
    .order("created_at", { ascending: false });

  return <ClientesClient clientesIniciales={clientes || []} />;
}

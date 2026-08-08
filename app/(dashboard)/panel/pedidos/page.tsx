import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PedidosClient from "./PedidosClient";

export default async function PedidosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: pedidos } = await supabase
    .from("pedidos_especiales")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <PedidosClient pedidosIniciales={pedidos || []} />
    </div>
  );
}
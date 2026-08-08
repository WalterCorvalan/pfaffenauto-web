import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import KanbanBoard from "./KanbanBoard";

export default async function CRMPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // Traemos todas las solicitudes para el Pipeline
  const { data: leads } = await supabase
    .from("cotizaciones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    // Sin márgenes, 100% del alto y fondo blanco puro
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <KanbanBoard leadsIniciales={leads || []} />
    </div>
  );
}
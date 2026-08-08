import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import TareasKanban from "./TareasKanban";

export default async function TareasPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: tareas } = await supabase
    .from("tareas")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <TareasKanban tareasIniciales={tareas || []} />
    </div>
  );
}
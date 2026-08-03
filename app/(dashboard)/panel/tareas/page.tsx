import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import TareasKanban from "./TareasKanban";
import { CheckSquare } from "lucide-react";

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
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-[#0ea5e9]" /> Tablero de Tareas Internas
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Organiza las tareas del equipo, asigná pendientes y arrastralos según su progreso.
            </p>
          </div>
        </div>

        <TareasKanban tareasIniciales={tareas || []} />
      </div>
    </div>
  );
}
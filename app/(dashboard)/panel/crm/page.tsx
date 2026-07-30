import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import KanbanBoard from "./KanbanBoard";
import { LayoutDashboard, Users } from "lucide-react";

export default async function CRMPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // Traemos todas las solicitudes (Cotizaciones/Consignaciones web)
  // En un futuro acá también pueden ir los "clientes" manuales
  const { data: leads } = await supabase
    .from("cotizaciones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">
        {/* Cabecera */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-[#0ea5e9]" /> Pipeline
              CRM
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Arrastrá las tarjetas para cambiar el estado del cliente en el
              embudo de ventas.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 px-4 py-2.5 rounded-xl shadow-inner">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-white">
              {leads?.length || 0}{" "}
              <span className="text-slate-500 font-medium">Leads Activos</span>
            </span>
          </div>
        </div>

        {/* Tablero Kanban */}
        <div className="w-full">
          <KanbanBoard leadsIniciales={leads || []} />
        </div>
      </div>
    </div>
  );
}

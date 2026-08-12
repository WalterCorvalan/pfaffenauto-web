import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Wrench } from "lucide-react";
import TallerClient from "./TallerClient";

export default async function TallerPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, patente, color, etapa_preparacion")
    .not("etapa_preparacion", "is", null)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB]">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 bg-white shrink-0">
        <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <Wrench className="w-4.5 h-4.5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Preparación de Vehículos</h1>
          <p className="text-[11px] font-medium text-slate-500">Ingreso, taller, detailing y publicación</p>
        </div>
      </header>

      <TallerClient vehiculosIniciales={vehiculos || []} />
    </div>
  );
}

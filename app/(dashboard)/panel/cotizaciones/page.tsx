// app/(dashboard)/panel/cotizaciones/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ClipboardList, Image as ImageIcon, MapPin, CheckCircle, Clock } from "lucide-react";

export default async function CotizacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // Traemos las cotizaciones ordenadas de más nuevas a más viejas
  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-[#0ea5e9]" /> Cotizaciones Recibidas
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Vehículos ingresados por clientes desde la web. n8n calcula el precio sugerido automáticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cotizaciones?.map((cot) => (
            <div key={cot.id} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col hover:border-slate-700 transition-colors shadow-lg">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">
                    {cot.marca} • {cot.anio}
                  </span>
                  <h3 className="font-black text-lg text-white leading-tight">
                    {cot.modelo} {cot.version && <span className="text-sm font-medium text-slate-400 block truncate">{cot.version}</span>}
                  </h3>
                </div>
                {cot.precio_sugerido ? (
                  <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-700/50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Tasado
                  </span>
                ) : (
                  <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-700/50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Procesando
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b1329] border border-slate-800 p-3 rounded-xl mb-4">
                <div>
                  <span className="block text-slate-500 text-[9px] uppercase tracking-widest font-bold">KM</span>
                  <span className="font-bold text-slate-200">{cot.kilometraje.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[9px] uppercase tracking-widest font-bold">Modalidad</span>
                  <span className="font-bold text-slate-200 capitalize">{cot.tipo_peritaje}</span>
                </div>
              </div>

              {/* Precio sugerido por n8n */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 text-center">
                <span className="block text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                  Precio de Compra Sugerido (n8n)
                </span>
                {cot.precio_sugerido ? (
                  <span className="text-2xl font-black text-[#0ea5e9]">
                    $ {cot.precio_sugerido.toLocaleString("es-AR")}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-slate-500 italic">
                    Calculando mercado...
                  </span>
                )}
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-3">
                  <span className="text-slate-400">{cot.nombre}</span>
                  <a href={`https://wa.me/${cot.telefono}`} target="_blank" className="text-[#25D366] font-bold hover:underline">
                    {cot.telefono}
                  </a>
                </div>

                {cot.fotos_y_videos && cot.fotos_y_videos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {cot.fotos_y_videos.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-slate-700 hover:border-[#0ea5e9] transition-colors relative group">
                        {url.includes("mp4") || url.includes("mov") ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center"><span className="text-[8px] font-bold">VID</span></div>
                        ) : (
                          <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
          
          {(!cotizaciones || cotizaciones.length === 0) && (
            <div className="col-span-full p-12 text-center border border-dashed border-slate-700 rounded-2xl">
              <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Aún no hay solicitudes de cotización.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
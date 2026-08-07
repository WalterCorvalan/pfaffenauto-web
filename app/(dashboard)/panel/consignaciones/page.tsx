import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Handshake, CarFront, DollarSign } from "lucide-react";

export default async function ConsignacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // Traemos solo los vehículos que están a consignación
  const { data: consignados } = await supabase
    .from("vehiculos")
    .select("*, sucursales(nombre)")
    .eq("origen", "Consignado")
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif text-white flex items-center gap-3">
            <Handshake className="w-8 h-8 text-[#0ea5e9]" /> Autos en Consignación
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Control de unidades de terceros y comisiones proyectadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {consignados?.map((auto) => {
            // El "precio de costo" en consignación es lo que el dueño quiere en mano
            const precioDuenio = Number(auto.precio_costo_ars) || 0; 
            const precioVenta = Number(auto.precio_publicado_ars) || 0;
            const comisionAgencia = precioVenta - precioDuenio;

            return (
              <div key={auto.id} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1"><CarFront className="w-3 h-3"/> {auto.sucursales?.nombre}</span>
                  <span className="bg-purple-900/30 text-purple-400 border border-purple-700/50 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                    {auto.estado}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-white leading-tight mb-4">
                  {auto.marca} {auto.modelo} <span className="text-sm text-slate-400 block">{auto.patente}</span>
                </h3>

                <div className="space-y-2 bg-[#0b1329] p-4 rounded-xl border border-[#1e293b]">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Pactado con Dueño:</span>
                    <strong className="text-slate-200 font-mono">$ {precioDuenio.toLocaleString("es-AR")}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Precio Publicado:</span>
                    <strong className="text-[#0ea5e9] font-mono">$ {precioVenta.toLocaleString("es-AR")}</strong>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-700 pt-2 mt-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><DollarSign className="w-3 h-3"/> Comisión Agencia:</span>
                    <strong className="text-emerald-400 font-mono text-sm">$ {comisionAgencia.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              </div>
            );
          })}

          {(!consignados || consignados.length === 0) && (
            <div className="col-span-full p-12 text-center border border-dashed border-[#1e293b] rounded-2xl text-slate-500">
              No hay vehículos a consignación activos en este momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
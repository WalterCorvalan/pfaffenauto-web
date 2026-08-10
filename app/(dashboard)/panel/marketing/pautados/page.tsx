import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Target, Megaphone, Car, DollarSign } from "lucide-react";

export default async function AutosPautadosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      id, marca, modelo, patente, estado, pautado, canal_pauta, precio_publicado_ars,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .order("created_at", { ascending: false });

  const datos = vehiculos || [];
  const pautados = datos.filter((v) => v.pautado);
  const activos = pautados.filter((v) => v.estado === "Disponible" || v.estado === "Reservado");
  const vendidosPautados = pautados.filter((v) => v.estado === "Vendido");

  // ================= AGRUPACIÓN POR CANAL DE PAUTA =================
  const canalMap: Record<string, number> = {};
  pautados.forEach((v) => {
    const canal = v.canal_pauta || "Sin especificar";
    canalMap[canal] = (canalMap[canal] || 0) + 1;
  });
  const canalesOrdenados = Object.entries(canalMap).sort((a, b) => b[1] - a[1]);

  const badgeEstado = (estado: string) => {
    switch (estado) {
      case "Disponible": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "Reservado": return "bg-amber-50 text-amber-600 border-amber-200";
      case "Vendido": return "bg-slate-100 text-slate-500 border-slate-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Autos Pautados</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Unidades con inversión publicitaria activa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-orange-700">
            <Megaphone className="w-3.5 h-3.5" /> {activos.length} activos pautados
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700">
            {vendidosPautados.length} vendidos estando pautados
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= DISTRIBUCIÓN POR CANAL ================= */}
          {canalesOrdenados.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Distribución por canal de pauta</h2>
              <div className="flex flex-wrap gap-3">
                {canalesOrdenados.map(([canal, cantidad]) => (
                  <div key={canal} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                    <span className="font-bold text-[13px] text-slate-800">{canal}</span>
                    <span className="bg-white border border-slate-200 text-[11px] font-bold text-indigo-600 px-2 py-0.5 rounded-md">{cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= LISTADO DE ACTIVOS PAUTADOS ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Unidades pautadas activas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Vehículo</th>
                    <th className="p-4">Canal</th>
                    <th className="p-4">Sucursal</th>
                    <th className="p-4 text-right">Precio</th>
                    <th className="p-4 pr-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activos.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <Link href={`/panel/vehiculo/editar/${v.id}`} className="flex items-center gap-3 group">
                          {v.multimedia_vehiculos?.[0] ? (
                            <img src={v.multimedia_vehiculos[0].url_archivo} className="w-14 h-10 object-cover rounded-md border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-14 h-10 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center shrink-0">
                              <Car className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-bold block truncate uppercase tracking-widest">{v.patente || "S/P"}</span>
                            <span className="font-bold text-[13px] text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">{v.marca} {v.modelo}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-[13px] font-medium text-slate-600">{v.canal_pauta || "Sin especificar"}</td>
                      <td className="p-4 text-[13px] text-slate-600">{v.sucursales?.nombre || "—"}</td>
                      <td className="p-4 text-right">
                        <span className="flex items-center justify-end gap-1 font-mono text-[13px] font-bold text-slate-700">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {v.precio_publicado_ars?.toLocaleString("es-AR") || "—"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${badgeEstado(v.estado)}`}>
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {activos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 text-sm italic">
                        No hay unidades pautadas activas. Marcá autos como "pautado" desde la edición del vehículo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

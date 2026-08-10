import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Receipt, CarFront, Search } from "lucide-react";

export default async function VentasListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  let query = supabase
    .from("ventas")
    .select(`
      id, fecha_venta, tipo_operacion, codigo_seguimiento, etapa_seguimiento, precio_final_ars,
      clientes ( nombre, apellido ),
      vehiculos ( marca, modelo, patente )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: ventas } = await query;

  const filtradas = q
    ? (ventas || []).filter((v: any) => {
        const texto = `${v.clientes?.nombre ?? ""} ${v.clientes?.apellido ?? ""} ${v.vehiculos?.marca ?? ""} ${v.vehiculos?.modelo ?? ""} ${v.vehiculos?.patente ?? ""} ${v.codigo_seguimiento ?? ""}`.toLowerCase();
        return texto.includes(q.toLowerCase());
      })
    : ventas || [];

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Ventas y Operaciones</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Historial, códigos de seguimiento y documentación</p>
          </div>
        </div>

        <form method="GET" className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" name="q" defaultValue={q} placeholder="Buscar cliente, auto o código..." className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400" />
          </div>
          <Link href="/panel/ventas/nueva" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nueva Operación
          </Link>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] custom-scrollbar">
        <div className="hidden md:block bg-white border-b border-slate-200 w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 whitespace-nowrap font-bold">Fecha</th>
                <th className="p-4 whitespace-nowrap font-bold">Cliente</th>
                <th className="p-4 whitespace-nowrap font-bold">Vehículo</th>
                <th className="p-4 whitespace-nowrap font-bold">Tipo</th>
                <th className="p-4 whitespace-nowrap font-bold">Etapa</th>
                <th className="p-4 whitespace-nowrap font-bold">Código</th>
                <th className="p-4 text-right whitespace-nowrap font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600 text-[13px] whitespace-nowrap">{v.fecha_venta}</td>
                  <td className="p-4 text-[13px] font-medium text-slate-900 whitespace-nowrap">{v.clientes?.nombre} {v.clientes?.apellido}</td>
                  <td className="p-4 text-[13px] text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                    <CarFront className="w-3.5 h-3.5 text-slate-400" /> {v.vehiculos?.marca} {v.vehiculos?.modelo}
                  </td>
                  <td className="p-4 text-[11px] font-bold text-slate-500 whitespace-nowrap">{v.tipo_operacion}</td>
                  <td className="p-4 whitespace-nowrap">
                    {v.etapa_seguimiento ? (
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md">{v.etapa_seguimiento}</span>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-4 text-[11px] font-mono font-bold text-slate-500 whitespace-nowrap">{v.codigo_seguimiento || "—"}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {v.codigo_seguimiento && (
                      <Link href={`/panel/ventas/seguimiento/${v.id}`} className="text-[11px] font-bold text-indigo-600 hover:underline">
                        Gestionar
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 text-sm italic">Sin ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL */}
        <div className="flex flex-col gap-3 p-4 md:hidden">
          {filtradas.map((v: any) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{v.clientes?.nombre} {v.clientes?.apellido}</span>
                <span className="text-[10px] font-bold text-slate-400">{v.fecha_venta}</span>
              </div>
              <p className="text-[13px] text-slate-600 mb-2">{v.vehiculos?.marca} {v.vehiculos?.modelo}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500">{v.codigo_seguimiento || "—"}</span>
                {v.codigo_seguimiento && (
                  <Link href={`/panel/ventas/seguimiento/${v.id}`} className="text-[11px] font-bold text-indigo-600">Gestionar →</Link>
                )}
              </div>
            </div>
          ))}
          {filtradas.length === 0 && <p className="text-center text-slate-400 text-sm italic py-10">Sin ventas registradas.</p>}
        </div>
      </div>
    </div>
  );
}

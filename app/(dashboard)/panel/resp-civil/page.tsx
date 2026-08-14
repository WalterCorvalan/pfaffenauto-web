import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { ShieldCheck, Plus, Printer, CarFront } from "lucide-react";

export default async function RespCivilPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: registros } = await supabase
    .from("resp_civil")
    .select("*, perfiles ( nombre )")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Responsabilidad Civil</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Recibos de entrega para venta a consumidor final</p>
          </div>
        </div>
        <Link href="/panel/resp-civil/nuevo" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo Recibo
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">N°</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4">Vendedor</th>
                    <th className="p-4 pr-6 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registros?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono text-[13px] font-bold text-indigo-600">{r.numero || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 whitespace-nowrap">
                        {r.fecha ? new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-[13px] font-medium text-slate-900">{r.apellido}, {r.nombre}</td>
                      <td className="p-4 text-[13px] text-slate-700 flex items-center gap-1.5">
                        <CarFront className="w-3.5 h-3.5 text-slate-400" /> {r.marca} {r.modelo}
                      </td>
                      <td className="p-4 text-[13px] text-slate-500">{r.perfiles?.nombre || "—"}</td>
                      <td className="p-4 pr-6 text-center">
                        <Link href={`/panel/resp-civil/imprimir/${r.id}`} className="inline-flex p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <Printer className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!registros || registros.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 text-sm italic">
                        Sin registros cargados todavía.
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

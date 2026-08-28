import { createClient } from "@/lib/supabase2/server";

// Placeholder — backend listo (sql_panel_v2_pedidos.sql), frontend definitivo lo hace Gemini.
export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-1">Pedidos</h1>
      <p className="text-xs text-slate-400 mb-4">Vista provisoria — diseño definitivo pendiente.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-slate-200 dark:border-white/10">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-left">
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Busca</th>
              <th className="px-3 py-2">Presupuesto</th>
              <th className="px-3 py-2">Vendedor</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Cargado</th>
            </tr>
          </thead>
          <tbody>
            {(pedidos || []).map((p: any) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-3 py-2">{p.nombre_cliente}<br /><span className="text-xs text-slate-400">{p.telefono}</span></td>
                <td className="px-3 py-2">{p.marca} {p.modelo} {p.anio_desde || p.anio_hasta ? `(${p.anio_desde ?? ""}-${p.anio_hasta ?? ""})` : ""}</td>
                <td className="px-3 py-2">{p.presupuesto_max ? `${p.moneda} ${p.presupuesto_max}` : "—"}</td>
                <td className="px-3 py-2">{p.vendedor_id ?? "sin asignar"}</td>
                <td className="px-3 py-2">{p.estado}</td>
                <td className="px-3 py-2">{new Date(p.created_at).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
            {(!pedidos || pedidos.length === 0) && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Sin pedidos cargados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Wallet, FileText, Printer, ArrowDownRight, Search, Activity, User, CarFront, Plus } from "lucide-react";

export default async function CajaYGastosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data } = await supabase
    .from("ventas")
    .select(`
      id, created_at, fecha_venta, tipo_operacion, precio_final_ars, seña_ars, saldo_pendiente, forma_pago,
      vehiculos ( marca, modelo, patente ),
      clientes ( nombre, apellido, dni ),
      perfiles ( nombre )
    `);

  const operaciones = data as any[] | null;

  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anoActual = hoy.getFullYear();

  const operacionesDelMes = operaciones?.filter(op => {
    const fecha = new Date(`${op.fecha_venta}T12:00:00Z`);
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual && op.tipo_operacion !== "Presupuesto";
  }) || [];

  const ingresosCajaMes = operacionesDelMes.reduce((acc, op) => {
    if (op.tipo_operacion === "Venta") return acc + (Number(op.precio_final_ars) || 0);
    if (op.tipo_operacion === "Seña") return acc + (Number(op.seña_ars) || 0);
    return acc;
  }, 0);

  const saldoPendienteCalle = operaciones?.reduce((acc, op) => acc + (Number(op.saldo_pendiente) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full">

        {/* Cabecera */}
        <div className="mb-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                Tesorería y Operaciones
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Control de ingresos, señas, ventas y presupuestos emitidos</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-[#111827] border border-emerald-800/40 p-6 rounded-2xl relative overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Ingresos Efectivos (Mes)</span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1.5 mb-1">$ {ingresosCajaMes.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-500 font-medium">Suma de Ventas y Señas cobradas</span>
          </div>

          <div className="bg-[#111827] border border-[#1e293b] p-6 rounded-2xl relative overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center mb-4">
              <Activity className="w-4 h-4 text-[#0ea5e9]" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Saldos a Cobrar (Total)</span>
            <h3 className="text-2xl font-bold text-white mt-1.5 mb-1">$ {saldoPendienteCalle.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-500 font-medium">Plata en la calle por operaciones señadas</span>
          </div>

          <div className="bg-[#111827] border border-dashed border-[#2d3d54] p-6 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer hover:border-[#0ea5e9]/40 hover:bg-[#0ea5e9]/[0.03] transition-colors">
            <div className="w-10 h-10 bg-[#0b1329] border border-[#1e293b] rounded-full flex items-center justify-center mb-3 text-slate-500">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Registrar Gasto</h3>
            <span className="text-xs text-slate-500 mt-1">Luz, sueldos, gestoría (Próximamente)</span>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden w-full">
          <div className="p-5 border-b border-[#1e293b] bg-[#0b1329]/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0ea5e9]" /> Historial de Operaciones
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar cliente, auto o Nro..."
                className="w-full bg-[#0b1329] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-[#0ea5e9]/60 focus:ring-2 focus:ring-[#0ea5e9]/10 text-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#0b1329]/40 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-4">OP N° / Fecha</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Vehículo</th>
                  <th className="p-4">Cliente / Vendedor</th>
                  <th className="p-4 text-right">Montos ($)</th>
                  <th className="p-4 text-center">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/70">
                {operaciones && operaciones.length > 0 ? (
                  operaciones.map((op) => {
                    const isPresupuesto = op.tipo_operacion === "Presupuesto";
                    const isSena = op.tipo_operacion === "Seña";
                    const isVenta = op.tipo_operacion === "Venta";

                    return (
                      <tr key={op.id} className="hover:bg-[#0ea5e9]/[0.03] transition-colors">

                        <td className="p-4">
                          <span className="font-mono text-xs font-bold text-[#0ea5e9] block mb-1">
                            OP-{op.id.split("-")[0].toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(op.fecha_venta).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                            ${isPresupuesto ? 'bg-[#0b1329] text-slate-400 border-[#1e293b]' : ''}
                            ${isSena ? 'bg-amber-900/20 text-amber-400 border-amber-700/40' : ''}
                            ${isVenta ? 'bg-emerald-900/20 text-emerald-400 border-emerald-700/40' : ''}
                          `}>
                            {op.tipo_operacion}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0b1329] border border-[#1e293b] flex items-center justify-center shrink-0">
                              <CarFront className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <strong className="text-sm font-semibold text-white block uppercase">
                                {op.vehiculos?.marca} {op.vehiculos?.modelo}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {op.vehiculos?.patente || "0KM"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-200 font-semibold flex items-center gap-1.5 truncate max-w-[200px]">
                              <User className="w-3.5 h-3.5 text-slate-500" /> {op.clientes?.apellido}, {op.clientes?.nombre}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest pl-5">
                              Vend: {op.perfiles?.nombre || "Sin Asignar"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-right font-mono text-xs">
                          {isPresupuesto ? (
                            <span className="text-slate-500 italic">Cotizado:<br/>$ {op.precio_final_ars?.toLocaleString("es-AR")}</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-white font-semibold">Total: $ {op.precio_final_ars?.toLocaleString("es-AR")}</span>
                              {isSena && (
                                <span className="text-amber-400">Seña: $ {op.seña_ars?.toLocaleString("es-AR")}</span>
                              )}
                              {Number(op.saldo_pendiente) > 0 && (
                                <span className="text-rose-400">Saldo: $ {op.saldo_pendiente?.toLocaleString("es-AR")}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <Link
                            href={`/panel/ventas/imprimir/${op.id}`}
                            className="inline-flex p-2.5 bg-[#0b1329] hover:bg-[#0ea5e9] border border-[#1e293b] hover:border-[#0ea5e9] rounded-xl text-slate-400 hover:text-white transition-all group"
                            title="Re-imprimir Documento"
                          >
                            <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </Link>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 text-sm">
                      No hay operaciones registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
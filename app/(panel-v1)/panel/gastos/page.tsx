import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import LinkConCarga from "./LinkConCarga";
import { Wallet, FileText, Printer, ArrowDownRight, ArrowUpRight, Search, Activity, User, CarFront, Building2, Scale } from "lucide-react";
import NuevoGastoModal from "./NuevoGastoModal";
import SucursalFilterHeader from "../SucursalFilterHeader";
import { getVentasPanel } from "@/lib/ventas";
import { obtenerDatosMes } from "@/lib/informes";

export default async function CajaYGastosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; q?: string }>;
}) {
  const cookieStore = await cookies();
  const { sucursal = "", q = "" } = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // 1. Traer sucursales, cuentas y AHORA categorías (SOLO EGRESOS)
  const [{ data: sucursales }, { data: cuentas }, { data: categorias }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("cuentas").select("id, nombre").eq("activa", true).order("nombre"),
    supabase.from("categorias_movimiento")
      .select("id, nombre")
      .eq("tipo", "egreso") // <--- ESTE ES EL FILTRO QUE FALTABA
      .order("nombre"), 
  ]);

  // 2. Traer operaciones de venta
  const operacionesRaw = await getVentasPanel(supabase);

  // Filtrado por sucursal y por búsqueda de texto
  let operaciones = operacionesRaw;

  if (sucursal) {
    operaciones = operaciones?.filter(
      (op) => op.vehiculos?.sucursal_id === sucursal
    ) || [];
  }

  if (q) {
    const qLower = q.toLowerCase();
    operaciones = operaciones?.filter((op) => {
      const clienteNombre = `${op.clientes?.nombre} ${op.clientes?.apellido}`.toLowerCase();
      const autoNombre = `${op.vehiculos?.marca} ${op.vehiculos?.modelo} ${op.vehiculos?.patente}`.toLowerCase();
      const idOp = op.id.toLowerCase();
      return clienteNombre.includes(qLower) || autoNombre.includes(qLower) || idOp.includes(qLower);
    }) || [];
  }

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

  // 3. Egresos del mes: misma función que usa /panel/informes — única fuente de
  // verdad para "egresos del mes" en todo el panel, así nunca se desincronizan.
  const { egresosTotales: egresosDelMes } = await obtenerDatosMes(supabase as any, hoy, sucursal || undefined);

  const netoDelMes = ingresosCajaMes - egresosDelMes;

  // CÁLCULO DE CAJA INDIVIDUAL POR SUCURSAL (PARA EL DUEÑO)
  const cajaPorSucursal = sucursales?.map((suc) => {
    const opsSucMes = operacionesRaw?.filter((op) => {
      const fecha = new Date(`${op.fecha_venta}T12:00:00Z`);
      return (
        op.vehiculos?.sucursal_id === suc.id &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anoActual &&
        op.tipo_operacion !== "Presupuesto"
      );
    }) || [];

    const ingresos = opsSucMes.reduce((acc, op) => {
      if (op.tipo_operacion === "Venta") return acc + (Number(op.precio_final_ars) || 0);
      if (op.tipo_operacion === "Seña") return acc + (Number(op.seña_ars) || 0);
      return acc;
    }, 0);

    const saldos = operacionesRaw?.filter(op => op.vehiculos?.sucursal_id === suc.id)
      .reduce((acc, op) => acc + (Number(op.saldo_pendiente) || 0), 0) || 0;

    return { id: suc.id, nombre: suc.nombre, ingresos, saldos };
  }) || [];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= HEADER Y FILTROS ================= */}
      <SucursalFilterHeader
        icon={<Wallet className="w-5 h-5 text-indigo-600" />}
        titulo="Gastos y Caja"
        subtitulo="Ingresos, egresos y operaciones del mes, multi-sucursal"
        basePath="/panel/gastos"
        sucursales={sucursales || []}
        sucursalActual={sucursal}
      />

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">

          {/* Tarjetas de Resumen Global/Filtrado */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] flex items-center justify-center mb-4">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Ingresos Efectivos (Mes)</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 mb-1 font-mono">$ {ingresosCajaMes.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Suma de Ventas y Señas cobradas</span>
            </div>

            <LinkConCarga href="/panel/gastos/egresos" className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center hover:border-rose-300 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-[#002a6e] border border-rose-100 dark:border-[#0a2a6b] flex items-center justify-center mb-4">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Egresos Totales (Mes)</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1 mb-1 font-mono">$ {egresosDelMes.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gastos manuales + las 5 categorías</span>
            </LinkConCarga>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${netoDelMes >= 0 ? "bg-indigo-50 dark:bg-[#002a6e] border-indigo-100 dark:border-[#0a2a6b]" : "bg-rose-50 dark:bg-[#002a6e] border-rose-100 dark:border-[#0a2a6b]"}`}>
                <Scale className={`w-4 h-4 ${netoDelMes >= 0 ? "text-indigo-600 dark:text-sky-300" : "text-rose-600"}`} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Neto del Mes</span>
              <h3 className={`text-2xl font-black mt-1 mb-1 font-mono ${netoDelMes >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>$ {netoDelMes.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ingresos menos egresos</span>
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center mb-4">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-sky-300" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Saldos a Cobrar (Total)</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 mb-1 font-mono">$ {saldoPendienteCalle.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Plata en la calle por operaciones señadas</span>
            </div>
          </div>

          <div className="mb-8 max-w-xs mx-auto sm:mx-0">
            <NuevoGastoModal 
              sucursales={sucursales || []} 
              cuentas={cuentas || []} 
              categorias={categorias || []} 
            />
          </div>

          {/* COMPARATIVA DE CAJA POR SUCURSAL (SOLO DUEÑO) */}
          {!sucursal && (
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Control de Caja por Sucursal (Este Mes)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {cajaPorSucursal.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-[13px] text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#0a2a6b]">{c.nombre}</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Ingresos Efectivos:</span>
                        <span className="font-mono text-emerald-600 font-bold">$ {c.ingresos.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Saldos a Cobrar:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-bold">$ {c.saldos.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TABLA DE OPERACIONES ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden w-full shadow-sm">

            <div className="p-4 border-b border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#001c55] flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-sky-300" /> Historial de Operaciones
              </h3>

              <form method="GET" action="/panel/gastos" className="relative w-full sm:w-72">
                {sucursal && <input type="hidden" name="sucursal" value={sucursal} />}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar cliente, auto o Nro..."
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg pl-9 pr-4 py-2 text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] text-slate-900 dark:text-white transition-colors placeholder:text-slate-400"
                />
              </form>
            </div>

            {/* VISTA MÓVIL */}
            <div className="flex flex-col gap-3 p-4 md:hidden">
              {operaciones && operaciones.length > 0 ? (
                operaciones.map((op) => {
                  const isPresupuesto = op.tipo_operacion === "Presupuesto";
                  const isSena = op.tipo_operacion === "Seña";
                  const isVenta = op.tipo_operacion === "Venta";
                  return (
                    <div key={op.id} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-600">OP-{op.id.split("-")[0].toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                          ${isPresupuesto ? 'bg-slate-50 text-slate-500 border-slate-200' : ''}
                          ${isSena ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                          ${isVenta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        `}>
                          {op.tipo_operacion}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(op.fecha_venta).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                      </span>
                      <div className="flex items-center gap-2.5 bg-white dark:bg-[#001c55] border border-slate-100 dark:border-[#0a2a6b] rounded-lg p-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
                          <CarFront className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <strong className="text-[13px] font-bold text-slate-900 dark:text-white block uppercase leading-tight truncate">
                            {op.vehiculos?.marca} {op.vehiculos?.modelo}
                          </strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{op.vehiculos?.sucursales?.nombre || "Sin Sucursal"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-800 dark:text-slate-100 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {op.clientes?.apellido}, {op.clientes?.nombre}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Vend: <span className="font-semibold text-slate-600 dark:text-slate-300">{op.perfiles?.nombre || "Sin Asignar"}</span>
                      </span>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#0a2a6b] font-mono text-[12px]">
                        {isPresupuesto ? (
                          <span className="text-slate-500 italic font-sans font-medium">Cotizado: <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">$ {op.precio_final_ars?.toLocaleString("es-AR")}</span></span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900 dark:text-white font-bold">Total: $ {op.precio_final_ars?.toLocaleString("es-AR")}</span>
                            {isSena && <span className="text-amber-600 font-bold">Seña: $ {op.seña_ars?.toLocaleString("es-AR")}</span>}
                            {Number(op.saldo_pendiente) > 0 && <span className="text-indigo-600 dark:text-sky-300 font-bold">Saldo: $ {op.saldo_pendiente?.toLocaleString("es-AR")}</span>}
                          </div>
                        )}
                        <Link
                          href={`/panel/boletos/imprimir/${op.id}`}
                          className="p-2 bg-white dark:bg-[#001c55] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all shadow-sm shrink-0"
                          title="Re-imprimir Documento"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center">
                  <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Sin Operaciones</h3>
                  <p className="text-slate-500 text-xs mt-1">No hay operaciones registradas con esos filtros.</p>
                </div>
              )}
            </div>

            {/* VISTA DESKTOP */}
            <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">OP N° / Fecha</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Vehículo / Sucursal</th>
                    <th className="p-4">Cliente / Vendedor</th>
                    <th className="p-4 text-right">Montos ($)</th>
                    <th className="p-4 pr-6 text-center">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {operaciones && operaciones.length > 0 ? (
                    operaciones.map((op) => {
                      const isPresupuesto = op.tipo_operacion === "Presupuesto";
                      const isSena = op.tipo_operacion === "Seña";
                      const isVenta = op.tipo_operacion === "Venta";

                      return (
                        <tr key={op.id} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">

                          <td className="p-4 pl-6">
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-sky-300 block mb-0.5">
                              OP-{op.id.split("-")[0].toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              {new Date(op.fecha_venta).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                              ${isPresupuesto ? 'bg-slate-50 dark:bg-[#00246b] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-[#0a2a6b]' : ''}
                              ${isSena ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                              ${isVenta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                            `}>
                              {op.tipo_operacion}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
                                <CarFront className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                <strong className="text-[13px] font-bold text-slate-900 dark:text-white block uppercase leading-tight">
                                  {op.vehiculos?.marca} {op.vehiculos?.modelo}
                               </strong>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {op.vehiculos?.sucursales?.nombre || "Sin Sucursal"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] text-slate-800 dark:text-slate-100 font-bold flex items-center gap-1.5 truncate max-w-[200px]">
                                <User className="w-3.5 h-3.5 text-slate-400" /> {op.clientes?.apellido}, {op.clientes?.nombre}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium pl-5">
                                Vend: <span className="font-semibold text-slate-600 dark:text-slate-300">{op.perfiles?.nombre || "Sin Asignar"}</span>
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-right font-mono text-[11px] leading-relaxed">
                            {isPresupuesto ? (
                              <span className="text-slate-500 italic font-sans font-medium">Cotizado:<br/><span className="font-mono text-slate-600 dark:text-slate-300 font-bold">$ {op.precio_final_ars?.toLocaleString("es-AR")}</span></span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-slate-900 dark:text-white font-bold">Total: $ {op.precio_final_ars?.toLocaleString("es-AR")}</span>
                                {isSena && (
                                  <span className="text-amber-600 font-bold">Seña: $ {op.seña_ars?.toLocaleString("es-AR")}</span>
                                )}
                                {Number(op.saldo_pendiente) > 0 && (
                                  <span className="text-indigo-600 dark:text-sky-300 font-bold">Saldo: $ {op.saldo_pendiente?.toLocaleString("es-AR")}</span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-4 pr-6 text-center">
                            <Link
                              href={`/panel/boletos/imprimir/${op.id}`}
                              className="inline-flex p-2 bg-white dark:bg-[#001c55] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all group shadow-sm"
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
                      <td colSpan={6} className="p-16 text-center border-t border-dashed border-slate-200 dark:border-[#0a2a6b]">
                        <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Sin Operaciones</h3>
                        <p className="text-slate-500 text-xs mt-1">No hay operaciones registradas con esos filtros.</p>
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
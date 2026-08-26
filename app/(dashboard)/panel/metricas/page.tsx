import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  CarFront,
  DollarSign,
  Activity,
  PieChart,
  Target,
  Trophy,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";
import Link from "next/link";
import VentasChart from "@/components/VentasChart";
import SucursalFilterHeader from "../SucursalFilterHeader";
import { getVentasPanel } from "@/lib/ventas";

export default async function DashboardIntegralPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const cookieStore = await cookies();
  const { sucursal = "" } = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  // 1. Traer lista de sucursales
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .order("nombre");

  // 2. Traer configuración global (Objetivo mensual)
  const { data: configData } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .eq("clave", "objetivo_mensual_autos")
    .single();

  const objetivoBase = configData ? Number(configData.valor) : 15;
  const OBJETIVO_MENSUAL_AUTOS = sucursal
    ? Math.round(objetivoBase / (sucursales?.length || 3))
    : objetivoBase;

  // 3. Traer vehículos para cálculos de capital (ARS y USD)
  const { data: vehiculosRaw } = await supabase
    .from("vehiculos")
    .select(
      "id, estado, precio_costo_ars, precio_costo_usd, precio_publicado_ars, precio_publicado_usd, sucursal_id, sucursales!vehiculos_sucursal_id_fkey(id, nombre)",
    );

  // 4. Traer TODAS las ventas
  const ventasRaw = await getVentasPanel(supabase);

  // ---- FILTRADO POR SUCURSAL ----
  const vehiculos = sucursal
    ? vehiculosRaw?.filter((v) => v.sucursal_id === sucursal)
    : vehiculosRaw;

  const ventas = sucursal
    ? ventasRaw?.filter((v) => (v.vehiculos as any)?.sucursal_id === sucursal)
    : ventasRaw;

  // ---- CÁLCULOS CONTABLES (ARS & USD) ----
  const stockActivo =
    vehiculos?.filter(
      (v) => v.estado === "Disponible" || v.estado === "Reservado",
    ) || [];
  const totalAutos = stockActivo.length;

  // ARS
  const capitalInmovilizadoArs = stockActivo.reduce(
    (acc, v) => acc + (Number(v.precio_costo_ars) || 0),
    0,
  );
  const valorVentaProyectadoArs = stockActivo.reduce(
    (acc, v) => acc + (Number(v.precio_publicado_ars) || 0),
    0,
  );
  const gananciaBrutaArs = valorVentaProyectadoArs - capitalInmovilizadoArs;
  const margenPromedioArs =
    capitalInmovilizadoArs > 0
      ? (gananciaBrutaArs / capitalInmovilizadoArs) * 100
      : 0;

  // USD
  const capitalInmovilizadoUsd = stockActivo.reduce(
    (acc, v) => acc + (Number(v.precio_costo_usd) || 0),
    0,
  );
  const valorVentaProyectadoUsd = stockActivo.reduce(
    (acc, v) => acc + (Number(v.precio_publicado_usd) || 0),
    0,
  );
  const gananciaBrutaUsd = valorVentaProyectadoUsd - capitalInmovilizadoUsd;

  // ---- VENTAS DEL MES ----
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anoActual = hoy.getFullYear();

  const ventasDelMes =
    ventas?.filter((v) => {
      const fecha = new Date(`${v.fecha_venta}T12:00:00Z`);
      return (
        fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual
      );
    }) || [];

  const ingresosDelMesArs = ventasDelMes.reduce(
    (acc, v) => acc + (Number(v.precio_final_ars) || 0),
    0,
  );
  const autosVendidosMes = ventasDelMes.length;
  const progresoObjetivo = Math.min(
    (autosVendidosMes / OBJETIVO_MENSUAL_AUTOS) * 100,
    100,
  );

  // ---- DESGLOSE COMPARATIVO POR SUCURSAL ----
  const desgloseSucursales =
    sucursales?.map((s) => {
      const vehiculosSuc =
        vehiculosRaw?.filter(
          (v) =>
            (v.estado === "Disponible" || v.estado === "Reservado") &&
            v.sucursal_id === s.id,
        ) || [];

      const ventasSucMes =
        ventasRaw?.filter((v) => {
          const fecha = new Date(`${v.fecha_venta}T12:00:00Z`);
          return (
            (v.vehiculos as any)?.sucursal_id === s.id &&
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === anoActual
          );
        }) || [];

      const capital = vehiculosSuc.reduce(
        (acc, v) => acc + (Number(v.precio_costo_ars) || 0),
        0,
      );
      const facturacion = ventasSucMes.reduce(
        (acc, v) => acc + (Number(v.precio_final_ars) || 0),
        0,
      );

      return {
        id: s.id,
        nombre: s.nombre,
        unidadesStock: vehiculosSuc.length,
        capital,
        ventasUnidades: ventasSucMes.length,
        facturacion,
      };
    }) || [];

  // ---- RANKING DE VENDEDORES (Mes Actual) ----
  const rankingMap: Record<
    string,
    { nombre: string; cantidad: number; facturacion: number; comision: number }
  > = {};

  ventasDelMes.forEach((v) => {
    const vId = v.vendedor_id || "sin-asignar";
    const vNombre = (v.perfiles as any)?.nombre || "Administración";

    if (!rankingMap[vId]) {
      rankingMap[vId] = { nombre: vNombre, cantidad: 0, facturacion: 0, comision: 0 };
    }
    rankingMap[vId].cantidad += 1;
    rankingMap[vId].facturacion += Number(v.precio_final_ars) || 0;
    rankingMap[vId].comision += Number((v as any).comision_ars) || 0;
  });

  const rankingOrdenado = Object.values(rankingMap).sort(
    (a, b) => b.cantidad - a.cantidad,
  );

  // ---- GRÁFICO HISTÓRICO (ÚLTIMOS 6 MESES) ----
  const ultimos6Meses = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString("es-AR", { month: "short" }).toUpperCase(),
      month: d.getMonth(),
      year: d.getFullYear(),
      total: 0,
      vendedores: {} as Record<string, number>,
    };
  });

  const vendedoresUnicos = new Set<string>();

  ventas?.forEach((v) => {
    const date = new Date(`${v.fecha_venta}T12:00:00Z`);
    const vMonth = date.getMonth();
    const vYear = date.getFullYear();
    const vNombre = (v.perfiles as any)?.nombre || "Administración";

    const mesObj = ultimos6Meses.find(
      (m) => m.month === vMonth && m.year === vYear,
    );

    if (mesObj) {
      vendedoresUnicos.add(vNombre);
      mesObj.total += 1;
      if (!mesObj.vendedores[vNombre]) mesObj.vendedores[vNombre] = 0;
      mesObj.vendedores[vNombre] += 1;
    }
  });

  const chartData = ultimos6Meses.map((m) => {
    const dataPoint: any = { name: m.label, Total: m.total };
    Array.from(vendedoresUnicos).forEach((v) => {
      dataPoint[v] = m.vendedores[v] || 0;
    });
    return dataPoint;
  });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden font-sans">

      {/* ================= HEADER Y FILTRO POR SUCURSAL ================= */}
      <SucursalFilterHeader
        icon={<PieChart className="w-5 h-5 text-indigo-600" />}
        titulo="Dashboard de Control"
        subtitulo="Panel del dueño: Rendimiento, capital y gestión multi-sucursal"
        basePath="/panel/metricas"
        sucursales={sucursales || []}
        sucursalActual={sucursal}
      />

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* ================= FILA 1: KPIs GLOBALES (ARS & USD) ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">
                Capital Inmovilizado
              </span>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white font-mono mb-1">
                $ {capitalInmovilizadoArs.toLocaleString("es-AR")}
              </h3>
              {capitalInmovilizadoUsd > 0 && (
                <span className="text-[11px] font-mono text-indigo-600 dark:text-sky-300 font-bold">
                  US$ {capitalInmovilizadoUsd.toLocaleString("en-US")}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 dark:text-sky-300 mb-1">
                Valor de Venta (Proy)
              </span>
              <h3 className="text-xl lg:text-2xl font-black text-indigo-700 dark:text-sky-300 font-mono mb-1">
                $ {valorVentaProyectadoArs.toLocaleString("es-AR")}
              </h3>
              {valorVentaProyectadoUsd > 0 && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 font-bold">
                  US$ {valorVentaProyectadoUsd.toLocaleString("en-US")}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                  Ganancia Bruta
                </span>
                <span className="bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#0a2a6b] px-2 py-0.5 rounded text-[10px] font-bold">
                  {margenPromedioArs.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono mb-1">
                $ {gananciaBrutaArs.toLocaleString("es-AR")}
              </h3>
              {gananciaBrutaUsd > 0 && (
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                  US$ {gananciaBrutaUsd.toLocaleString("en-US")}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] shadow-sm p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                  Stock Activo
                </span>
                <CarFront className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                  {totalAutos}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  unidades
                </span>
              </div>
            </div>

          </div>

          {/* ================= DESGLOSE COMPARATIVO SUCURSALES ================= */}
          {!sucursal && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Comparativa por Sucursal (Mes Actual)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {desgloseSucursales.map((suc) => (
                  <div
                    key={suc.id}
                    className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#0a2a6b] pb-3 mb-3">
                      <h3 className="font-bold text-[13px] text-slate-900 dark:text-white">
                        {suc.nombre}
                      </h3>
                      <span className="bg-indigo-50 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 dark:border-[#0a2a6b]">
                        {suc.unidadesStock} en stock
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Capital Inmovilizado:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
                          $ {suc.capital.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Ventas del Mes:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {suc.ventasUnidades} unidades
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700 dark:text-slate-200 font-bold pt-2 border-t border-slate-100 dark:border-[#0a2a6b]">
                        <span>Facturación Mes:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-300 text-[13px]">
                          $ {suc.facturacion.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= GRÁFICOS INTERACTIVOS ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
            <VentasChart
              data={chartData}
              vendedores={Array.from(vendedoresUnicos)}
            />
          </div>

          {/* ================= FILA 3: VENTAS, OBJETIVOS Y LEADS ================= */}
          <div className="grid grid-cols-1 gap-6">

            <div className="space-y-6">

              {/* Panel Objetivo de Ventas */}
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-6 rounded-2xl shadow-sm relative">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] rounded-xl">
                      <Target className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-800 dark:text-white">
                        Progreso del Mes
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Objetivo comercial: {OBJETIVO_MENSUAL_AUTOS} unidades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {autosVendidosMes}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                      {" "} / {OBJETIVO_MENSUAL_AUTOS}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-[#00246b] rounded-full h-3 mb-3 overflow-hidden border border-slate-200 dark:border-[#0a2a6b]">
                  <div
                    className={`h-3 transition-all duration-1000 ${progresoObjetivo >= 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                    style={{ width: `${progresoObjetivo}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold mt-4 pt-4 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    Facturación mensual:{" "}
                    <span className="text-slate-900 dark:text-white font-mono">
                      $ {ingresosDelMesArs.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <span
                    className={
                      progresoObjetivo >= 100
                        ? "text-emerald-600 dark:text-emerald-300 font-bold"
                        : "text-indigo-600 dark:text-sky-300 font-bold"
                    }
                  >
                    {progresoObjetivo.toFixed(0)}% Alcanzado
                  </span>
                </div>
              </div>

              {/* Panel Ranking Vendedores */}
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#0a2a6b] flex justify-between items-center bg-white dark:bg-[#001c55]">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Ranking de Vendedores
                  </h3>
                </div>
                <div>
                  {rankingOrdenado.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-[#00246b] text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-[#0a2a6b]">
                          <th className="px-6 py-3">Vendedor</th>
                          <th className="px-6 py-3 text-center">Unidades</th>
                          <th className="px-6 py-3 text-right">Facturación</th>
                          <th className="px-6 py-3 text-right">Comisión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                        {rankingOrdenado.map((vendedor, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                            <td className="px-6 py-3.5 flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  index === 0 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" :
                                  index === 1 ? "bg-slate-100 dark:bg-[#00246b] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#0a2a6b]" :
                                  "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="font-bold text-[13px] text-slate-800 dark:text-white">
                                {vendedor.nombre}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-center text-slate-900 dark:text-white font-black">
                              {vendedor.cantidad}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-600 dark:text-slate-300 font-semibold">
                              $ {vendedor.facturacion.toLocaleString("es-AR")}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                              $ {vendedor.comision.toLocaleString("es-AR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                      Aún no hay ventas registradas este mes.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
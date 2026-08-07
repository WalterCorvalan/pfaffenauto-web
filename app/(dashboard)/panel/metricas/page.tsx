// app/(dashboard)/panel/metricas/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  Wallet,
  TrendingUp,
  CarFront,
  DollarSign,
  Activity,
  PieChart,
  Target,
  Trophy,
  Users,
  ArrowRight,
  Building2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import VentasChart from "@/components/VentasChart";

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
      "id, estado, precio_costo_ars, precio_costo_usd, precio_publicado_ars, precio_publicado_usd, sucursal_id, sucursales(id, nombre)",
    );

  // 4. Traer TODAS las ventas
  const { data: ventasRaw } = await supabase.from("ventas").select(`
      precio_final_ars, 
      precio_final_usd,
      fecha_venta, 
      vendedor_id,
      vehiculo_id,
      vehiculos ( sucursal_id, sucursales ( id, nombre ) ),
      perfiles ( nombre )
    `);

  // 5. Traer últimos leads
  const { data: ultimosLeads } = await supabase
    .from("cotizaciones")
    .select("id, nombre, marca, modelo, tipo_peritaje, created_at")
    .order("created_at", { ascending: false })
    .limit(4);

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

  // ---- DESGLOSE COMPARATIVO POR SUCURSAL (PARA EL DUEÑO) ----
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
    { nombre: string; cantidad: number; facturacion: number }
  > = {};

  ventasDelMes.forEach((v) => {
    const vId = v.vendedor_id || "sin-asignar";
    const vNombre = (v.perfiles as any)?.nombre || "Administración";

    if (!rankingMap[vId]) {
      rankingMap[vId] = { nombre: vNombre, cantidad: 0, facturacion: 0 };
    }
    rankingMap[vId].cantidad += 1;
    rankingMap[vId].facturacion += Number(v.precio_final_ars) || 0;
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
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ENCABEZADO Y FILTRO POR SUCURSAL */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white flex items-center gap-3">
              <PieChart className="w-8 h-8 text-[#0ea5e9]" /> Dashboard de
              Control
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Panel del dueño: Rendimiento, capital y gestión multi-sucursal
            </p>
          </div>

          {/* Selector de Sucursal */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0b1329] border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-300">
              <Filter className="w-4 h-4 text-[#0ea5e9]" />
              <span>Sucursal:</span>
            </div>
            <Link
              href="/panel/metricas"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                !sucursal
                  ? "bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-sky-500/20"
                  : "bg-[#0b1329] text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              Todas
            </Link>
            {sucursales?.map((s) => (
              <Link
                key={s.id}
                href={`/panel/metricas?sucursal=${s.id}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  sucursal === s.id
                    ? "bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-sky-500/20"
                    : "bg-[#0b1329] text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                {s.nombre}
              </Link>
            ))}
          </div>
        </div>

        {/* ================= FILA 1: KPIs GLOBALES (ARS & USD) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Capital Inmovilizado
            </span>
            <h3 className="text-xl lg:text-2xl font-black text-white mt-1 mb-0.5">
              $ {capitalInmovilizadoArs.toLocaleString("es-AR")}
            </h3>
            {capitalInmovilizadoUsd > 0 && (
              <span className="text-xs font-mono text-[#0ea5e9]">
                US$ {capitalInmovilizadoUsd.toLocaleString("en-US")}
              </span>
            )}
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#0ea5e9]">
              Valor de Venta (Proy)
            </span>
            <h3 className="text-xl lg:text-2xl font-black text-[#0ea5e9] mt-1 mb-0.5">
              $ {valorVentaProyectadoArs.toLocaleString("es-AR")}
            </h3>
            {valorVentaProyectadoUsd > 0 && (
              <span className="text-xs font-mono text-emerald-400">
                US$ {valorVentaProyectadoUsd.toLocaleString("en-US")}
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-[#0f172a] border border-emerald-800/50 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">
                Ganancia Bruta
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-black">
                {margenPromedioArs.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-xl lg:text-2xl font-black text-emerald-400 mb-0.5">
              $ {gananciaBrutaArs.toLocaleString("es-AR")}
            </h3>
            {gananciaBrutaUsd > 0 && (
              <span className="text-xs font-mono text-emerald-300">
                US$ {gananciaBrutaUsd.toLocaleString("en-US")}
              </span>
            )}
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                Stock Activo
              </span>
              <CarFront className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-black text-white leading-none">
                {totalAutos}
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">
                unidades
              </span>
            </div>
          </div>
        </div>

        {/* ================= TARJETAS DESGLOSE COMPARATIVO SUCURSALES (SOLO DUEÑO) ================= */}
        {!sucursal && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0ea5e9]" /> Comparativa por
              Sucursal (Mes Actual)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {desgloseSucursales.map((suc) => (
                <div
                  key={suc.id}
                  className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                    <h3 className="font-black text-base text-white">
                      {suc.nombre}
                    </h3>
                    <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/20">
                      {suc.unidadesStock} autos en stock
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Capital Inmovilizado:</span>
                      <span className="font-mono text-slate-200 font-bold">
                        $ {suc.capital.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ventas del Mes:</span>
                      <span className="font-bold text-white">
                        {suc.ventasUnidades} unidades
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-2 border-t border-slate-800/60">
                      <span>Facturación Mes:</span>
                      <span className="font-mono text-sm">
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
        <VentasChart
          data={chartData}
          vendedores={Array.from(vendedoresUnicos)}
        />

        {/* ================= FILA 3: VENTAS, OBJETIVOS Y LEADS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Panel Objetivo de Ventas */}
            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                      Progreso del Mes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Objetivo comercial: {OBJETIVO_MENSUAL_AUTOS} unidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-white">
                    {autosVendidosMes}
                  </span>
                  <span className="text-sm text-slate-500 font-bold">
                    {" "}
                    / {OBJETIVO_MENSUAL_AUTOS}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800/50 rounded-full h-4 mb-2 overflow-hidden border border-slate-700/50">
                <div
                  className={`h-4 transition-all duration-1000 ${progresoObjetivo >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-[#0145F2] to-sky-400"}`}
                  style={{ width: `${progresoObjetivo}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Facturación mensual:{" "}
                  <span className="text-white">
                    $ {ingresosDelMesArs.toLocaleString("es-AR")}
                  </span>
                </div>
                <span
                  className={
                    progresoObjetivo >= 100
                      ? "text-emerald-400"
                      : "text-sky-400"
                  }
                >
                  {progresoObjetivo.toFixed(0)}% Alcanzado
                </span>
              </div>
            </div>

            {/* Panel Ranking Vendedores */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Ranking de
                  Vendedores
                </h3>
              </div>
              <div className="p-0">
                {rankingOrdenado.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/30 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-6 py-3">Vendedor</th>
                        <th className="px-6 py-3 text-center">Unidades</th>
                        <th className="px-6 py-3 text-right">Facturación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {rankingOrdenado.map((vendedor, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-3.5 flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index === 0 ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : index === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" : "bg-orange-700/20 text-orange-400 border border-orange-700/30"}`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-bold text-sm text-slate-200">
                              {vendedor.nombre}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center text-white font-black">
                            {vendedor.cantidad}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-400">
                            $ {vendedor.facturacion.toLocaleString("es-AR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Aún no hay ventas registradas este mes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA 3: Últimos Leads */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-lg flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0ea5e9]" /> Últimos Leads (Web)
              </h3>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3">
              {ultimosLeads && ultimosLeads.length > 0 ? (
                ultimosLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-[#0b1329] border border-slate-800 p-4 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString("es-AR")}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${lead.tipo_peritaje === "consignacion" ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/50" : "bg-purple-900/30 text-purple-400 border-purple-700/50"}`}
                      >
                        {lead.tipo_peritaje === "online"
                          ? "cotización"
                          : lead.tipo_peritaje}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-white mb-0.5 truncate">
                      {lead.nombre}
                    </p>
                    <p className="text-xs text-[#0ea5e9] truncate">
                      {lead.marca} {lead.modelo}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-4 text-center">
                  No hay solicitudes recientes.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800">
              <Link
                href="/panel/crm"
                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl transition-colors border border-slate-700"
              >
                Ver todos los leads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

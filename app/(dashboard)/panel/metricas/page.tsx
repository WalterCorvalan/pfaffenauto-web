import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Wallet, TrendingUp, CarFront, DollarSign, Activity, PieChart } from "lucide-react";

export default async function MetricasPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // 1. Traer todos los vehículos para el cálculo del activo
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("estado, precio_costo_ars, precio_publicado_ars");

  // 2. Traer las ventas registradas
  const { data: ventas } = await supabase
    .from("ventas")
    .select("precio_final_ars, fecha_venta");

  // ---- CÁLCULOS CONTABLES (ACTIVOS Y RENTABILIDAD) ----
  const stockActivo = vehiculos?.filter(v => v.estado === 'Disponible' || v.estado === 'Reservado') || [];
  const totalAutos = stockActivo.length;
  
  const capitalInmovilizado = stockActivo.reduce((acc, v) => acc + (Number(v.precio_costo_ars) || 0), 0);
  const valorVentaProyectado = stockActivo.reduce((acc, v) => acc + (Number(v.precio_publicado_ars) || 0), 0);
  
  const gananciaBrutaProyectada = valorVentaProyectado - capitalInmovilizado;
  // Previene división por 0
  const margenPromedio = capitalInmovilizado > 0 ? (gananciaBrutaProyectada / capitalInmovilizado) * 100 : 0;

  // ---- VENTAS DEL MES ----
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const anoActual = hoy.getFullYear();
  
  const ventasDelMes = ventas?.filter(v => {
    // Si la fecha_venta viene como string (YYYY-MM-DD), parseamos tomando en cuenta la zona horaria UTC
    const fecha = new Date(`${v.fecha_venta}T12:00:00Z`); 
    return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
  }) || [];
  
  const ingresosDelMes = ventasDelMes.reduce((acc, v) => acc + (Number(v.precio_final_ars) || 0), 0);
  const autosVendidosMes = ventasDelMes.length;

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white flex items-center gap-3">
            <PieChart className="w-8 h-8 text-[#0ea5e9]" /> Dashboard Financiero
          </h1>
          <p className="text-xs md:text-sm text-slate-400">Análisis del rendimiento y capital de la agencia</p>
        </div>

        {/* SECCIÓN 1: STOCK Y CAPITAL INMOVILIZADO */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Activo en Stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          
          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-16 h-16 text-white" /></div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Capital Inmovilizado</span>
            <h3 className="text-2xl font-black text-white mt-1 mb-2">$ {capitalInmovilizado.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-500 font-medium">Costo total de compra de unidades</span>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16 text-[#0ea5e9]" /></div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#0ea5e9]">Valor de Venta (Proyectado)</span>
            <h3 className="text-2xl font-black text-[#0ea5e9] mt-1 mb-2">$ {valorVentaProyectado.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-500 font-medium">Suma de precios publicados</span>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><CarFront className="w-16 h-16 text-white" /></div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Unidades Disponibles</span>
            <h3 className="text-3xl font-black text-white mt-1 mb-2">{totalAutos}</h3>
            <span className="text-xs text-slate-500 font-medium">Autos a la venta o señados</span>
          </div>

        </div>

        {/* SECCIÓN 2: RENTABILIDAD Y VENTAS REALES */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Rentabilidad y Ventas del Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="bg-gradient-to-br from-emerald-900/40 to-[#0f172a] border border-emerald-800/50 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Ganancia Bruta Proyectada</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-black">{margenPromedio.toFixed(1)}% PROM</span>
            </div>
            <h3 className="text-3xl font-black text-emerald-400 mb-1">$ {gananciaBrutaProyectada.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-400 font-medium">Beneficio estimado al vender todo el stock</span>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-blue-400" /></div>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-300">Ingresos del Mes</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">$ {ingresosDelMes.toLocaleString("es-AR")}</h3>
            <span className="text-xs text-slate-500 font-medium">Facturado en ventas finalizadas este mes</span>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl"><Activity className="w-5 h-5 text-purple-400" /></div>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-300">Volumen Mensual</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{autosVendidosMes}</h3>
            <span className="text-xs text-slate-500 font-medium">Autos entregados este mes</span>
          </div>

        </div>

      </div>
    </div>
  );
}
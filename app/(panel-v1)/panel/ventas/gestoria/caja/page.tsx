import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Clock3, CheckCircle2, ExternalLink } from "lucide-react";
import NotificacionesBell from "../../../../NotificacionesBell";

export default async function CajaGestoriaPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // Caja de Gestoría = solo movimientos ligados a un trámite — separada de
  // Tesorería/Gastos (que ven TODO, gestoría incluida; esto es el recorte
  // propio del área, no un libro contable nuevo).
  const { data: movimientos } = await supabase
    .from("movimientos_caja")
    .select("id, tipo, concepto, monto, medio_pago, comprobante_url, fecha, tramite_id, patente, tramites_gestoria(vehiculos(marca, modelo))")
    .not("tramite_id", "is", null)
    .order("fecha", { ascending: false })
    .limit(200);

  const lista = movimientos || [];
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];

  const cobrados = lista.filter((m) => m.tipo === "ingreso" && m.medio_pago !== "Pendiente");
  const egresos = lista.filter((m) => m.tipo === "egreso");
  const pendientes = lista.filter((m) => m.tipo === "ingreso" && m.medio_pago === "Pendiente");

  const saldoActual = cobrados.reduce((acc, m) => acc + Number(m.monto), 0) - egresos.reduce((acc, m) => acc + Number(m.monto), 0);
  const ingresosPeriodo = cobrados.filter((m) => m.fecha >= inicioMes).reduce((acc, m) => acc + Number(m.monto), 0);
  const egresosPeriodo = egresos.filter((m) => m.fecha >= inicioMes).reduce((acc, m) => acc + Number(m.monto), 0);
  const gananciaPeriodo = ingresosPeriodo - egresosPeriodo;
  const totalPendiente = pendientes.reduce((acc, m) => acc + Number(m.monto), 0);

  const uno = (v: any) => (Array.isArray(v) ? v[0] || null : v);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Caja de Gestoría</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Solo movimientos de trámites — separada de Tesorería y Gastos</p>
          </div>
        </div>
        <NotificacionesBell seccion="gestoria" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Wallet className="w-3 h-3" /> Saldo actual</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">$ {saldoActual.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ingresos del mes</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">$ {ingresosPeriodo.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Egresos del mes</p>
              <p className="text-lg font-black text-rose-700 dark:text-rose-300 mt-1">$ {egresosPeriodo.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-sky-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ganancia del mes</p>
              <p className="text-lg font-black text-indigo-700 dark:text-sky-300 mt-1">$ {gananciaPeriodo.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-300 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Pendiente de cobro</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">$ {totalPendiente.toLocaleString("es-AR")}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Movimientos recientes</h2>
            <div className="space-y-1.5">
              {lista.length === 0 && <p className="text-[12px] text-slate-400 dark:text-slate-500 italic py-4 text-center">Todavía no hay movimientos de gestoría.</p>}
              {lista.map((m: any) => {
                const v = uno(uno(m.tramites_gestoria)?.vehiculos);
                return (
                  <Link
                    key={m.id}
                    href={`/panel/ventas/gestoria/tramites/${m.tramite_id}`}
                    className="flex items-center justify-between gap-2 py-2.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0 ${m.tipo === "ingreso" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300"}`}>
                        {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                      </span>
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{m.concepto || "—"}</span>
                      {v && <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{v.marca} {v.modelo} {m.patente ? `(${m.patente})` : ""}</span>}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{m.fecha}</span>
                      {m.comprobante_url && <ExternalLink className="w-3 h-3 text-indigo-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">$ {Number(m.monto).toLocaleString("es-AR")}</span>
                      <span className={`text-[10px] font-semibold ${m.medio_pago === "Pendiente" ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>{m.medio_pago}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

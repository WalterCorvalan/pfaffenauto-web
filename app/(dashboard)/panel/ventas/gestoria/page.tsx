import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { FileSearch, AlertTriangle, CalendarDays, CalendarClock, Sparkles, FileText } from "lucide-react";
import NotificacionesBell from "../../../NotificacionesBell";
import GestoriaBuscador from "./GestoriaBuscador";

type Color = "rojo" | "naranja" | "azul" | "verde";

interface Item {
  id: string;
  color: Color;
  vehiculo: string;
  patente: string | null;
  cliente: string | null;
  etiqueta: string;
  mensaje: string;
  fecha: string | null;
  href: string;
}

const COLOR_CLASSES: Record<Color, string> = {
  rojo: "border-rose-400 bg-rose-50 dark:bg-[#002a6e]",
  naranja: "border-amber-400 bg-amber-50 dark:bg-[#002a6e]",
  azul: "border-blue-400 bg-blue-50 dark:bg-[#002a6e]",
  verde: "border-emerald-400 bg-emerald-50 dark:bg-[#002a6e]",
};

const COLOR_TEXTO: Record<Color, string> = {
  rojo: "text-rose-700 dark:text-rose-300",
  naranja: "text-amber-700 dark:text-amber-300",
  azul: "text-blue-700 dark:text-sky-300",
  verde: "text-emerald-700 dark:text-emerald-300",
};

function Columna({ titulo, icono: Icono, items, vacio }: { titulo: string; icono: any; items: Item[]; vacio: string }) {
  return (
    <div className="flex-1 min-w-[280px] bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm flex flex-col">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
        <Icono className="w-3.5 h-3.5" /> {titulo} <span className="ml-auto text-slate-400 dark:text-slate-500">{items.length}</span>
      </h2>
      <div className="space-y-2 flex-1">
        {items.length === 0 && <p className="text-[12px] text-slate-400 dark:text-slate-500 italic py-6 text-center">{vacio}</p>}
        {items.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className={`block border-l-4 rounded-lg p-3 hover:shadow-md transition-shadow ${COLOR_CLASSES[it.color]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{it.vehiculo}</span>
              {it.patente && <span className="text-[10px] font-mono font-bold bg-white/70 dark:bg-[#001c55] px-1.5 py-0.5 rounded shrink-0">{it.patente}</span>}
            </div>
            <p className={`text-[12px] font-semibold mt-0.5 ${COLOR_TEXTO[it.color]}`}>{it.etiqueta}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{it.mensaje}</p>
            {(it.cliente || it.fecha) && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {it.cliente} {it.cliente && it.fecha ? "· " : ""}{it.fecha}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function GestoriaPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const hoy = new Date().toISOString().split("T")[0];

  const [{ data: tramites }, { data: docs }, { data: pagos }] = await Promise.all([
    supabase
      .from("tramites_gestoria")
      .select("id, tipo_tramite, estado, fecha_estimada_fin, proxima_tarea, proxima_fecha, vehiculos(marca, modelo, patente), boletos_venta(nombre, apellido)")
      .neq("estado", "Entregado")
      .order("proxima_fecha", { ascending: true }),
    supabase
      .from("documentacion_vehiculos")
      .select("id, tipo_documento, vencimiento, vehiculo_id, vehiculos(marca, modelo, patente)")
      .not("vencimiento", "is", null)
      .neq("estado", "No corresponde")
      .lte("vencimiento", new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]),
    supabase
      .from("movimientos_caja")
      .select("id, monto, tipo_movimiento, patente")
      .eq("aprobado", false)
      .not("tipo_movimiento", "is", null),
  ]);

  const uno = (v: any) => (Array.isArray(v) ? v[0] || null : v);

  const urgente: Item[] = [];
  const paraHoy: Item[] = [];
  const proximos: Item[] = [];
  const nuevos: Item[] = [];

  (tramites || []).forEach((t: any) => {
    const v = uno(t.vehiculos);
    const b = uno(t.boletos_venta);
    const nombreVehiculo = v ? `${v.marca} ${v.modelo}` : "Vehículo";
    const cliente = b ? `${b.nombre} ${b.apellido}` : null;
    const href = `/panel/ventas/gestoria/tramites/${t.id}`;

    if (t.estado === "Nuevo") {
      nuevos.push({ id: `tramite-nuevo-${t.id}`, color: "azul", vehiculo: nombreVehiculo, patente: v?.patente || null, cliente, etiqueta: t.tipo_tramite, mensaje: "Trámite nuevo — sin iniciar", fecha: null, href });
      return;
    }

    if (t.fecha_estimada_fin && t.fecha_estimada_fin < hoy && t.estado !== "Finalizado" && t.estado !== "Listo para retirar") {
      urgente.push({ id: `tramite-vencido-${t.id}`, color: "rojo", vehiculo: nombreVehiculo, patente: v?.patente || null, cliente, etiqueta: "Trámite atrasado", mensaje: `Estimado para ${t.fecha_estimada_fin} — sigue en "${t.estado}"`, fecha: t.fecha_estimada_fin, href });
    }

    if (t.proxima_tarea && t.proxima_fecha) {
      const item: Item = { id: `tarea-${t.id}`, color: t.proxima_fecha < hoy ? "rojo" : t.proxima_fecha === hoy ? "naranja" : "azul", vehiculo: nombreVehiculo, patente: v?.patente || null, cliente, etiqueta: t.tipo_tramite, mensaje: t.proxima_tarea, fecha: t.proxima_fecha, href };
      if (t.proxima_fecha < hoy) urgente.push(item);
      else if (t.proxima_fecha === hoy) paraHoy.push(item);
      else proximos.push(item);
    }
  });

  (docs || []).forEach((d: any) => {
    const v = uno(d.vehiculos);
    if (!v) return;
    const nombreVehiculo = `${v.marca} ${v.modelo}`;
    const href = `/panel/vehiculo/${d.vehiculo_id}/documentacion`;
    const vencido = d.vencimiento < hoy;
    const item: Item = {
      id: `doc-${d.id}`,
      color: vencido ? "rojo" : d.vencimiento === hoy ? "naranja" : "naranja",
      vehiculo: nombreVehiculo,
      patente: v.patente,
      cliente: null,
      etiqueta: d.tipo_documento,
      mensaje: vencido ? `Vencido el ${d.vencimiento}` : `Vence el ${d.vencimiento}`,
      fecha: d.vencimiento,
      href,
    };
    if (vencido) urgente.push(item);
    else if (d.vencimiento === hoy) paraHoy.push(item);
    else proximos.push(item);
  });

  (pagos || []).forEach((p: any) => {
    urgente.push({
      id: `pago-${p.id}`,
      color: "rojo",
      vehiculo: p.patente || "—",
      patente: p.patente,
      cliente: null,
      etiqueta: p.tipo_movimiento,
      mensaje: `$${Number(p.monto).toLocaleString("es-AR")} pendiente de aprobar`,
      fecha: null,
      href: "/panel/ventas/gestoria/aprobaciones",
    });
  });

  const porFecha = (a: Item, b: Item) => (a.fecha || "").localeCompare(b.fecha || "");
  urgente.sort(porFecha);
  proximos.sort(porFecha);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Mi Día</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Qué hay que hacer hoy, qué está atrasado y qué llegó nuevo</p>
          </div>
        </div>
        <NotificacionesBell seccion="gestoria" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5" /> Buscar por patente
            </h2>
            <GestoriaBuscador />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <Columna titulo="Urgente y atrasado" icono={AlertTriangle} items={urgente} vacio="Nada atrasado. Buen día." />
            <Columna titulo="Para hoy" icono={CalendarDays} items={paraHoy} vacio="Sin tareas para hoy." />
            <Columna titulo="Próximos días" icono={CalendarClock} items={proximos} vacio="Nada agendado todavía." />
            <Columna titulo="Trámites nuevos" icono={FileText} items={nuevos} vacio="Sin trámites nuevos." />
          </div>
        </div>
      </div>
    </div>
  );
}

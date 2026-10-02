"use client";

import { FileText, TrendingUp, Tags, Car, Wrench, CheckCircle2 } from "lucide-react";
import { ETAPA_ENTREGA } from "./etapasTaller";

interface Cobro { orden_id: string; monto: number | string; moneda: string }
interface Renglon { orden_id: string; costo: number | string; aprobado_cliente: boolean | null }

const SIMBOLO: Record<string, string> = { ARS: "$", USD: "USD" };
function fmtPorMoneda(porMoneda: Record<string, number>): string | null {
  const partes = Object.entries(porMoneda).filter(([, n]) => Number.isFinite(n)).map(([m, n]) => `${SIMBOLO[m] || m} ${Math.round(n).toLocaleString("es-AR")}`);
  return partes.length > 0 ? partes.join(" · ") : null;
}

// puedeVerPlata = admin/finanzas/director. El taller (sector) ve los conteos operativos pero no la plata
// (facturación, ganancia, ticket), mismo criterio que el resto del panel.
export default function TallerResumenTab({ ordenes, cobros, renglones, puedeVerPlata }: { ordenes: any[]; cobros: Cobro[]; renglones: Renglon[]; puedeVerPlata: boolean }) {
  const fechaActual = new Date();
  const mesActualStr = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fechaActual);
  const tituloMes = mesActualStr.charAt(0).toUpperCase() + mesActualStr.slice(1);
  const mesActualIso = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, "0")}`; // "YYYY-MM" local

  // ---- Plata del mes (por moneda, nunca mezclada) ----
  // Facturación = cobros vigentes (no anulados) del mes -- los trae page.tsx ya filtrados.
  // Costo = renglones aprobados por el cliente de las órdenes que cobraron en el mes, en la moneda de la orden.
  // Ganancia = facturación - costo (solo si esas órdenes tienen renglones cargados; si no, se muestra "—").
  const monedaDeOrden: Record<string, string> = {};
  ordenes.forEach((o) => { monedaDeOrden[o.id] = o.moneda || "USD"; });

  const facturacion: Record<string, number> = {};
  const ordenesCobradasPorMoneda: Record<string, Set<string>> = {};
  cobros.forEach((c) => {
    facturacion[c.moneda] = (facturacion[c.moneda] || 0) + Number(c.monto);
    (ordenesCobradasPorMoneda[c.moneda] ||= new Set()).add(c.orden_id);
  });

  const costo: Record<string, number> = {};
  const ordenesConRenglones = new Set<string>();
  renglones.forEach((r) => {
    if (r.aprobado_cliente === false) return;
    const m = monedaDeOrden[r.orden_id];
    if (!m) return;
    costo[m] = (costo[m] || 0) + Number(r.costo);
    ordenesConRenglones.add(r.orden_id);
  });

  const ganancia: Record<string, number> = {};
  Object.keys(facturacion).forEach((m) => {
    const ordenesDeMoneda = Array.from(ordenesCobradasPorMoneda[m] || []);
    if (ordenesDeMoneda.length > 0 && ordenesDeMoneda.every((id) => ordenesConRenglones.has(id))) ganancia[m] = facturacion[m] - (costo[m] || 0);
  });

  const ticket: Record<string, number> = {};
  Object.keys(facturacion).forEach((m) => {
    const n = ordenesCobradasPorMoneda[m]?.size || 0;
    if (n > 0) ticket[m] = facturacion[m] / n;
  });

  const facturacionTxt = fmtPorMoneda(facturacion);
  const gananciaTxt = fmtPorMoneda(ganancia);
  const ticketTxt = fmtPorMoneda(ticket);

  // ---- Operativo ----
  // Autos atendidos = órdenes creadas este mes
  const autosAtendidos = ordenes.filter((o) => o.created_at?.startsWith(mesActualIso)).length;
  // En el taller ahora = cualquier etapa que no sea la entrega (las etapas viejas "ingresado/presupuestado/..." ya no existen en la base)
  const enElTallerAhora = ordenes.filter((o) => o.estado !== ETAPA_ENTREGA).length;
  // Entregados este mes = pasaron a la etapa de entrega este mes
  const entregadosMes = ordenes.filter((o) => o.estado === ETAPA_ENTREGA && (o.updated_at || o.created_at || "").startsWith(mesActualIso)).length;

  const Tarjeta = ({ icono, titulo, valor, color }: { icono: React.ReactNode; titulo: string; valor: React.ReactNode; color?: string }) => (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{icono} {titulo}</div>
      <p className={`text-2xl font-black ${color || "text-slate-900 dark:text-white"}`}>{valor}</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">{tituloMes}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {puedeVerPlata && (
          <>
            <Tarjeta icono={<FileText className="w-4 h-4" />} titulo="Facturación del mes" valor={facturacionTxt ?? "—"} />
            <Tarjeta icono={<TrendingUp className="w-4 h-4" />} titulo="Ganancia del mes" valor={gananciaTxt ?? "—"} color="text-emerald-600 dark:text-emerald-400" />
            <Tarjeta icono={<Tags className="w-4 h-4" />} titulo="Ticket promedio" valor={ticketTxt ?? "—"} />
          </>
        )}
        <Tarjeta icono={<Car className="w-4 h-4" />} titulo="Autos atendidos" valor={autosAtendidos} />
        <Tarjeta icono={<Wrench className="w-4 h-4" />} titulo="En el taller ahora" valor={enElTallerAhora} />
        <Tarjeta icono={<CheckCircle2 className="w-4 h-4" />} titulo="Entregados este mes" valor={entregadosMes} />
      </div>

      {puedeVerPlata && !facturacionTxt && (
        <p className="text-xs text-slate-400">Todavía no hay cobros de taller registrados este mes — la facturación se calcula a partir de los cobros cargados (no se inventa un total).</p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { BookOpen, Landmark, TrendingUp, Activity, Loader2 } from "lucide-react";
import { fmt, inputClass, labelClass } from "./shared";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

// Libros contables básicos armados enteramente sobre movimientos_caja y
// cuentas (nada nuevo en la base) — Diario, Mayor, Estado de Resultados y
// Flujo de Caja son distintas formas de agrupar/cruzar la misma tabla de
// movimientos que ya alimenta Finanzas > Movimientos.

const SUBTABS = [
  { value: "mayor", label: "Libro Mayor", icon: Landmark },
  { value: "resultados", label: "Estado de Resultados", icon: TrendingUp },
  { value: "flujo", label: "Flujo de Caja", icon: Activity },
  { value: "diario", label: "Libro Diario", icon: BookOpen },
] as const;

function primerDiaMes(offset = 0) {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
}
function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export default function LibrosContablesTab({ cuentas }: { cuentas: any[] }) {
  const [sub, setSub] = useState<(typeof SUBTABS)[number]["value"]>("mayor");
  const [desde, setDesde] = useState(toISO(primerDiaMes(0)));
  const [hasta, setHasta] = useState(toISO(new Date(primerDiaMes(1).getTime() - 86400000)));
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 pb-1 overflow-x-auto">
        {SUBTABS.map((t) => (
          <button key={t.value} onClick={() => setSub(t.value)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-lg transition-colors ${sub === t.value ? "bg-[#0145F2] text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {sub !== "mayor" && sub !== "flujo" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div><label className={labelClass}>Desde</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Hasta</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputClass} /></div>
        </div>
      )}

      {sub === "diario" && <LibroDiario desde={desde} hasta={hasta} />}
      {sub === "mayor" && <LibroMayor cuentas={cuentas} cuentaId={cuentaId} setCuentaId={setCuentaId} />}
      {sub === "resultados" && <EstadoResultados desde={desde} hasta={hasta} />}
      {sub === "flujo" && <FlujoDeCaja />}
    </div>
  );
}

function LibroDiario({ desde, hasta }: { desde: string; hasta: string }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("id, fecha, tipo, monto, tipo_movimiento, observaciones, cuenta:cuentas(nombre, moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde).lte("fecha", hasta)
      .order("fecha", { ascending: true }).order("created_at", { ascending: true })
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [desde, hasta]);

  const columnas: ColumnaTabla<(typeof movimientos)[number]>[] = [
    { key: "fecha", header: "Fecha", cell: (m) => <span className="text-slate-500 dark:text-slate-400">{m.fecha}</span> },
    { key: "cuenta", header: "Cuenta", cell: (m) => <span className="font-bold text-slate-700 dark:text-slate-200">{m.cuenta?.nombre || "—"}</span> },
    { key: "concepto", header: "Concepto", cell: (m) => m.tipo_movimiento || "—" },
    { key: "detalle", header: "Detalle", cell: (m) => <span className="text-slate-400">{m.observaciones || "—"}</span>, claseTd: "truncate max-w-[200px]", ocultarEnMobile: true },
    { key: "debe", header: "Debe", cell: (m) => <span className="font-mono text-emerald-600">{m.tipo === "ingreso" ? fmt(Number(m.monto), m.cuenta?.moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
    { key: "haber", header: "Haber", cell: (m) => <span className="font-mono text-[#0145F2]">{m.tipo === "egreso" ? fmt(Number(m.monto), m.cuenta?.moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 px-1">Registro cronológico de todos los movimientos del período — un asiento por fila, en el orden en que ocurrieron.</p>
      {cargando ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <TablaResponsiva
          columnas={columnas}
          filas={movimientos}
          keyExtractor={(m) => m.id}
          vacio={<p className="px-4 py-8 text-center text-slate-400 text-xs">Sin movimientos en este período.</p>}
        />
      )}
    </div>
  );
}

function LibroMayor({ cuentas, cuentaId, setCuentaId }: { cuentas: any[]; cuentaId: string; setCuentaId: (v: string) => void }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const cuenta = cuentas.find((c) => c.id === cuentaId);

  useEffect(() => {
    if (!cuentaId) return;
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("id, fecha, tipo, monto, tipo_movimiento, observaciones")
      .is("deleted_at", null).eq("estado", "aprobado").eq("cuenta_id", cuentaId)
      .order("fecha", { ascending: true }).order("created_at", { ascending: true })
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [cuentaId]);

  // Saldo corriente = saldo_inicial de la cuenta + acumulado de ingresos/egresos
  // en orden cronológico — es exactamente lo que hace saldo_cuenta() en SQL,
  // pero mostrando la evolución fila por fila en vez de solo el total.
  const filasConSaldo = useMemo(() => {
    let acumulado = Number(cuenta?.saldo_inicial) || 0;
    return movimientos.map((m) => {
      acumulado += m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto);
      return { ...m, saldo: acumulado };
    });
  }, [movimientos, cuenta]);

  const columnas: ColumnaTabla<(typeof filasConSaldo)[number]>[] = [
    { key: "fecha", header: "Fecha", cell: (m) => <span className="text-slate-500 dark:text-slate-400">{m.fecha}</span> },
    { key: "concepto", header: "Concepto", cell: (m) => m.tipo_movimiento || "—" },
    { key: "debe", header: "Debe", cell: (m) => <span className="font-mono text-emerald-600">{m.tipo === "ingreso" ? fmt(Number(m.monto), cuenta?.moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
    { key: "haber", header: "Haber", cell: (m) => <span className="font-mono text-[#0145F2]">{m.tipo === "egreso" ? fmt(Number(m.monto), cuenta?.moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
    { key: "saldo", header: "Saldo", cell: (m) => <span className="font-mono font-bold">{fmt(m.saldo, cuenta?.moneda)}</span>, claseTh: "text-right", claseTd: "text-right", anchoCompletoMobile: true },
  ];

  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <label className={labelClass}>Cuenta</label>
        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}>
          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
        </select>
      </div>
      <p className="text-xs text-slate-400 px-1">Historial completo de la cuenta con saldo corriente — arranca en el saldo inicial cargado y va sumando/restando cada movimiento en orden.</p>
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-slate-400">Saldo inicial</span>
        <span className="font-mono font-bold text-sm">{fmt(Number(cuenta?.saldo_inicial) || 0, cuenta?.moneda)}</span>
      </div>
      {cargando ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <TablaResponsiva
          columnas={columnas}
          filas={filasConSaldo}
          keyExtractor={(m) => m.id}
          vacio={<p className="px-4 py-8 text-center text-slate-400 text-xs">Sin movimientos en esta cuenta.</p>}
        />
      )}
    </div>
  );
}

function EstadoResultados({ desde, hasta }: { desde: string; hasta: string }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("tipo, monto, tipo_movimiento, cuenta:cuentas(moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde).lte("fecha", hasta)
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [desde, hasta]);

  // Nunca se mezcla ARS con USD — un estado de resultados por cada moneda.
  const porMoneda = useMemo(() => {
    const monedas: Record<string, { ingresos: Record<string, number>; egresos: Record<string, number> }> = {};
    movimientos.forEach((m: any) => {
      const moneda = m.cuenta?.moneda;
      if (!moneda) return;
      // Transferencia entre cajas propias no es ingreso ni egreso real -- es
      // la misma plata moviéndose de una caja a otra, no afecta el resultado.
      if (m.tipo_movimiento === "Transferencia") return;
      if (!monedas[moneda]) monedas[moneda] = { ingresos: {}, egresos: {} };
      const bucket = m.tipo === "ingreso" ? monedas[moneda].ingresos : monedas[moneda].egresos;
      const key = m.tipo_movimiento || "Sin categoría";
      bucket[key] = (bucket[key] || 0) + Number(m.monto);
    });
    return monedas;
  }, [movimientos]);

  if (cargando) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const monedas = Object.keys(porMoneda);
  if (monedas.length === 0) return <p className="text-xs text-slate-400 text-center py-8">Sin movimientos en este período.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {monedas.map((moneda) => {
        const { ingresos, egresos } = porMoneda[moneda];
        const totalIngresos = Object.values(ingresos).reduce((a, b) => a + b, 0);
        const totalEgresos = Object.values(egresos).reduce((a, b) => a + b, 0);
        const resultado = totalIngresos - totalEgresos;
        return (
          <div key={moneda} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-5">
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Estado de Resultados — {moneda}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Ingresos</p>
            {Object.entries(ingresos).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="text-slate-500 dark:text-slate-400">{k}</span><span className="font-mono">{fmt(v, moneda)}</span></div>
            ))}
            <div className="flex justify-between text-xs font-bold border-t border-slate-100 dark:border-white/10 mt-1 pt-1"><span>Total ingresos</span><span className="font-mono text-emerald-600">{fmt(totalIngresos, moneda)}</span></div>

            <p className="text-[10px] font-black uppercase tracking-widest text-[#0145F2] mb-1 mt-4">Egresos</p>
            {Object.entries(egresos).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="text-slate-500 dark:text-slate-400">{k}</span><span className="font-mono">{fmt(v, moneda)}</span></div>
            ))}
            <div className="flex justify-between text-xs font-bold border-t border-slate-100 dark:border-white/10 mt-1 pt-1"><span>Total egresos</span><span className="font-mono text-[#0145F2]">{fmt(totalEgresos, moneda)}</span></div>

            <div className={`flex justify-between text-sm font-black border-t-2 border-slate-200 dark:border-white/20 mt-3 pt-2 ${resultado >= 0 ? "text-emerald-600" : "text-[#0145F2]"}`}>
              <span>Resultado del período</span><span className="font-mono">{fmt(resultado, moneda)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlujoDeCaja() {
  const [datos, setDatos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desde = toISO(primerDiaMes(-11));
    supabase2.from("movimientos_caja")
      .select("fecha, tipo, monto, tipo_movimiento, cuenta:cuentas(moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde)
      .then(({ data }) => { setDatos(data || []); setCargando(false); });
  }, []);

  const porMes = useMemo(() => {
    const meses: { key: string; label: string; ingresos: Record<string, number>; egresos: Record<string, number> }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = primerDiaMes(-i);
      meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), ingresos: {}, egresos: {} });
    }
    const porKey = new Map(meses.map((m) => [m.key, m]));
    datos.forEach((m: any) => {
      if (m.tipo_movimiento === "Transferencia") return;
      const key = m.fecha.slice(0, 7);
      const fila = porKey.get(key);
      const moneda = m.cuenta?.moneda;
      if (!fila || !moneda) return;
      const bucket = m.tipo === "ingreso" ? fila.ingresos : fila.egresos;
      bucket[moneda] = (bucket[moneda] || 0) + Number(m.monto);
    });
    return meses;
  }, [datos]);

  if (cargando) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const filas = porMes.map((m) => ({
    ...m,
    netoUsd: (m.ingresos.USD || 0) - (m.egresos.USD || 0),
    netoArs: (m.ingresos.ARS || 0) - (m.egresos.ARS || 0),
  }));

  // 7 columnas (mes + ingreso/egreso/neto x2 monedas) era ilegible en mobile
  // aun con scroll horizontal -- separado en dos tablas responsivas, una por
  // moneda, cada una con solo 4 columnas (Mes, Ingresos, Egresos, Neto).
  const columnasPorMoneda = (moneda: "USD" | "ARS"): ColumnaTabla<(typeof filas)[number]>[] => [
    { key: "mes", header: "Mes", cell: (m) => <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{m.label}</span> },
    { key: "ingresos", header: "Ingresos", cell: (m) => <span className="font-mono text-emerald-600">{m.ingresos[moneda] ? fmt(m.ingresos[moneda], moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
    { key: "egresos", header: "Egresos", cell: (m) => <span className="font-mono text-[#0145F2]">{m.egresos[moneda] ? fmt(m.egresos[moneda], moneda) : "—"}</span>, claseTh: "text-right", claseTd: "text-right" },
    {
      key: "neto", header: "Neto", claseTh: "text-right", claseTd: "text-right", anchoCompletoMobile: true,
      cell: (m) => { const neto = moneda === "USD" ? m.netoUsd : m.netoArs; return <span className={`font-mono font-bold ${neto >= 0 ? "text-emerald-600" : "text-[#0145F2]"}`}>{fmt(neto, moneda)}</span>; },
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400 px-1">Ingresos, egresos y neto por mes (últimos 12 meses), por moneda.</p>
      {(["USD", "ARS"] as const).map((moneda) => (
        <div key={moneda} className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Flujo de caja — {moneda}</p>
          <TablaResponsiva columnas={columnasPorMoneda(moneda)} filas={filas} keyExtractor={(m) => m.key} />
        </div>
      ))}
    </div>
  );
}

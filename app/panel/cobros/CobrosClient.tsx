"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { AlertTriangle, Clock, DollarSign, X, Save } from "lucide-react";

function fmt(n: number, moneda = "ARS") {
  return `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
}
function diasHasta(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha + "T00:00:00");
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export default function CobrosClient({ miId, soyAdminOFinanzas, cuotasIniciales, cuentas }: { miId: string; soyAdminOFinanzas: boolean; cuotasIniciales: any[]; cuentas: any[] }) {
  const [cuotas, setCuotas] = useState(cuotasIniciales);
  const [cobrando, setCobrando] = useState<any | null>(null);
  const [cbFecha, setCbFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cbMonto, setCbMonto] = useState("");
  const [cbCuentaId, setCbCuentaId] = useState("");
  const [guardando, setGuardando] = useState(false);

  const pendientes = cuotas.filter((c) => !c.cobrada);
  const hoy = new Date().toISOString().slice(0, 10);
  const en7 = new Date(); en7.setDate(en7.getDate() + 7);
  const en7str = en7.toISOString().slice(0, 10);

  const vencidas = pendientes.filter((c) => c.vencimiento < hoy);
  const proximas = pendientes.filter((c) => c.vencimiento >= hoy && c.vencimiento <= en7str);

  const adeudadoPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    pendientes.forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + (Number(c.monto) - Number(c.monto_cobrado)); });
    return map;
  }, [pendientes]);

  const ordenadas = [...pendientes].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));

  const badge = (fecha: string) => {
    const d = diasHasta(fecha);
    if (d < 0) return { texto: `Vencida hace ${-d}d`, clase: "border-rose-300 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30" };
    if (d <= 7) return { texto: d === 0 ? "Vence hoy" : `Vence en ${d}d`, clase: "border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30" };
    return { texto: `En fecha (${d}d)`, clase: "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5" };
  };

  const abrirCobro = (c: any) => {
    setCobrando(c);
    setCbFecha(new Date().toISOString().slice(0, 10));
    setCbMonto(String(Number(c.monto) - Number(c.monto_cobrado)));
    setCbCuentaId(cuentas.find((ct) => ct.moneda === c.moneda)?.id || "");
  };

  const confirmarCobro = async () => {
    if (!cobrando || !cbCuentaId || !cbMonto) return alert("Completá caja y monto.");
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("cobrar_cuota_cliente", { p_cuota_id: cobrando.id, p_monto: Number(cbMonto), p_cuenta_id: cbCuentaId, p_fecha: cbFecha });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre), venta:ventas(vehiculo_marca, vehiculo_modelo)").eq("id", cobrando.id).single();
      setCuotas((prev: any[]) => prev.map((c) => (c.id === cobrando.id ? fresh : c)));
      setCobrando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el cobro.");
    } finally { setGuardando(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-1"><h1 className="text-xl font-bold">Cobros</h1><p className="text-sm text-slate-400">Cuotas que la agencia le cobra a sus clientes{!soyAdminOFinanzas ? " — solo tus operaciones" : ""}.</p></div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Vencidas</p><p className="text-2xl font-black">{vencidas.length}</p></div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Próximas (7d)</p><p className="text-2xl font-black">{proximas.length}</p></div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Adeudado USD</p><p className="text-xl font-black">{fmt(adeudadoPorMoneda.USD || 0, "USD")}</p></div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Adeudado ARS</p><p className="text-xl font-black">{fmt(adeudadoPorMoneda.ARS || 0, "ARS")}</p></div>
      </div>

      {ordenadas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin cuotas pendientes</p><p className="text-xs text-slate-400 mt-1">{soyAdminOFinanzas ? "No hay nada por cobrar." : "No tenés cuotas pendientes de tus operaciones."}</p></div>
      ) : (
        <div className="space-y-2">
          {ordenadas.map((c) => {
            const b = badge(c.vencimiento);
            const pendiente = Number(c.monto) - Number(c.monto_cobrado);
            return (
              <div key={c.id} className={`border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap ${b.clase}`}>
                <div>
                  <p className="text-sm font-bold">{c.cliente?.nombre || "Sin cliente"}</p>
                  <p className="text-xs text-slate-400">{c.concepto}{c.cuota_actual ? ` (${c.cuota_actual}/${c.cuota_total})` : ""}{c.venta ? ` · ${c.venta.vehiculo_marca} ${c.venta.vehiculo_modelo}` : ""}</p>
                  <p className="text-[11px] font-bold mt-0.5">{b.texto} · {c.vencimiento}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black">{fmt(pendiente, c.moneda)}</p>
                  {Number(c.monto_cobrado) > 0 && <p className="text-[10px] text-slate-400">de {fmt(c.monto, c.moneda)} — cobrado {fmt(c.monto_cobrado, c.moneda)}</p>}
                  <button onClick={() => abrirCobro(c)} className="mt-1.5 flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg ml-auto"><DollarSign className="w-3.5 h-3.5" /> Marcar cobrada</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cobrando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCobrando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Marcar cobrada</h3><button onClick={() => setCobrando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-3">{cobrando.cliente?.nombre || "Sin cliente"} — {cobrando.concepto}</p>
            <label className={labelClass}>Fecha real de cobro *</label>
            <input type="date" value={cbFecha} onChange={(e) => setCbFecha(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto ({cobrando.moneda}) *</label><input type="number" value={cbMonto} onChange={(e) => setCbMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Caja *</label><select value={cbCuentaId} onChange={(e) => setCbCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((ct) => ct.moneda === cobrando.moneda).map((ct) => <option key={ct.id} value={ct.id}>{ct.nombre}</option>)}</select></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">La cuota sale de pendientes y queda registrada con esta fecha.</p>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setCobrando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarCobro} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar cobro</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

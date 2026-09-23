"use client";

import { useMemo, useState } from "react";
import { FileText, Pencil, CheckCircle2, AlertTriangle } from "lucide-react";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";
import FacturaModal, { type VehiculoFactura } from "./FacturaModal";

function fmt(n: number, moneda: string) {
  return `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
}

type Filtro = "todos" | "facturados" | "sin_facturar";

export default function FacturacionClient({ vehiculosIniciales }: { vehiculosIniciales: VehiculoFactura[] }) {
  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<VehiculoFactura | null>(null);

  const totalesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    vehiculos.filter((v) => v.facturado && v.factura_importe).forEach((v) => {
      const moneda = v.moneda_compra || "ARS";
      map[moneda] = (map[moneda] || 0) + Number(v.factura_importe);
    });
    return map;
  }, [vehiculos]);

  const sinFacturarCount = useMemo(() => vehiculos.filter((v) => !v.facturado).length, [vehiculos]);

  const filtrados = useMemo(() => {
    let l = vehiculos;
    if (filtro === "facturados") l = l.filter((v) => v.facturado);
    if (filtro === "sin_facturar") l = l.filter((v) => !v.facturado);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((v) => [v.marca, v.modelo, v.patente, v.factura_numero, v.factura_emisor].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [vehiculos, filtro, busqueda]);

  const columnas: ColumnaTabla<VehiculoFactura>[] = [
    { key: "vehiculo", header: "Vehículo", cell: (v) => <span className="font-bold text-slate-700 dark:text-slate-200">{v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ""}</span> },
    { key: "patente", header: "Patente", cell: (v) => v.patente || "—", ocultarEnMobile: true },
    {
      key: "facturado", header: "Estado",
      cell: (v) => v.facturado
        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-3 h-3" /> Facturado</span>
        : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"><AlertTriangle className="w-3 h-3" /> Sin facturar</span>,
    },
    { key: "importe", header: "Importe", cell: (v) => v.facturado && v.factura_importe ? fmt(Number(v.factura_importe), v.moneda_compra || "ARS") : "—" },
    { key: "numero", header: "N° Factura", cell: (v) => v.factura_numero || "—", ocultarEnMobile: true },
    { key: "emisor", header: "Quién factura", cell: (v) => v.factura_emisor || "—", ocultarEnMobile: true },
    { key: "archivo", header: "Archivo", cell: (v) => v.factura_archivo_url ? <a href={v.factura_archivo_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#0145F2] hover:underline">Ver</a> : "—", ocultarEnMobile: true },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-[#0145F2]" /> Facturación</h1>
        <p className="text-sm text-slate-400">Estado de facturación de cada vehículo del stock.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
          <p className="text-[10px] font-bold uppercase text-amber-600">Sin facturar</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{sinFacturarCount}</p>
        </div>
        {Object.keys(totalesPorMoneda).length === 0 ? (
          <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total facturado</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">—</p>
          </div>
        ) : Object.entries(totalesPorMoneda).map(([moneda, total]) => (
          <div key={moneda} className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Total facturado ({moneda})</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{fmt(total, moneda)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1">
          {([["todos", "Todos"], ["sin_facturar", "Sin facturar"], ["facturados", "Facturados"]] as [Filtro, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFiltro(v)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filtro === v ? "bg-[#0145F2] text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>{l}</button>
          ))}
        </div>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por marca, patente, N° factura..." className="flex-1 min-w-[200px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0145F2]" />
      </div>

      <TablaResponsiva
        columnas={columnas}
        filas={filtrados}
        keyExtractor={(v) => v.id}
        onRowClick={(v) => setEditando(v)}
        acciones={(v) => <button onClick={() => setEditando(v)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-[#0145F2]"><Pencil className="w-3.5 h-3.5" /></button>}
        vacio={<p className="text-center text-sm text-slate-400 py-10">No hay vehículos que coincidan.</p>}
      />

      {editando && (
        <FacturaModal
          vehiculo={editando}
          onClose={() => setEditando(null)}
          onGuardado={(actualizado) => {
            setVehiculos((prev) => prev.map((v) => (v.id === actualizado.id ? actualizado : v)));
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

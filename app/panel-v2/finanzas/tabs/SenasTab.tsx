"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Printer, CarFront, AlertTriangle } from "lucide-react";
import EstadoSenaSelector from "../../senas/EstadoSenaSelector";
import NuevaSenaModal from "../../senas/NuevaSenaModal";
import { fmt } from "./shared";

const COLOR_ESTADO: Record<string, string> = { Activa: "border-l-amber-400", Convertida: "border-l-emerald-400", Perdida: "border-l-rose-400" };

export default function SenasTab({
  senas, clientes, vehiculos, vendedores, sucursales, cuentas,
}: { senas: any[]; clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; cuentas: any[] }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const activasPorMoneda: Record<string, number> = {};
  senas.filter((s) => (s.estado || "").toLowerCase() === "activa" && s.monto).forEach((s) => { activasPorMoneda[s.moneda] = (activasPorMoneda[s.moneda] || 0) + Number(s.monto); });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-400">Anticipos y reservas de unidades — este formulario es el mismo de <Link href="/panel-v2/senas" className="underline">Señas</Link>, no hay dos versiones.</p>
          {Object.keys(activasPorMoneda).length > 0 && (
            <p className="text-xs text-amber-600 font-bold mt-1">Activas (a aplicar): {Object.entries(activasPorMoneda).map(([m, n]) => fmt(n, m)).join(" · ")}</p>
          )}
        </div>
        <button onClick={() => setModalAbierto(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nueva Seña</button>
      </div>

      {senas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin señas cargadas</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">N°</th><th className="p-2.5">Fecha</th><th className="p-2.5">Cliente</th><th className="p-2.5">Vehículo</th><th className="p-2.5">Seña</th><th className="p-2.5">Estado</th><th className="p-2.5">Imprimir</th></tr></thead>
            <tbody>
              {senas.map((s: any) => (
                <tr key={s.id} className={`border-b border-slate-50 dark:border-white/5 border-l-4 ${COLOR_ESTADO[s.estado] || "border-l-slate-200"}`}>
                  <td className="p-2.5 font-mono font-bold text-rose-600">{s.numero || "—"}</td>
                  <td className="p-2.5">{s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</td>
                  <td className="p-2.5 font-bold">{s.apellido || s.cliente_nombre}{s.apellido ? `, ${s.nombre}` : ""}{s.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}</td>
                  <td className="p-2.5"><span className="flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {s.marca} {s.modelo}</span></td>
                  <td className="p-2.5 font-mono font-bold">{s.sena_ars ? `$ ${Number(s.sena_ars).toLocaleString("es-AR")}` : s.monto ? fmt(s.monto, s.moneda) : "—"}</td>
                  <td className="p-2.5"><EstadoSenaSelector id={s.id} estado={s.estado} vehiculoId={s.vehiculo_id} /></td>
                  <td className="p-2.5"><Link href={`/panel-v2/senas/imprimir/${s.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 hover:text-rose-600"><Printer className="w-3.5 h-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <NuevaSenaModal
          clientes={clientes} vehiculos={vehiculos} vendedores={vendedores} sucursales={sucursales} cuentas={cuentas}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}

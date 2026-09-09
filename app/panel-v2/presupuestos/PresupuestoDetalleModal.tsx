"use client";

import Link from "next/link";
import { X, FileText, Printer } from "lucide-react";
import CompartirPresupuestoBoton from "./CompartirPresupuestoBoton";

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2 whitespace-pre-wrap">{valor ?? "—"}</p>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{titulo}</p>
      <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
        {children}
      </div>
    </div>
  );
}

export default function PresupuestoDetalleModal({ presupuesto: p, onClose }: { presupuesto: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 pt-4 pb-2 sticky top-0 bg-white dark:bg-[#111] z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-rose-600" /> Presupuesto {p.numero ? `N° ${p.numero}` : ""}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <Seccion titulo="Cliente">
            <Fila label="Nombre" valor={p.cliente_nombre} />
          </Seccion>

          <Seccion titulo="Vehículo">
            <Fila label="Descripción" valor={[p.marca, p.modelo, p.modelo_anio].filter(Boolean).join(" ") || null} />
            <Fila label="Dominio" valor={p.dominio} />
            <Fila label="Color" valor={p.color} />
            <Fila label="Km" valor={p.kilometros ? Number(p.kilometros).toLocaleString("es-AR") : null} />
            <Fila label="Combustible" valor={p.combustible} />
          </Seccion>

          <Seccion titulo="Precio">
            <Fila label="Precio" valor={p.precio_ars ? `$ ${Number(p.precio_ars).toLocaleString("es-AR")}` : p.precio_usd ? `US$ ${Number(p.precio_usd).toLocaleString("es-AR")}` : null} />
            <Fila label="Confirmado" valor={p.precio_confirmado === false ? "⚠️ A confirmar" : p.precio_confirmado === true ? "Sí" : null} />
          </Seccion>

          <Seccion titulo="Datos">
            <Fila label="Vendedor" valor={p.perfiles?.nombre} />
            <Fila label="Fecha" valor={p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : null} />
          </Seccion>

          {p.observaciones && (
            <Seccion titulo="Observaciones">
              <p className="text-sm text-slate-800 dark:text-white whitespace-pre-wrap py-2">{p.observaciones}</p>
            </Seccion>
          )}

          <div className="flex gap-2 pt-1">
            <Link href={`/panel-v2/presupuestos/imprimir/${p.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm py-2.5 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> Ver / Imprimir
            </Link>
            <CompartirPresupuestoBoton tokenPublico={p.token_publico} />
          </div>
        </div>
      </div>
    </div>
  );
}

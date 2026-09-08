"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FileText, Receipt, Calculator, Car, UserPlus, ShoppingCart } from "lucide-react";

// Botón "+" flotante global (calcado del CRM viejo) — despliega los 6 accesos
// directos de creación rápida. "Nuevo boleto" espera al módulo Boletos (venta
// formal), todavía no construido.
const ACCIONES = [
  { label: "Nuevo boleto", icon: FileText, color: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300", href: null },
  { label: "Nuevo recibo (seña)", icon: Receipt, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", href: "/panel-v2/senas?nuevo=1" },
  { label: "Nuevo presupuesto", icon: Calculator, color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300", href: "/panel-v2/presupuestos?nuevo=1" },
  { label: "Nuevo vehículo", icon: Car, color: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300", href: "/panel-v2/stock?nuevo=1" },
  { label: "Nuevo cliente", icon: UserPlus, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300", href: "/panel-v2/clientes?nuevo=1" },
  { label: "Nueva venta", icon: ShoppingCart, color: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300", href: "/panel-v2/ventas?nueva=1" },
];

export default function QuickActionsButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const elegir = (href: string | null) => {
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <>
          <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
          <div className="flex flex-col items-end gap-2 mb-1">
            {ACCIONES.map((a) => {
              const Icon = a.icon;
              const habilitada = !!a.href;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => habilitada && elegir(a.href)}
                  disabled={!habilitada}
                  title={habilitada ? undefined : "Todavía no construido"}
                  className={`flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all ${
                    habilitada ? "hover:shadow-xl hover:-translate-x-0.5 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${a.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {a.label}
                </button>
              );
            })}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95"
        title="Acciones rápidas"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}

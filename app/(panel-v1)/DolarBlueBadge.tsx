"use client";

import { useEffect, useState } from "react";

export default function DolarBlueBadge({ compacto }: { compacto?: boolean }) {
  const [cotizacion, setCotizacion] = useState<{ compra: number; venta: number } | null>(null);
  const [mostrando, setMostrando] = useState<"compra" | "venta">("compra");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cargar = () => {
      fetch("/api/dolar-blue")
        .then((r) => r.json())
        .then((data) => {
          if (data.compra && data.venta) setCotizacion(data);
        })
        .catch(() => {});
    };
    cargar();
    const timer = setInterval(cargar, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Alterna compra/venta cada 3s con un pequeño fade, en vez de mostrar las
  // dos juntas (no entraban en el header móvil sin recortarse).
  useEffect(() => {
    const ciclo = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMostrando((m) => (m === "compra" ? "venta" : "compra"));
        setVisible(true);
      }, 200);
    }, 3000);
    return () => clearInterval(ciclo);
  }, []);

  if (!cotizacion) return null;

  const valor = mostrando === "compra" ? cotizacion.compra : cotizacion.venta;

  return (
    <div
      title="Cotización Dólar Blue en tiempo real (dolarapi.com)"
      className={`group flex items-center shrink-0 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-full shadow-sm hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(52,211,153,0.15)] transition-all cursor-default ${
        compacto ? "pl-1.5 pr-2.5 py-1 gap-1.5" : "pl-1.5 pr-4 py-1.5 gap-3"
      }`}
    >
      {/* ================= INDICADOR "LIVE" ================= */}
      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-400/20">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          Blue
        </span>
      </div>

      {/* ================= VALOR (alterna compra/venta) ================= */}
      <div
        className={`flex items-baseline gap-1 min-w-[64px] transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          {mostrando === "compra" ? (compacto ? "C" : "Compra") : (compacto ? "V" : "Venta")}
        </span>
        <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white font-mono tracking-tight">
          ${valor.toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}
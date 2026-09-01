"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Car, FolderKanban, Trophy, Banknote, Landmark } from "lucide-react";

export default function TopTicker() {
  const [stock, setStock] = useState<number | null>(null);
  const [ventas, setVentas] = useState<number | null>(null);
  const [expedientes, setExpedientes] = useState<number | null>(null);
  const [dolar, setDolar] = useState<{ compra: number; venta: number } | null>(null);

  useEffect(() => {
    const cargarMetricas = async () => {
      fetch("/api/dolar-blue")
        .then((res) => res.json())
        .then((data) => {
          if (data.compra && data.venta) setDolar(data);
        })
        .catch(() => {});

      supabase2
        .from("vehiculos")
        .select("id", { count: "exact", head: true })
        .eq("estado", "disponible")
        .then(({ count }) => setStock(count || 0));

      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      supabase2
        .from("ventas")
        .select("id", { count: "exact", head: true })
        .eq("estado", "cerrada")
        .gte("fecha_cierre", primerDiaMes)
        .then(({ count }) => setVentas(count || 0));

      supabase2
        .from("expedientes")
        .select("id", { count: "exact", head: true })
        .neq("estado", "cerrado")
        .then(({ count }) => setExpedientes(count || 0));
    };

    cargarMetricas();
    const timer = setInterval(cargarMetricas, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const MetricasGrupo = () => (
    <>
      <div className="flex items-center gap-2 px-4 border-r border-indigo-100/50 dark:border-white/5 shrink-0">
        <div className="bg-emerald-100 dark:bg-emerald-500/20 p-1 rounded-md">
          <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
          Caja: <span className="font-bold text-emerald-600 dark:text-emerald-400">USD 0 · ARS 0</span>
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-indigo-100/50 dark:border-white/5 shrink-0">
        <div className="bg-blue-100 dark:bg-blue-500/20 p-1 rounded-md">
          <Car className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
          <span className="font-black text-blue-600 dark:text-blue-400">{stock !== null ? stock : "-"}</span> disponibles
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-indigo-100/50 dark:border-white/5 shrink-0">
        <div className="bg-rose-100 dark:bg-rose-500/20 p-1 rounded-md">
          <Trophy className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
          <span className="font-black text-rose-600 dark:text-rose-400">{ventas !== null ? ventas : "-"}</span> ventas el mes
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-indigo-100/50 dark:border-white/5 shrink-0">
        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1 rounded-md">
          <FolderKanban className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
          <span className="font-black text-indigo-600 dark:text-indigo-400">{expedientes !== null ? expedientes : "-"}</span> exp. en curso
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 border-r border-indigo-100/50 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-500/20 p-1 px-1.5 rounded-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          </span>
          <Landmark className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 tracking-wide">
          Dólar Blue: <span className="font-bold text-amber-600 dark:text-amber-400">C ${dolar?.compra || "-"} · V ${dolar?.venta || "-"}</span>
        </span>
      </div>
    </>
  );

  return (
    <div className="flex-1 overflow-hidden relative mx-4 rounded-lg border border-indigo-100 dark:border-white/10 bg-gradient-to-r from-indigo-50/40 via-white to-indigo-50/40 dark:from-white/[0.02] dark:via-white/[0.05] dark:to-white/[0.02] hidden md:flex items-center h-[32px] shadow-inner">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
          display: flex;
          width: max-content;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="animate-ticker">
        <MetricasGrupo />
        <MetricasGrupo />
      </div>
    </div>
  );
}
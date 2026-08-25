"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { ToastTipo } from "@/lib/toast";

interface ToastItem {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
}

const ESTILOS: Record<ToastTipo, { grad: string; icon: typeof CheckCircle2; bar: string }> = {
  success: { grad: "from-emerald-500 to-emerald-600", icon: CheckCircle2, bar: "bg-emerald-200" },
  error: { grad: "from-rose-500 to-rose-600", icon: XCircle, bar: "bg-rose-200" },
  info: { grad: "from-indigo-500 to-indigo-600", icon: Info, bar: "bg-indigo-200" },
};

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let seq = 0;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mensaje: string; tipo?: ToastTipo };
      const id = ++seq;
      setItems((prev) => [...prev, { id, mensaje: detail.mensaje, tipo: detail.tipo || "success" }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
    };
    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2.5 pointer-events-none">
      {items.map((t) => {
        const e = ESTILOS[t.tipo];
        const Icono = e.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 bg-gradient-to-br ${e.grad} text-white pl-4 pr-9 py-3.5 rounded-2xl shadow-2xl shadow-black/25 min-w-[280px] max-w-sm animate-toastIn`}
          >
            <Icono className="w-5 h-5 shrink-0" />
            <span className="text-[13px] font-bold leading-snug">{t.mensaje}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="absolute top-2.5 right-2.5 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className={`absolute bottom-0 left-0 h-[3px] ${e.bar} animate-toastBar`} />
          </div>
        );
      })}
    </div>
  );
}

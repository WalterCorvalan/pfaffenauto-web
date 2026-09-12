"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Info, X, Bell } from "lucide-react";
import type { ToastTipo } from "@/lib/toast";

interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastTipo | "alerta";
  link?: string | null;
}

const ICONO: Record<Toast["tipo"], typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  alerta: Bell,
};

const COLOR: Record<Toast["tipo"], string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
  info: "bg-slate-800 dark:bg-white/10 text-white",
  alerta: "bg-indigo-600 text-white",
};

let contador = 0;

// Montado una vez en el layout del panel -- escucha el evento global
// "app-toast" (lib/toast.ts) para acciones puntuales del usuario (guardar,
// borrar, etc.) y también "app-toast-alerta" (NotificationBell) para avisar
// en el momento que llega una notificación nueva, no solo cuando el usuario
// mira la campana y ve el número cambiado.
export default function ToastHost() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const agregar = (mensaje: string, tipo: Toast["tipo"], link?: string | null) => {
      const id = ++contador;
      setToasts((prev) => [...prev, { id, mensaje, tipo, link }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    };

    const onToast = (e: Event) => {
      const { mensaje, tipo } = (e as CustomEvent).detail || {};
      if (mensaje) agregar(mensaje, tipo || "info");
    };
    const onAlerta = (e: Event) => {
      const { mensaje, link } = (e as CustomEvent).detail || {};
      if (mensaje) agregar(mensaje, "alerta", link);
    };

    window.addEventListener("app-toast", onToast);
    window.addEventListener("app-toast-alerta", onAlerta);
    return () => {
      window.removeEventListener("app-toast", onToast);
      window.removeEventListener("app-toast-alerta", onAlerta);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONO[t.tipo];
        return (
          <div
            key={t.id}
            onClick={() => { if (t.link) { router.push(t.link); setToasts((prev) => prev.filter((x) => x.id !== t.id)); } }}
            className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-2xl animate-fadeIn ${COLOR[t.tipo]} ${t.link ? "cursor-pointer" : ""}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-snug flex-1">{t.mensaje}</p>
            <button onClick={(e) => { e.stopPropagation(); setToasts((prev) => prev.filter((x) => x.id !== t.id)); }} className="shrink-0 opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

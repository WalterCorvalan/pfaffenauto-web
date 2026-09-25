"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

// Activa notificaciones push nativas del dispositivo (Web Push API) para
// este navegador puntual -- no depende de WhatsApp ni de Meta. El usuario
// tiene que aceptar el permiso una vez; a partir de ahí, cada alerta nueva
// le llega como notificación real del sistema operativo (cron
// enviar-push cada 1 min, ver app/api/cron/panel/enviar-push/route.ts).
// En iPhone, Safari solo entrega push si el sitio está agregado a la
// pantalla de inicio (PWA instalada) -- iOS 16.4+. En Android/desktop
// funciona directo desde el navegador, sin instalar nada.

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribeButton() {
  const [soportado, setSoportado] = useState(true);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSoportado(false);
        setCargando(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setActivo(!!sub);
      } catch { /* sin registro todavía, queda activo=false */ }
      setCargando(false);
    })();
  }, []);

  const activar = async () => {
    setProcesando(true);
    setError("");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setError("Rechazaste el permiso de notificaciones — activalo desde la configuración del navegador para poder usarlo.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setError("Falta configurar las notificaciones del lado del servidor todavía."); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const res = await fetch("/api/panel/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error();
      setActivo(true);
    } catch {
      setError("No se pudo activar. Probá de nuevo en un momento.");
    } finally {
      setProcesando(false);
    }
  };

  const desactivar = async () => {
    setProcesando(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/panel/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setActivo(false);
    } catch {
      setError("No se pudo desactivar. Probá de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return null;
  if (!soportado) return null;

  return (
    <div className={`flex items-start gap-3 border rounded-xl p-3.5 mb-3 ${activo ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"}`}>
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activo ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300"}`}>
        {activo ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-sm font-semibold block">Notificaciones en este dispositivo</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">
          {activo
            ? "Activadas — las alertas te llegan como notificación real del celular/PC, sin tener el CRM abierto."
            : "Recibí las alertas como notificación nativa del celular o la compu, aunque no tengas el CRM abierto. En iPhone, primero agregá el sitio a la pantalla de inicio."}
        </span>
        {error && <span className="block text-[11px] text-rose-500 mt-1">{error}</span>}
      </span>
      <button
        type="button"
        onClick={activo ? desactivar : activar}
        disabled={procesando}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activo ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20" : "bg-[#0145F2] hover:bg-[#0138c9] text-white"}`}
      >
        {procesando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : activo ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { UserCircle2, Camera, Loader2, Check, Save } from "lucide-react";
import { inputClass, labelClass } from "./shared";

export default function PerfilTab({ miId }: { miId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/panel-v2/perfil").then((r) => r.json()).then(({ perfil }) => {
      setNombre(perfil?.nombre || "");
      setWhatsapp(perfil?.whatsapp || "");
      setEmail(perfil?.email || "");
      setFotoUrl(perfil?.foto_url || null);
      setCargando(false);
    });
  }, []);

  const subirFoto = async (file: File) => {
    setSubiendoFoto(true);
    setMensaje(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/panel-v2/perfil/foto", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la foto.");
      setFotoUrl(data.publicUrl);
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "Error al subir la foto." });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/panel-v2/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), whatsapp: whatsapp.replace(/\D/g, "") || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setMensaje({ tipo: "ok", texto: "Datos guardados correctamente." });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return null;

  return (
    <div className="max-w-lg">
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 mb-5">
        <p className="text-sm font-bold flex items-center gap-1.5"><UserCircle2 className="w-4 h-4" /> Mi Perfil</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tu foto, nombre y WhatsApp se muestran al cliente cuando te asignan un auto -- en la ficha del catálogo, el presupuesto y el seguimiento de su venta/seña.</p>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="relative shrink-0">
          {fotoUrl ? (
            <img src={fotoUrl} alt={nombre} className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xl">
              {nombre.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-sm disabled:opacity-50"
            title="Cambiar foto"
          >
            {subiendoFoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{nombre || "Sin nombre"}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{email}</p>
        </div>
      </div>

      <label className={labelClass}>Nombre completo</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />

      <label className={`${labelClass} mt-3`}>WhatsApp propio</label>
      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 5491137564398" className={inputClass} />
      <p className="text-[10px] text-slate-400 mt-1 mb-1">Con código de país, sin espacios ni guiones. Si lo dejás vacío, el cliente ve el teléfono de tu sucursal en vez del tuyo.</p>

      {mensaje && (
        <div className={`text-[12px] font-medium px-3.5 py-2.5 rounded-xl flex items-center gap-2 mt-3 ${mensaje.tipo === "ok" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
          {mensaje.tipo === "ok" && <Check className="w-4 h-4 shrink-0" />}
          {mensaje.texto}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={guardar} disabled={guardando || !nombre.trim()} className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50">
          <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

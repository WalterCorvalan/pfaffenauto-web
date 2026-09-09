"use client";

import { useState, useEffect, useRef } from "react";
import { UserCircle2, Camera, Loader2, Check, Save } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export default function PerfilClient({ miId }: { miId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sucursalNombre, setSucursalNombre] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/panel-v2/perfil").then((r) => r.json()).then(({ perfil }) => {
      setNombre(perfil?.nombre || "");
      setWhatsapp(perfil?.whatsapp || "");
      setEmail(perfil?.email || "");
      setEmpresa(perfil?.empresa || "");
      setSucursalNombre(perfil?.sucursal_nombre || null);
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0"><UserCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Mi Perfil</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tu foto, nombre y WhatsApp -- se muestran al cliente cuando te asignan un auto (catálogo, presupuesto, seguimiento).</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        {cargando ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="max-w-lg">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nombre} className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-2xl">
                    {nombre.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoFoto}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-sm disabled:opacity-50"
                  title="Cambiar foto"
                >
                  {subiendoFoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{nombre || "Sin nombre"}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{email}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Empresa</label>
                  <input value={empresa} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelClass}>Sucursal</label>
                  <input value={sucursalNombre || "Sin asignar"} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                  <p className="text-[10px] text-slate-400 mt-1">La asigna un admin en Configuración → Usuarios.</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Nombre completo</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp propio</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 5491137564398" className={inputClass} />
                <p className="text-[10px] text-slate-400 mt-1">Con código de país, sin espacios ni guiones. Si lo dejás vacío, el cliente ve el teléfono de tu sucursal en vez del tuyo.</p>
              </div>

              {mensaje && (
                <div className={`text-[12px] font-medium px-3.5 py-2.5 rounded-xl flex items-center gap-2 ${mensaje.tipo === "ok" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                  {mensaje.tipo === "ok" && <Check className="w-4 h-4 shrink-0" />}
                  {mensaje.texto}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button onClick={guardar} disabled={guardando || !nombre.trim()} className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50">
                  <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

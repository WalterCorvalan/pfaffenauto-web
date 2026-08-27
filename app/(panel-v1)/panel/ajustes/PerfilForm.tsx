"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User, Camera, Loader2, Check } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors";

export default function PerfilForm({
  perfilId,
  emailActual,
  rol,
  nombreInicial,
  telefonoInicial,
  avatarInicial,
}: {
  perfilId: string;
  emailActual: string;
  rol: string;
  nombreInicial: string;
  telefonoInicial: string;
  avatarInicial: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [email, setEmail] = useState(emailActual);
  const [avatarUrl, setAvatarUrl] = useState(avatarInicial);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const subirFoto = async (file: File) => {
    setSubiendoFoto(true);
    setMensaje(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la foto.");
      const { error } = await supabase.from("perfiles").update({ avatar_url: data.publicUrl }).eq("id", perfilId);
      if (error) throw error;
      setAvatarUrl(data.publicUrl);
      router.refresh();
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "Error al subir la foto." });
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarDatos = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const { error: errorPerfil } = await supabase
        .from("perfiles")
        .update({ nombre: nombre.trim(), telefono: telefono.trim() || null })
        .eq("id", perfilId);
      if (errorPerfil) throw errorPerfil;

      if (email.trim() !== emailActual) {
        const { error: errorEmail } = await supabase.auth.updateUser({ email: email.trim() });
        if (errorEmail) throw errorEmail;
        setMensaje({ tipo: "ok", texto: "Datos guardados. Te enviamos un correo de confirmación al nuevo email — hasta que lo confirmes, seguís entrando con el actual." });
      } else {
        setMensaje({ tipo: "ok", texto: "Datos guardados correctamente." });
      }
      router.refresh();
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarContrasena = async () => {
    setEnviandoReset(true);
    setMensaje(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailActual, {
        redirectTo: `${window.location.origin}/login/reset`,
      });
      if (error) throw error;
      setMensaje({ tipo: "ok", texto: `Te enviamos un link para cambiar la contraseña a ${emailActual}.` });
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err.message || "No se pudo enviar el correo." });
    } finally {
      setEnviandoReset(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Foto de perfil */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nombre} className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-[#0a2a6b]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] flex items-center justify-center text-indigo-700 dark:text-sky-300 font-bold text-xl">
              {nombre.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm disabled:opacity-50"
            title="Cambiar foto"
          >
            {subiendoFoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && subirFoto(e.target.files[0])}
          />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{nombre || "Sin nombre"}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{rol}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Nombre Completo</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Correo Electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Teléfono</label>
          <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 11 2345 6789" className={inputClass} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Rol Asignado</label>
          <input type="text" disabled defaultValue={rol} className={`${inputClass} text-slate-500 dark:text-slate-400 cursor-not-allowed capitalize`} />
        </div>
      </div>

      {mensaje && (
        <div className={`text-[12px] font-medium px-3.5 py-2.5 rounded-xl flex items-center gap-2 ${mensaje.tipo === "ok" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"}`}>
          {mensaje.tipo === "ok" && <Check className="w-4 h-4 shrink-0" />}
          {mensaje.texto}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={guardarDatos}
          disabled={guardando || !nombre.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[12px] uppercase tracking-widest rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={cambiarContrasena}
          disabled={enviandoReset}
          className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-700 dark:text-slate-300 font-bold text-[12px] uppercase tracking-widest rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50"
        >
          {enviandoReset ? "Enviando..." : "Cambiar Contraseña"}
        </button>
      </div>
    </div>
  );
}

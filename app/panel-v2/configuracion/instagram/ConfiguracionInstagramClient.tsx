"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Copy, Check, Loader2, ExternalLink } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

export default function ConfiguracionInstagramClient() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [igUserId, setIgUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [copiado, setCopiado] = useState<"webhook" | "verify" | null>(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/instagram/configuracion");
    const data = await res.json();
    if (res.ok) {
      setConfig(data.config);
      setIgUserId(data.config?.ig_user_id || "");
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setGuardando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/panel-v2/instagram/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igUserId, accessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      setConfig(data.config);
      setAccessToken("");
      setMensaje("Guardado correctamente.");
    } catch (e: any) {
      setMensaje(e.message || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const regenerarVerify = async () => {
    if (!confirm("¿Regenerar el Verify Token? Vas a tener que actualizarlo también en el dashboard de Meta.")) return;
    setGuardando(true);
    try {
      const res = await fetch("/api/panel-v2/instagram/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igUserId, accessToken: "", regenerarVerifyToken: true }),
      });
      const data = await res.json();
      if (res.ok) setConfig(data.config);
    } finally {
      setGuardando(false);
    }
  };

  const copiar = (texto: string, cual: "webhook" | "verify") => {
    navigator.clipboard.writeText(texto);
    setCopiado(cual);
    setTimeout(() => setCopiado(null), 1500);
  };

  if (cargando) return <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const webhookUrl = config?.webhook_verify_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/panel-v2/webhooks/instagram/${config.webhook_verify_token}` : "";

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-5">
        <Link href="/panel-v2/configuracion" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Usuarios</Link>
        <Link href="/panel-v2/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Empresa</Link>
        <Link href="/panel-v2/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">WhatsApp</Link>
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-rose-600 text-rose-600">Instagram</span>
      </div>
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1"><Camera className="w-5 h-5 text-rose-600" /> Configuración — Instagram</h1>
      <p className="text-sm text-slate-400 mb-6">Conectá la cuenta de Instagram de Meta para recibir DMs y respuestas privadas a comentarios acá (Conversaciones → Instagram), con el mismo asistente automático que WhatsApp.</p>

      <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${config?.listo ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
        {config?.listo ? "✅ Configurado" : "⏳ Falta completar"}
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 mb-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Credenciales de Meta</p>
        <div>
          <label className={labelClass}>Instagram User ID (ig_user_id)</label>
          <input value={igUserId} onChange={(e) => setIgUserId(e.target.value)} placeholder="Ej: 17841400000000000" className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">Meta → Instagram → Configuración de la API → ID de la cuenta profesional.</p>
        </div>
        <div>
          <label className={labelClass}>Access Token</label>
          <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder={config?.listo ? "•••••••• (dejalo vacío para no cambiarlo)" : "Pegá el token temporal o permanente"} className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">Se guarda cifrado. Para producción generá un token permanente (System User) en Meta Business Suite.</p>
        </div>
        {mensaje && <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{mensaje}</p>}
        <button onClick={guardar} disabled={guardando} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Guardar
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Webhook — cargalo en Meta</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">En Meta → Instagram → Configuración → Webhook → Editar, pegá estos dos valores y suscribite a los campos <b>comments</b> y <b>messages</b>.</p>

        <div>
          <label className={labelClass}>URL de devolución de llamada (Callback URL)</label>
          <div className="flex gap-2">
            <input readOnly value={webhookUrl} className={`${inputClass} font-mono text-xs`} />
            <button onClick={() => copiar(webhookUrl, "webhook")} className="px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 shrink-0">
              {copiado === "webhook" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Verify Token</label>
          <div className="flex gap-2">
            <input readOnly value={config?.webhook_verify_token || ""} className={`${inputClass} font-mono text-xs`} />
            <button onClick={() => copiar(config?.webhook_verify_token || "", "verify")} className="px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 shrink-0">
              {copiado === "verify" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={regenerarVerify} className="text-[11px] font-semibold text-rose-600 mt-1.5">Regenerar (invalida el actual)</button>
        </div>

        <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">
          Abrir Meta for Developers <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

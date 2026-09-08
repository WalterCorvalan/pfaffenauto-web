"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Copy, Check, Loader2, ExternalLink, Brain, Plus, Trash2 } from "lucide-react";
import { supabase2 } from "@/lib/supabase2/client";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

const CATEGORIAS_MEMORIA = [
  { value: "saludo", label: "Saludo" },
  { value: "horarios_ubicacion", label: "Horarios y ubicación" },
  { value: "pagos_financiacion", label: "Formas de pago / financiación" },
  { value: "datos_empresa", label: "Datos de la empresa" },
  { value: "fuera_horario", label: "Fuera de horario (automático, sin palabras clave)" },
] as const;

interface MemoriaFila {
  id: string;
  categoria: string;
  palabras_clave: string[];
  respuesta: string;
  activo: boolean;
  orden: number;
}

function MemoriaBot() {
  const [filas, setFilas] = useState<MemoriaFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nueva, setNueva] = useState<{ categoria: string; palabras: string; respuesta: string }>({ categoria: "horarios_ubicacion", palabras: "", respuesta: "" });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase2.from("whatsapp_memoria").select("*").order("categoria").order("orden");
    setFilas(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const agregar = async () => {
    if (!nueva.respuesta.trim()) return;
    if (nueva.categoria !== "fuera_horario" && !nueva.palabras.trim()) return;
    setGuardando(true);
    const palabras_clave = nueva.palabras.split(",").map((p) => p.trim()).filter(Boolean);
    const { error } = await supabase2.from("whatsapp_memoria").insert({ categoria: nueva.categoria, palabras_clave, respuesta: nueva.respuesta.trim() });
    setGuardando(false);
    if (!error) { setNueva({ categoria: nueva.categoria, palabras: "", respuesta: "" }); cargar(); }
  };

  const toggleActivo = async (fila: MemoriaFila) => {
    setFilas((prev) => prev.map((f) => (f.id === fila.id ? { ...f, activo: !f.activo } : f)));
    await supabase2.from("whatsapp_memoria").update({ activo: !fila.activo }).eq("id", fila.id);
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar esta respuesta de memoria?")) return;
    setFilas((prev) => prev.filter((f) => f.id !== id));
    await supabase2.from("whatsapp_memoria").delete().eq("id", id);
  };

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 mt-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Memoria del bot</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Preguntas frecuentes que el bot contesta con una respuesta fija, sin gastar un llamado a la IA. Si el mensaje del cliente no matchea ninguna palabra clave de acá, recién ahí pasa a la IA. "Fuera de horario" no usa palabras clave — se manda solo cuando llega un mensaje fuera de las 8 a 22hs (una vez por día por conversación).</p>
      </div>

      {cargando ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-2">
          {filas.length === 0 && <p className="text-xs text-slate-400 italic">Sin respuestas cargadas todavía.</p>}
          {filas.map((f) => (
            <div key={f.id} className={`rounded-xl border p-3 text-xs ${f.activo ? "border-slate-200 dark:border-white/10" : "border-slate-100 dark:border-white/5 opacity-50"}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-200">{CATEGORIAS_MEMORIA.find((c) => c.value === f.categoria)?.label || f.categoria}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActivo(f)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${f.activo ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-white/5"}`}>{f.activo ? "Activo" : "Inactivo"}</button>
                  <button onClick={() => borrar(f.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {f.palabras_clave.length > 0 && (
                <p className="text-[10px] text-slate-400 mb-1">Palabras clave: {f.palabras_clave.join(", ")}</p>
              )}
              <p className="text-slate-600 dark:text-slate-300">{f.respuesta}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-2.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Agregar respuesta</p>
        <div>
          <label className={labelClass}>Categoría</label>
          <select value={nueva.categoria} onChange={(e) => setNueva((n) => ({ ...n, categoria: e.target.value }))} className={inputClass}>
            {CATEGORIAS_MEMORIA.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {nueva.categoria !== "fuera_horario" && (
          <div>
            <label className={labelClass}>Palabras clave (separadas por coma)</label>
            <input value={nueva.palabras} onChange={(e) => setNueva((n) => ({ ...n, palabras: e.target.value }))} placeholder="Ej: horario, a que hora abren, hasta que hora" className={inputClass} />
          </div>
        )}
        <div>
          <label className={labelClass}>Respuesta</label>
          <textarea value={nueva.respuesta} onChange={(e) => setNueva((n) => ({ ...n, respuesta: e.target.value }))} rows={3} className={inputClass} />
        </div>
        <button onClick={agregar} disabled={guardando} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Agregar
        </button>
      </div>
    </div>
  );
}

export default function ConfiguracionWhatsappClient() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [botNombre, setBotNombre] = useState("");
  const [copiado, setCopiado] = useState<"webhook" | "verify" | null>(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/whatsapp/configuracion");
    const data = await res.json();
    if (res.ok) {
      setConfig(data.config);
      setPhoneNumberId(data.config?.phone_number_id || "");
      setBotNombre(data.config?.bot_nombre || "");
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setGuardando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/panel-v2/whatsapp/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId, accessToken, botNombre }),
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
      const res = await fetch("/api/panel-v2/whatsapp/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId, accessToken: "", botNombre, regenerarVerifyToken: true }),
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

  const webhookUrl = config?.webhook_verify_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/panel-v2/webhooks/whatsapp/${config.webhook_verify_token}` : "";

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-5">
        <Link href="/panel-v2/configuracion" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Usuarios</Link>
        <Link href="/panel-v2/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Empresa</Link>
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-rose-600 text-rose-600">WhatsApp</span>
        <Link href="/panel-v2/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Instagram</Link>
      </div>
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1"><MessageCircle className="w-5 h-5 text-rose-600" /> Configuración — WhatsApp</h1>
      <p className="text-sm text-slate-400 mb-6">Conectá el número de WhatsApp Business de Meta para recibir los mensajes de los clientes acá (Conversaciones → WhatsApp) y que el asistente automático conteste hasta que un vendedor toma la charla.</p>

      <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${config?.listo ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
        {config?.listo ? "✅ Configurado" : "⏳ Falta completar"}
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 mb-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Credenciales de Meta</p>
        <div>
          <label className={labelClass}>Identificador del número (phone_number_id)</label>
          <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="Ej: 1194980067042611" className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">Meta → WhatsApp → Configuración de la API → "Identificador de número de teléfono".</p>
        </div>
        <div>
          <label className={labelClass}>Access Token</label>
          <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder={config?.listo ? "•••••••• (dejalo vacío para no cambiarlo)" : "Pegá el token temporal o permanente"} className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">Se guarda cifrado. El token temporal de Meta vence en 24hs — para producción generá uno permanente (System User) en Meta Business Suite.</p>
        </div>
        <div>
          <label className={labelClass}>Nombre del bot (opcional)</label>
          <input value={botNombre} onChange={(e) => setBotNombre(e.target.value)} placeholder="Sin nombre propio — responde como Pfaffen Autos" className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">No tiene relación con Rodi (el chatbot del sitio público). Este es solo el asistente que contesta acá, en WhatsApp.</p>
        </div>
        {mensaje && <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{mensaje}</p>}
        <button onClick={guardar} disabled={guardando} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5">
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Guardar
        </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Webhook — cargalo en Meta</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">En Meta → WhatsApp → Configuración → Webhook → Editar, pegá estos dos valores y suscribite al campo <b>messages</b>.</p>

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

      <MemoriaBot />
    </div>
  );
}

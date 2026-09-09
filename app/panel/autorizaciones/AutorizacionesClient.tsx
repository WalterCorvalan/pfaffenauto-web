"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { ShieldAlert, CheckCircle2, XCircle, KeyRound, Save, History, Inbox } from "lucide-react";

const RIESGO_COLOR: Record<string, string> = {
  bajo: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400",
  medio: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300",
  alto: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function fmtDiff(antes: any, despues: any) {
  if (!antes || !despues) return null;
  const claves = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)]));
  return claves.filter((k) => antes[k] !== despues[k]).map((k) => `${k}: ${antes[k]} → ${despues[k]}`).join(" · ");
}

export default function AutorizacionesClient({
  pendientesIniciales, historicoInicial, usosPinIniciales, tienePin, soyAdmin, miId,
}: { pendientesIniciales: any[]; historicoInicial: any[]; usosPinIniciales: any[]; tienePin: boolean; soyAdmin: boolean; miId: string }) {
  const [tab, setTab] = useState<"pendientes" | "historico" | "pin">("pendientes");
  const [pendientes, setPendientes] = useState(pendientesIniciales);
  const [historico, setHistorico] = useState(historicoInicial);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({});
  const [pinInput, setPinInput] = useState<Record<string, string>>({});
  const [nuevoPin, setNuevoPin] = useState("");
  const [tienePinEstado, setTienePinEstado] = useState(tienePin);
  const [guardandoPin, setGuardandoPin] = useState(false);

  const resolver = async (a: any, aprobar: boolean) => {
    setProcesando(a.id);
    try {
      const { error } = await supabase2.rpc("resolver_autorizacion", {
        p_id: a.id,
        p_aprobar: aprobar,
        p_motivo: aprobar ? null : (motivoRechazo[a.id] || null),
        p_pin: a.requiere_pin && aprobar ? (pinInput[a.id] || null) : null,
      });
      if (error) throw error;
      setPendientes((prev) => prev.filter((x) => x.id !== a.id));
      setHistorico((prev) => [{ ...a, estado: aprobar ? "aprobada" : "rechazada", resuelto_en: new Date().toISOString() }, ...prev]);
    } catch (err: any) {
      alert(err.message || "No se pudo resolver la solicitud.");
    } finally {
      setProcesando(null);
    }
  };

  const guardarPin = async () => {
    if (nuevoPin.length < 4) return alert("El PIN necesita al menos 4 caracteres.");
    setGuardandoPin(true);
    try {
      const { error } = await supabase2.rpc("fijar_autorizacion_pin", { p_pin: nuevoPin });
      if (error) throw error;
      setTienePinEstado(true);
      setNuevoPin("");
      alert("PIN guardado.");
    } catch (err: any) {
      alert(err.message || "No se pudo guardar el PIN.");
    } finally {
      setGuardandoPin(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1"><ShieldAlert className="w-5 h-5 text-rose-600" /> Autorizaciones</h1>
      <p className="text-sm text-slate-400 mb-4">Bandeja de solicitudes que requieren tu aprobación. Cada decisión queda trazada con motivo, fecha y usuario.</p>

      <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 mb-4 w-fit">
        <button onClick={() => setTab("pendientes")} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${tab === "pendientes" ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400"}`}><Inbox className="w-3.5 h-3.5" /> Pendientes</button>
        <button onClick={() => setTab("historico")} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${tab === "historico" ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400"}`}><History className="w-3.5 h-3.5" /> Histórico</button>
        {soyAdmin && (
          <button onClick={() => setTab("pin")} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${tab === "pin" ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400"}`}><KeyRound className="w-3.5 h-3.5" /> PIN de emergencia</button>
        )}
      </div>

      {tab === "pendientes" && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {pendientes.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No hay solicitudes pendientes.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {pendientes.map((a) => (
                <div key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{a.descripcion}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pedido por {a.solicitante?.nombre || "—"} · {new Date(a.created_at).toLocaleString("es-AR")}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${RIESGO_COLOR[a.riesgo]}`}>{a.riesgo}</span>
                  </div>
                  {fmtDiff(a.datos_antes, a.datos_despues) && <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg px-2.5 py-1.5 mt-2">{fmtDiff(a.datos_antes, a.datos_despues)}</p>}

                  {soyAdmin ? (
                    <div className="mt-3 space-y-2">
                      {a.requiere_pin && (
                        <input value={pinInput[a.id] || ""} onChange={(e) => setPinInput((prev) => ({ ...prev, [a.id]: e.target.value }))} placeholder="PIN de administrador" type="password" className="w-full sm:w-48 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
                      )}
                      <input value={motivoRechazo[a.id] || ""} onChange={(e) => setMotivoRechazo((prev) => ({ ...prev, [a.id]: e.target.value }))} placeholder="Motivo si rechazás (opcional)" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => resolver(a, true)} disabled={procesando === a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Aprobar</button>
                        <button onClick={() => resolver(a, false)} disabled={procesando === a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50"><XCircle className="w-3.5 h-3.5" /> Rechazar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-2">Solo el admin puede aprobar o rechazar. Si es urgente, pedile el PIN de emergencia.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "historico" && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          {historico.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Sin histórico todavía.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {historico.map((a) => (
                <div key={a.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{a.descripcion}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.solicitante?.nombre || "—"} pidió · {a.resolutor?.nombre || "—"} {a.estado === "aprobada" ? "aprobó" : "rechazó"} · {a.resuelto_en ? new Date(a.resuelto_en).toLocaleString("es-AR") : ""}</p>
                      {a.motivo_rechazo && <p className="text-[11px] text-rose-500 mt-0.5">Motivo: {a.motivo_rechazo}</p>}
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${a.estado === "aprobada" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>{a.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pin" && soyAdmin && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5"><KeyRound className="w-4 h-4" /> Cómo funciona</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-1">Un PIN que podés dictar por teléfono cuando un usuario necesita autorizar algo urgente y no estás disponible para aprobar desde el CRM. <strong>Todo uso del PIN queda registrado abajo</strong> con quién, qué acción y cuándo.</p>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${tienePinEstado ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{tienePinEstado ? "PIN configurado" : "Sin PIN configurado"}</span>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-3 mb-1">Nuevo PIN (mín 4 caracteres)</label>
            <input value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value)} placeholder="Ej: 2874" type="password" className="w-full max-w-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
            <button onClick={guardarPin} disabled={guardandoPin || nuevoPin.length < 4} className="flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"><Save className="w-4 h-4" /> Guardar PIN</button>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Uso del PIN (auditoría)</p>
            {usosPinIniciales.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Nadie usó el PIN todavía.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {usosPinIniciales.map((u) => (
                  <div key={u.id} className="px-4 py-2.5 text-xs flex items-center justify-between">
                    <span>{u.usado_por_perfil?.nombre || "—"} usó el PIN de {u.pin_de?.nombre || "—"}</span>
                    <span className="text-slate-400">{new Date(u.created_at).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

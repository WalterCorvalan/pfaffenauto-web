"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { BellRing, Save } from "lucide-react";

const ITEMS = [
  { key: "leads", icono: "🆕", label: "Leads nuevos, reasignados y sin responder", desc: "Lead nuevo, reasignado por no contactarse a tiempo, o un lead que lleva demasiadas horas sin respuesta." },
  { key: "nps", icono: "📊", label: "Encuestas NPS (nota baja)", desc: "Cuando un cliente responde la encuesta de atención con una nota baja (0-6)." },
  { key: "clientes", icono: "👤", label: "Clientes (nuevos, sin contactar, VIP)", desc: "Alta de clientes, clientes sin contactar a tiempo y VIP sin seguimiento." },
  { key: "reclamos", icono: "📣", label: "Reclamos", desc: "Asignaciones, comentarios, pedidos de atención y reclamos estancados." },
  { key: "pedidos_atencion_expedientes", icono: "📣", label: "Pedidos de atención en expedientes", desc: "Cuando un sector te pide atención en un expediente (y sus respuestas)." },
  { key: "expedientes", icono: "📁", label: "Expedientes (trámites y vencimientos)", desc: "Trámites demorados, por vencer, confirmaciones, transferencias y reventas." },
  { key: "gestoria", icono: "🏛", label: "Gestoría (vencimientos)", desc: "Gestorías vencidas o próximas a vencer." },
  { key: "consignacion", icono: "🤝", label: "Consignación", desc: "Precio/tipo pendiente de cargar y consignaciones por vencer." },
  { key: "stock", icono: "🚚", label: "Stock (preparación, parados, mandatos)", desc: "Autos nuevos, en preparación, sin movimiento, mandatos por vencer y entregas." },
  { key: "cambios_precio", icono: "💰", label: "Cambios de precio en stock", desc: "Cuando cambia el precio de un vehículo del stock." },
  { key: "ventas", icono: "🛒", label: "Ventas y operaciones", desc: "Nuevas ventas, operaciones confirmadas (totales y parciales) y reservas." },
  { key: "cotizaciones", icono: "📄", label: "Cotizaciones", desc: "Cotizaciones nuevas y respuestas de clientes." },
  { key: "pedidos_wishlist", icono: "✨", label: "Autos para un pedido (y pedidos reasignados)", desc: "Cuando entra un auto que matchea un pedido del wishlist, un pedido que se te reasigna, y pedidos sin novedad." },
  { key: "service_sla", icono: "🔧", label: "Service / posventa (SLA)", desc: "Cuando un service supera su SLA de atención." },
  { key: "taller", icono: "🔧", label: "Taller: pedidos y respuestas del cliente", desc: "Un pedido de presupuesto que entró por la web o por el bot, una cotización que pidió un vendedor, y cuando el cliente aprueba o rechaza el presupuesto desde su celular." },
  { key: "gerente_ia", icono: "🩰", label: "Alertas del Gerente IA", desc: "Alertas que detecta el Gerente IA (clientes molestos, oportunidades, riesgos)." },
  { key: "oportunidades_red", icono: "🤝", label: "Oportunidades entre agencias", desc: "Cuando un pedido matchea stock de otra agencia (tablero de oportunidades)." },
  { key: "logros", icono: "🏆", label: "Logros y performance (Top Seller)", desc: "Avisos de cercanía a Top Seller / niveles y tu resumen semanal de performance." },
  { key: "comisiones", icono: "💹", label: "Comisiones (cambios manuales)", desc: "Cambios manuales de comisión, comisiones sueltas y marcadas como pagadas." },
  { key: "finanzas", icono: "🏦", label: "Movimientos y eliminaciones de finanzas", desc: "Egresos grandes y eliminaciones de movimientos, pagos, cuotas." },
  { key: "fraude", icono: "🛡", label: "Alertas de fraude", desc: "Movimientos sospechosos detectados en operaciones." },
  { key: "suscripcion", icono: "💳", label: "Suscripción de la agencia", desc: "Vencimientos, gracia, suspensión y reactivación de la suscripción." },
];

export default function NotificacionesTab({ miId }: { miId: string }) {
  const [desactivadas, setDesactivadas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    supabase2.from("espacio_notif_prefs").select("*").eq("perfil_id", miId).maybeSingle().then(({ data }) => {
      setDesactivadas(data?.desactivadas || []);
      setCargando(false);
    });
  }, [miId]);

  const toggle = (key: string) => setDesactivadas((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const guardar = async () => {
    setGuardando(true);
    try {
      await supabase2.from("espacio_notif_prefs").upsert({ perfil_id: miId, desactivadas, updated_at: new Date().toISOString() });
    } catch { alert("No se pudo guardar."); } finally { setGuardando(false); }
  };

  if (cargando) return null;

  return (
    <div className="max-w-2xl">
      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4 mb-3">
        <p className="text-sm font-bold flex items-center gap-1.5"><BellRing className="w-4 h-4" /> Mis notificaciones</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elegí qué querés que te llegue a la campanita 🔔 y al Centro de Alertas. Lo que apagues deja de avisarte (solo a vos). Por defecto recibís todo.</p>
      </div>
      <div className="space-y-2">
        {ITEMS.map((it) => {
          const activo = !desactivadas.includes(it.key);
          return (
            <label key={it.key} className="flex items-start gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 cursor-pointer">
              <input type="checkbox" checked={activo} onChange={() => toggle(it.key)} className="w-4 h-4 mt-0.5 accent-emerald-600 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="text-sm font-semibold flex items-center gap-1.5">{it.icono} {it.label}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">{it.desc}</span>
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${activo ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>{activo ? "Activado" : "Apagado"}</span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">El resumen diario se configura aparte, en la pestaña <strong>Mi resumen</strong>.</p>
      <div className="flex justify-end mt-3">
        <button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar"}</button>
      </div>
    </div>
  );
}

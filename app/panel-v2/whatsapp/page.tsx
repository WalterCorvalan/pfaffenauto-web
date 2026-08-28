import { createClient } from "@/lib/supabase2/server";

// Placeholder — backend listo (sql_panel_v2_whatsapp_chat.sql + alertas), frontend definitivo lo hace Gemini.
export default async function WhatsappPage() {
  const supabase = await createClient();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, last_message_at, unread_count, calificacion, ai_habilitada, handoff_at, whatsapp_contactos(nombre_perfil, telefono)")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-1">WhatsApp — Bandeja</h1>
      <p className="text-xs text-slate-400 mb-4">Vista provisoria — diseño definitivo lo hace Gemini (calcado de /panel/chat de v1).</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-slate-200 dark:border-white/10">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5 text-left">
              <th className="px-3 py-2">Contacto</th>
              <th className="px-3 py-2">Calificación</th>
              <th className="px-3 py-2">IA</th>
              <th className="px-3 py-2">Sin leer</th>
              <th className="px-3 py-2">Handoff</th>
              <th className="px-3 py-2">Último mensaje</th>
            </tr>
          </thead>
          <tbody>
            {(conversaciones || []).map((c: any) => (
              <tr key={c.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-3 py-2">{c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "—"}</td>
                <td className="px-3 py-2">{c.calificacion || "—"}</td>
                <td className="px-3 py-2">{c.ai_habilitada ? "Activa" : "Pausada"}</td>
                <td className="px-3 py-2">{c.unread_count}</td>
                <td className="px-3 py-2">{c.handoff_at ? "Sí" : "No"}</td>
                <td className="px-3 py-2">{c.last_message_at ? new Date(c.last_message_at).toLocaleString("es-AR") : "—"}</td>
              </tr>
            ))}
            {(!conversaciones || conversaciones.length === 0) && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">Sin conversaciones todavía (bot v2 no está escribiendo aún).</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

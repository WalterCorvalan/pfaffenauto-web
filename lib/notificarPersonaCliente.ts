// Notificar a OTRO usuario desde un client component: RLS bloquea el insert
// directo (nadie puede escribirle una notificación a otro), así que pasa
// siempre por /api/notificaciones/persona (service role).
export async function notificarPersonaCliente(opts: {
  perfilId: string;
  tipo: string;
  mensaje: string;
  link: string;
  seccion: string;
}) {
  try {
    const res = await fetch("/api/notificaciones/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) console.error("[notificaciones] no se pudo notificar:", await res.text().catch(() => ""));
  } catch (err) {
    console.error("[notificaciones] error de red al notificar:", err);
  }
}

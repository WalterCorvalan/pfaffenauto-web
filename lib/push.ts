import webpush from "web-push";

// Notificaciones push nativas del navegador/celular (Web Push API) -- a
// diferencia del reenvío por WhatsApp (que depende de que Meta tenga el
// número bien configurado), esto usa el service worker del propio panel
// y no depende de ninguna cuenta de terceros. El usuario tiene que aceptar
// notificaciones una vez desde el dispositivo (botón en Mi Espacio →
// Notificaciones) -- eso genera una "subscription" que se guarda en
// push_subscriptions y es lo que se usa acá para mandarle el push.

let configurado = false;
function asegurarConfigurado() {
  if (configurado) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Faltan las VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  webpush.setVapidDetails("mailto:sistemas@pfaffenautos.com.ar", publicKey, privateKey);
  configurado = true;
}

export function pushConfigurado(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export type PushSubscriptionRow = { endpoint: string; p256dh: string; auth: string };

// Devuelve true si el envío fue exitoso, false si la suscripción ya no es
// válida (navegador desinstalado, permiso revocado, etc.) -- en ese caso el
// caller debe borrar la fila de push_subscriptions, no reintentar.
export async function enviarPush(sub: PushSubscriptionRow, payload: { titulo: string; mensaje?: string | null; link?: string | null }): Promise<{ ok: boolean; expirada: boolean }> {
  asegurarConfigurado();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: payload.titulo, body: payload.mensaje || "", url: payload.link || "/panel" })
    );
    return { ok: true, expirada: false };
  } catch (err: any) {
    // 404/410 = la suscripción ya no existe del lado del navegador (Gone).
    const expirada = err?.statusCode === 404 || err?.statusCode === 410;
    if (!expirada) console.error("[push] error enviando", err?.statusCode, err?.body || err);
    return { ok: false, expirada };
  }
}

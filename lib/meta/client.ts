const GRAPH_BASE_URL = process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? "v25.0";

export class MetaApiError extends Error {
  code?: number;
  isReconnectRequired: boolean;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
    this.isReconnectRequired = code === 190;
  }
}

async function graphRequest<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const url = `${GRAPH_BASE_URL}/${GRAPH_VERSION}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data?.error?.code;
    throw new MetaApiError(data?.error?.message ?? `Graph API error ${res.status}`, code);
  }
  return data as T;
}

// Meta dejó de requerir el "9" de celular argentino en el parámetro "to" al
// enviar (aunque el wa_id que llega en los mensajes ENTRANTES lo sigue
// trayendo, ej. "5493856865979") — mandarlo con el 9 puesto devuelve
// "Recipient phone number not in allowed list" (#131030) incluso con
// destinatarios habilitados. Solo se normaliza acá, en el envío: el wa_id
// guardado en whatsapp_contactos.telefono no se toca (sigue siendo la
// identidad real del contacto para matchear mensajes entrantes).
function formatearParaEnvio(to: string): string {
  return to.replace(/^549(\d{10})$/, "54$1");
}

export async function validatePhoneNumber(phoneNumberId: string, token: string) {
  return graphRequest<{ display_phone_number: string; verified_name: string; id: string }>(
    `${phoneNumberId}?fields=display_phone_number,verified_name`,
    token
  );
}

export async function sendTextMessage(phoneNumberId: string, token: string, to: string, text: string) {
  return graphRequest<{ messages: { id: string }[] }>(`${phoneNumberId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: formatearParaEnvio(to),
      type: "text",
      text: { body: text },
    }),
  });
}

export async function sendImageMessage(phoneNumberId: string, token: string, to: string, imageUrl: string, caption?: string) {
  return graphRequest<{ messages: { id: string }[] }>(`${phoneNumberId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: formatearParaEnvio(to),
      type: "image",
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    }),
  });
}

// Instagram: publicación en el feed. Dos pasos obligatorios de la Content
// Publishing API — primero se crea el contenedor con la imagen, después se
// publica ese contenedor (no se puede publicar en un solo llamado).
export async function publishInstagramPost(igUserId: string, token: string, imageUrl: string, caption: string) {
  const contenedor = await graphRequest<{ id: string }>(`${igUserId}/media`, token, {
    method: "POST",
    body: JSON.stringify({ image_url: imageUrl, caption }),
  });
  return graphRequest<{ id: string }>(`${igUserId}/media_publish`, token, {
    method: "POST",
    body: JSON.stringify({ creation_id: contenedor.id }),
  });
}

// Facebook: publicación con foto en el feed de la página (un solo llamado).
export async function publishFacebookPost(pageId: string, token: string, imageUrl: string, caption: string) {
  return graphRequest<{ id: string; post_id: string }>(`${pageId}/photos`, token, {
    method: "POST",
    body: JSON.stringify({ url: imageUrl, caption }),
  });
}

// Instagram: métricas de la cuenta (requiere permiso instagram_manage_insights
// de Meta, distinto de instagram_basic que ya se usa para publicar/mensajear).
// reach/profile_views/website_clicks son diarias; follower_count sirve como
// serie para el gráfico de crecimiento acumulado.
export async function getInstagramAccountInsights(igUserId: string, token: string, since: number, until: number) {
  return graphRequest<{
    data: { name: string; period: string; values: { value: number; end_time: string }[] }[];
  }>(
    `${igUserId}/insights?metric=reach,profile_views,follower_count&period=day&since=${since}&until=${until}`,
    token
  );
}

// Datos base de la cuenta: seguidores actuales, cantidad de publicaciones.
export async function getInstagramAccountSummary(igUserId: string, token: string) {
  return graphRequest<{ followers_count: number; media_count: number; username: string }>(
    `${igUserId}?fields=followers_count,media_count,username`,
    token
  );
}

// Publicaciones recientes con sus datos básicos (likes/comments vienen en el
// campo mismo; para reach/saved/shares hay que pedir insights por post aparte).
export async function getInstagramMedia(igUserId: string, token: string, limit = 12) {
  return graphRequest<{
    data: {
      id: string;
      caption?: string;
      media_type: string;
      media_url?: string;
      permalink: string;
      timestamp: string;
      like_count?: number;
      comments_count?: number;
    }[];
  }>(
    `${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}`,
    token
  );
}

// Insights de un post puntual — reach y engagement real (guardados/compartidos).
export async function getInstagramMediaInsights(mediaId: string, token: string) {
  return graphRequest<{ data: { name: string; values: { value: number }[] }[] }>(
    `${mediaId}/insights?metric=reach,saved,shares`,
    token
  );
}

// Instagram: respuesta privada (DM) a un comentario puntual — es el mecanismo
// "comentaste, te mando un privado" tipo ManyChat, hecho directo con la API de Meta.
export async function sendInstagramPrivateReply(commentId: string, token: string, text: string) {
  return graphRequest<{ id: string; recipient_id: string }>(`${commentId}/private_replies`, token, {
    method: "POST",
    body: JSON.stringify({ message: text }),
  });
}

// Instagram: mensaje directo de seguimiento dentro de una conversación ya abierta
// (después del primer private reply, se puede seguir charlando como un DM normal).
export async function sendInstagramMessage(igUserId: string, token: string, recipientId: string, text: string) {
  return graphRequest<{ recipient_id: string; message_id: string }>(`${igUserId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}
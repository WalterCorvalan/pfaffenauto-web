const GRAPH_BASE_URL = process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com";
// Los tokens del login nuevo de Instagram (Business Login for Instagram --
// api.instagram.com/oauth/authorize, ver Configuración → Instagram → botón
// "Conectar con Instagram") son válidos SOLO contra graph.instagram.com, no
// contra graph.facebook.com -- son namespaces de token distintos. Usarlos
// contra el endpoint equivocado da "Invalid OAuth access token - Cannot
// parse access token" (código 190) aunque el token sea válido y nuevo.
// Ver hilo del 24/9. Afecta solo a sendInstagramPrivateReply/
// sendInstagramMessage -- el resto de las funciones de Instagram de este
// archivo (publish, insights) usan el token viejo del login con Facebook.
const GRAPH_INSTAGRAM_BASE_URL = "https://graph.instagram.com";
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
  init?: RequestInit,
  baseUrl: string = GRAPH_BASE_URL
): Promise<T> {
  const url = `${baseUrl}/${GRAPH_VERSION}/${path}`;
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

// Descarga un media entrante (audio/imagen/documento) de WhatsApp. Meta
// entrega el archivo en 2 pasos: primero hay que pedir la URL temporal por
// el ID del media (dura pocos minutos), después bajarla con el mismo Bearer
// token -- sin el header, la URL de Meta devuelve 401 aunque sea la url
// "correcta". Por eso no se puede simplemente guardar la URL de Meta como
// media_url permanente: hay que bajar el archivo ahora mismo y subirlo a
// nuestro storage (R2) para que quede accesible después.
export async function descargarMediaWhatsapp(mediaId: string, token: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const info = await graphRequest<{ url: string; mime_type: string }>(mediaId, token);
  const res = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new MetaApiError(`No se pudo descargar el media (${res.status})`, res.status);
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType: info.mime_type };
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

// Plantillas de mensaje: viven en el WABA (Business Account), no en el
// phone_number_id -- por eso reciben wabaId aparte.
export async function createMessageTemplate(
  wabaId: string,
  token: string,
  input: { name: string; language: string; category: string; body: string; hasVariable: boolean }
) {
  return graphRequest<{ id?: string; status?: string }>(`${wabaId}/message_templates`, token, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      language: input.language,
      category: input.category,
      components: [
        {
          type: "BODY",
          text: input.body,
          ...(input.hasVariable ? { example: { body_text: [["ejemplo"]] } } : {}),
        },
      ],
    }),
  });
}

export async function listMessageTemplates(wabaId: string, token: string) {
  return graphRequest<{
    data: {
      id?: string; name?: string; language?: string; status?: string; rejected_reason?: string; category?: string;
      components?: { type: string; text?: string }[];
    }[];
  }>(`${wabaId}/message_templates`, token);
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  name: string,
  language: string,
  variable?: string
) {
  return graphRequest<{ messages: { id: string }[] }>(`${phoneNumberId}/messages`, token, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: formatearParaEnvio(to),
      type: "template",
      template: {
        name,
        language: { code: language },
        ...(variable
          ? { components: [{ type: "body", parameters: [{ type: "text", text: variable }] }] }
          : {}),
      },
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
  }, GRAPH_INSTAGRAM_BASE_URL);
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
  }, GRAPH_INSTAGRAM_BASE_URL);
}
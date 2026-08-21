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
      to,
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
      to,
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
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
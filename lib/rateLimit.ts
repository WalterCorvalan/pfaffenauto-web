// Rate limiter en memoria por IP. Alcanza para frenar spam/abuso de costo en un
// solo proceso (dev, o un deploy de instancia única); en serverless multi-instancia
// cada instancia tiene su propio contador, así que no es una garantía dura — pero
// corta el 99% de los bots que pegan en loop.
const intentos = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string | null,
  { limite, ventanaMs }: { limite: number; ventanaMs: number },
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const key = ip || "desconocida";
  const ahora = Date.now();
  const entry = intentos.get(key);

  if (!entry || ahora > entry.resetAt) {
    intentos.set(key, { count: 1, resetAt: ahora + ventanaMs });
    return { ok: true };
  }

  if (entry.count >= limite) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.resetAt - ahora) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export function ipDesdeRequest(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

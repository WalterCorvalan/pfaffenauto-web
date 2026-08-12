import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verificarTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY no configurada: se rechaza la solicitud.");
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { turnstileToken, ...cotizacion } = payload;

    if (!turnstileToken) {
      return Response.json({ error: "Falta verificación anti-spam." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const humano = await verificarTurnstile(turnstileToken, ip);
    if (!humano) {
      return Response.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    if (!cotizacion.marca || !cotizacion.modelo || !cotizacion.telefono || !cotizacion.nombre) {
      return Response.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    const puedeVenirSucursal = cotizacion.puede_venir_sucursal === true;

    const { data, error } = await supabase
      .from("cotizaciones")
      .insert({
        marca: cotizacion.marca,
        modelo: cotizacion.modelo,
        anio: Number(cotizacion.anio),
        version: cotizacion.version,
        kilometraje: Number(cotizacion.kilometraje),
        gnc: cotizacion.gnc ?? null,
        nombre: cotizacion.nombre,
        email: cotizacion.email,
        telefono: cotizacion.telefono,
        telefono_verificado: false,
        puede_venir_sucursal: puedeVenirSucursal,
        tipo_peritaje: puedeVenirSucursal ? "presencial" : "online",
        sucursal_preferida: cotizacion.sucursal_preferida ?? "Casa Central",
        fotos_y_videos: Array.isArray(cotizacion.fotos_y_videos) ? cotizacion.fotos_y_videos : [],
      })
      .select("id")
      .single();

    if (error) throw error;

    return Response.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[cotizaciones] error:", err);
    return Response.json({ error: "Hubo un problema al procesar tu solicitud." }, { status: 500 });
  }
}

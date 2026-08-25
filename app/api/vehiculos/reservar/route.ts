import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ReservarSchema = z.object({
  vehiculoId: z.string().uuid(),
  estado: z.enum(["Reservado", "Disponible", "Archivado", "Vendido"]),
});

// Un vendedor puede crear una seña (y con eso, reservar el auto) o hacer que
// se caiga (liberándolo) — pero RLS de "vehiculos" solo deja tocar el estado
// a admin/encargado (AccionesAuto). Sin esta ruta, el update se pierde en
// silencio: Postgrest devuelve éxito con 0 filas afectadas. Corre con service
// role, pero sigue exigiendo sesión de staff — no es un cheque en blanco.
export async function POST(req: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(req), { limite: 30, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return Response.json({ error: "Demasiadas solicitudes. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado." }, { status: 401 });

    const parsed = ReservarSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json({ error: "Faltan datos o tienen formato inválido." }, { status: 400 });
    }
    const { vehiculoId, estado } = parsed.data;

    // Archivar/desarchivar es decisión manual de inventario (no la dispara
    // ninguna otra pantalla), a diferencia de Reservado/Disponible que vienen
    // de Señas — por eso acá sí exigimos rol admin/encargado.
    if (estado === "Archivado") {
      const { data: perfil } = await supabaseAuth.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
      if (perfil?.rol !== "admin" && perfil?.rol !== "encargado") {
        return Response.json({ error: "No tenés permiso para archivar vehículos." }, { status: 403 });
      }
    }

    // No pisar un auto ya Vendido (ej. la seña se marca Perdida tarde, después
    // de que el auto se vendió por otra vía).
    const { data, error } = await supabase
      .from("vehiculos")
      .update({ estado })
      .eq("id", vehiculoId)
      .neq("estado", "Vendido")
      .select("id");

    if (error) throw error;

    return Response.json({ ok: true, actualizado: (data?.length || 0) > 0 });
  } catch (err) {
    registrarError("api/vehiculos/reservar", err);
    return Response.json({ error: "Error al actualizar el auto." }, { status: 500 });
  }
}

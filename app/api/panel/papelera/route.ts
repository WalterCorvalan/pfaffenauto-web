import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Papelera: borrado lógico de ventas/expedientes/clientes/taller_ordenes.
// Solo admin -- ver app/panel/papelera/ARCHITECTURE.md para el criterio de
// cascada (venta <-> expediente son 1:1, se borran/restauran juntos, y se
// revierte vehiculos.estado vendido<->disponible).

const TIPOS = ["ventas", "expedientes", "clientes", "taller_ordenes"] as const;
type Tipo = (typeof TIPOS)[number];

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.includes("admin")) {
    return { error: NextResponse.json({ error: "Solo administradores." }, { status: 403 }) };
  }
  return { user };
}

function admin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

const CAMPOS: Record<Tipo, string> = {
  ventas: "id, comprador_nombre, vehiculo_marca, vehiculo_modelo, vehiculo_anio, vehiculo_patente, precio_venta, moneda_venta, fecha_cierre, vehiculo_id, deleted_at, deleted_by, motivo_eliminacion",
  expedientes: "id, titulo, venta_id, tipo, created_at, deleted_at, deleted_by, motivo_eliminacion",
  clientes: "id, nombre, apellido, dni_cuit, telefono, deleted_at, deleted_by, motivo_eliminacion",
  taller_ordenes: "id, cliente_nombre, marca, modelo, patente, deleted_at, deleted_by, motivo_eliminacion",
};

export async function GET(request: Request) {
  const { error } = await verificarAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") as Tipo | null;
  const sb = admin();

  if (tipo) {
    if (!TIPOS.includes(tipo)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    const { data, error: qError } = await sb.from(tipo).select(CAMPOS[tipo]).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (qError) return NextResponse.json({ error: qError.message }, { status: 400 });
    const items = (data || []) as unknown as Array<{ deleted_by: string | null }>;
    const idsDeletedBy = [...new Set(items.map((i) => i.deleted_by).filter(Boolean))] as string[];
    const { data: perfiles } = idsDeletedBy.length ? await sb.from("perfiles").select("id, nombre").in("id", idsDeletedBy) : { data: [] as { id: string; nombre: string }[] };
    const nombrePorId = Object.fromEntries((perfiles || []).map((p) => [p.id, p.nombre]));
    return NextResponse.json({ items: items.map((i) => ({ ...i, deleted_by_nombre: i.deleted_by ? nombrePorId[i.deleted_by] || "—" : null })) });
  }

  // Sin tipo -- solo los conteos, para los chips de arriba.
  const conteos: Record<string, number> = {};
  for (const t of TIPOS) {
    const { count } = await sb.from(t).select("id", { count: "exact", head: true }).not("deleted_at", "is", null);
    conteos[t] = count || 0;
  }
  return NextResponse.json({ conteos });
}

const BodySchema = z.object({
  accion: z.enum(["eliminar", "restaurar", "eliminar_definitivo"]),
  tipo: z.enum(TIPOS),
  id: z.string().uuid(),
  motivo: z.string().optional(),
});

export async function POST(request: Request) {
  const { error, user } = await verificarAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { accion, tipo, id, motivo } = parsed.data;
  const sb = admin();

  // ventas <-> expedientes son 1:1 (expedientes.venta_id es unique) -- se
  // borran/restauran siempre juntos, sea cual sea el que el admin haya
  // tocado, porque un expediente sin su venta (o viceversa) no tiene
  // sentido de negocio. Ver ARCHITECTURE.md.
  async function parEncontrado(): Promise<{ ventaId: string | null; expedienteId: string | null; vehiculoId: string | null; ventaEraCerrada: boolean }> {
    if (tipo === "ventas") {
      const { data: venta } = await sb.from("ventas").select("id, vehiculo_id, estado").eq("id", id).maybeSingle();
      const { data: exp } = await sb.from("expedientes").select("id").eq("venta_id", id).maybeSingle();
      return { ventaId: venta?.id || null, expedienteId: exp?.id || null, vehiculoId: venta?.vehiculo_id || null, ventaEraCerrada: venta?.estado === "cerrada" };
    }
    if (tipo === "expedientes") {
      const { data: exp } = await sb.from("expedientes").select("id, venta_id").eq("id", id).maybeSingle();
      const { data: venta } = exp?.venta_id ? await sb.from("ventas").select("id, vehiculo_id, estado").eq("id", exp.venta_id).maybeSingle() : { data: null };
      return { ventaId: venta?.id || null, expedienteId: exp?.id || null, vehiculoId: venta?.vehiculo_id || null, ventaEraCerrada: venta?.estado === "cerrada" };
    }
    return { ventaId: null, expedienteId: null, vehiculoId: null, ventaEraCerrada: false };
  }

  // Una venta con comisiones ya COBRADAS (plata real ya pagada) que se manda
  // a Papelera dejaba esas comisiones huérfanas -- la RLS de ventas filtra
  // deleted_at is null, así que la comisión seguía apareciendo en el
  // listado con venta null, sin ningún aviso de que la plata pagada ya no
  // corresponde a ninguna venta viva. Ver auditoría del 23/9. Se bloquea
  // el borrado (lógico y definitivo) en vez de revertir la comisión sola
  // -- esa decisión (¿se le reclama al vendedor? ¿queda como estaba?) es
  // del dueño del negocio, no algo para resolver en silencio acá.
  async function tieneComisionesCobradas(ventaId: string | null): Promise<boolean> {
    if (!ventaId) return false;
    const { count } = await sb.from("comisiones").select("id", { count: "exact", head: true }).eq("venta_id", ventaId).eq("estado", "cobrada");
    return (count || 0) > 0;
  }

  if (accion === "eliminar") {
    const patch = { deleted_at: new Date().toISOString(), deleted_by: user!.id, motivo_eliminacion: motivo?.trim() || null };
    if (tipo === "ventas" || tipo === "expedientes") {
      const { ventaId, expedienteId, vehiculoId } = await parEncontrado();
      if (await tieneComisionesCobradas(ventaId)) {
        return NextResponse.json({ error: "Esta venta tiene comisiones ya cobradas (plata pagada). No se puede eliminar sin resolver esas comisiones primero." }, { status: 409 });
      }
      if (ventaId) await sb.from("ventas").update(patch).eq("id", ventaId);
      if (expedienteId) await sb.from("expedientes").update(patch).eq("id", expedienteId);
      if (vehiculoId) {
        const { data: vehiculo } = await sb.from("vehiculos").select("estado").eq("id", vehiculoId).maybeSingle();
        if (vehiculo?.estado === "vendido") await sb.from("vehiculos").update({ estado: "disponible" }).eq("id", vehiculoId);
      }
      // Mismo criterio que "cancelar" una venta desde VentaDetalleModal.tsx
      // (revertirVinculosCancelacion) -- mandar a Papelera es otro camino de
      // "esta venta ya no va", con los mismos efectos secundarios que
      // resolver: si no, las cuotas sin cobrar seguían activas (Cobros y el
      // cron le siguen reclamando al cliente sobre una venta que ya no
      // existe) y la seña vinculada quedaba "Convertida" para siempre sin
      // ninguna venta viva a la que apuntar.
      if (ventaId) {
        await sb.from("cuotas_cobrar_clientes").delete().eq("venta_id", ventaId).eq("cobrada", false);
        const { data: senasVinculadas } = await sb.from("venta_senas").select("sena_origen_id").eq("venta_id", ventaId).not("sena_origen_id", "is", null);
        const idsSenas = (senasVinculadas || []).map((s) => s.sena_origen_id).filter(Boolean) as string[];
        if (idsSenas.length > 0) {
          await sb.from("senas").update({ estado: "Activa", etapa_seguimiento: "Activa" }).in("id", idsSenas).eq("estado", "Convertida");
        }
      }
    } else {
      const { error: upError } = await sb.from(tipo).update(patch).eq("id", id);
      if (upError) return NextResponse.json({ error: upError.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (accion === "restaurar") {
    const patch = { deleted_at: null, deleted_by: null, motivo_eliminacion: null };
    if (tipo === "ventas" || tipo === "expedientes") {
      // Simétrico a "eliminar": ahí solo se revierte a disponible si estaba
      // vendido (la venta la había puesto así); acá solo se vuelve a poner
      // vendido si la venta restaurada es la que originalmente lo vendió
      // (mismo criterio que NuevaVentaModal.tsx al crearla: vehiculoId &&
      // estado === "cerrada"). Antes esto era incondicional -- restaurar una
      // venta que nunca llegó a "cerrada" (el vehículo nunca pasó a vendido)
      // igual forzaba el vehículo a "vendido", pisando su estado real.
      const { ventaId, expedienteId, vehiculoId, ventaEraCerrada } = await parEncontrado();
      if (ventaId) await sb.from("ventas").update(patch).eq("id", ventaId);
      if (expedienteId) await sb.from("expedientes").update(patch).eq("id", expedienteId);
      if (vehiculoId && ventaEraCerrada) await sb.from("vehiculos").update({ estado: "vendido" }).eq("id", vehiculoId);
    } else {
      const { error: upError } = await sb.from(tipo).update(patch).eq("id", id);
      if (upError) return NextResponse.json({ error: upError.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  // eliminar_definitivo: el hard delete real, irreversible. La feature
  // original lo reserva a un "super-admin" que no existe como rol en este
  // codebase (solo hay "admin") -- se restringe a admin, igual que ya
  // restringían las políticas borrar_ventas/borrar_expedientes/etc.
  if (tipo === "ventas" || tipo === "expedientes") {
    const { ventaId, expedienteId } = await parEncontrado();
    if (await tieneComisionesCobradas(ventaId)) {
      return NextResponse.json({ error: "Esta venta tiene comisiones ya cobradas (plata pagada). No se puede eliminar sin resolver esas comisiones primero." }, { status: 409 });
    }
    if (expedienteId) await sb.from("expedientes").delete().eq("id", expedienteId);
    if (ventaId) await sb.from("ventas").delete().eq("id", ventaId);
  } else {
    const { error: delError } = await sb.from(tipo).delete().eq("id", id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

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
  async function parEncontrado(): Promise<{ ventaId: string | null; expedienteId: string | null; vehiculoId: string | null }> {
    if (tipo === "ventas") {
      const { data: venta } = await sb.from("ventas").select("id, vehiculo_id").eq("id", id).maybeSingle();
      const { data: exp } = await sb.from("expedientes").select("id").eq("venta_id", id).maybeSingle();
      return { ventaId: venta?.id || null, expedienteId: exp?.id || null, vehiculoId: venta?.vehiculo_id || null };
    }
    if (tipo === "expedientes") {
      const { data: exp } = await sb.from("expedientes").select("id, venta_id").eq("id", id).maybeSingle();
      const { data: venta } = exp?.venta_id ? await sb.from("ventas").select("id, vehiculo_id").eq("id", exp.venta_id).maybeSingle() : { data: null };
      return { ventaId: venta?.id || null, expedienteId: exp?.id || null, vehiculoId: venta?.vehiculo_id || null };
    }
    return { ventaId: null, expedienteId: null, vehiculoId: null };
  }

  if (accion === "eliminar") {
    const patch = { deleted_at: new Date().toISOString(), deleted_by: user!.id, motivo_eliminacion: motivo?.trim() || null };
    if (tipo === "ventas" || tipo === "expedientes") {
      const { ventaId, expedienteId, vehiculoId } = await parEncontrado();
      if (ventaId) await sb.from("ventas").update(patch).eq("id", ventaId);
      if (expedienteId) await sb.from("expedientes").update(patch).eq("id", expedienteId);
      if (vehiculoId) {
        const { data: vehiculo } = await sb.from("vehiculos").select("estado").eq("id", vehiculoId).maybeSingle();
        if (vehiculo?.estado === "vendido") await sb.from("vehiculos").update({ estado: "disponible" }).eq("id", vehiculoId);
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
      const { ventaId, expedienteId, vehiculoId } = await parEncontrado();
      if (ventaId) await sb.from("ventas").update(patch).eq("id", ventaId);
      if (expedienteId) await sb.from("expedientes").update(patch).eq("id", expedienteId);
      if (vehiculoId) await sb.from("vehiculos").update({ estado: "vendido" }).eq("id", vehiculoId);
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
    if (expedienteId) await sb.from("expedientes").delete().eq("id", expedienteId);
    if (ventaId) await sb.from("ventas").delete().eq("id", ventaId);
  } else {
    const { error: delError } = await sb.from(tipo).delete().eq("id", id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

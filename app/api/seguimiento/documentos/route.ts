import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subirArchivoR2 } from "@/lib/storage/r2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { validarYObtenerMimeReal } from "@/lib/validarArchivo";
import { crearAlerta } from "@/lib/panel/alertas";

// Subida pública de documentación (foto/PDF del vehículo que el cliente
// entrega, DNI, cédula verde) desde /seguimiento/[codigo] -- sin sesión de
// panel, por eso no reusa /api/panel/upload (que exige auth). El código de
// seguimiento tiene que resolver a una seña o venta real antes de aceptar
// nada; si no, 404 sin dar pistas de qué códigos existen.

const MAX_MB = 15;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

async function resolverCodigo(codigo: string) {
  const { data: venta } = await supabase.from("ventas").select("id, vendedor_id, marca:vehiculo_marca, modelo:vehiculo_modelo").eq("codigo_seguimiento", codigo).maybeSingle();
  if (venta) return { ventaId: venta.id as string, senaId: null as string | null, vendedorId: venta.vendedor_id as string | null, auto: `${venta.marca || ""} ${venta.modelo || ""}`.trim() };
  const { data: sena } = await supabase.from("senas").select("id, vendedor_id, marca, modelo").eq("codigo_seguimiento", codigo).maybeSingle();
  if (sena) return { ventaId: null as string | null, senaId: sena.id as string, vendedorId: sena.vendedor_id as string | null, auto: `${sena.marca || ""} ${sena.modelo || ""}`.trim() };
  return null;
}

export async function GET(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 30, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiados intentos. Esperá un momento." }, { status: 429 });

  const codigo = new URL(request.url).searchParams.get("codigo")?.trim().toUpperCase();
  if (!codigo) return NextResponse.json({ error: "Falta el código." }, { status: 400 });

  const resuelto = await resolverCodigo(codigo);
  if (!resuelto) return NextResponse.json({ error: "Código no encontrado." }, { status: 404 });

  const query = resuelto.ventaId
    ? supabase.from("documentos_cliente").select("id, nombre, url, created_at").eq("venta_id", resuelto.ventaId)
    : supabase.from("documentos_cliente").select("id, nombre, url, created_at").eq("sena_id", resuelto.senaId);
  const { data } = await query.order("created_at", { ascending: false });

  return NextResponse.json({ documentos: data || [] });
}

export async function POST(request: Request) {
  try {
    const limite = await rateLimit(ipDesdeRequest(request), { limite: 15, ventanaMs: 60 * 1000, proyecto: "v2" });
    if (!limite.ok) return NextResponse.json({ error: "Demasiadas subidas. Esperá un momento." }, { status: 429 });

    const formData = await request.formData();
    const codigo = (formData.get("codigo") as string)?.trim().toUpperCase();
    const file = formData.get("file") as File;
    if (!codigo) return NextResponse.json({ error: "Falta el código." }, { status: 400 });
    if (!file) return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `El archivo pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });

    const resuelto = await resolverCodigo(codigo);
    if (!resuelto) return NextResponse.json({ error: "Código no encontrado." }, { status: 404 });

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const mimeReal = validarYObtenerMimeReal(buffer, ["imagen", "pdf"]);
    if (!mimeReal) return NextResponse.json({ error: "Solo se permiten imágenes o PDF." }, { status: 400 });

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;
    const publicUrl = await subirArchivoR2(buffer, `documentos-cliente/${uniqueFileName}`, mimeReal);

    const { error } = await supabase.from("documentos_cliente").insert({
      codigo_seguimiento: codigo, venta_id: resuelto.ventaId, sena_id: resuelto.senaId, nombre: file.name, url: publicUrl,
    });
    if (error) throw error;

    if (resuelto.vendedorId) {
      await crearAlerta(supabase, resuelto.vendedorId, `El cliente subió documentación${resuelto.auto ? ` de su ${resuelto.auto}` : ""}`, {
        mensaje: file.name, link: resuelto.ventaId ? "/panel/ventas" : "/panel/senas", tipo: "documento_cliente_subido", prioridad: "media",
      });
    }

    return NextResponse.json({ publicUrl, nombre: file.name });
  } catch (error) {
    registrarError("api/seguimiento/documentos", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}

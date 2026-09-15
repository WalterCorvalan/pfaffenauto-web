import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";
import { normalizarMarca } from "@/lib/vehiculos";
import { registrarError } from "@/lib/panel/logger";

// Matchea pedidos activos sin vehiculo_match_id contra el stock disponible
// -- antes vehiculo_match_id/match_detectado_at solo los seteaba un
// vendedor a mano (asignarMatchManual en PedidosClient.tsx), sin nada que
// avisara solo cuando entraba algo. Corre por pg_cron (ver
// migraciones/sql_cron_pedidos_match.sql).
//
// Cubre tanto los pedidos "prolijos" (NuevoPedidoModal.tsx, marca+modelo
// separados) como los que entran desde BuscadorFallBack.tsx en el catálogo
// público (marca = el texto libre que buscó el visitante, ej. "Toyota
// Hilux 2020") -- para estos últimos el match es best-effort por substring,
// puede no encontrar nada si el texto no menciona una marca real, pero
// nunca genera un falso positivo peligroso (si no matchea, no hace nada).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function vehiculoCumplePedido(pedido: { marca: string; modelo: string | null; anio_desde: number | null; anio_hasta: number | null; presupuesto_max: number | null; moneda: string | null }, vehiculo: { marca: string; modelo: string; anio: number; precio_venta: number; moneda_venta: string }): boolean {
  const haystack = normalizarMarca(`${vehiculo.marca} ${vehiculo.modelo}`);
  if (!haystack.includes(normalizarMarca(pedido.marca))) return false;
  if (pedido.modelo && !normalizarMarca(vehiculo.modelo).includes(normalizarMarca(pedido.modelo))) return false;
  if (pedido.anio_desde && vehiculo.anio < pedido.anio_desde) return false;
  if (pedido.anio_hasta && vehiculo.anio > pedido.anio_hasta) return false;
  // Sin cotización disponible acá para convertir entre monedas (mismo
  // criterio que lib/moneda.ts: sin cotización no se inventa una
  // equivalencia) -- si las monedas no coinciden, no se filtra por precio
  // en vez de descartar el match a ciegas.
  if (pedido.presupuesto_max && pedido.moneda === vehiculo.moneda_venta && vehiculo.precio_venta > pedido.presupuesto_max) return false;
  return true;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [{ data: pedidos }, { data: vehiculos }] = await Promise.all([
      supabase.from("pedidos").select("id, marca, modelo, anio_desde, anio_hasta, presupuesto_max, moneda, vendedor_id, nombre_cliente, telefono")
        .eq("estado", "activo").is("vehiculo_match_id", null).eq("gestion_finalizada", false),
      supabase.from("vehiculos").select("id, marca, modelo, anio, precio_venta, moneda_venta").eq("estado", "disponible").order("created_at", { ascending: true }),
    ]);
    if (!pedidos?.length || !vehiculos?.length) return Response.json({ matches: 0 });

    let matches = 0;
    for (const pedido of pedidos) {
      const vehiculo = vehiculos.find((v) => vehiculoCumplePedido(pedido, v));
      if (!vehiculo) continue;

      await supabase.from("pedidos").update({ vehiculo_match_id: vehiculo.id, match_detectado_at: new Date().toISOString() }).eq("id", pedido.id);
      matches++;

      const mensaje = `${pedido.nombre_cliente} buscaba ${pedido.marca}${pedido.modelo ? ` ${pedido.modelo}` : ""} — entró un ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} que matchea. Contactalo${pedido.telefono ? ` al ${pedido.telefono}` : ""}.`;

      if (pedido.vendedor_id) {
        await crearAlerta(supabase, pedido.vendedor_id, "Pedido con match nuevo", {
          mensaje, link: "/panel/pedidos", tipo: "pedido_match", prioridad: "alta", modulo: "pedidos", categoriaNotif: "pedidos_wishlist",
        });
      } else {
        // Sin vendedor asignado -- mismo criterio que
        // notificarVendedoresDisponibles() en lib/panel/notificaciones.ts
        // (admin/encargado/ventas activos, respetando disponibilidad_vendedor),
        // pero categoriaNotif es "pedidos_wishlist" acá, no "leads" -- esa
        // función no expone el override, así que se repite el loop en vez
        // de tocarla y afectar a sus otros llamados.
        const hoy = new Date().toISOString().slice(0, 10);
        const { data: disponibilidad } = await supabase.from("disponibilidad_vendedor").select("vendedor_id, recibir_leads, hasta");
        const noDisponibles = new Set((disponibilidad || []).filter((d) => d.recibir_leads === false && (!d.hasta || d.hasta >= hoy)).map((d) => d.vendedor_id));
        const { data: candidatos } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{ventas}").eq("activo", true);
        for (const c of candidatos || []) {
          if (noDisponibles.has(c.id)) continue;
          await crearAlerta(supabase, c.id, "Pedido sin asignar con match nuevo", {
            mensaje, link: "/panel/pedidos", tipo: "pedido_match", prioridad: "alta", modulo: "pedidos", categoriaNotif: "pedidos_wishlist",
          });
        }
      }
    }

    return Response.json({ matches });
  } catch (err) {
    registrarError("cron/pedidos-match", err);
    return new Response("Error", { status: 500 });
  }
}

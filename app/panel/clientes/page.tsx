import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: miPerfil }, { data: config }] = await Promise.all([
    supabase.from("perfiles").select("roles").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("configuracion_empresa").select("cada_vendedor_ve_solo_sus_clientes").eq("id", true).maybeSingle(),
  ]);
  // Encargado, gestoría y finanzas no son "un vendedor más" -- necesitan
  // ver la cartera completa igual que admin (bug real con encargado:
  // quedaba tratado como vendedor común y, con el toggle de abajo
  // prendido, se le filtraba por vendedor_id = su propio id, así que la
  // lista le quedaba vacía). Gestoría lo necesita para gestionar trámites
  // de cualquier cliente, no solo los de "su" vendedor. Finanzas lo
  // necesita para cobranzas/facturación de toda la cartera, no solo la de
  // un vendedor puntual (mismo bug: sin vendedor_id propio asignado, la
  // lista le quedaba vacía con el toggle prendido).
  const esAdminOGestion = miPerfil?.roles?.some((r: string) => ["admin", "encargado", "gestoria", "finanzas"].includes(r)) || false;
  // Configuración → Empresa → "Cada vendedor ve solo sus clientes": con el
  // toggle prendido, un vendedor (no admin/encargado/gestoría) solo ve los
  // clientes que tiene asignados -- ni los de otros vendedores ni los sin
  // asignar (ver el aviso exacto en EmpresaClient.tsx). El toggle se
  // guardaba desde que se creó Configuración → Empresa pero nada lo leía
  // todavía.
  const restringirAMisClientes = !!config?.cada_vendedor_ve_solo_sus_clientes && !esAdminOGestion;

  const [clientes, { data: perfiles }, { data: disponibilidad }, { data: ventas }] = await Promise.all([
    // PostgREST corta en 1000 filas cualquier select sin importar el
    // .limit() pedido -- con la base real ya arriba de los 1000 clientes,
    // el fetch simple de antes (.limit(5000)) perdía todo lo que caía
    // después del corte. fetchPaginado() pagina con .range() hasta agotar
    // la tabla. El toggle restringe leads (todavía no compraron), no
    // clientes reales -- un vendedor siempre puede ver la cartera completa
    // de gente que ya compró, aunque el lead que la originó no haya sido
    // suyo.
    fetchPaginado(() => {
      let q = supabase.from("clientes").select("*").order("created_at", { ascending: false });
      if (restringirAMisClientes) q = q.or(`vendedor_id.eq.${user?.id ?? ""},estado_relacion.eq.cliente`);
      return q;
    }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("disponibilidad_vendedor").select("*"),
    // Sin filtrar por cliente_id -- Ranking también rescata ventas por DNI
    // del comprador cuando no quedaron vinculadas a una ficha de cliente.
    supabase.from("ventas").select("id, cliente_id, comprador_dni, estado, precio_venta, moneda_venta, created_at").limit(10000),
  ]);

  return (
    <ClientesClient
      clientesIniciales={clientes || []}
      perfiles={perfiles || []}
      disponibilidadInicial={disponibilidad || []}
      ventas={ventas || []}
      miId={user?.id || ""}
    />
  );
}

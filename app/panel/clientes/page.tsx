import { createClient } from "@/lib/supabase/server";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: miPerfil }, { data: config }] = await Promise.all([
    supabase.from("perfiles").select("roles").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("configuracion_empresa").select("cada_vendedor_ve_solo_sus_clientes").eq("id", true).maybeSingle(),
  ]);
  // El encargado no es "un vendedor más" -- necesita ver la cartera
  // completa igual que admin/recepción (bug real: quedaba tratado como
  // vendedor común y, con el toggle de abajo prendido, se le filtraba por
  // vendedor_id = su propio id, así que la lista le quedaba vacía).
  const esAdminRecepcionOEncargado = miPerfil?.roles?.some((r: string) => ["admin", "recepcion", "encargado"].includes(r)) || false;
  // Configuración → Empresa → "Cada vendedor ve solo sus clientes": con el
  // toggle prendido, un vendedor (no admin/recepción/encargado) solo ve los
  // clientes que tiene asignados -- ni los de otros vendedores ni los sin
  // asignar (ver el aviso exacto en EmpresaClient.tsx). El toggle se
  // guardaba desde que se creó Configuración → Empresa pero nada lo leía
  // todavía.
  const restringirAMisClientes = !!config?.cada_vendedor_ve_solo_sus_clientes && !esAdminRecepcionOEncargado;

  let queryClientes = supabase.from("clientes").select("*").order("created_at", { ascending: false }).limit(5000);
  // El toggle restringe leads (todavía no compraron), no clientes reales --
  // un vendedor siempre puede ver la cartera completa de gente que ya
  // compró, aunque el lead que la originó no haya sido suyo.
  if (restringirAMisClientes) queryClientes = queryClientes.or(`vendedor_id.eq.${user?.id ?? ""},estado_relacion.eq.cliente`);

  const [{ data: clientes }, { data: perfiles }, { data: disponibilidad }, { data: ventas }] = await Promise.all([
    // Sin límite esto traía TODA la base de clientes de toda la historia --
    // 5000 da margen de sobra hoy y evita que la query quede sin techo.
    queryClientes,
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

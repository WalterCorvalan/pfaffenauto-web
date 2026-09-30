import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import RecontactosClient from "./RecontactosClient";

export const metadata = { title: "Recontactos | Pfaffen Cars" };

export default async function RecontactosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    clientes,
    { data: perfiles },
    { data: config },
    { data: ventasCerradas },
    { data: recontactos },
  ] = await Promise.all([
    // PostgREST corta en 1000 filas sin importar si no se pide .limit() --
    // con la base real ya arriba de los 1000 clientes, el universo elegible
    // para recontactar perdía en silencio (sin orden determinístico) todo
    // lo que caía después del corte. fetchPaginado() trae la tabla entera.
    fetchPaginado(() =>
      supabase
        .from("clientes")
        .select("id, nombre, telefono, vehiculo_interes_texto, busca_marca, busca_modelo, segmento, no_contactar, ultimo_contacto, vendedor_id, created_at")
        .eq("no_contactar", false)
        .order("created_at", { ascending: true })
    ),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("configuracion_empresa").select("*").eq("id", true).maybeSingle(),
    supabase.from("ventas").select("cliente_id").eq("estado", "cerrada").not("cliente_id", "is", null),
    supabase
      .from("recontactos")
      .select("*, cliente:cliente_id ( nombre, telefono ), vendedor:vendedor_id ( nombre )")
      .order("enviado_en", { ascending: false })
      .limit(500),
  ]);

  return (
    <RecontactosClient
      clientesIniciales={clientes || []}
      perfiles={perfiles || []}
      config={config}
      idsCompraron={(ventasCerradas || []).map((v: any) => v.cliente_id)}
      recontactosIniciales={(recontactos || []) as any}
      miId={user?.id || ""}
    />
  );
}

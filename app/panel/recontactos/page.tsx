import { createClient } from "@/lib/supabase2/server";
import RecontactosClient from "./RecontactosClient";

export const metadata = { title: "Recontactos | Pfaffen Autos" };

export default async function RecontactosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: clientes },
    { data: perfiles },
    { data: config },
    { data: ventasCerradas },
    { data: recontactos },
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, vehiculo_interes_texto, busca_marca, busca_modelo, segmento, no_contactar, ultimo_contacto, vendedor_id, created_at")
      .eq("no_contactar", false)
      .order("created_at", { ascending: true }),
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

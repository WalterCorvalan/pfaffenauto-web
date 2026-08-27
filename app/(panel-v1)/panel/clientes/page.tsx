import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: clientes }, { data: senas }, { data: boletos }, { data: cotizaciones }] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nombre, apellido, dni, telefono_celular, correo_electronico, localidad, created_at, estado_contacto, ultimo_contacto, sucursales ( nombre )"
      )
      .order("created_at", { ascending: false }),
    supabase.from("senas").select("cliente_id"),
    supabase.from("boletos_venta").select("cliente_id"),
    supabase.from("cotizaciones").select("telefono"),
  ]);

  // Ops. = señas + boletos por cliente_id (FK real) + cotizaciones por teléfono
  // (esa tabla no tiene cliente_id, es standalone) — se repite antes que faltar.
  const opsPorCliente = new Map<string, number>();
  const sumar = (id: string | null | undefined) => {
    if (!id) return;
    opsPorCliente.set(id, (opsPorCliente.get(id) || 0) + 1);
  };
  (senas || []).forEach((s) => sumar(s.cliente_id));
  (boletos || []).forEach((b) => sumar(b.cliente_id));

  const telefonosCotizados = new Map<string, number>();
  (cotizaciones || []).forEach((c) => {
    const tel = (c.telefono || "").replace(/\D/g, "");
    if (!tel) return;
    telefonosCotizados.set(tel, (telefonosCotizados.get(tel) || 0) + 1);
  });

  const clientesConOps = (clientes || []).map((c) => {
    const telCliente = (c.telefono_celular || "").replace(/\D/g, "");
    const opsCotizaciones = telCliente ? telefonosCotizados.get(telCliente) || 0 : 0;
    return { ...c, ops: (opsPorCliente.get(c.id) || 0) + opsCotizaciones };
  });

  return <ClientesClient clientesIniciales={clientesConOps} />;
}

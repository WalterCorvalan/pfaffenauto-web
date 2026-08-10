import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import KanbanBoard from "./KanbanBoard";

export default async function CRMPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: conversacionesWa } = await supabase
    .from("whatsapp_conversaciones")
    .select(`
      id, estado_pipeline, created_at, calificacion,
      whatsapp_contactos ( nombre_perfil, telefono )
    `)
    .order("created_at", { ascending: false });

  const leadsWa = (conversacionesWa || []).map((c: any) => ({
    id: c.id,
    origen: "whatsapp",
    nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Consulta WhatsApp",
    telefono: c.whatsapp_contactos?.telefono || "",
    marca: "",
    modelo: "Consulta por WhatsApp",
    tipo_peritaje: "whatsapp",
    precio_sugerido: null,
    estado: c.estado_pipeline || "Nuevo",
    created_at: c.created_at,
  }));

  const leadsCotizaciones = (cotizaciones || []).map((c: any) => ({ ...c, origen: "cotizacion" }));

  const leadsUnificados = [...leadsCotizaciones, ...leadsWa];

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <KanbanBoard leadsIniciales={leadsUnificados} />
    </div>
  );
}
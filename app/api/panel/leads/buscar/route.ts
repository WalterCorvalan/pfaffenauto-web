import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { buscarLeadsPorTexto } from "@/lib/panel/buscarLeads";

// Pasa por service-role a propósito: buscarLeadsPorTexto la usaba ClienteBuscador.tsx
// directo desde el browser con el cliente normal (sujeto a RLS), y dejó de
// devolver nada para cualquiera que no sea admin apenas se sumó la RLS de
// "cada vendedor ve solo sus leads asignados" (feat(leads): visibilidad por
// vendedor) -- un vendedor armando una venta/seña/presupuesto tiene que poder
// encontrar un lead de OTRO vendedor igual (no es "su" lead todavía, está
// convirtiéndolo recién). Esta ruta solo expone nombre/teléfono/origen/id,
// nada sensible, así que evitar la RLS acá es seguro.
function admin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const leads = await buscarLeadsPorTexto(admin(), q);
  return NextResponse.json({ leads });
}

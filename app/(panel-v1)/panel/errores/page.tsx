import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ErroresClient from "./ErroresClient";

export default async function ErroresPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: errores } = await supabase
    .from("logs_errores")
    .select("id, origen, mensaje, detalle, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return <ErroresClient errores={(errores || []) as any} />;
}

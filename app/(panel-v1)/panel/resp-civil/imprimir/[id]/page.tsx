import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirRespCivil from "./ImprimirRespCivil";

export default async function ImprimirRespCivilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: registro } = await supabase
    .from("resp_civil")
    .select("*, perfiles ( nombre )")
    .eq("id", id)
    .maybeSingle();

  if (!registro) notFound();

  return <ImprimirRespCivil registro={registro} />;
}

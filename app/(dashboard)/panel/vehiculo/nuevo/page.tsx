import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VehiculoForm from "../VehiculoForm";
import { tienePermiso } from "@/lib/permisos";

export default async function NuevoAutoPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  if (!(await tienePermiso(supabase, "vehiculos.crear"))) {
    redirect("/panel");
  }

  return <VehiculoForm modo="crear" />;
}

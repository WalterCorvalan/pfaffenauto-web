import { createClient } from "@/lib/supabase/server";
import PapeleraClient from "./PapeleraClient";

export const metadata = { title: "Papelera | Pfaffen Cars" };

export default async function PapeleraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user?.id ?? "").maybeSingle();
  const esAdmin = miPerfil?.roles?.includes("admin") ?? false;

  if (!esAdmin) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">La Papelera es solo para administradores.</p>
      </div>
    );
  }

  return <PapeleraClient />;
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Users, Phone, Mail, FileText, Briefcase } from "lucide-react";
import NotificacionesBell from "../../NotificacionesBell";

export default async function PostulacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: postulaciones } = await supabase
    .from("postulaciones")
    .select("id, nombre, apellido, email, telefono, puesto, cv_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Postulaciones</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">CVs recibidos desde "Trabajá con nosotros"</p>
          </div>
        </div>
        <NotificacionesBell seccion="postulaciones" />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postulaciones?.map((p) => (
            <div key={p.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1">{p.nombre} {p.apellido}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Briefcase className="w-3 h-3" /> {p.puesto || "Sin especificar"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> {p.telefono}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                <Mail className="w-3 h-3" /> {p.email}
              </p>
              {p.cv_url && (
                <a
                  href={p.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-[#002a6e] hover:bg-indigo-100 dark:hover:bg-[#00246b] text-indigo-700 dark:text-sky-300 border border-indigo-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Ver CV
                </a>
              )}
            </div>
          ))}
          {(!postulaciones || postulaciones.length === 0) && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Sin postulaciones recibidas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

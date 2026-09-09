import { createClient } from "@/lib/supabase2/server";
import { Users, Briefcase, Phone, Mail, FileText } from "lucide-react";

export default async function PostulacionesPage() {
  const supabase = await createClient();
  const { data: postulaciones } = await supabase.from("postulaciones").select("*").order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-rose-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Postulaciones</h1>
      </div>
      <p className="text-sm text-slate-400 mb-6">{(postulaciones || []).length} postulación{(postulaciones || []).length === 1 ? "" : "es"} recibidas desde /trabaja-con-nosotros</p>

      {(!postulaciones || postulaciones.length === 0) ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sin postulaciones todavía</p>
          <p className="text-xs text-slate-400 mt-1">Van a aparecer acá apenas alguien complete el formulario del sitio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {postulaciones.map((p) => (
            <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{p.nombre} {p.apellido}</p>
              {p.puesto && (
                <p className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 font-semibold mt-1">
                  <Briefcase className="w-3.5 h-3.5" /> {p.puesto}
                </p>
              )}
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <Phone className="w-3.5 h-3.5" /> {p.telefono}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {p.email}
              </p>
              <p className="text-[10px] text-slate-400 mt-2">{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</p>
              <a href={p.cv_url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20">
                <FileText className="w-3.5 h-3.5" /> Ver CV
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

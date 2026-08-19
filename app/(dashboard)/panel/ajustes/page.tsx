import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Settings, User, Bell, Palette } from "lucide-react";

export default async function AjustesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let perfil = null;

  if (user) {
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", user.id)
      .single();
    perfil = data;
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Ajustes de Cuenta
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Gestión de tu perfil y preferencias del panel
            </p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Perfil */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Perfil de Usuario</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue={perfil?.nombre || ""}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  disabled
                  defaultValue={user?.email || ""}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Rol Asignado
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue={perfil?.rol || ""}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed capitalize"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Seguridad
                </label>
                <button
                  type="button"
                  className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-700 dark:text-slate-300 font-bold text-[12px] uppercase tracking-widest rounded-xl px-3 py-2.5 transition-colors"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-3">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Preferencias de Notificaciones</h2>
            </div>
            <div className="p-5 space-y-5">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-sky-300 transition-colors">
                    Alertas del Sistema
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nuevas cotizaciones, reservas y cambios de estado de stock.
                  </span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-sky-300 transition-colors">
                    WhatsApp y Mensajes
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Avisos visuales ante mensajes entrantes en la bandeja de chat.
                  </span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600" />
              </label>
            </div>
          </div>

          {/* Apariencia */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-3">
              <Palette className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tema y Apariencia</h2>
            </div>
            <div className="p-5 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
              El modo oscuro está integrado directamente en la cabecera superior y en el selector del panel. Las configuraciones de pantalla y sesión se guardan automáticamente en tu navegador.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
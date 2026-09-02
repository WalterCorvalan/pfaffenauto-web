"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import {
  Search, Moon, Sun, LogOut, RotateCw, Menu, X, PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, CalendarDays, CalendarCheck, BellRing, LineChart, Megaphone, Folder,
  Car, Users, FileText, Briefcase, Trophy, SearchCode, Handshake, PackageCheck,
  BedDouble, Repeat, Star, FolderKanban, ClipboardList, ClipboardCheck, KeyRound, Landmark,
  Wrench, Hammer, MessageSquareWarning, Banknote, PiggyBank, Coins, ShieldCheck,
  BarChart3, DollarSign, MessagesSquare, Smartphone, ThumbsUp, Lightbulb, Mail,
  MessageCircle, BookUser, Settings, Trash2, Bot, Wallet, Tag, AlertTriangle, CheckSquare,
} from "lucide-react";
import QuickActionsButton from "@/components/panelV2/QuickActionsButton";
import MensajesBubble from "@/components/panelV2/MensajesBubble";
import NotificationBell from "@/components/panelV2/NotificationBell";
import TopTicker from "@/components/panelV2/TopTicker";

// Grupos calcados del índice del manual del CRM viejo — todo lo que todavía
// no construimos queda listado pero deshabilitado, para que el mapa completo
// se vea desde ahora y cada módulo se "prenda" cuando lo hagamos.
// Grupos reorganizados según el nuevo índice del panel Principal.
// Marketing ya está habilitado apuntando a /panel-v2/marketing.
// Grupos calcados del esquema principal solicitado
const GRUPOS: { titulo: string; items: { href?: string; label: string; icon: any }[] }[] = [
  {
    titulo: "Principal",
    items: [
      { href: "/panel-v2", label: "Dashboard", icon: LayoutDashboard },
      { href: "/panel-v2/calendario", label: "Calendario", icon: CalendarDays },
      { href: "/panel-v2/alertas", label: "Alertas", icon: BellRing },
      { label: "Reportes", icon: LineChart },
      { href: "/panel-v2/marketing/generales", label: "Marketing", icon: Megaphone },
      { label: "Mi Espacio", icon: Folder },
    ],
  },
  {
    titulo: "Comercial",
    items: [
      { href: "/panel-v2/stock", label: "Stock", icon: Car },
      { href: "/panel-v2/visitas", label: "Visitas", icon: CalendarCheck },
      { href: "/panel-v2/clientes", label: "Clientes", icon: Users },
      { href: "/panel-v2/cotizaciones", label: "Cotizaciones", icon: FileText },
      { href: "/panel-v2/senas", label: "Señas", icon: Wallet },
      { href: "/panel-v2/presupuestos", label: "Presupuestos", icon: FileText },
      { href: "/panel-v2/ventas", label: "Ventas", icon: Briefcase },
      { href: "/panel-v2/mis-ventas", label: "Mis ventas", icon: Trophy },
    ],
  },
  {
    titulo: "Operación",
    items: [
      { href: "/panel-v2/pedidos", label: "Pedidos", icon: SearchCode },
      { href: "/panel-v2/postventa", label: "Postventa", icon: PackageCheck },
      { href: "/panel-v2/expedientes", label: "Expedientes", icon: FolderKanban },
      { href: "/panel-v2/reclamos", label: "Reclamos", icon: MessageSquareWarning },
      { href: "/panel-v2/gestoria", label: "Gestoría", icon: ClipboardList },
      { href: "/panel-v2/consignaciones", label: "Consignaciones", icon: KeyRound },
      { href: "/panel-v2/peritajes", label: "Peritajes", icon: ClipboardCheck },
      { href: "/panel-v2/infracciones", label: "Infracciones", icon: Landmark },
      { href: "/panel-v2/telefonos", label: "Teléfonos útiles", icon: BookUser },
      { href: "/panel-v2/taller", label: "Taller", icon: Wrench },
      { label: "Service", icon: Hammer },
    ],
  },
  {
    titulo: "Finanzas",
    items: [
      { label: "Finanzas", icon: Banknote },
      { href: "/panel-v2/tesoreria", label: "Tesorería", icon: PiggyBank },
      { label: "Liquidaciones", icon: Coins },
      { href: "/panel-v2/comisiones", label:"Mis Comisiones", icon: DollarSign },
    ],
  },
  {
    titulo: "Colaboración",
    items: [
      { href: "/panel-v2/mensajes", label: "Mensajes", icon: MessagesSquare },
      { href: "/panel-v2/whatsapp", label: "WhatsApp", icon: Smartphone },
      { href: "/panel-v2/rodi", label: "Rodi (chat web)", icon: Bot },
      { href: "/panel-v2/tareas", label: "Tareas de Leads", icon: CheckSquare },
      { label: "Correos", icon: Mail },
      { label: "NPS", icon: ThumbsUp },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { href: "/panel-v2/autorizaciones", label: "Autorizaciones", icon: ShieldCheck },
      { href: "/panel-v2/dormidos", label: "Dormidos", icon: BedDouble },
      { href: "/panel-v2/recontactos", label: "Recontactos", icon: Repeat },
      { label: "Sugerencias", icon: Lightbulb },
      { label: "Papelera", icon: Trash2 },
      { href: "/panel-v2/configuracion/whatsapp", label: "Configuración", icon: Settings },
      { label: "Oportunidades", icon: Handshake },
      { href: "/panel-v2/postulaciones", label: "Postulaciones", icon: Users },
      { href: "/panel-v2/sueldos/liquidador", label: "Liquidador de Sueldos", icon: Wallet },
      { href: "/panel-v2/sueldos/categorias", label: "Categorías de Empleados", icon: Tag },
      { href: "/panel-v2/errores", label: "Errores del sistema", icon: AlertTriangle },
    ],
  },
];

const ROL_LABEL: Record<string, string> = { admin: "Administrador", ventas: "Ventas", finanzas: "Finanzas", gestoria: "Gestoría", recepcion: "Recepción", taller: "Taller" };
const ROL_COLOR: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  ventas: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  finanzas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  gestoria: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  recepcion: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  taller: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
};

export default function PanelV2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [colapsado, setColapsado] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [nombre, setNombre] = useState("Cargando...");
  const [roles, setRoles] = useState<string[]>([]);
  const [miId, setMiId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; titulo: string; mensaje: string | null; link: string | null } | null>(null);
  // Feedback de "toqué esto, se está cargando" en la navegación del sidebar —
  // sin esto, un click tarda ~1-2s en mostrar algo y parece que no pasó nada.
  const [navegandoA, setNavegandoA] = useState<string | null>(null);

  useEffect(() => {
    setNavegandoA(null);
  }, [pathname]);

  useEffect(() => {
    const guardado = localStorage.getItem("panelV2DarkMode");
    if (guardado === "true") setDarkMode(true);
    const guardadoColapsado = localStorage.getItem("panelV2SidebarColapsado");
    if (guardadoColapsado === "true") setColapsado(true);
  }, []);

  const toggleColapsado = () => {
    setColapsado((prev) => {
      localStorage.setItem("panelV2SidebarColapsado", String(!prev));
      return !prev;
    });
  };

  useEffect(() => {
    supabase2.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setMiId(user.id);
      const { data } = await supabase2.from("perfiles").select("nombre, roles").eq("id", user.id).single();
      setNombre(data?.nombre || "Usuario");
      setRoles(data?.roles || []);
    });
  }, []);

  // Toast de alertas urgentes en vivo (se cierra solo a los 10s, o con
  // click) — el contador de la campana lo maneja NotificationBell aparte.
  useEffect(() => {
    if (!miId) return;

    const canal = supabase2
      .channel(`alertas-${miId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alertas", filter: `destinatario_id=eq.${miId}` }, (payload) => {
        if (payload.new.prioridad === "alta") {
          setToast({ id: payload.new.id, titulo: payload.new.titulo, mensaje: payload.new.mensaje, link: payload.new.link });
          setTimeout(() => setToast((prev) => (prev?.id === payload.new.id ? null : prev)), 10000);
        }
      })
      .subscribe();

    return () => { supabase2.removeChannel(canal); };
  }, [miId]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("panelV2DarkMode", String(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    await supabase2.auth.signOut();
    router.push("/panel-v2/login");
  };

  const esLogin = pathname === "/panel-v2/login";
  if (esLogin) return <>{children}</>;

  const rolPrincipal = roles[0] || "";

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 overflow-hidden">
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-50">
          <span className="font-bold">Panel v2</span>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>

        {/* SIDEBAR */}
        <aside
          className={`fixed md:relative top-14 md:top-0 left-0 h-[calc(100vh-3.5rem)] md:h-full ${colapsado ? "md:w-[68px]" : "md:w-[230px]"} w-[230px] bg-white dark:bg-[#111] border-r border-slate-200 dark:border-white/10 flex flex-col shrink-0 transform transition-all duration-200 z-40 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className={`h-[60px] flex items-center gap-2 border-b border-slate-200 dark:border-white/10 shrink-0 ${colapsado ? "md:px-2 px-4" : "px-4"}`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">PV</div>
            <div className={colapsado ? "md:hidden" : ""}>
              <p className="text-sm font-bold leading-none">Panel v2</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Pfaffen Autos</p>
            </div>
            <button
              onClick={toggleColapsado}
              title={colapsado ? "Expandir menú" : "Colapsar menú"}
              className="hidden md:flex ml-auto shrink-0 w-6 h-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              {colapsado ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {GRUPOS.map((grupo) => (
              <div key={grupo.titulo} className="mb-1">
                <p className={`px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${colapsado ? "md:hidden" : ""}`}>{grupo.titulo}</p>
                {colapsado && <div className="hidden md:block mx-3 my-1.5 border-t border-slate-100 dark:border-white/5 first:mt-0" />}
                {grupo.items.map((item) => {
                  const Icon = item.icon;
                  const activo = item.href && (item.href === "/panel-v2" ? pathname === item.href : pathname?.startsWith(item.href));
                  if (!item.href) {
                    return (
                      <div
                        key={item.label}
                        title="Todavía no construido"
                        className={`flex items-center gap-3 py-2 mx-2 rounded-lg text-sm text-slate-300 dark:text-slate-600 cursor-not-allowed ${colapsado ? "md:justify-center px-4 md:px-0" : "px-4"}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" /> <span className={colapsado ? "md:hidden" : ""}>{item.label}</span>
                      </div>
                    );
                  }
                  const cargando = navegandoA === item.href && !activo;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={colapsado ? item.label : undefined}
                      onClick={() => { setIsOpen(false); if (!activo) setNavegandoA(item.href!); }}
                      className={`flex items-center gap-3 py-2 mx-2 rounded-lg text-sm transition-all active:scale-[0.97] ${colapsado ? "md:justify-center px-4 md:px-0" : "px-4"} ${
                        activo ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold" : cargando ? "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {cargando ? <RotateCw className="w-4 h-4 animate-spin shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />} <span className={colapsado ? "md:hidden" : ""}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 dark:border-white/10 p-3 shrink-0 space-y-2">
            <div className={`flex items-center gap-2 px-1 ${colapsado ? "md:justify-center" : ""}`} title={colapsado ? nombre : undefined}>
              <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{nombre.charAt(0).toUpperCase()}</div>
              <div className={`min-w-0 flex-1 ${colapsado ? "md:hidden" : ""}`}>
                <p className="text-xs font-bold truncate">{nombre}</p>
                {rolPrincipal && <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${ROL_COLOR[rolPrincipal] || "bg-slate-100 text-slate-600"}`}>{ROL_LABEL[rolPrincipal] || rolPrincipal}</span>}
              </div>
            </div>
            <button onClick={handleLogout} title={colapsado ? "Cerrar sesión" : undefined} className={`w-full flex items-center gap-2 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ${colapsado ? "md:justify-center px-2" : "px-2"}`}>
              <LogOut className="w-3.5 h-3.5 shrink-0" /> <span className={colapsado ? "md:hidden" : ""}>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO */}
        <div className="flex-1 min-w-0 h-full flex flex-col pt-14 md:pt-0">
          {/* TOPBAR */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] shrink-0">
            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                disabled
                placeholder="Buscar clientes, patentes, etc..."
                title="El buscador global se conecta cuando construyamos esos módulos"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-1.5 pl-9 pr-3 text-[11px] outline-none text-slate-900 dark:text-white placeholder:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            <TopTicker />

            <button onClick={toggleDarkMode} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 shrink-0" title={darkMode ? "Modo claro" : "Modo oscuro"}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationBell miId={miId || ""} />
          </div>

          <main className="relative flex-1 min-w-0 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0A0A0A]">
            {navegandoA && (
              <div className="absolute top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-indigo-100 dark:bg-indigo-500/10">
                <div className="h-full w-1/3 bg-indigo-600 dark:bg-indigo-400 animate-barra-carga" />
              </div>
            )}
            {children}
          </main>
        </div>
      </div>

      {toast && (
        <div
          onClick={() => { if (toast.link) router.push(toast.link); setToast(null); }}
          className="fixed top-4 right-4 z-[100] w-80 bg-white dark:bg-[#1A1A1A] border border-rose-200 dark:border-rose-500/30 rounded-xl shadow-2xl p-4 cursor-pointer animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{toast.titulo}</p>
            <button onClick={(e) => { e.stopPropagation(); setToast(null); }} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {toast.mensaje && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{toast.mensaje}</p>}
        </div>
      )}

      <QuickActionsButton />
      <MensajesBubble />
    </div>
  );
}
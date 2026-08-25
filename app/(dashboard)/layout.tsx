"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Banknote,
  CheckSquare,
  CalendarCheck,
  MessagesSquare,
  Landmark,
  Wallet,
  FileBarChart,
  Tags,
  Users,
  Megaphone,
  Target,
  MousePointerClick,
  Bot,
  CarFront,
  LayoutDashboard,
  Inbox,
  ClipboardCheck,
  History,
  PieChart,
  LogOut,
  Handshake,
  MessageSquareCheckIcon,
  Receipt,
  UsersRound,
  Wrench,
  Moon,
  Sun,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Camera,
} from "lucide-react";
import DolarBlueBadge from "./DolarBlueBadge";
const SECCIONES_INICIALES = {
  inventario: true,
  crm: true,
  solicitudes: true,
  operaciones: true,
  equipo: false,
  administracion: true,
  marketing: false,
  ajustes: false,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    nombre: "Cargando...",
    email: "",
    rol: "vendedor",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [notifPorSeccion, setNotifPorSeccion] = useState<
    Record<string, number>
  >({});
  const [erroresUltimas24h, setErroresUltimas24h] = useState(0);
  const [seccionesAbiertas, setSeccionesAbiertas] =
    useState<Record<string, boolean>>(SECCIONES_INICIALES);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const guardado = localStorage.getItem("panelDarkMode");
    if (guardado === "true") setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("panelDarkMode", String(!prev));
      return !prev;
    });
  };

  const toggleSeccion = (clave: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  // Auto-expandir la sección de la página en la que estás parado
  useEffect(() => {
    const rutasPorSeccion: Record<string, string[]> = {
      inventario: ["/panel"],
      crm: [
        "/panel/crm",
        "/panel/chat",
        "/panel/contactos",
        "/panel/citas",
        "/panel/clientes",
      ],
      solicitudes: [
        "/panel/cotizaciones",
        "/panel/peritajes",
        "/panel/consignaciones",
        "/panel/pedidos",
      ],
      operaciones: [
        "/panel/ventas",
        "/panel/postventa",
        "/panel/presupuestos",
        "/panel/senas",
        "/panel/boletos",
        "/panel/resp-civil",
      ],
      equipo: [
        "/panel/equipo",
        "/panel/usuarios",
        "/panel/postulaciones",
      ],
      administracion: [
        "/panel/informes",
        "/panel/gastos",
        "/panel/tesoreria",
        "/panel/logs",
        "/panel/sueldos",
      ],
      marketing: ["/panel/metricas", "/panel/marketing"],
      ajustes: ["/panel/ajustes"],
    };
    const seccionActiva = Object.entries(rutasPorSeccion).find(([, rutas]) =>
      rutas.some((r) =>
        r === "/panel" ? pathname === "/panel" : pathname?.startsWith(r),
      ),
    )?.[0];
    if (seccionActiva) {
      setSeccionesAbiertas((prev) =>
        prev[seccionActiva] ? prev : { ...prev, [seccionActiva]: true },
      );
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("perfiles")
          .select("rol, nombre")
          .eq("id", user.id)
          .single();
        const userRol = data?.rol || "vendedor";
        setUserProfile({
          nombre: data?.nombre || "Usuario",
          email: user.email || "",
          rol: userRol,
        });

        if (
          userRol !== "admin" &&
          (pathname?.startsWith("/panel/usuarios") ||
            pathname?.startsWith("/panel/gastos"))
        ) {
          router.replace("/panel");
        }
        if (
          userRol === "vendedor" &&
          (pathname?.startsWith("/panel/metricas") ||
            pathname?.startsWith("/panel/marketing"))
        ) {
          router.replace("/panel");
        }
        if (userRol === "taller" && !pathname?.startsWith("/panel/taller")) {
          router.replace("/panel/taller");
        }
      }
    };
    fetchUser();
  }, [pathname, router]);

  useEffect(() => {
    if (!userId) return;

    const cargarConteos = async () => {
      const { data } = await supabase
        .from("notificaciones")
        .select("seccion")
        .eq("perfil_id", userId)
        .eq("leida", false)
        .not("seccion", "is", null);
      const conteos: Record<string, number> = {};
      (data || []).forEach((n: any) => {
        if (n.seccion) conteos[n.seccion] = (conteos[n.seccion] || 0) + 1;
      });

      // Tareas de leads no dispara notificaciones (nadie inserta seccion="tareas"
      // ahí) — el badge sale de tareas_lead directo. Todas las pendientes, no
      // solo vencidas/hoy: mismo total que suma el tablero (vencidas+hoy+próximas).
      const { count: tareasPendientes } = await supabase
        .from("tareas_lead")
        .select("id", { count: "exact", head: true })
        .eq("completada", false);
      if (tareasPendientes) conteos.tareas = tareasPendientes;

      setNotifPorSeccion(conteos);
    };
    cargarConteos();

    const canal = supabase
      .channel(
        `notif-secciones-${userId}-${Math.random().toString(36).slice(2)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificaciones",
          filter: `perfil_id=eq.${userId}`,
        },
        cargarConteos,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]);

  // Badge de "salud del sistema": cuántos errores cayeron en logs_errores en
  // las últimas 24h, para que admin/encargado lo vean sin tener que entrar a
  // /panel/errores a mirar.
  useEffect(() => {
    if (userProfile.rol !== "admin" && userProfile.rol !== "encargado") return;
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("logs_errores")
      .select("id", { count: "exact", head: true })
      .gte("created_at", desde)
      .then(({ count }) => setErroresUltimas24h(count || 0));
  }, [userProfile.rol]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Enlace Minimalista estilo "Vocero"
  // Colores por flujo de negocio (calcados del sitio público, para que el
  // panel no sea "un quilombo" de colores random): cotizar = azul, consignar
  // = verde, vender = naranja. El resto de las secciones se queda con el
  // esquema neutro de siempre.
  const COLORES_NAV: Record<string, { bg: string; text: string; textActive: string; badge: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-[#002a6e]", text: "text-blue-900 dark:text-white", textActive: "text-[#0145F2] dark:text-sky-300", badge: "bg-[#0145F2] text-white" },
    emerald: { bg: "bg-emerald-50 dark:bg-[#002a6e]", text: "text-emerald-900 dark:text-white", textActive: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-700 text-white" },
    orange: { bg: "bg-orange-50 dark:bg-[#002a6e]", text: "text-orange-900 dark:text-white", textActive: "text-orange-600 dark:text-orange-300", badge: "bg-orange-600 text-white" },
    default: { bg: "bg-emerald-50 dark:bg-[#002a6e]", text: "text-emerald-900 dark:text-white", textActive: "text-emerald-700 dark:text-sky-300", badge: "bg-emerald-800 text-white" },
  };

  const NavLinkItem = ({
    icon: Icon,
    label,
    href,
    exact = false,
    notifications,
    color = "default",
  }: any) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    const c = COLORES_NAV[color] || COLORES_NAV.default;
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center justify-between px-3 py-2 mx-2 rounded-md transition-colors ${
          isActive
            ? `${c.bg} ${c.text} font-medium`
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002a6e] hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`w-[18px] h-[18px] ${isActive ? c.textActive : "text-slate-400 dark:text-slate-400"}`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="text-[13px]">{label}</span>
        </div>
        {notifications && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? c.badge : "bg-slate-200 dark:bg-[#0a2a6b] text-slate-600 dark:text-slate-300"}`}
          >
            {notifications}
          </span>
        )}
      </Link>
    );
  };

  const SectionAccordion = ({
    id,
    label,
    children,
  }: {
    id: string;
    label: string;
    children: React.ReactNode;
  }) => {
    const abierta = seccionesAbiertas[id];
    return (
      <div className="mt-2">
        <button
          onClick={() => toggleSeccion(id)}
          className="w-full flex items-center justify-between px-5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {label}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${abierta ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        {abierta && <div className="mt-0.5">{children}</div>}
      </div>
    );
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen w-full bg-white dark:bg-[#001233] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors print:h-auto print:overflow-visible print:block">
        {/* HEADER MÓVIL */}
        <div className="print:hidden md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#001c55] border-b border-slate-200 dark:border-[#0a2a6b] flex items-center justify-between px-4 z-50 transition-colors">
          <span className="font-bold text-slate-900 dark:text-white truncate mr-2">
            Pfaffen CRM
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <DolarBlueBadge compacto />
            <button
              onClick={toggleDarkMode}
              className="text-slate-600 dark:text-slate-300 p-2"
              title="Modo oscuro"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 dark:text-slate-300 p-2"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        {/* SIDEBAR DESKTOP */}
        <aside
          className={`print:hidden fixed md:relative top-14 md:top-0 left-0 h-[calc(100vh-3.5rem)] md:h-full w-[225px] bg-[#F9FAFB] dark:bg-[#001c55] border-r border-slate-200 dark:border-[#0a2a6b] transform transition-transform z-40 flex flex-col shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          {/* Cabecera del Espacio de Trabajo */}
          <div className="h-[60px] flex items-center gap-3 px-4 border-b border-slate-200 dark:border-[#0a2a6b] transition-colors shrink-0">
            <Link
              href="/"
              title="Volver al sitio público"
              className="flex items-center gap-3 min-w-0 flex-1 hover:bg-slate-100 dark:hover:bg-[#002a6e] -mx-4 px-4 h-full transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                P
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                  Pfaffen
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  CRM · WhatsApp
                </span>
              </div>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="hidden md:flex text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-[#0a2a6b] transition-colors"
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="hidden md:flex px-4 py-2.5 border-b border-slate-200 dark:border-[#0a2a6b] shrink-0">
            <DolarBlueBadge />
          </div>

          {/* Links de Navegación Completos (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            {/* 🔧 TALLER (rol exclusivo, sin acceso al resto del panel) */}
            {userProfile.rol === "taller" && (
              <NavLinkItem
                icon={Wrench}
                label="Preparación de Vehículos"
                href="/panel/taller"
                exact
              />
            )}

            {userProfile.rol !== "taller" && (
              <>
                {/* 📦 STOCK */}
                <SectionAccordion id="inventario" label="Inventario">
                  <NavLinkItem
                    icon={CarFront}
                    label="Gestión de Stock"
                    href="/panel"
                    exact
                    notifications={notifPorSeccion.stock}
                  />
                  <NavLinkItem
                    icon={Wrench}
                    label="Preparación de Vehículos"
                    href="/panel/taller"
                  />
                </SectionAccordion>

                {/* 💬 CRM — pipeline y comunicación del día a día */}
                <SectionAccordion id="crm" label="CRM & Leads">
                  <NavLinkItem
                    icon={LayoutDashboard}
                    label="Tablero de Leads"
                    href="/panel/crm"
                    notifications={notifPorSeccion.crm}
                  />
                  <NavLinkItem
                    icon={CheckSquare}
                    label="Tareas de Leads"
                    href="/panel/crm/tareas"
                    notifications={notifPorSeccion.tareas}
                  />
                  <NavLinkItem
                    icon={MessageSquareCheckIcon}
                    label="Chat"
                    href="/panel/chat"
                  />
                  <NavLinkItem
                    icon={UsersRound}
                    label="Contactos"
                    href="/panel/contactos"
                  />
                  <NavLinkItem
                    icon={CalendarCheck}
                    label="Agenda de Visitas"
                    href="/panel/citas"
                  />
                  <NavLinkItem
                    icon={UserPlus}
                    label="Nuevo Cliente"
                    href="/panel/clientes/nuevo"
                  />
                </SectionAccordion>

                {/* 📥 SOLICITUDES — tipos de leads entrantes desde el sitio público */}
                <SectionAccordion id="solicitudes" label="Solicitudes">
                  <NavLinkItem
                    icon={Inbox}
                    label="Cotizaciones"
                    href="/panel/cotizaciones"
                    notifications={notifPorSeccion.cotizaciones}
                    color="blue"
                  />
                  <NavLinkItem
                    icon={ClipboardCheck}
                    label="Peritajes"
                    href="/panel/peritajes"
                  />
                  <NavLinkItem
                    icon={Handshake}
                    label="Consignaciones"
                    href="/panel/consignaciones"
                    notifications={notifPorSeccion.consignaciones}
                    color="emerald"
                  />
                  <NavLinkItem
                    icon={Wallet}
                    label="Comprar"
                    href="/panel/comprar"
                    notifications={notifPorSeccion.comprar}
                    color="orange"
                  />
                  <NavLinkItem
                    icon={Search}
                    label="Pedidos Especiales"
                    href="/panel/pedidos"
                  />
                </SectionAccordion>

                {/* 🧾 VENTAS — desde el presupuesto hasta la postventa */}
                <SectionAccordion id="operaciones" label="Ventas">
                  <NavLinkItem
                    icon={FileText}
                    label="Presupuestos"
                    href="/panel/presupuestos"
                    notifications={notifPorSeccion.presupuestos}
                  />
                  <NavLinkItem
                    icon={Banknote}
                    label="Señas"
                    href="/panel/senas"
                    notifications={notifPorSeccion.senas}
                  />
                  <NavLinkItem
                    icon={Receipt}
                    label="Ventas"
                    href="/panel/boletos"
                    notifications={notifPorSeccion.boletos}
                  />
                  <NavLinkItem
                    icon={ShieldCheck}
                    label="Resp. Civil"
                    href="/panel/resp-civil"
                  />
                  <NavLinkItem
                    icon={Landmark}
                    label="Financiaciones"
                    href="/panel/ventas/financiaciones"
                    notifications={notifPorSeccion.financiacion}
                  />
                  <NavLinkItem
                    icon={Wrench}
                    label="Postventa"
                    href="/panel/postventa"
                    notifications={notifPorSeccion.postventa}
                  />
                </SectionAccordion>

                {/* 👥 EQUIPO — todo lo relacionado a las personas que trabajan acá */}
                {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
                  <SectionAccordion id="equipo" label="Equipo">
                    <NavLinkItem
                      icon={Users}
                      label="Supervisión de Equipo"
                      href="/panel/equipo"
                    />
                    <NavLinkItem
                      icon={Users}
                      label="Postulaciones"
                      href="/panel/postulaciones"
                      notifications={notifPorSeccion.postulaciones}
                    />
                    {userProfile.rol === "admin" && (
                      <NavLinkItem
                        icon={UsersRound}
                        label="Usuarios y Roles"
                        href="/panel/usuarios"
                      />
                    )}
                  </SectionAccordion>
                )}

                {/* 💼 ADMINISTRACIÓN */}
                {(userProfile.rol === "admin" ||
                  userProfile.rol === "encargado") && (
                  <SectionAccordion id="administracion" label="Administración">
                    <NavLinkItem
                      icon={FileBarChart}
                      label="Informes Globales"
                      href="/panel/informes"
                    />
                    <NavLinkItem
                      icon={History}
                      label="Registro de Cambios"
                      href="/panel/logs"
                    />
                    <NavLinkItem
                      icon={AlertTriangle}
                      label="Errores del Sistema"
                      href="/panel/errores"
                      notifications={erroresUltimas24h || undefined}
                    />
                    {userProfile.rol === "admin" && (
                      <>
                        <NavLinkItem
                          icon={Wallet}
                          label="Gastos"
                          href="/panel/gastos"
                        />
                        <NavLinkItem
                          icon={Receipt}
                          label="Egresos por Categoría"
                          href="/panel/gastos/egresos"
                        />
                        <NavLinkItem
                          icon={Landmark}
                          label="Tesorería"
                          href="/panel/tesoreria"
                        />
                        <NavLinkItem
                          icon={Wallet}
                          label="Liquidador de Sueldos"
                          href="/panel/sueldos/liquidador"
                        />
                        <NavLinkItem
                          icon={Tags}
                          label="Categorías de Empleado"
                          href="/panel/sueldos/categorias"
                        />
                      </>
                    )}
                  </SectionAccordion>
                )}

                {/* 📣 MARKETING */}
                {(userProfile.rol === "admin" ||
                  userProfile.rol === "encargado") && (
                  <SectionAccordion id="marketing" label="Marketing">
                    <NavLinkItem
                      icon={PieChart}
                      label="Métricas Generales"
                      href="/panel/metricas"
                    />
                    <NavLinkItem
                      icon={Megaphone}
                      label="Pautas Publicitarias"
                      href="/panel/marketing/pautas"
                    />
                    <NavLinkItem
                      icon={Megaphone}
                      label="Embudo de Conversión"
                      href="/panel/marketing/embudo"
                    />
                    <NavLinkItem
                      icon={Target}
                      label="Autos Pautados"
                      href="/panel/marketing/pautados"
                    />
                    <NavLinkItem
                      icon={MousePointerClick}
                      label="Búsquedas Web"
                      href="/panel/marketing/busquedas"
                    />
                    <NavLinkItem
                      icon={Bot}
                      label="Asistente Virtual"
                      href="/panel/marketing/chatbot"
                    />
                    <NavLinkItem
                      icon={Camera}
                      label="Métricas de Instagram"
                      href="/panel/marketing/instagram"
                    />
                  </SectionAccordion>
                )}
              </>
            )}
          </div>

          {/* Footer: Perfil de Usuario */}
          <div className="mt-auto border-t border-slate-200 dark:border-[#0a2a6b] bg-[#F9FAFB] dark:bg-[#001c55] shrink-0">
            <div
              className={`flex items-center justify-between transition-colors group ${
                pathname === "/panel/ajustes"
                  ? "bg-slate-100 dark:bg-[#002a6e]"
                  : "hover:bg-slate-100 dark:hover:bg-[#002a6e]"
              }`}
            >
              <Link
                href="/panel/ajustes"
                onClick={() => setIsOpen(false)}
                className="p-4 flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                title="Ir a Ajustes y Perfil"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {userProfile.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                    {userProfile.nombre}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {userProfile.rol} · Ajustes
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 shrink-0 p-3 mr-1 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>{" "}
        {/* <--- ESTA ES LA ETIQUETA QUE FALTABA */}
        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 min-w-0 h-full flex flex-col bg-white dark:bg-[#001233] relative pt-14 md:pt-0 transition-colors overflow-y-auto print:h-auto print:overflow-visible print:pt-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}

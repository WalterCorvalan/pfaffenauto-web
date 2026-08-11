"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Menu, X, Search, ChevronRight, ChevronDown, UserPlus, Banknote, CheckSquare,
  CalendarCheck, MessagesSquare, Landmark, Wallet, FileBarChart,
  Users, Megaphone, Target, MousePointerClick, Bot, CarFront,
  LayoutDashboard, Inbox, PieChart, LogOut, Handshake, MessageSquareCheckIcon, Receipt, UsersRound
} from "lucide-react";

const SECCIONES_INICIALES = {
  inventario: true,
  crm: true,
  operaciones: true,
  administracion: true,
  marketing: false,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ nombre: "Cargando...", email: "", rol: "vendedor" });
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>(SECCIONES_INICIALES);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSeccion = (clave: string) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  // Auto-expandir la sección de la página en la que estás parado
  useEffect(() => {
    const rutasPorSeccion: Record<string, string[]> = {
      inventario: ["/panel"],
      crm: ["/panel/crm", "/panel/chat", "/panel/contactos", "/panel/citas", "/panel/cotizaciones", "/panel/consignaciones", "/panel/pedidos", "/panel/tareas"],
      operaciones: ["/panel/ventas", "/panel/clientes"],
      administracion: ["/panel/informes", "/panel/gastos", "/panel/usuarios"],
      marketing: ["/panel/metricas", "/panel/marketing"],
    };
    const seccionActiva = Object.entries(rutasPorSeccion).find(([, rutas]) =>
      rutas.some((r) => (r === "/panel" ? pathname === "/panel" : pathname?.startsWith(r)))
    )?.[0];
    if (seccionActiva) {
      setSeccionesAbiertas((prev) => (prev[seccionActiva] ? prev : { ...prev, [seccionActiva]: true }));
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("perfiles").select("rol, nombre").eq("id", user.id).single();
        const userRol = data?.rol || "vendedor";
        setUserProfile({ nombre: data?.nombre || "Usuario", email: user.email || "", rol: userRol });

        if (userRol !== "admin" && (pathname?.startsWith("/panel/usuarios") || pathname?.startsWith("/panel/gastos"))) {
          router.replace("/panel");
        }
        if (userRol === "vendedor" && (pathname?.startsWith("/panel/metricas") || pathname?.startsWith("/panel/marketing"))) {
          router.replace("/panel");
        }
      }
    };
    fetchUser();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Enlace Minimalista estilo "Vocero"
  const NavLinkItem = ({ icon: Icon, label, href, exact = false, notifications }: any) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center justify-between px-3 py-2 mx-2 rounded-md transition-colors ${
          isActive
            ? "bg-emerald-50 text-emerald-900 font-medium"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-[18px] h-[18px] ${isActive ? "text-emerald-700" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[13px]">{label}</span>
        </div>
        {notifications && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-600"}`}>
            {notifications}
          </span>
        )}
      </Link>
    );
  };

  const SectionAccordion = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => {
    const abierta = seccionesAbiertas[id];
    return (
      <div className="mt-2">
        <button
          onClick={() => toggleSeccion(id)}
          className="w-full flex items-center justify-between px-5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
        >
          {label}
          <ChevronDown className={`w-3 h-3 transition-transform ${abierta ? "rotate-0" : "-rotate-90"}`} />
        </button>
        {abierta && <div className="mt-0.5">{children}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
      
      {/* HEADER MÓVIL */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <span className="font-bold text-slate-900">Pfaffen CRM</span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside className={`fixed md:relative top-14 md:top-0 left-0 h-full w-[225px] bg-[#F9FAFB] border-r border-slate-200 transform transition-transform z-40 flex flex-col shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Cabecera del Espacio de Trabajo */}
        <div className="h-[60px] flex items-center gap-3 px-4 border-b border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            P
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-slate-900 truncate">Pfaffen</span>
            <span className="text-[11px] text-slate-500 truncate">CRM · WhatsApp</span>
          </div>
        </div>

        {/* Links de Navegación Completos (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          
          {/* 📦 STOCK */}
          <SectionAccordion id="inventario" label="Inventario">
            <NavLinkItem icon={CarFront} label="Gestión de Stock" href="/panel" exact />
          </SectionAccordion>

          {/* 💬 CRM */}
          <SectionAccordion id="crm" label="CRM & Leads">
            <NavLinkItem icon={LayoutDashboard} label="Tablero de Leads" href="/panel/crm" />
            <NavLinkItem icon={MessageSquareCheckIcon} label="Chat" href="/panel/chat" />
            <NavLinkItem icon={UsersRound} label="Contactos" href="/panel/contactos" />
            <NavLinkItem icon={CalendarCheck} label="Agenda de Visitas" href="/panel/citas" />
            <NavLinkItem icon={Inbox} label="Cotizaciones" href="/panel/cotizaciones" />
            <NavLinkItem icon={Handshake} label="Consignaciones" href="/panel/consignaciones" />
            <NavLinkItem icon={Search} label="Pedidos Especiales" href="/panel/pedidos" />
            <NavLinkItem icon={CheckSquare} label="Tareas del Equipo" href="/panel/tareas" />
          </SectionAccordion>

          {/* 🧾 VENTAS */}
          <SectionAccordion id="operaciones" label="Operaciones">
            <NavLinkItem icon={Banknote} label="Nueva Operación" href="/panel/ventas/nueva" />
            <NavLinkItem icon={Receipt} label="Ventas y Seguimiento" href="/panel/ventas" />
            <NavLinkItem icon={Landmark} label="Financiaciones" href="/panel/ventas/financiaciones" />
            <NavLinkItem icon={UserPlus} label="Nuevo Cliente" href="/panel/clientes/nuevo" />
          </SectionAccordion>

          {/* 💼 ADMINISTRACIÓN */}
          {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
            <SectionAccordion id="administracion" label="Administración">
              <NavLinkItem icon={FileBarChart} label="Informes Globales" href="/panel/informes" />
              {userProfile.rol === "admin" && (
                <>
                  <NavLinkItem icon={Wallet} label="Gastos" href="/panel/gastos" />
                  <NavLinkItem icon={Receipt} label="Egresos por Categoría" href="/panel/gastos/egresos" />
                  <NavLinkItem icon={Users} label="Gestión de Equipo" href="/panel/usuarios" />
                </>
              )}
            </SectionAccordion>
          )}

          {/* 📣 MARKETING */}
          {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
            <SectionAccordion id="marketing" label="Marketing">
              <NavLinkItem icon={PieChart} label="Métricas Generales" href="/panel/metricas" />
              <NavLinkItem icon={Megaphone} label="Embudo de Conversión" href="/panel/marketing/embudo" />
              <NavLinkItem icon={Target} label="Autos Pautados" href="/panel/marketing/pautados" />
              <NavLinkItem icon={MousePointerClick} label="Búsquedas Web" href="/panel/marketing/busquedas" />
              <NavLinkItem icon={Bot} label="Asistente Virtual" href="/panel/marketing/chatbot" />
            </SectionAccordion>
          )}
        </div>

        {/* Footer: Perfil de Usuario */}
        <div className="mt-auto border-t border-slate-200 bg-[#F9FAFB] shrink-0">
          <div className="p-4 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {userProfile.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-slate-900 truncate">{userProfile.nombre}</span>
                <span className="text-[11px] text-slate-500 truncate">{userProfile.rol} · En línea</span>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-700 shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 min-w-0 h-full flex flex-col bg-white relative pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
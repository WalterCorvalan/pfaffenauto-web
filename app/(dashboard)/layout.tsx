"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  UserPlus,
  Banknote,
  CheckSquare,
  CalendarCheck,
  MessagesSquare,
  Landmark,
  Wallet,
  FileBarChart,
  Users,
  Megaphone,
  Target,
  MousePointerClick,
  Bot,
  CarFront,
  LayoutDashboard,
  Inbox,
  PieChart,
  LogOut,
  Handshake
} from "lucide-react";

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

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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
      }
    };
    fetchUser();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Componente de Enlace Mejorado
  const NavLinkItem = ({
    icon: Icon,
    label,
    href,
    exact = false,
    notifications,
  }: any) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
          isActive
            ? "bg-[#0ea5e9]/10 text-[#0ea5e9] font-bold"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-100 font-medium"
        }`}
      >
        {/* Indicador Activo Lateral */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0ea5e9] rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
        )}
        
        <div className="flex items-center gap-3">
          <Icon
            className={`w-[18px] h-[18px] transition-transform duration-300 ${
              isActive ? "text-[#0ea5e9]" : "text-slate-500 group-hover:scale-110 group-hover:text-[#0ea5e9]"
            }`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="text-sm tracking-wide">{label}</span>
        </div>

        {notifications && (
          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-md">
            {notifications}
          </span>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-4">
      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#0b1329] text-slate-100 font-sans">
      
      {/* BARRA SUPERIOR MÓVIL */}
      <div className="md:hidden print:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-50 shadow-md">
        <Link href="/panel" className="flex items-center relative group py-2">
          <img
            src="/logo.png"
            alt="Pfaffen Autos"
            className="h-6 w-auto invert brightness-0"
          />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed print:hidden md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-[280px] bg-[#0f172a] border-r border-slate-800 transform transition-transform duration-300 z-40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-2xl md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          
          {/* USER BUTTON (Premium Card) */}
          <div className="flex items-center justify-between p-3 -mx-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer mb-8 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0145F2] to-sky-400 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                {userProfile.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate pr-2">
                  {userProfile.nombre}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0ea5e9] truncate pr-2">
                  {userProfile.rol}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
          </div>

          {/* SEARCH (Glassmorphism Input) */}
          <div className="relative mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar rápido..."
              className="w-full bg-[#0b1329] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-14 py-2.5 outline-none focus:border-[#0ea5e9]/50 focus:ring-2 focus:ring-[#0ea5e9]/10 transition-all placeholder:text-slate-600 shadow-inner"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 text-[9px] font-black text-slate-400 px-1.5 py-1 rounded-md pointer-events-none uppercase tracking-widest">
              Ctrl K
            </div>
          </div>

          {/* 📦 STOCK */}
          <div className="mb-8">
            <SectionLabel>Inventario</SectionLabel>
            <div className="flex flex-col gap-1 -mx-2">
              <NavLinkItem icon={CarFront} label="Gestión de Stock" href="/panel" exact />
            </div>
          </div>

          {/* 💬 CRM */}
          <div className="mb-8">
            <SectionLabel>CRM & Leads</SectionLabel>
            <div className="flex flex-col gap-1 -mx-2">
              <NavLinkItem icon={LayoutDashboard} label="Tablero de Leads" href="/panel/crm" />
              <NavLinkItem icon={Inbox} label="Solicitudes Web" href="/panel/cotizaciones" />
              <NavLinkItem icon={Handshake} label="Consignaciones" href="/panel/consignaciones" />
              <NavLinkItem icon={Search} label="Pedidos Especiales" href="/panel/pedidos" />
              <NavLinkItem icon={CalendarCheck} label="Agenda de Visitas" href="/panel/citas" />
              <NavLinkItem icon={MessagesSquare} label="Consultas Activas" href="/panel/chat" />
              <NavLinkItem icon={CheckSquare} label="Tareas del Equipo" href="/panel/tareas" />
            </div>
          </div>

          {/* 🧾 VENTAS */}
          <div className="mb-8">
            <SectionLabel>Operaciones</SectionLabel>
            <div className="flex flex-col gap-1 -mx-2">
              <NavLinkItem icon={Banknote} label="Nueva Operación" href="/panel/ventas/nueva" />
              <NavLinkItem icon={UserPlus} label="Nuevo Cliente" href="/panel/clientes/nuevo" />
              <NavLinkItem icon={Landmark} label="Financiaciones" href="/panel/ventas/financiaciones" />
            </div>
          </div>

          {/* 💼 ADMINISTRACIÓN */}
          {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
            <div className="mb-8">
              <SectionLabel>Administración</SectionLabel>
              <div className="flex flex-col gap-1 -mx-2">
                <NavLinkItem icon={FileBarChart} label="Informes Globales" href="/panel/informes" />
                {userProfile.rol === "admin" && (
                  <>
                    <NavLinkItem icon={Wallet} label="Movimientos de Caja" href="/panel/gastos" />
                    <NavLinkItem icon={Users} label="Gestión de Equipo" href="/panel/usuarios" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* 📣 MARKETING */}
          {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
            <div className="mb-auto">
              <SectionLabel>Marketing</SectionLabel>
              <div className="flex flex-col gap-1 -mx-2">
                <NavLinkItem icon={PieChart} label="Métricas Generales" href="/panel/metricas" />
                <NavLinkItem icon={Target} label="Autos Pautados" href="/panel/marketing/pautados" />
                <NavLinkItem icon={Megaphone} label="Embudo de Conversión" href="/panel/marketing/embudo" />
                <NavLinkItem icon={MousePointerClick} label="Búsquedas Web" href="/panel/marketing/busquedas" />
                <NavLinkItem icon={Bot} label="Asistente Virtual" href="/panel/marketing/chatbot" />
              </div>
            </div>
          )}

          {/* LOGOUT */}
          <div className="pt-6 mt-6 border-t border-slate-800 -mx-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors group"
            >
              <LogOut className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-16 md:pt-0 bg-[#0b1329] flex flex-col">
        <div className="p-4 md:p-8 w-full flex-1">{children}</div>
      </main>
    </div>
  );
}
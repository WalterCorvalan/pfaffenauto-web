"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Users,
  LogOut,
  Menu,
  X,
  MessageSquareShare, // Para CRM
  FileCheck, // Para Gestoría
  BarChart3,
  ChevronDown,
  ChevronUp,
  Settings,
  Wallet,
  UserPlus,
  Banknote,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [rol, setRol] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Traemos el rol del usuario al cargar el layout y BLOQUEAMOS ACCESOS DIRECTOS
  useEffect(() => {
    const fetchRol = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single();

        const userRol = data?.rol || "vendedor";
        setRol(userRol);

        // ========================================================
        // BARRERA DE SEGURIDAD: PREVENIR ACCESO DIRECTO POR URL
        // ========================================================

        // 1. Si no es admin y quiere entrar a Usuarios o Gastos -> Afuera
        if (
          userRol !== "admin" &&
          (pathname.startsWith("/panel/usuarios") ||
            pathname.startsWith("/panel/gastos"))
        ) {
          router.replace("/panel");
        }

        // 2. Si es vendedor y quiere entrar a Gestoría o Métricas -> Afuera
        if (
          userRol === "vendedor" &&
          (pathname.startsWith("/panel/gestoria") ||
            pathname.startsWith("/panel/metricas"))
        ) {
          router.replace("/panel");
        }
      }
    };
    fetchRol();
  }, [pathname, router]); // Se vuelve a ejecutar cada vez que cambia la URL

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0b1329] text-slate-100 font-sans">
      {/* 1. BARRA SUPERIOR (MÓVIL) */}
      <div className="md:hidden print:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-50 shadow-md">
        <Link href="/panel" className="flex items-center relative group py-2">
          <div className="relative inline-block">
            <img
              src="/logo.png"
              alt="Pfaffen Autos"
              className="h-6 w-auto invert brightness-0"
            />
            <img
              src="/r.png"
              alt="Marca"
              className="absolute invert brightness-0 -top-1 -right-3 w-2.5 h-2.5 opacity-80"
            />
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-300 hover:text-white"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 2. BARRA LATERAL (SIDEBAR) */}
      <aside
        className={`fixed print:hidden md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-[#0f172a] border-r border-slate-800/80 transform transition-transform duration-300 z-40 shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex flex-col shrink-0`}
      >
        <div className="hidden md:flex shrink-0 h-20 items-center px-6 border-b border-slate-800">
          <Link href="/panel" className="flex items-center relative group py-2">
            <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Pfaffen Autos"
                className="h-7 w-auto invert brightness-0"
              />
              <img
                src="/r.png"
                alt="Marca"
                className="absolute invert brightness-0 -top-1 -right-3.5 w-3 h-3 opacity-80"
              />
            </div>
          </Link>
        </div>

        {/* Menú de Navegación Dinámico */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {/* MÓDULOS GLOBALES (Todos los ven) */}
          <Link
            href="/panel"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname === "/panel" || pathname.startsWith("/panel/vehiculo") ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
          >
            <Car
              className={`w-5 h-5 ${pathname === "/panel" || pathname.startsWith("/panel/vehiculo") ? "text-white" : "text-slate-500"}`}
            />
            Gestión de Stock
          </Link>

          <Link
            href="/panel/crm"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname.startsWith("/panel/crm") || pathname.startsWith("/panel/cotizaciones") ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
          >
            <MessageSquareShare
              className={`w-5 h-5 ${pathname.startsWith("/panel/crm") || pathname.startsWith("/panel/cotizaciones") ? "text-white" : "text-slate-500"}`}
            />
            CRM / Leads
          </Link>

          {/* <--- ACÁ AGREGAMOS EL BOTÓN DE NUEVO CLIENTE ---> */}
          <Link
            href="/panel/clientes/nuevo"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname === "/panel/clientes/nuevo" ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
          >
            <UserPlus
              className={`w-5 h-5 ${pathname === "/panel/clientes/nuevo" ? "text-white" : "text-slate-500"}`}
            />
            Nuevo Cliente
          </Link>

          {/* <--- NUEVO BOTÓN DE VENTAS / OPERACIONES ---> */}
          <Link
            href="/panel/ventas/nueva"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname.startsWith("/panel/ventas") ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
          >
            <Banknote
              className={`w-5 h-5 ${pathname.startsWith("/panel/ventas") ? "text-white" : "text-slate-500"}`}
            />
            Nueva Operación
          </Link>

          {/* MÓDULOS DE ENCARGADOS Y ADMINS */}
          {(rol === "admin" || rol === "encargado") && (
            <Link
              href="/panel/gestoria"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pathname.startsWith("/panel/gestoria") ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"}`}
            >
              <FileCheck
                className={`w-5 h-5 ${pathname.startsWith("/panel/gestoria") ? "text-white" : "text-slate-500"}`}
              />
              Gestoría
            </Link>
          )}

          {/* EL "ABANICO" DE ADMINISTRACIÓN */}
          {(rol === "admin" || rol === "encargado") && (
            <div className="pt-2">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  Administración
                </div>
                {adminMenuOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Sub-menú desplegable */}
              {adminMenuOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1 animate-fadeIn">
                  {/* Métricas: Lo ven admin y encargado */}
                  <Link
                    href="/panel/metricas"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname.startsWith("/panel/metricas") ? "text-[#0ea5e9] bg-[#0ea5e9]/10" : "text-slate-400 hover:text-white"}`}
                  >
                    <BarChart3 className="w-4 h-4" /> Métricas
                  </Link>

                  {/* Gastos: SOLO ADMIN */}
                  {rol === "admin" && (
                    <Link
                      href="/panel/gastos"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname.startsWith("/panel/gastos") ? "text-[#0ea5e9] bg-[#0ea5e9]/10" : "text-slate-400 hover:text-white"}`}
                    >
                      <Wallet className="w-4 h-4" /> Caja y Gastos
                    </Link>
                  )}

                  {/* Usuarios: SOLO ADMIN */}
                  {rol === "admin" && (
                    <Link
                      href="/panel/usuarios"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${pathname.startsWith("/panel/usuarios") ? "text-[#0ea5e9] bg-[#0ea5e9]/10" : "text-slate-400 hover:text-white"}`}
                    >
                      <Users className="w-4 h-4" /> Usuarios
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          {rol && (
            <div className="mb-3 px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                Conectado como
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${rol === "admin" ? "bg-purple-900/30 text-purple-400 border-purple-700/50" : rol === "encargado" ? "bg-blue-900/30 text-blue-400 border-blue-700/50" : "bg-green-900/30 text-green-400 border-green-700/50"}`}
              >
                {rol}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-16 md:pt-0 bg-[#0b1329] flex flex-col">
        <div className="p-4 md:p-8 w-full flex-1">{children}</div>
      </main>
    </div>
  );
}

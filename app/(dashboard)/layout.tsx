"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Menu,
  X,
  Search,
  ChevronRight,
  UserPlus,
  Banknote,
  MessageSquareShare,
  CheckSquare,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Estado ampliado para mostrar Nombre y Email en el perfil
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

        // BARRERAS DE SEGURIDAD
        if (
          userRol !== "admin" &&
          (pathname?.startsWith("/panel/usuarios") ||
            pathname?.startsWith("/panel/gastos"))
        ) {
          router.replace("/panel");
        }

        if (
          userRol === "vendedor" &&
          (pathname?.startsWith("/panel/gestoria") ||
            pathname?.startsWith("/panel/metricas"))
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

  // Componente interno ultra-flexible (Soporta Iconos Lucide o Emojis estilo Mantine)
  const NavLinkItem = ({
    icon: Icon,
    emoji,
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
        className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-[#0145F2]/10 text-[#339AF0] font-medium"
            : "text-[#C1C2C5] hover:bg-[#25262B] hover:text-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Si pasamos un emoji, lo renderiza. Si pasamos un ícono, usa Lucide */}
          {emoji ? (
            <span className="text-base leading-none w-[18px] text-center">
              {emoji}
            </span>
          ) : (
            <Icon
              className={`w-[18px] h-[18px] ${isActive ? "text-[#339AF0]" : "text-gray-400"}`}
              strokeWidth={2}
            />
          )}
          <span className="text-sm">{label}</span>
        </div>

        {/* Burbuja de notificaciones (Opcional) */}
        {notifications && (
          <span className="bg-[#1971C2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
            {notifications}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0b1329] text-slate-100 font-sans">
      {/* ================= 1. BARRA SUPERIOR (MÓVIL) ================= */}
      <div className="md:hidden print:hidden fixed top-0 left-0 right-0 h-16 bg-[#1A1B1E] border-b border-[#2C2E33] flex items-center justify-between px-4 z-50 shadow-md">
        <Link href="/panel" className="flex items-center relative group py-2">
          <img
            src="/logo.png"
            alt="Pfaffen Autos"
            className="h-6 w-auto invert brightness-0"
          />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#C1C2C5] hover:text-white"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ================= 2. BARRA LATERAL (SIDEBAR ESTILO MANTINE) ================= */}
      <aside
        className={`fixed print:hidden md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-[280px] bg-[#1A1B1E] border-r border-[#2C2E33] transform transition-transform duration-300 z-40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* USER BUTTON */}
          <div className="flex items-center justify-between p-3 -mx-2 rounded-lg hover:bg-[#25262B] transition-colors cursor-pointer mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0145F2] to-sky-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {userProfile.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-200 truncate pr-2">
                  {userProfile.nombre}
                </span>
                <span className="text-xs text-gray-500 truncate pr-2 capitalize">
                  {userProfile.rol}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
          </div>

          {/* SEARCH BAR MOCKUP */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar"
              className="w-full bg-[#25262B] border border-[#373A40] text-sm text-gray-200 rounded-md pl-9 pr-14 py-2 outline-none focus:border-[#1971C2] transition-colors placeholder:text-gray-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1A1B1E] border border-[#373A40] text-[10px] font-bold text-gray-400 px-1.5 py-0.5 rounded pointer-events-none">
              Ctrl + K
            </div>
          </div>

          {/* ================= SECCIONES ORDENADAS ================= */}

          {/* INVENTARIO */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">
              Inventario
            </div>
            <div className="flex flex-col gap-0.5">
              <NavLinkItem
                icon={Car}
                label="Gestión de Stock"
                href="/panel"
                exact
              />
            </div>
          </div>

          {/* COMERCIAL & CRM */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">
              Comercial & CRM
            </div>
            <div className="flex flex-col gap-0.5">
              <NavLinkItem
                icon={MessageSquareShare}
                label="Tablero Kanban"
                href="/panel/crm"
              />
              <NavLinkItem
                icon={CheckSquare}
                label="Tareas del Equipo"
                href="/panel/tareas"
              />{" "}
              {/* <-- NUEVO */}
              <NavLinkItem
                emoji="📥"
                label="Leads Web (Cotiz / Consig)"
                href="/panel/cotizaciones"
              />
              <NavLinkItem
                icon={Banknote}
                label="Nueva Operación"
                href="/panel/ventas/nueva"
              />
              <NavLinkItem
                icon={UserPlus}
                label="Nuevo Cliente"
                href="/panel/clientes/nuevo"
              />
            </div>
          </div>

          {/* ADMINISTRACIÓN (Protegido por Rol) */}
          {(userProfile.rol === "admin" || userProfile.rol === "encargado") && (
            <div className="mb-auto">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">
                Colecciones
              </div>
              <div className="flex flex-col gap-0.5">
                <NavLinkItem
                  emoji="📝"
                  label="Gestoría"
                  href="/panel/gestoria"
                />
                <NavLinkItem
                  emoji="📊"
                  label="Métricas"
                  href="/panel/metricas"
                />

                {userProfile.rol === "admin" && (
                  <>
                    <NavLinkItem
                      emoji="💰"
                      label="Tesorería y Caja"
                      href="/panel/gastos"
                    />
                    <NavLinkItem
                      emoji="👥"
                      label="Usuarios"
                      href="/panel/usuarios"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          <div className="pt-6 mt-6 border-t border-[#2C2E33]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            >
              <span className="text-base leading-none">🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ================= 3. ÁREA DE CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-16 md:pt-0 bg-[#0b1329] flex flex-col">
        <div className="p-4 md:p-8 w-full flex-1">{children}</div>
      </main>
    </div>
  );
}

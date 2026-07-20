"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Car, 
  PlusCircle, 
  Users, 
  LogOut, 
  Menu, 
  X,
  CarFront
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // Nos permite saber en qué URL estamos
  const router = useRouter();

  // Función para cerrar sesión de forma segura
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Gestión de Stock", href: "/panel", icon: Car },
    { name: "Ingresar Vehículo", href: "/panel/vehiculo/nuevo", icon: PlusCircle },
    { name: "Usuarios", href: "/panel/usuarios", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden text-[#F5F5F3]">
      
      {/* 1. BARRA SUPERIOR (SOLO MÓVIL) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between px-4 z-50">
        <Link href="/panel" className="flex items-center gap-2">
          <CarFront className="w-6 h-6 text-[#0055A4]" />
          <span className="font-serif text-lg tracking-wide text-white">
            PFAFFEN<span className="text-[#0055A4] font-sans font-bold text-xs ml-1">PANEL</span>
          </span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 2. BARRA LATERAL (SIDEBAR) */}
      <aside
        className={`fixed md:static top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-[#0A0A0A] border-r border-white/10 transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex flex-col`}
      >
        {/* Logo (Solo visible en Desktop) */}
        <div className="hidden md:flex h-20 items-center px-6 border-b border-white/10">
          <Link href="/panel" className="flex items-center gap-2">
            <CarFront className="w-7 h-7 text-[#0055A4]" />
            <span className="font-serif text-xl tracking-wide text-white">
              PFAFFEN<span className="text-[#0055A4] font-sans font-bold text-xs ml-1">PANEL</span>
            </span>
          </Link>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} // Cierra el menú en móvil al hacer clic
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#0055A4] text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Botón de Cerrar Sesión abajo de todo */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-[#050505]">
        <div className="p-4 md:p-8">
          {/* Acá Next.js inyecta el contenido de tus páginas (/panel, /panel/nuevo, etc) */}
          {children}
        </div>
      </main>
      
    </div>
  );
}
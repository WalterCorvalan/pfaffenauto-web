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
  ClipboardList
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); 
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Gestión de Stock", href: "/panel", icon: Car },
    { name: "Ingresar Vehículo", href: "/panel/vehiculo/nuevo", icon: PlusCircle },
    { name: "Cotizaciones", href: "/panel/cotizaciones", icon: ClipboardList }, // <-- NUEVA SECCIÓN
    { name: "Usuarios", href: "/panel/usuarios", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#0b1329] overflow-hidden text-slate-100 font-sans">
      
      {/* 1. BARRA SUPERIOR (MÓVIL) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-50 shadow-md">
        <Link href="/panel" className="flex items-center relative group py-2">
          <div className="relative inline-block">
            <img
              src="/logo.png"
              alt="Pfaffen Autos"
              className="h-6 w-auto invert brightness-0"
            />
            <img
              src="/r.png"
              alt="Marca Registrada"
              className="absolute invert brightness-0 -top-1 -right-3 w-2.5 h-2.5 object-contain opacity-80"
            />
          </div>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 hover:text-white">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 2. BARRA LATERAL (SIDEBAR) */}
      <aside
        className={`fixed md:static top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-[#0f172a] border-r border-slate-800/80 transform transition-transform duration-300 z-40 shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } flex flex-col`}
      >
        {/* Logo (Desktop) */}
        <div className="hidden md:flex h-20 items-center px-6 border-b border-slate-800">
          <Link href="/panel" className="flex items-center relative group py-2">
            <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Pfaffen Autos"
                className="h-7 w-auto invert brightness-0"
              />
              <img
                src="/r.png"
                alt="Marca Registrada"
                className="absolute invert brightness-0 -top-1 -right-3.5 w-3 h-3 object-contain opacity-80"
              />
            </div>
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
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#0ea5e9] text-white shadow-lg shadow-sky-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 3. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 bg-[#0b1329]">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CarFront, Plus, LayoutDashboard } from "lucide-react";

export default function PanelPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>("");
  const router = useRouter();

  useEffect(() => {
    // Función que verifica si el usuario tiene permiso para estar acá
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si no hay sesión activa, lo mandamos al login
        router.push("/login");
      } else {
        // Si todo está bien, lo dejamos pasar y guardamos su email
        setUserEmail(session.user.email);
        setLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex justify-center items-center">
        <p className="text-[#0055A4] font-bold animate-pulse">Cargando panel seguro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#F5F5F3] flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-[#0055A4]" />
              Centro de Gestión
            </h1>
            <p className="text-gray-400 mt-1">
              Sesión iniciada como: <span className="text-[#F5F5F3] font-medium">{userEmail}</span>
            </p>
          </div>
          
          <button className="flex items-center justify-center gap-2 bg-[#0055A4] hover:bg-[#1E6FD9] text-white px-6 py-3 rounded-md font-bold transition-colors">
            <Plus className="w-5 h-5" />
            Ingresar Nuevo Auto
          </button>
        </div>

        {/* Grilla de Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#0055A4]/10 rounded-full flex items-center justify-center mb-4">
              <CarFront className="w-8 h-8 text-[#0055A4]" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F3] mb-2">Stock Activo</h3>
            <p className="text-gray-400 text-sm mb-4">
              Administrar precios, fotos y estado de los vehículos disponibles.
            </p>
            <button className="mt-auto text-[#0055A4] font-bold hover:text-[#1E6FD9] transition-colors">
              Ver inventario completo →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
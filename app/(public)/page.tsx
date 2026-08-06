"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Hero from "@/components/Hero";
import Stock from "@/components/Stock";
import ComparadorModal from "@/components/ComparadorModal";
import { Scale } from "lucide-react";
// ... (importás el resto de tus componentes)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function Page() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [isComparadorOpen, setIsComparadorOpen] = useState(false);
  const [autosComparar, setAutosComparar] = useState<any[]>([]);

  useEffect(() => {
    async function cargarVehiculos() {
      const { data } = await supabase
        .from("vehiculos")
        .select(`*, multimedia_vehiculos ( url_archivo ), sucursales ( nombre )`)
        .in("estado", ["Disponible", "Reservado"])
        .order("created_at", { ascending: false });
      
      if (data) setVehiculos(data);
    }
    cargarVehiculos();
  }, []);

  const manejarSeleccionComparar = (auto: any) => {
    setAutosComparar((prev) => {
      const yaExiste = prev.some((a) => a.id === auto.id);
      if (yaExiste) return prev.filter((a) => a.id !== auto.id);
      if (prev.length >= 3) {
        alert("Solo podés comparar hasta 3 vehículos a la vez.");
        return prev;
      }
      return [...prev, auto];
    });
  };

  return (
    <main className="w-full bg-[#E9ECEF] min-h-screen relative">
      <Hero />
      <Stock 
        vehiculos={vehiculos} 
        onSelectParaComparar={manejarSeleccionComparar}
        autosParaComparar={autosComparar}
      />
      {/* ... el resto de tus componentes ... */}

      {autosComparar.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsComparadorOpen(true)}
            className="bg-[#0b1329] text-white px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/20 backdrop-blur-md"
          >
            <Scale className="w-4 h-4 text-sky-400" />
            Comparar vehículos ({autosComparar.length}/3)
          </button>
        </div>
      )}

      <ComparadorModal
        isOpen={isComparadorOpen}
        onClose={() => setIsComparadorOpen(false)}
        autos={autosComparar}
        removerAuto={(id) => setAutosComparar(prev => prev.filter(a => a.id !== id))}
      />
    </main>
  );
}
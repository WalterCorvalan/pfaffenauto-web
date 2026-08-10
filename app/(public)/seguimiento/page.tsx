"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CarFront } from "lucide-react";

export default function BuscarSeguimientoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    router.push(`/seguimiento/${codigo.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
          <CarFront className="w-7 h-7 text-[#0145F2]" />
        </div>
        <h1 className="text-2xl font-black text-navy mb-2">Seguí tu operación</h1>
        <p className="text-sm text-slate-500 mb-6">
          Ingresá el código que te compartió tu asesor para ver el estado de tu compra.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ej: A3F7K2M9"
            maxLength={8}
            className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-navy outline-none focus:border-[#0145F2] transition-colors text-center"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#0145F2] hover:bg-blue-600 text-white font-black px-5 rounded-xl transition-colors shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

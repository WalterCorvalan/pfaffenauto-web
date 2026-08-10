"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ArrowRight } from "lucide-react";

export default function Seguimiento() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    router.push(`/seguimiento/${codigo.trim().toUpperCase()}`);
  };

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          
          {/* Texto explicativo */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#0145F2] text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Estado en tiempo real
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
              ¿Compraste un vehículo?
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              Ingresá tu código de reserva para ver los avances de tu documentación y fecha de entrega.
            </p>
          </div>

          {/* Formulario buscador */}
          <div className="w-full md:w-auto shrink-0">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="CÓDIGO (EJ: A3F7K2M9)"
                  maxLength={8}
                  className="w-full sm:w-64 bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-widest text-[#0f172a] placeholder:text-slate-400 placeholder:normal-case outline-none focus:border-[#0145F2] focus:ring-2 focus:ring-[#0145F2]/10 transition-all text-center sm:text-left"
                />
              </div>

              <button
                type="submit"
                className="bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer"
              >
                <span>Consultar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
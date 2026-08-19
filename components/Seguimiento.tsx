"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Search, MapPin, FileText, Wallet } from "lucide-react";

export default function Seguimiento() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    router.push(`/seguimiento/${codigo.trim().toUpperCase()}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fuerzo mayúsculas automáticamente para mejor experiencia de usuario
    setCodigo(e.target.value.toUpperCase());
  };

  return (
    <section className="relative py-20 lg:py-28 bg-[#F8FAFC] dark:bg-[#0a0a0f] overflow-hidden border-y border-slate-100 dark:border-transparent">
      {/* Luz decorativa de fondo */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-[#0145F2]/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* ================= COLUMNA IZQUIERDA ================= */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#0145F2]/10 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 w-max mx-auto lg:mx-0">
              <ShieldCheck className="w-4 h-4" /> Seguimiento Transparente
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              Seguí el camino de tu nuevo auto.
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
              Ingresá el código único de 8 caracteres que te enviamos por WhatsApp al momento de señar o comprar tu vehículo para acceder a tu panel privado.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6">
              <div className="flex items-center gap-3 text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[#0145F2] dark:text-sky-400 shadow-sm shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                Entrega
              </div>
              <div className="flex items-center gap-3 text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[#0145F2] dark:text-sky-400 shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                Documentación
              </div>
              <div className="flex items-center gap-3 text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[#0145F2] dark:text-sky-400 shadow-sm shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                Saldos
              </div>
            </div>
          </div>

          {/* ================= COLUMNA DERECHA (BUSCADOR) ================= */}
          <div className="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0 mt-8 lg:mt-0">
            {/* Fondo con blur tipo aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0145F2]/20 to-sky-400/20 dark:from-blue-600/20 dark:to-sky-400/10 blur-2xl rounded-[3rem] transform -rotate-6" />
            
            <form 
              onSubmit={handleSubmit} 
              className="relative bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Consultar Operación
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-2 text-center">
                    Ingresá tu código
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={handleChange}
                    placeholder="A3F7K2M9"
                    maxLength={8}
                    autoComplete="off"
                    className="w-full bg-[#F8FAFC] dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-4 text-center text-2xl font-mono font-black tracking-[0.25em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-[#0145F2]/10 dark:focus:ring-sky-400/10 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!codigo.trim()}
                  className="w-full mt-6 bg-[#0145F2] hover:bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none active:scale-[0.98] cursor-pointer"
                >
                  <span>Ver Estado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
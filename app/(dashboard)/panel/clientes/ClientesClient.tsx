"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, UserPlus, Phone, Mail, MapPin, User, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono_celular: string | null;
  correo_electronico: string | null;
  localidad: string | null;
  created_at: string;
  sucursales: { nombre: string }[] | { nombre: string } | null;
}

function nombreSucursal(s: Cliente["sucursales"]) {
  if (!s) return null;
  return Array.isArray(s) ? s[0]?.nombre : s.nombre;
}

export default function ClientesClient({ clientesIniciales }: { clientesIniciales: Cliente[] }) {
  const [query, setQuery] = useState("");

  const clientesFiltrados = useMemo(() => {
    if (!query.trim()) return clientesIniciales;
    const q = query.trim().toLowerCase();
    return clientesIniciales.filter((c) => {
      const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(q) ||
        (c.dni || "").includes(q) ||
        (c.telefono_celular || "").includes(q) ||
        (c.correo_electronico || "").toLowerCase().includes(q)
      );
    });
  }, [clientesIniciales, query]);

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] dark:bg-[#030303] overflow-hidden relative">
      
      {/* ================= HEADER FLOTANTE ================= */}
      <header className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-[#0145F2] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Directorio de Clientes
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {clientesIniciales.length} Registros
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#0145F2] dark:group-focus-within:text-sky-400 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nombre, DNI o celular..."
              className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-[#0145F2]/30 dark:focus:border-sky-400/30 rounded-lg py-2 pl-9 pr-4 text-xs outline-none focus:bg-white dark:focus:bg-[#111] focus:ring-4 focus:ring-[#0145F2]/10 dark:focus:ring-sky-400/10 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
            />
          </div>
          <Link
            href="/panel/clientes/nuevo"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[#0145F2] hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm active:scale-95 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" /> Nuevo Cliente
          </Link>
        </div>
      </header>

      {/* ================= GRILLA DE CLIENTES (TARJETAS CUADRADAS) ================= */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            {clientesFiltrados.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center text-center py-24 px-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm"
              >
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight mb-1">
                  {query ? "No hay coincidencias" : "Directorio vacío"}
                </h3>
                <p className="max-w-sm text-xs font-medium text-slate-500 dark:text-slate-400">
                  {query ? "Intentá buscando con otro número o apellido." : "Comenzá agregando tu primer contacto."}
                </p>
              </motion.div>
            ) : (
              <motion.ul 
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                // Acá armamos la grilla que hace que sean tarjetas cuadradas
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
              >
                {clientesFiltrados.map((c) => {
                  const esNombreVacio = !c.nombre || c.nombre.trim() === "." || c.nombre.trim() === "";
                  const esApellidoVacio = !c.apellido || c.apellido.trim() === "." || c.apellido.trim() === "";
                  const nombreMostrar = esNombreVacio && esApellidoVacio ? "Cliente sin nombre" : `${c.nombre || ""} ${c.apellido || ""}`.trim();
                  
                  const iniciales = esNombreVacio 
                    ? <User className="w-5 h-5 opacity-50" /> 
                    : `${c.nombre?.charAt(0) || ""}${c.apellido?.charAt(0) || ""}`.toUpperCase();

                  return (
                    <motion.li
                      key={c.id}
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                      className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[1.25rem] p-5 hover:shadow-lg dark:hover:border-white/10 hover:border-blue-200 transition-all duration-300 flex flex-col aspect-auto sm:aspect-square justify-between relative"
                    >
                      {/* Cabecera de la tarjeta: Avatar + Botón Editar */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-white/10 shadow-inner">
                          {iniciales}
                        </div>
                        
                        {/* Botón Editar */}
                        <Link 
                          href={`/panel/clientes/${c.id}/editar`}
                          className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-[#0145F2] hover:text-white text-slate-400 rounded-xl transition-colors active:scale-95"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                      
                      {/* Información Principal */}
                      <div className="mb-4">
                        <h3 className={`text-base font-black tracking-tight leading-tight line-clamp-2 mb-1.5 ${esNombreVacio && esApellidoVacio ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white'}`}>
                          {nombreMostrar}
                        </h3>
                        {c.dni && c.dni !== "." && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                            DNI {c.dni}
                          </span>
                        )}
                      </div>
                      
                      {/* Píldoras de contacto apiladas */}
                      <div className="flex flex-col gap-1.5 mt-auto">
                        {c.telefono_celular && c.telefono_celular !== "." && (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 truncate">
                            <Phone className="w-3.5 h-3.5 text-[#0145F2] dark:text-sky-400 shrink-0" /> 
                            <span className="truncate">{c.telefono_celular}</span>
                          </div>
                        )}
                        {c.correo_electronico && c.correo_electronico !== "." && (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 truncate">
                            <Mail className="w-3.5 h-3.5 text-[#0145F2] dark:text-sky-400 shrink-0" /> 
                            <span className="truncate">{c.correo_electronico}</span>
                          </div>
                        )}
                        {(c.localidad || nombreSucursal(c.sucursales)) && (
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 px-1 py-1 truncate mt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">
                              {[c.localidad, nombreSucursal(c.sucursales)].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                        )}
                      </div>

                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
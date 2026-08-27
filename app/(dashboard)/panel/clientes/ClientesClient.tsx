"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, UserPlus, Phone, Mail, MapPin, User, Edit2, MessageCircle, CheckCircle2, Circle, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono_celular: string | null;
  correo_electronico: string | null;
  localidad: string | null;
  created_at: string;
  estado_contacto: string;
  ultimo_contacto: string | null;
  ops: number;
  sucursales: { nombre: string }[] | { nombre: string } | null;
}

type Tab = "todos" | "sin_contactar" | "contactados" | "compraron";

const TABS: { id: Tab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "sin_contactar", label: "Sin contactar" },
  { id: "contactados", label: "Contactados" },
  { id: "compraron", label: "Compraron" },
];

function nombreSucursal(s: Cliente["sucursales"]) {
  if (!s) return null;
  return Array.isArray(s) ? s[0]?.nombre : s.nombre;
}

function formatearUltimoContacto(fecha: string | null) {
  if (!fecha) return "Sin contactar todavía";
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return "Contactado hoy";
  if (dias === 1) return "Contactado ayer";
  return `Hace ${dias} días`;
}

function nombreMostrarDe(c: Cliente) {
  const esNombreVacio = !c.nombre || c.nombre.trim() === "." || c.nombre.trim() === "";
  const esApellidoVacio = !c.apellido || c.apellido.trim() === "." || c.apellido.trim() === "";
  return esNombreVacio && esApellidoVacio ? "Cliente sin nombre" : `${c.nombre || ""} ${c.apellido || ""}`.trim();
}

export default function ClientesClient({ clientesIniciales }: { clientesIniciales: Cliente[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("todos");
  const [clientes, setClientes] = useState(clientesIniciales);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const stats = useMemo(() => {
    const sinContactar = clientes.filter((c) => c.estado_contacto !== "Contactado").length;
    const contactados = clientes.filter((c) => c.estado_contacto === "Contactado").length;
    const compraron = clientes.filter((c) => c.ops > 0).length;
    return { total: clientes.length, sinContactar, contactados, compraron };
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    let lista = clientes;
    if (tab === "sin_contactar") lista = lista.filter((c) => c.estado_contacto !== "Contactado");
    if (tab === "contactados") lista = lista.filter((c) => c.estado_contacto === "Contactado");
    if (tab === "compraron") lista = lista.filter((c) => c.ops > 0);

    if (!query.trim()) return lista;
    const q = query.trim().toLowerCase();
    return lista.filter((c) => {
      const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(q) ||
        (c.dni || "").includes(q) ||
        (c.telefono_celular || "").includes(q) ||
        (c.correo_electronico || "").toLowerCase().includes(q)
      );
    });
  }, [clientes, query, tab]);

  const toggleContacto = async (c: Cliente) => {
    const nuevoEstado = c.estado_contacto === "Contactado" ? "Sin contactar" : "Contactado";
    const nuevoUltimoContacto = nuevoEstado === "Contactado" ? new Date().toISOString() : c.ultimo_contacto;
    setActualizando(c.id);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({ estado_contacto: nuevoEstado, ultimo_contacto: nuevoUltimoContacto })
        .eq("id", c.id);
      if (error) throw error;
      setClientes((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, estado_contacto: nuevoEstado, ultimo_contacto: nuevoUltimoContacto } : x))
      );
    } catch {
      alert("No se pudo actualizar el estado de contacto.");
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] dark:bg-[#030303] overflow-hidden relative">

      {/* ================= HEADER FLOTANTE ================= */}
      <header className="sticky top-0 z-30 flex flex-col gap-4 px-6 py-4 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  {clientes.length} Registros
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
        </div>

        {/* ================= STATS + TABS ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((t) => {
              const count = t.id === "todos" ? stats.total : t.id === "sin_contactar" ? stats.sinContactar : t.id === "contactados" ? stats.contactados : stats.compraron;
              const activo = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-colors ${
                    activo
                      ? "bg-[#0145F2] border-[#0145F2] text-white shadow-sm"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10"
                  }`}
                >
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activo ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ================= LISTA DE CLIENTES ================= */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto">

          {clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight mb-1">
                {query ? "No hay coincidencias" : "No hay clientes en esta vista"}
              </h3>
              <p className="max-w-sm text-xs font-medium text-slate-500 dark:text-slate-400">
                {query ? "Intentá buscando con otro número o apellido." : "Cambiá de pestaña o agregá tu primer contacto."}
              </p>
            </div>
          ) : (
            <>
              {/* ---- TABLA (desktop) ---- */}
              <div className="hidden lg:block bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                      <th className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Contacto</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Localidad</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Ops.</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Seguimiento</th>
                      <th className="px-4 py-3 w-px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => {
                      const contactado = c.estado_contacto === "Contactado";
                      const telLimpio = (c.telefono_celular || "").replace(/\D/g, "");
                      const nombreMostrar = nombreMostrarDe(c);
                      const esVacio = nombreMostrar === "Cliente sin nombre";
                      const iniciales = esVacio ? <User className="w-4 h-4 opacity-50" /> : `${c.nombre?.charAt(0) || ""}${c.apellido?.charAt(0) || ""}`.toUpperCase();

                      return (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200 dark:border-white/10">
                                {iniciales}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${esVacio ? "text-slate-400 italic" : "text-slate-900 dark:text-white"}`}>{nombreMostrar}</p>
                                {c.dni && c.dni !== "." && <p className="text-[10px] font-semibold text-slate-400">DNI {c.dni}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              {c.telefono_celular && c.telefono_celular !== "." && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  <Phone className="w-3 h-3 text-[#0145F2] dark:text-sky-400 shrink-0" /> {c.telefono_celular}
                                </span>
                              )}
                              {c.correo_electronico && c.correo_electronico !== "." && (
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                                  <Mail className="w-3 h-3 shrink-0" /> {c.correo_electronico}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(c.localidad || nombreSucursal(c.sucursales)) && (
                              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                {[c.localidad, nombreSucursal(c.sucursales)].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {c.ops > 0 ? (
                              <span
                                title={`${c.ops} operación${c.ops === 1 ? "" : "es"} (señas/boletos/tasaciones)`}
                                className="inline-flex items-center gap-1 text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20"
                              >
                                <ShoppingBag className="w-3 h-3" /> {c.ops}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleContacto(c)}
                                disabled={actualizando === c.id}
                                title={contactado ? "Marcar como Sin contactar" : "Marcar como Contactado"}
                                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 whitespace-nowrap ${
                                  contactado
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100"
                                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100"
                                }`}
                              >
                                {contactado ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
                                {formatearUltimoContacto(c.ultimo_contacto)}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 w-px whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {telLimpio && (
                                <a
                                  href={`https://wa.me/${telLimpio}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Contactar por WhatsApp"
                                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors active:scale-95"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <Link
                                href={`/panel/clientes/${c.id}/editar`}
                                title="Editar cliente"
                                className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-[#0145F2] hover:text-white text-slate-400 rounded-lg transition-colors active:scale-95"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ---- TARJETAS (mobile/tablet) ---- */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                {clientesFiltrados.map((c) => {
                  const nombreMostrar = nombreMostrarDe(c);
                  const esVacio = nombreMostrar === "Cliente sin nombre";
                  const iniciales = esVacio ? <User className="w-5 h-5 opacity-50" /> : `${c.nombre?.charAt(0) || ""}${c.apellido?.charAt(0) || ""}`.toUpperCase();
                  const contactado = c.estado_contacto === "Contactado";
                  const telLimpio = (c.telefono_celular || "").replace(/\D/g, "");

                  return (
                    <li
                      key={c.id}
                      className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[1.25rem] p-5 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-white/10 shadow-inner">
                          {iniciales}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {c.ops > 0 && (
                            <span className="inline-flex items-center justify-center text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                              {c.ops} Ops.
                            </span>
                          )}
                          <Link
                            href={`/panel/clientes/${c.id}/editar`}
                            className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-[#0145F2] hover:text-white text-slate-400 rounded-xl transition-colors active:scale-95"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      <div>
                        <h3 className={`text-base font-black tracking-tight leading-tight line-clamp-2 mb-1.5 ${esVacio ? "text-slate-400 italic" : "text-slate-900 dark:text-white"}`}>
                          {nombreMostrar}
                        </h3>
                        {c.dni && c.dni !== "." && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                            DNI {c.dni}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
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

                        <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-slate-100 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => toggleContacto(c)}
                            disabled={actualizando === c.id}
                            title={contactado ? "Marcar como Sin contactar" : "Marcar como Contactado"}
                            className={`flex-1 min-w-0 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              contactado
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100"
                            }`}
                          >
                            {contactado ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">{formatearUltimoContacto(c.ultimo_contacto)}</span>
                          </button>
                          {telLimpio && (
                            <a
                              href={`https://wa.me/${telLimpio}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contactar por WhatsApp"
                              className="shrink-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

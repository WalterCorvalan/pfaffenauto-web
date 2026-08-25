"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { notificarPersonaCliente } from "@/lib/notificarPersonaCliente";
import { ExternalLink, MessageCircle, Globe, Handshake } from "lucide-react";

const ESTADOS = ["Nuevo", "Contactado", "Interesado", "Cliente", "Perdido"];

const ESTILO_ESTADO: Record<string, string> = {
  Nuevo: "bg-amber-500 text-white border-amber-500",
  Contactado: "bg-amber-500 text-white border-amber-500",
  Interesado: "bg-amber-500 text-white border-amber-500",
  Cliente: "bg-emerald-500 text-white border-emerald-500",
  Perdido: "bg-rose-500 text-white border-rose-500",
};

const BORDE_ESTADO: Record<string, string> = {
  Nuevo: "border-l-amber-400",
  Contactado: "border-l-amber-400",
  Interesado: "border-l-amber-400",
  Cliente: "border-l-emerald-400",
  Perdido: "border-l-rose-400",
};

const ESTILO_CALIFICACION: Record<string, string> = {
  caliente: "bg-rose-500 text-white border-rose-500",
  tibio: "bg-amber-500 text-white border-amber-500",
  frio: "bg-slate-400 text-white border-slate-400",
};

const ESTILO_ORIGEN: Record<string, { color: string; icono: React.ReactNode }> = {
  whatsapp: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icono: <MessageCircle className="w-3 h-3" /> },
  consignacion: { color: "bg-purple-50 text-purple-700 border-purple-200", icono: <Handshake className="w-3 h-3" /> },
  default: { color: "bg-sky-50 text-sky-700 border-sky-200", icono: <Globe className="w-3 h-3" /> },
};

const AVATAR_COLORES = [
  "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-purple-500", "bg-teal-500",
];
const colorAvatar = (id: string) => AVATAR_COLORES[id.charCodeAt(0) % AVATAR_COLORES.length];

export default function LeadsTable({
  leads,
  vendedores,
  sucursales,
  onCambiarEstado,
}: {
  leads: any[];
  vendedores: { id: string; nombre: string }[];
  sucursales: { id: string; nombre: string }[];
  onCambiarEstado: (lead: any, nuevoEstado: string) => void;
}) {
  const [reasignando, setReasignando] = useState<string | null>(null);
  const [overrideVendedor, setOverrideVendedor] = useState<Record<string, string | null>>({});
  const [overrideSucursal, setOverrideSucursal] = useState<Record<string, string>>({});
  const [guardandoSucursal, setGuardandoSucursal] = useState<string | null>(null);

  const reasignar = async (lead: any, vendedorId: string) => {
    setReasignando(lead.id);
    const tabla = lead.origen === "whatsapp" ? "whatsapp_conversaciones" : lead.origen === "instagram" ? "instagram_conversaciones" : "cotizaciones";
    const { error } = await supabase.from(tabla).update({ vendedor_id: vendedorId || null }).eq("id", lead.id);
    setReasignando(null);
    if (error) return alert("Error al reasignar.");
    setOverrideVendedor((prev) => ({ ...prev, [lead.id]: vendedorId || null }));
    if (vendedorId) {
      notificarPersonaCliente({
        perfilId: vendedorId,
        tipo: "nuevo_lead",
        mensaje: `Te asignaron el lead de ${lead.nombre}.`,
        link: `/panel/crm/${lead.id}`,
        seccion: "crm",
      });
    }
  };

  // sucursal_preferida es un campo de cotizaciones — leads de WhatsApp/Instagram
  // no lo tienen, por eso el selector de sucursal se oculta para ambos orígenes.
  const cambiarSucursal = async (lead: any, sucursalNombre: string) => {
    setGuardandoSucursal(lead.id);
    const { error } = await supabase.from("cotizaciones").update({ sucursal_preferida: sucursalNombre }).eq("id", lead.id);
    setGuardandoSucursal(null);
    if (error) return alert("Error al cambiar la sucursal.");
    setOverrideSucursal((prev) => ({ ...prev, [lead.id]: sucursalNombre }));
  };

  const origenInfo = (lead: any) => {
    if (lead.origen === "whatsapp") {
      return { texto: lead.origen_ads ? `WhatsApp (${lead.origen_ads})` : "WhatsApp", ...ESTILO_ORIGEN.whatsapp };
    }
    if (lead.tipo_peritaje === "consignacion") {
      return { texto: "Consignación", ...ESTILO_ORIGEN.consignacion };
    }
    if (lead.tipo_peritaje) {
      return { texto: lead.tipo_peritaje.charAt(0).toUpperCase() + lead.tipo_peritaje.slice(1), ...ESTILO_ORIGEN.default };
    }
    return { texto: "Cotización Web", ...ESTILO_ORIGEN.default };
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 dark:bg-[#00246b] text-white text-[10px] uppercase tracking-widest font-bold">
                <th className="p-3 pl-4">Lead</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Vendedor Asignado</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Sucursal</th>
                <th className="p-3">Ingreso</th>
                <th className="p-3 pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
              {leads.map((lead) => {
                const vendedorActualId = overrideVendedor[lead.id] !== undefined ? overrideVendedor[lead.id] : lead.vendedor_id;
                const esWhatsapp = lead.origen === "whatsapp";
                const esInstagram = lead.origen === "instagram";
                const estadoActual = esWhatsapp ? (lead.estado_pipeline || lead.estado || "Nuevo") : (lead.estado || "Nuevo");
                const badgeCalificacion = (esWhatsapp || esInstagram) && lead.calificacion
                  ? { texto: lead.calificacion.charAt(0).toUpperCase() + lead.calificacion.slice(1), color: ESTILO_CALIFICACION[lead.calificacion] || ESTILO_CALIFICACION.frio }
                  : null;
                const origen = origenInfo(lead);
                const sucursalActual = overrideSucursal[lead.id] !== undefined ? overrideSucursal[lead.id] : (lead.sucursal_preferida || "");
                const href = lead.origen === "cotizacion" ? `/panel/crm/${lead.id}` : `/panel/chat?conversacion=${lead.id}&canal=${esInstagram ? "instagram" : "whatsapp"}`;

                return (
                  <tr key={lead.id} className={`hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors border-l-4 ${BORDE_ESTADO[estadoActual] || "border-l-slate-200"}`}>
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${colorAvatar(lead.id)}`}>
                          {lead.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{lead.nombre}</p>
                          {badgeCalificacion && (
                            <span className={`inline-block mt-0.5 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeCalificacion.color}`}>
                              {badgeCalificacion.texto}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border ${origen.color}`}>
                        {origen.icono} {origen.texto}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={vendedorActualId || ""}
                        disabled={reasignando === lead.id}
                        onChange={(e) => reasignar(lead, e.target.value)}
                        className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-indigo-500 cursor-pointer text-slate-800 dark:text-slate-200 disabled:opacity-50 hover:bg-white dark:hover:bg-[#002a6e] transition-colors"
                      >
                        <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
                        {vendedores.map((v) => (
                          <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={estadoActual}
                        onChange={(e) => onCambiarEstado(lead, e.target.value)}
                        className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 ${ESTILO_ESTADO[estadoActual] || ESTILO_ESTADO.Nuevo}`}
                      >
                        {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
                      </select>
                    </td>
                    <td className="p-3">
                      {esWhatsapp || esInstagram ? (
                        <span className="text-[12px] text-slate-400 dark:text-slate-500 italic">—</span>
                      ) : (
                        <select
                          value={sucursalActual}
                          disabled={guardandoSucursal === lead.id}
                          onChange={(e) => cambiarSucursal(lead, e.target.value)}
                          className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-2.5 py-1.5 text-[12px] font-medium outline-none focus:border-indigo-500 cursor-pointer text-slate-800 dark:text-slate-200 disabled:opacity-50 hover:bg-white dark:hover:bg-[#002a6e] transition-colors"
                        >
                          <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin definir</option>
                          {sucursales.map((s) => (
                            <option key={s.id} value={s.nombre} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="p-3 text-[12px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors shadow-sm"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                    Sin leads para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Globe, MessageSquareText, CheckCircle2, XCircle, ImageIcon, FileVideo, MapPin, CalendarDays, User, Phone, Mail, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2 whitespace-pre-wrap">{valor ?? "—"}</p>
    </div>
  );
}

const money = (v: number | null | undefined) => (v != null ? `$ ${Number(v).toLocaleString("es-AR")}` : "—");

const ESTADO_LABEL: Record<string, { texto: string; clase: string }> = {
  nuevo: { texto: "Nuevo", clase: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200 dark:border-sky-500/20" },
  en_gestion: { texto: "En gestión", clase: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200 dark:border-amber-500/20" },
  descartado: { texto: "Descartado", clase: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-slate-200 dark:border-white/10" },
};

interface Perfil { id: string; nombre: string; roles: string[] }

// Vista de detalle de un lead_tasacion (Compra/Permuta pedida desde
// /cotizador) -- rediseño del 26/9: antes era una lista plana de campos
// todos con el mismo peso visual, sin ninguna acción real más que el link
// de WhatsApp (había que ir a la lista de atrás para cambiar el estado).
// Ahora: header con foto de portada + nombre + estado, comparación de
// precios destacada arriba de todo (lo primero que necesita el asesor),
// galería más grande, y las 3 acciones reales (estado, vendedor, WhatsApp)
// en una barra fija abajo -- convertir a peritaje formal se sigue haciendo
// desde el módulo Peritajes (cruza a otra tabla, no se duplica acá).
export default function LeadWebDetalleModal({
  lead: s, vehiculoObjetivo, perfiles = [], onCambiarEstado, onAsignarVendedor, onClose,
}: {
  lead: any;
  vehiculoObjetivo?: { marca: string; modelo: string; anio: number; patente: string | null; precio_venta: number; moneda_venta: string; estado: string } | null;
  perfiles?: Perfil[];
  onCambiarEstado?: (estado: string) => void;
  onAsignarVendedor?: (vendedorId: string) => void;
  onClose: () => void;
}) {
  const fotos: string[] = Array.isArray(s.fotos_y_videos) ? s.fotos_y_videos : [];
  const esVideo = (url: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const portada = fotos.find((url) => !esVideo(url)) || null;
  const estadoActual = s.estado || "nuevo";
  const vendedores = perfiles.filter((p) => p.roles?.includes("ventas") || p.roles?.includes("encargado"));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* HEADER — foto de portada de fondo (si hay) + nombre/tipo/estado, lo primero que se ve */}
        <div className="relative shrink-0">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada} alt="" className="w-full h-28 object-cover" />
          ) : (
            <div className="w-full h-16 bg-gradient-to-br from-[#0145F2]/10 to-indigo-100 dark:from-[#0145F2]/10 dark:to-indigo-950/40" />
          )}
          <div className={portada ? "absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" : ""} />
          <button onClick={onClose} className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${portada ? "bg-black/30 text-white hover:bg-black/50" : "bg-white/80 dark:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>
            <X className="w-4 h-4" />
          </button>
          <div className={`absolute bottom-3 left-4 right-14 flex items-center gap-2 flex-wrap ${portada ? "" : "static px-4 pb-2"}`}>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${s.tipo === "permuta" ? "bg-indigo-500 text-white" : "bg-orange-500 text-white"}`}>
              {s.tipo === "permuta" ? "Permuta" : "Compra"}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 border ${ESTADO_LABEL[estadoActual]?.clase || ESTADO_LABEL.nuevo.clase}`}>
              {ESTADO_LABEL[estadoActual]?.texto || estadoActual}
            </span>
          </div>
        </div>

        <div className="px-5 pt-3 pb-1 flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-[#0145F2]/10 dark:bg-[#0145F2]/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-[#0145F2]" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 dark:text-white truncate">{s.nombre || "Sin nombre"}</h2>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1"><Globe className="w-3 h-3" /> {[s.marca, s.modelo, s.anio].filter(Boolean).join(" ") || "—"}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* PRECIOS — lo que el asesor necesita ver primero, destacado */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2.5 border bg-slate-50/60 dark:bg-white/[0.02] border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pide el cliente</p>
              <p className="text-lg font-black mt-0.5 text-slate-800 dark:text-white">{money(s.precio_esperado_cliente)}</p>
            </div>
            <div className="rounded-xl px-3 py-2.5 border bg-[#0145F2]/5 border-[#0145F2]/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0145F2] dark:text-sky-300 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Precio de mercado</p>
              <p className="text-lg font-black mt-0.5 text-[#0145F2] dark:text-sky-300">{money(s.precio_mercado_estimado)}</p>
              {/* precio_mercado_estimado ya viene con el descuento por km
                  aplicado sobre la media que encontró la IA (pedido del
                  26/9) -- se deja el desglose acá para que el asesor vea de
                  dónde sale el número, no que parezca sacado de la nada. */}
              {s.precio_mercado_medio_web != null && (
                <p className="text-[10px] text-slate-400 mt-1">Media web: {money(s.precio_mercado_medio_web)}{s.precio_mercado_descuento_pct != null ? ` · -${s.precio_mercado_descuento_pct}% por km` : ""}</p>
              )}
            </div>
          </div>

          {s.precio_mercado_estimado != null && Array.isArray(s.precio_mercado_fuentes) && s.precio_mercado_fuentes.length > 0 && (
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Fuentes del precio de mercado</p>
              <div className="flex flex-col gap-0.5">
                {s.precio_mercado_fuentes.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0145F2] dark:text-sky-300 hover:underline truncate">{url}</a>
                ))}
              </div>
            </div>
          )}

          {/* Legacy: leads enviados antes del 26/9 todavía tienen esta
              "oferta calculada" con descuento fijo -- se sigue mostrando
              para no perder el dato histórico, pero ningún lead nuevo la trae. */}
          {s.oferta_calculada != null && (
            <div className="rounded-xl px-3 py-2.5 border bg-slate-50/60 dark:bg-white/[0.02] border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Oferta calculada (histórico, previo al 26/9)</p>
              <p className="text-sm font-black mt-0.5 text-slate-600 dark:text-slate-300">{money(s.oferta_calculada)}{s.descuento_pct != null ? ` (-${s.descuento_pct}%)` : ""}</p>
            </div>
          )}

          {s.acepta_oferta != null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${s.acepta_oferta ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
              {s.acepta_oferta ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span className="text-xs font-bold">{s.acepta_oferta ? "El cliente aceptó la oferta calculada" : "El cliente prefirió un peritaje presencial"}</span>
            </div>
          )}

          {/* FOTOS — grilla más grande (2 columnas en vez de 3) y con lightbox,
              es el dato que más ayuda a evaluar el estado real del auto. */}
          {fotos.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Fotos y videos ({fotos.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {fotos.map((url) => (
                  <button
                    key={url}
                    onClick={() => (esVideo(url) ? window.open(url, "_blank") : setFotoAmpliada(url))}
                    className="relative block aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5"
                  >
                    {esVideo(url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileVideo className="w-6 h-6 text-slate-400" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Foto del vehículo" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {s.quiere_venir_sucursal && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Visita reservada</p>
              <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.sucursal_preferida || "—"}</span>
              </div>
            </div>
          )}

          {fotos.length === 0 && !s.quiere_venir_sucursal && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2.5">
              <ImageIcon className="w-3.5 h-3.5" /> Sin fotos ni videos adjuntos.
            </div>
          )}

          {/* DATOS DE CONTACTO y VEHÍCULO — agrupados abajo, ya con el resumen visual arriba no hace falta que compitan por atención */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Contacto</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Teléfono" valor={s.telefono ? <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {s.telefono}</span> : null} />
              <Fila label="Email" valor={s.email ? <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {s.email}</span> : null} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vehículo que nos ofrece</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Versión" valor={s.version} />
              <Fila label="Km" valor={s.kilometraje != null ? Number(s.kilometraje).toLocaleString("es-AR") : null} />
              <Fila label="Combustible" valor={s.combustible} />
              <Fila label="GNC" valor={s.gnc} />
            </div>
          </div>

          {s.tipo === "permuta" && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-1.5">Auto nuestro que quiere a cambio (permuta)</p>
              <div className="bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-3">
                {vehiculoObjetivo ? (
                  <>
                    <Fila label="Descripción" valor={[vehiculoObjetivo.marca, vehiculoObjetivo.modelo, vehiculoObjetivo.anio].filter(Boolean).join(" ")} />
                    <Fila label="Patente" valor={vehiculoObjetivo.patente} />
                    <Fila label="Precio" valor={`${vehiculoObjetivo.moneda_venta} ${Number(vehiculoObjetivo.precio_venta).toLocaleString("es-AR")}`} />
                    <Fila label="Estado en stock" valor={vehiculoObjetivo.estado} />
                  </>
                ) : (
                  <p className="text-sm text-slate-400 py-2">No se encontró el auto (puede haberse vendido o eliminado del stock).</p>
                )}
              </div>
            </div>
          )}

          {(s.utm_source || s.utm_medium || s.utm_campaign || s.canal_origen) && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Origen</p>
              <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
                <Fila label="Canal" valor={s.canal_origen} />
                <Fila label="UTM Source" valor={s.utm_source} />
                <Fila label="UTM Medium" valor={s.utm_medium} />
                <Fila label="UTM Campaign" valor={s.utm_campaign} />
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Recibido el {new Date(s.created_at).toLocaleString("es-AR")}</p>
        </div>

        {/* BARRA DE ACCIONES — fija abajo, las 3 cosas que el asesor realmente
            necesita hacer con este lead sin volver a la lista de atrás. */}
        <div className="shrink-0 border-t border-slate-100 dark:border-white/10 px-5 py-3 space-y-2 bg-white dark:bg-[#111]">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={estadoActual}
              onChange={(e) => onCambiarEstado?.(e.target.value)}
              disabled={!onCambiarEstado}
              className="text-xs font-bold rounded-xl px-2.5 py-2 outline-none border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              <option value="nuevo">Nuevo</option>
              <option value="en_gestion">En gestión</option>
              <option value="descartado">Descartado</option>
            </select>
            <select
              value={s.vendedor_id || ""}
              onChange={(e) => onAsignarVendedor?.(e.target.value)}
              disabled={!onAsignarVendedor}
              className="text-xs font-bold rounded-xl px-2.5 py-2 outline-none border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              <option value="">Sin vendedor</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {s.telefono && (
              <a
                href={`https://wa.me/${s.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te contactamos de Pfaffen Cars por tu ${s.tipo === "permuta" ? "permuta" : "cotización"} del ${s.marca} ${s.modelo || ""}`.trim() + ".")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                <MessageSquareText className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <Link
              href="/panel/peritajes"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              Convertir en peritaje <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox simple para ver una foto en grande sin salir del modal */}
      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}>
          <button onClick={() => setFotoAmpliada(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoAmpliada} alt="Foto ampliada" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

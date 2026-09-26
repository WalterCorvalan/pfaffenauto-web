"use client";

import { X, Globe, MessageSquareText, CheckCircle2, XCircle, ImageIcon, FileVideo, MapPin, CalendarDays } from "lucide-react";

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2 whitespace-pre-wrap">{valor ?? "—"}</p>
    </div>
  );
}

const money = (v: number | null | undefined) => (v != null ? `$ ${Number(v).toLocaleString("es-AR")}` : "—");

// Vista de detalle de un lead_tasacion (Compra/Permuta pedida desde
// /cotizador) -- antes esta lista solo redirigía a "Gestionar en Peritajes"
// sin mostrar los datos reales que mandó el cliente (fotos incluidas), hasta
// que se convertía manualmente en un peritaje. Ahora se puede ver todo lo
// que llegó sin pasar por esa conversión.
export default function LeadWebDetalleModal({ lead: s, vehiculoObjetivo, onClose }: { lead: any; vehiculoObjetivo?: { marca: string; modelo: string; anio: number; patente: string | null; precio_venta: number; moneda_venta: string; estado: string } | null; onClose: () => void }) {
  const fotos: string[] = Array.isArray(s.fotos_y_videos) ? s.fotos_y_videos : [];
  const esVideo = (url: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 pt-4 pb-2 sticky top-0 bg-white dark:bg-[#111] z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0145F2]" /> {s.tipo === "permuta" ? "Permuta pedida desde la web" : "Compra de vehículo pedida desde la web"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cliente</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Nombre" valor={s.nombre} />
              <Fila label="Teléfono" valor={s.telefono} />
              <Fila label="Email" valor={s.email} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vehículo que nos ofrece</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Descripción" valor={[s.marca, s.modelo, s.anio].filter(Boolean).join(" ") || "—"} />
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

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2.5 border bg-slate-50/60 dark:bg-white/[0.02] border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio esperado por el cliente</p>
              <p className="text-sm font-black mt-0.5 text-slate-800 dark:text-white">{money(s.precio_esperado_cliente)}</p>
            </div>
            <div className="rounded-xl px-3 py-2.5 border bg-[#0145F2]/5 border-[#0145F2]/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio de mercado (web)</p>
              <p className="text-sm font-black mt-0.5 text-[#0145F2] dark:text-sky-300">{money(s.precio_mercado_estimado)}</p>
            </div>
          </div>

          {/* Pedido del 26/9: ya no calculamos una "oferta" automática con
              descuento fijo sobre lo que pide el cliente (sin ancla de
              mercado real, podía terminar muy por encima del valor real) --
              ahora el asesor compara los dos números de arriba y decide acá
              qué ofrecerle. Si hay fuentes de la búsqueda, quedan de
              respaldo para justificar el número. */}
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

          {s.quiere_venir_sucursal ? (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Visita reservada</p>
              <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.sucursal_preferida || "—"}</span>
              </div>
            </div>
          ) : fotos.length > 0 ? (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Fotos y videos ({fotos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="relative block aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                    {esVideo(url) ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileVideo className="w-6 h-6 text-slate-400" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="Foto del vehículo" className="w-full h-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2.5">
              <ImageIcon className="w-3.5 h-3.5" /> Sin fotos ni videos adjuntos.
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

          {s.telefono && (
            <a
              href={`https://wa.me/${s.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te contactamos de Pfaffen Cars por tu ${s.tipo === "permuta" ? "permuta" : "cotización"} del ${s.marca} ${s.modelo || ""}`.trim() + ".")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              <MessageSquareText className="w-4 h-4" /> Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

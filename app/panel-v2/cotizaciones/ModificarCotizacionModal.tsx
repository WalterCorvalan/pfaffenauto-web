"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, CheckCircle2, XCircle, MessageCircle, Loader2 } from "lucide-react";

interface Cotizacion {
  id: string; cliente_nombre: string; vehiculo_id: string | null; vehiculo_descripcion: string | null;
  permuta_marca: string | null; permuta_modelo: string | null; permuta_anio: number | null; permuta_km: number | null; permuta_estado: string | null;
  precio_sugerido: number; moneda: string; conversacion: { autor_nombre: string; texto: string; created_at: string }[];
  historial: { estado: string; actor_nombre: string; created_at: string }[];
}

interface Props {
  cotizacion: Cotizacion;
  vendedorNombre: string;
  miNombre: string;
  onClose: () => void;
  onDecidido: (actualizada: any) => void;
}

export default function ModificarCotizacionModal({ cotizacion: c, vendedorNombre, miNombre, onClose, onDecidido }: Props) {
  const [precio, setPrecio] = useState(String(c.precio_sugerido));
  const [moneda, setMoneda] = useState(c.moneda);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const tieneTomaVieja = c.permuta_marca || c.permuta_modelo || c.permuta_estado;
  const tomaSugerida = Math.round((Number(precio) || 0) * 0.85);
  const precioDistinto = Number(precio) !== c.precio_sugerido;

  const decidir = async (accion: "aprobar" | "rechazar" | "info") => {
    setGuardando(true);
    const ahora = new Date().toISOString();
    const notaAuto =
      accion === "aprobar" ? (precioDistinto ? `Aprobada con precio modificado: ${moneda} ${Number(precio).toLocaleString("es-AR")} (sugerido ${c.moneda} ${c.precio_sugerido.toLocaleString("es-AR")}).` : "Aprobada al precio sugerido.")
      : accion === "rechazar" ? "Rechazada."
      : "Pidió más info al vendedor.";
    const textoConversacion = mensaje.trim() ? `${notaAuto} ${mensaje.trim()}` : notaAuto;
    const nuevaConversacion = [...(c.conversacion || []), { autor_nombre: miNombre, texto: textoConversacion, created_at: ahora }];

    const payload: any = { conversacion: nuevaConversacion };
    if (accion === "aprobar") {
      payload.estado = "aprobada";
      payload.precio_aprobado = Number(precio);
      payload.moneda = moneda;
      payload.notas_admin = notaAuto;
      payload.revision_pedida = false;
      payload.revision_mensaje = null;
      payload.historial = [...(c.historial || []), { estado: "aprobada", actor_nombre: miNombre, created_at: ahora }];
      if (tieneTomaVieja) payload.permuta_tasacion = tomaSugerida;
    } else if (accion === "rechazar") {
      payload.estado = "rechazada";
      payload.notas_admin = notaAuto;
      payload.revision_pedida = false;
      payload.revision_mensaje = null;
      payload.historial = [...(c.historial || []), { estado: "rechazada", actor_nombre: miNombre, created_at: ahora }];
      if (tieneTomaVieja) payload.permuta_tasacion = tomaSugerida;
    } else {
      payload.revision_pedida = true;
      payload.revision_mensaje = mensaje.trim() || "Necesito más información.";
    }

    const { data, error } = await supabase2.from("cotizaciones").update(payload).eq("id", c.id).select().single();
    setGuardando(false);
    if (!error) { onDecidido(data); onClose(); }
    else alert("No se pudo guardar la decisión.");
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-5 pb-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">Aprobá, rechazá o pedí más info al vendedor.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0 space-y-3">
          <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</p><p className="text-sm font-bold text-slate-900 dark:text-white">{c.cliente_nombre}</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vendedor</p><p className="text-sm font-bold text-slate-900 dark:text-white">{vendedorNombre}</p></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehículo</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.vehiculo_descripcion || "—"}</p>
            {c.vehiculo_id && <p className="text-[10px] text-slate-400">ID stock: {c.vehiculo_id}</p>}

            {tieneTomaVieja && (
              <div className="bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3 mt-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">Auto en permuta</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Marca/Modelo: </span><span className="font-semibold text-slate-700 dark:text-slate-200">{[c.permuta_marca, c.permuta_modelo].filter(Boolean).join(" ") || "—"}</span></div>
                  <div><span className="text-slate-400">Año: </span><span className="font-semibold text-slate-700 dark:text-slate-200">{c.permuta_anio || "—"}</span></div>
                  <div><span className="text-slate-400">Km: </span><span className="font-semibold text-slate-700 dark:text-slate-200">{c.permuta_km?.toLocaleString("es-AR") || "—"}</span></div>
                </div>
                <p className="text-xs mt-1.5"><span className="text-slate-400">Estado: </span><span className="font-semibold text-slate-700 dark:text-slate-200">{c.permuta_estado || "—"}</span></p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 mt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valor cotizado por el vendedor</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{c.moneda} {c.precio_sugerido.toLocaleString("es-AR")}</p>
              {tieneTomaVieja && <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mt-0.5">Toma sugerida (-15%): {c.moneda} {Math.round(c.precio_sugerido * 0.85).toLocaleString("es-AR")}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Precio a aprobar</label>
              <div className="flex gap-1">
                <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className={`${inputClass} flex-1 min-w-0`} />
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={`${inputClass} !w-20 shrink-0`}><option value="USD">USD</option><option value="ARS">ARS</option></select>
              </div>
              {tieneTomaVieja && <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 mt-1">Toma con este precio (-15%): {moneda} {tomaSugerida.toLocaleString("es-AR")}</p>}
              <p className="text-[10px] text-slate-400 mt-1">Editalo si querés modificarlo. Si difiere, queda como Modificada.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Mensaje al vendedor</label>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} placeholder="Ej: ¿Cuál es el km exacto? / Aprobado, avanzá. / Necesito ver fotos..." className={`${inputClass} resize-none`} />
              <p className="text-[10px] text-slate-400 mt-1">Se agrega al hilo de conversación junto con tu decisión.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button onClick={() => decidir("rechazar")} disabled={guardando} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 rounded-lg disabled:opacity-50"><XCircle className="w-3.5 h-3.5" /> Rechazar</button>
          <button onClick={() => decidir("info")} disabled={guardando} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-50"><MessageCircle className="w-3.5 h-3.5" /> Pedir más info</button>
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-lg">Cancelar</button>
          <button onClick={() => decidir("aprobar")} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg ml-auto disabled:opacity-50">
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Aprobar precio
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Car, Loader2, Trash2, Maximize2, Users, MapPin } from "lucide-react";

// Ficha RÁPIDA -- lo que se abre al hacer click en una tarjeta/fila/tabla de
// Stock (pedido explícito del 24/9: "eso es lo único que quiero"). Vista
// chica y resumida; el botón "Abrir ficha completa" es el único camino hacia
// FichaVehiculoModal.tsx (4 pestañas: Resumen y fotos, Rendimiento, Precios
// e historial, Plan de trabajo). "Editar" vive DENTRO de la ficha completa,
// no acá -- esta ficha rápida no abre el formulario directo.

interface Vehiculo {
  id: string; categoria: string; marca: string; modelo: string; anio: number; patente: string | null; color: string | null;
  condicion: string; km: number | null; precio_venta: number; moneda_venta: string; ubicacion: string; estado: string;
  propio_agencia: boolean; propietario_nombre: string | null; consignado_por: string | null; publicado_ml: boolean;
  ml_publicar_error: string | null; precio_compra: number | null; moneda_compra: string | null; origen: string | null;
  fotos: string[]; notas: string | null; created_at: string;
  sucursal_id: string | null; sucursal: { nombre: string } | null; vendedor_asignado_id: string | null;
}
interface Perfil { id: string; nombre: string; sucursal_id?: string | null }

const ESTADO_LABEL: Record<string, string> = { disponible: "Disponible", "señado": "Señado", vendido: "Vendido" };
const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  "señado": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  vendido: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
};
function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}
function fmtFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR");
}

interface ItemPlan { id: string; proxima_accion: string; responsable_id: string | null; fecha: string | null; resuelto: boolean }

interface Props {
  vehiculo: Vehiculo;
  miId: string;
  perfiles: Perfil[];
  puedeEliminar: boolean;
  onClose: () => void;
  onAbrirCompleta: () => void;
  onEliminar: (v: Vehiculo) => void;
}

export default function FichaRapidaModal({ vehiculo, miId, perfiles, puedeEliminar, onClose, onAbrirCompleta, onEliminar }: Props) {
  const [consultas, setConsultas] = useState<number | null>(null);
  const [items, setItems] = useState<ItemPlan[] | null>(null);
  const [accion, setAccion] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));

  useEffect(() => {
    Promise.all([
      supabase2.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculo.id),
      supabase2.from("instagram_conversaciones").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculo.id),
    ]).then(([wa, ig]) => setConsultas((wa.count ?? 0) + (ig.count ?? 0)));
  }, [vehiculo.id]);

  const cargarPlan = () => {
    supabase2.from("vehiculo_plan_trabajo").select("id, proxima_accion, responsable_id, fecha, resuelto")
      .eq("vehiculo_id", vehiculo.id).eq("resuelto", false).order("fecha", { ascending: true, nullsFirst: false })
      .then(({ data }) => setItems(data || []));
  };
  useEffect(cargarPlan, [vehiculo.id]);

  const agendar = async () => {
    if (!accion.trim()) return;
    setGuardando(true);
    const { error } = await supabase2.from("vehiculo_plan_trabajo").insert({
      vehiculo_id: vehiculo.id, proxima_accion: accion.trim(),
      responsable_id: responsableId || null, fecha: fecha || null, creado_por: miId,
    });
    if (!error) { setAccion(""); setResponsableId(""); setFecha(""); cargarPlan(); }
    setGuardando(false);
  };

  const pendientes: string[] = [];
  if (!vehiculo.publicado_ml) pendientes.push("Sin publicar en ML");
  if (vehiculo.fotos.length === 0) pendientes.push("Sin foto");
  if (!vehiculo.precio_venta) pendientes.push("Sin precio");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{vehiculo.marca} {vehiculo.modelo}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{vehiculo.anio} · {vehiculo.km?.toLocaleString("es-AR") ?? "—"} km</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="h-28 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
            {vehiculo.fotos?.[0] ? <img src={vehiculo.fotos[0]} alt="" className="w-full h-full object-cover" /> : <Car className="w-7 h-7 text-slate-300 dark:text-slate-600" />}
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ESTADO_COLOR[vehiculo.estado] || ESTADO_COLOR.disponible}`}>{ESTADO_LABEL[vehiculo.estado] || vehiculo.estado}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{fmtPrecio(vehiculo.precio_venta, vehiculo.moneda_venta)}</span>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {vehiculo.sucursal?.nombre || vehiculo.ubicacion || "Sin sucursal"}</p>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {consultas === null ? "Cargando consultas..." : `${consultas} persona${consultas === 1 ? "" : "s"} consultaron por esta unidad`}
          </p>

          {pendientes.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Preparación y atención comercial</p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
                {pendientes.map((p) => <li key={p}>· {p}</li>)}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Plan de trabajo</p>
            {items === null ? (
              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
            ) : items.length === 0 ? (
              <p className="text-xs text-slate-400 mb-2">Todavía no hay seguimiento agendado.</p>
            ) : (
              <ul className="space-y-1.5 mb-2">
                {items.map((i) => (
                  <li key={i.id} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{i.proxima_accion}</p>
                    <p className="text-[10px] text-slate-400">{i.responsable_id ? perfilMap[i.responsable_id] || "—" : "Sin responsable"}{i.fecha ? ` · ${fmtFecha(i.fecha)}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-1.5">
              <input value={accion} onChange={(e) => setAccion(e.target.value)} placeholder="Próxima acción" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400" />
              <div className="flex items-center gap-1.5">
                <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <option value="">Responsable</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300" />
              </div>
              <button onClick={agendar} disabled={guardando || !accion.trim()} className="w-full px-3 py-1.5 rounded-lg bg-[#0145F2] hover:bg-[#0138c9] text-white text-xs font-bold disabled:opacity-50">
                {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Agendar seguimiento"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-4 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button onClick={onAbrirCompleta} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold"><Maximize2 className="w-3.5 h-3.5" /> Abrir ficha completa</button>
          {puedeEliminar && (
            <button onClick={() => onEliminar(vehiculo)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 text-xs font-bold"><Trash2 className="w-3.5 h-3.5" /> Eliminar vehículo</button>
          )}
        </div>
      </div>
    </div>
  );
}

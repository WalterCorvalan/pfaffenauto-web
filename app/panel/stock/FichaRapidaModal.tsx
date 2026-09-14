"use client";

import { X, ArrowUpRight, Gauge, Cog, MapPin, UserCircle2 } from "lucide-react";
import { vehiculoPendientes } from "@/lib/vehiculos";
import VehiculoSeguimientos from "./VehiculoSeguimientos";

interface Vehiculo {
  id: string; marca: string; modelo: string; anio: number; patente: string | null;
  km: number | null; transmision: string | null; precio_venta: number; moneda_venta: string;
  estado: string; ubicacion: string | null; origen: string | null; publicado_ml: boolean;
  fotos: string[]; sucursal: { nombre: string } | null; vendedor_asignado_id: string | null;
  created_at: string;
}
interface Perfil { id: string; nombre: string }

const ESTADO_LABEL: Record<string, string> = { disponible: "Disponible", "señado": "Señado", vendido: "Vendido" };
const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  "señado": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  vendido: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
};

function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

export default function FichaRapidaModal({
  vehiculo, perfiles, miId, onClose, onAbrirCompleta,
}: { vehiculo: Vehiculo; perfiles: Perfil[]; miId: string; onClose: () => void; onAbrirCompleta: () => void }) {
  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));
  const pendientes = vehiculoPendientes(vehiculo);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ficha rápida</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pt-2">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{vehiculo.marca} {vehiculo.modelo}</h2>
          <p className="text-xs text-slate-400">{vehiculo.anio} · {vehiculo.patente || "s/patente"}</p>

          <div className="flex items-center justify-between mt-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${ESTADO_COLOR[vehiculo.estado]}`}>{ESTADO_LABEL[vehiculo.estado] || vehiculo.estado}</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{fmtPrecio(vehiculo.precio_venta, vehiculo.moneda_venta)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> Kilómetros</p>
              <p className="font-bold text-slate-800 dark:text-white">{vehiculo.km?.toLocaleString("es-AR") ?? "—"} km</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><Cog className="w-3.5 h-3.5" /> Transmisión</p>
              <p className="font-bold text-slate-800 dark:text-white">{vehiculo.transmision || "Sin registrar"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ubicación</p>
              <p className="font-bold text-slate-800 dark:text-white">{vehiculo.sucursal?.nombre || vehiculo.ubicacion || "Sin registrar"}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1"><UserCircle2 className="w-3.5 h-3.5" /> Responsable</p>
              <p className="font-bold text-slate-800 dark:text-white">{vehiculo.vendedor_asignado_id ? perfilMap[vehiculo.vendedor_asignado_id] : "Sin registrar"}</p>
            </div>
          </div>

          <button onClick={onAbrirCompleta} className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">
            <ArrowUpRight className="w-4 h-4" /> Abrir ficha completa
          </button>

          {pendientes.length > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1.5">Preparación y atención comercial</p>
              <ul className="space-y-1">
                {pendientes.map((p) => <li key={p} className="text-xs text-amber-700 dark:text-amber-300">• {p}</li>)}
              </ul>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-300/60 mt-2">El estado de MercadoLibre corresponde a lo registrado en el CRM.</p>
            </div>
          )}

          <div className="mt-5 pb-5">
            <VehiculoSeguimientos vehiculoId={vehiculo.id} perfiles={perfiles} miId={miId} />
          </div>
        </div>
      </div>
    </div>
  );
}

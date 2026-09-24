"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import {
  X, Car, Loader2, Edit2, Trash2, ClipboardCheck, Image as ImageIcon,
  TrendingUp, History, MapPin,
} from "lucide-react";
import NuevoVehiculoModal from "./NuevoVehiculoModal";
import PeritajeModal from "./PeritajeModal";
import BotonPublicarML from "./BotonPublicarML";

// Ficha de vehículo (Stock) — se abre al hacer click en la tarjeta (vista
// "tarjetas"), en vez de ir directo al formulario de edición. Contiene el
// formulario como una de sus acciones ("Editar"), no lo reemplaza.
// Solo 3 pestañas por ahora (pedido del 24/9): Resumen y fotos, Rendimiento,
// Precios e historial -- las otras 5 del mockup de referencia (Clientes,
// Gastos y margen, Consultas, Portal del propietario, Documentación) pisan
// o duplican módulos que ya existen (Leads, Finanzas, Consignaciones,
// /seguimiento) y quedan para pensarlas conectadas a esos módulos, no
// aparte. Ver charla del 24/9 para el detalle de qué pisa qué.

interface Vehiculo {
  id: string; categoria: string; marca: string; modelo: string; anio: number; patente: string | null; color: string | null;
  condicion: string; km: number | null; precio_venta: number; moneda_venta: string; ubicacion: string; estado: string;
  propio_agencia: boolean; propietario_nombre: string | null; consignado_por: string | null; publicado_ml: boolean;
  ml_publicar_error: string | null; precio_compra: number | null; moneda_compra: string | null; origen: string | null;
  fotos: string[]; notas: string | null; created_at: string;
  sucursal_id: string | null; sucursal: { nombre: string } | null; vendedor_asignado_id: string | null;
  numero_motor?: string | null; numero_chasis?: string | null;
}
interface Perfil { id: string; nombre: string; sucursal_id?: string | null }
interface Cliente { id: string; nombre: string; telefono: string | null; dni_cuit: string | null }
interface Sucursal { id: string; nombre: string }

const ESTADO_LABEL: Record<string, string> = { disponible: "Disponible", "señado": "Señado", vendido: "Vendido" };
const ESTADO_COLOR: Record<string, string> = {
  disponible: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  "señado": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  vendido: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
};
function fmtPrecio(n: number | null, moneda: string | null) {
  if (!n || !moneda) return "—";
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}
function fmtFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR");
}

type TabFicha = "resumen" | "rendimiento" | "precios";

interface Props {
  vehiculo: Vehiculo;
  miId: string;
  perfiles: Perfil[];
  clientes: Cliente[];
  sucursales: Sucursal[];
  puedeEditarCompleto: boolean;
  puedeEliminar: boolean;
  onClose: () => void;
  onActualizado: (id: string, cambios: Partial<Vehiculo>) => void;
  onCreado: (v: Vehiculo) => void;
  onEliminar: (v: Vehiculo) => void;
}

const TABS: { id: TabFicha; label: string; icon: typeof Car }[] = [
  { id: "resumen", label: "Resumen y fotos", icon: ImageIcon },
  { id: "rendimiento", label: "Rendimiento", icon: TrendingUp },
  { id: "precios", label: "Precios e historial", icon: History },
];

export default function FichaVehiculoModal({ vehiculo, miId, perfiles, clientes, sucursales, puedeEditarCompleto, puedeEliminar, onClose, onActualizado, onCreado, onEliminar }: Props) {
  const [tab, setTab] = useState<TabFicha>("resumen");
  const [editando, setEditando] = useState<"completo" | "fotos" | null>(null);
  const [peritajeAbierto, setPeritajeAbierto] = useState(false);
  const [tienePeritaje, setTienePeritaje] = useState<boolean | null>(null);

  useEffect(() => {
    supabase2.from("peritajes").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculo.id)
      .then(({ count }) => setTienePeritaje((count ?? 0) > 0));
  }, [vehiculo.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ficha comercial y seguimiento de la unidad</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-white/10 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 -mb-px ${tab === t.id ? "border-[#0145F2] text-[#0145F2]" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === "resumen" && (
            <TabResumen
              vehiculo={vehiculo}
              tienePeritaje={tienePeritaje}
              onEditarFotos={() => setEditando("fotos")}
              onCargarPeritaje={() => setPeritajeAbierto(true)}
              onPublicado={(id) => onActualizado(id, { publicado_ml: true, ml_publicar_error: null })}
            />
          )}
          {tab === "rendimiento" && <TabRendimiento vehiculoId={vehiculo.id} />}
          {tab === "precios" && <TabPrecios vehiculoId={vehiculo.id} />}
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10">Cerrar</button>
          <div className="flex-1" />
          {puedeEditarCompleto && (
            <button onClick={() => setEditando("completo")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
          )}
          {puedeEliminar && (
            <button onClick={() => onEliminar(vehiculo)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 text-sm font-bold"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
          )}
        </div>
      </div>

      {editando && (
        <NuevoVehiculoModal
          perfiles={perfiles} clientes={clientes} sucursales={sucursales} miId={miId}
          editando={vehiculo} soloFotos={editando === "fotos" || !puedeEditarCompleto}
          onClose={() => setEditando(null)}
          onCreado={(v) => { onCreado(v); setEditando(null); }}
        />
      )}
      {peritajeAbierto && (
        <PeritajeModal vehiculo={vehiculo} miId={miId} onClose={() => { setPeritajeAbierto(false); supabase2.from("peritajes").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculo.id).then(({ count }) => setTienePeritaje((count ?? 0) > 0)); }} />
      )}
    </div>
  );
}

function TabResumen({ vehiculo, tienePeritaje, onEditarFotos, onCargarPeritaje, onPublicado }: {
  vehiculo: Vehiculo; tienePeritaje: boolean | null;
  onEditarFotos: () => void; onCargarPeritaje: () => void; onPublicado: (id: string) => void;
}) {
  const pendientes: { texto: string; accion: () => void }[] = [];
  if (!vehiculo.publicado_ml) pendientes.push({ texto: "Sin publicar en ML", accion: () => {} });
  if (vehiculo.fotos.length === 0) pendientes.push({ texto: "Sin foto", accion: onEditarFotos });
  if (tienePeritaje === false) pendientes.push({ texto: "Cargar peritaje", accion: onCargarPeritaje });

  return (
    <div className="space-y-4">
      <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
        {vehiculo.fotos?.[0] ? <img src={vehiculo.fotos[0]} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1"><Car className="w-8 h-8 text-slate-300 dark:text-slate-600" /><span className="text-xs text-slate-400">Sin foto</span></div>}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ESTADO_COLOR[vehiculo.estado] || ESTADO_COLOR.disponible}`}>{ESTADO_LABEL[vehiculo.estado] || vehiculo.estado}</span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">{fmtPrecio(vehiculo.precio_venta, vehiculo.moneda_venta)}</span>
      </div>

      {pendientes.length > 0 && (
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Preparación y atención comercial</p>
          <ul className="space-y-1.5">
            {pendientes.map((p) => (
              <li key={p.texto}>
                {p.texto === "Sin publicar en ML" ? (
                  <span onClick={(e) => e.stopPropagation()}><BotonPublicarML vehiculoId={vehiculo.id} publicado={vehiculo.publicado_ml} error={vehiculo.ml_publicar_error} onPublicado={onPublicado} /></span>
                ) : (
                  <button onClick={p.accion} className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2 decoration-dotted">{p.texto}</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Campo label="Ubicación" valor={vehiculo.sucursal?.nombre || vehiculo.ubicacion || "—"} icono={MapPin} />
        <Campo label="Fecha de alta" valor={fmtFecha(vehiculo.created_at)} />
        <Campo label="Propietario" valor={vehiculo.propietario_nombre || "—"} />
        <Campo label="Consignado por" valor={vehiculo.consignado_por || "—"} />
        <Campo label="N° motor" valor={vehiculo.numero_motor || "—"} />
        <Campo label="N° chasis" valor={vehiculo.numero_chasis || "—"} />
        <Campo label="Publicado en ML" valor={vehiculo.publicado_ml ? "Sí" : "No"} />
        <Campo label="Origen" valor={vehiculo.origen || "—"} />
      </div>

      {vehiculo.notas && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Notas</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{vehiculo.notas}</p>
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor, icono: Icono }: { label: string; valor: string; icono?: typeof MapPin }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1">{Icono && <Icono className="w-3 h-3 shrink-0 text-slate-400" />}{valor}</p>
    </div>
  );
}

interface Metricas { consultas: number; cotizaciones: number; visitas: number; senas: number; ventas: number }

function TabRendimiento({ vehiculoId }: { vehiculoId: string }) {
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    const inicio = `${periodo}-01T00:00:00.000Z`;
    const finDate = new Date(`${periodo}-01T00:00:00.000Z`);
    finDate.setUTCMonth(finDate.getUTCMonth() + 1);
    const fin = finDate.toISOString();

    Promise.all([
      supabase2.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
      supabase2.from("instagram_conversaciones").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
      supabase2.from("cotizaciones").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
      supabase2.from("visitas").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
      supabase2.from("senas").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
      supabase2.from("ventas").select("id", { count: "exact", head: true }).eq("vehiculo_id", vehiculoId).gte("created_at", inicio).lt("created_at", fin),
    ]).then(([wa, ig, cot, vis, sen, ven]) => {
      if (cancelado) return;
      setMetricas({
        consultas: (wa.count ?? 0) + (ig.count ?? 0),
        cotizaciones: cot.count ?? 0,
        visitas: vis.count ?? 0,
        senas: sen.count ?? 0,
        ventas: ven.count ?? 0,
      });
      setCargando(false);
    });
    return () => { cancelado = true; };
  }, [vehiculoId, periodo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Rendimiento de esta unidad</p>
          <p className="text-xs text-slate-400">Actividad real registrada para este vehículo puntual.</p>
        </div>
        <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#0145F2]" />
      </div>

      {cargando ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricaBox label="Consultas (WhatsApp + Instagram)" valor={metricas.consultas} />
          <MetricaBox label="Cotizaciones enviadas" valor={metricas.cotizaciones} />
          <MetricaBox label="Visitas coordinadas" valor={metricas.visitas} />
          <MetricaBox label="Señas registradas" valor={metricas.senas} />
          <MetricaBox label="Ventas registradas" valor={metricas.ventas} />
        </div>
      )}
    </div>
  );
}

function MetricaBox({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{valor}</p>
    </div>
  );
}

interface CambioPrecio { id: string; precio_anterior: number | null; moneda_anterior: string | null; precio_nuevo: number | null; moneda_nueva: string | null; created_at: string }

function TabPrecios({ vehiculoId }: { vehiculoId: string }) {
  const [cambios, setCambios] = useState<CambioPrecio[] | null>(null);

  useEffect(() => {
    supabase2.from("vehiculo_precio_historial").select("id, precio_anterior, moneda_anterior, precio_nuevo, moneda_nueva, created_at")
      .eq("vehiculo_id", vehiculoId).order("created_at", { ascending: false })
      .then(({ data }) => setCambios(data || []));
  }, [vehiculoId]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Historial de precios</p>
        <p className="text-xs text-slate-400">Cambios reales registrados desde que se activó la auditoría. La antigüedad sigue contando desde el ingreso del auto.</p>
      </div>
      {cambios === null ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : cambios.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No hay cambios de precio auditados para esta unidad.</p>
      ) : (
        <div className="space-y-2">
          {cambios.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{fmtFecha(c.created_at)}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtPrecio(c.precio_anterior, c.moneda_anterior)} → {fmtPrecio(c.precio_nuevo, c.moneda_nueva)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

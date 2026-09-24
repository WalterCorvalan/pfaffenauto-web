"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import Link from "next/link";
import {
  X, Car, Loader2, Edit2, Trash2, ClipboardCheck, Image as ImageIcon,
  TrendingUp, History, MapPin, Users, Wallet, ExternalLink, Copy, Check,
  MessageCircle, AtSign, Bot, User,
} from "lucide-react";
import NuevoVehiculoModal from "./NuevoVehiculoModal";
import PeritajeModal from "./PeritajeModal";
import BotonPublicarML from "./BotonPublicarML";

// Ficha de vehículo (Stock) -- se abre desde FichaRapidaModal.tsx ("Abrir
// ficha completa"), no directo al click de la tarjeta. Contiene el
// formulario como una de sus acciones ("Editar"), no lo reemplaza.
// Del mockup de referencia (pedido del 24/9), "Clientes", "Gastos y
// margen" y "Portal del propietario" pisaban módulos que ya existen
// (Leads, Finanzas, /seguimiento) -- en vez de duplicar esos datos en una
// tabla nueva, estas 3 pestañas son solo VISTAS de solo lectura que leen
// directo de las tablas reales de esos módulos, filtradas por este
// vehículo. No hay tabla ni fetch nuevo detrás, así que no se pueden
// desincronizar. "Consultas" y "Documentación" quedaron afuera (Consultas
// por pedido explícito, Documentación porque "Cargar peritaje" ya vive en
// TabResumen reusando PeritajeModal.tsx).

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

type TabFicha = "resumen" | "rendimiento" | "precios" | "plan" | "leads" | "gastos" | "portal";

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
  { id: "plan", label: "Plan de trabajo", icon: ClipboardCheck },
  { id: "leads", label: "Leads", icon: Users },
  { id: "gastos", label: "Gastos y margen", icon: Wallet },
  { id: "portal", label: "Portal del propietario", icon: ExternalLink },
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
          {tab === "plan" && <TabPlan vehiculoId={vehiculo.id} miId={miId} perfiles={perfiles} />}
          {tab === "leads" && <TabLeads vehiculoId={vehiculo.id} />}
          {tab === "gastos" && <TabGastos vehiculo={vehiculo} />}
          {tab === "portal" && <TabPortal vehiculoId={vehiculo.id} />}
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

function MetricaBox({ label, valor }: { label: string; valor: number | string }) {
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

// "Plan de trabajo" -- próxima acción/responsable/fecha para ESTA unidad
// puntual (tabla `vehiculo_plan_trabajo`, con FK a vehiculos). Deliberadamente
// distinto del buscador público /seguimiento (que sigue una venta/seña por
// código, tablas ventas/senas) y del cron app/api/cron/panel/seguimientos
// (agregador de alertas de otros módulos) -- no comparten tabla ni datos con
// ninguno de los dos, por eso el nombre no usa la palabra "seguimiento".
interface ItemPlan { id: string; proxima_accion: string; responsable_id: string | null; fecha: string | null; resuelto: boolean; created_at: string }

function TabPlan({ vehiculoId, miId, perfiles }: { vehiculoId: string; miId: string; perfiles: Perfil[] }) {
  const [items, setItems] = useState<ItemPlan[] | null>(null);
  const [accion, setAccion] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));

  const cargar = () => {
    supabase2.from("vehiculo_plan_trabajo").select("id, proxima_accion, responsable_id, fecha, resuelto, created_at")
      .eq("vehiculo_id", vehiculoId).order("resuelto", { ascending: true }).order("fecha", { ascending: true, nullsFirst: false })
      .then(({ data }) => setItems(data || []));
  };
  useEffect(cargar, [vehiculoId]);

  const agregar = async () => {
    if (!accion.trim()) return;
    setGuardando(true);
    const { error } = await supabase2.from("vehiculo_plan_trabajo").insert({
      vehiculo_id: vehiculoId, proxima_accion: accion.trim(),
      responsable_id: responsableId || null, fecha: fecha || null, creado_por: miId,
    });
    if (!error) { setAccion(""); setResponsableId(""); setFecha(""); cargar(); }
    setGuardando(false);
  };

  const marcarResuelto = async (item: ItemPlan) => {
    setItems((prev) => prev && prev.map((i) => (i.id === item.id ? { ...i, resuelto: !i.resuelto } : i)));
    await supabase2.from("vehiculo_plan_trabajo").update({ resuelto: !item.resuelto }).eq("id", item.id);
    cargar();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Plan de trabajo</p>
        <p className="text-xs text-slate-400">Próximas acciones a seguir sobre esta unidad puntual.</p>
      </div>

      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-2">
        <input value={accion} onChange={(e) => setAccion(e.target.value)} placeholder="Próxima acción (ej: llamar al cliente, cargar peritaje)" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400" />
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <option value="">Sin responsable</option>
            {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300" />
          <button onClick={agregar} disabled={guardando || !accion.trim()} className="px-4 py-2 rounded-lg bg-[#0145F2] hover:bg-[#0138c9] text-white text-xs font-bold disabled:opacity-50 shrink-0">
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Agregar"}
          </button>
        </div>
      </div>

      {items === null ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Sin acciones cargadas para esta unidad.</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <label key={i.id} className={`flex items-start gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 cursor-pointer ${i.resuelto ? "opacity-50" : ""}`}>
              <input type="checkbox" checked={i.resuelto} onChange={() => marcarResuelto(i)} className="mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${i.resuelto ? "line-through" : ""}`}>{i.proxima_accion}</p>
                <p className="text-[11px] text-slate-400">
                  {i.responsable_id ? perfilMap[i.responsable_id] || "—" : "Sin responsable"}
                  {i.fecha ? ` · ${fmtFecha(i.fecha)}` : ""}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// "Leads" -- vista de solo lectura sobre las 4 tablas reales de Leads
// (whatsapp_conversaciones, instagram_conversaciones, rodi_conversaciones,
// leads_manuales), filtradas por vehiculo_id. Mismo patrón de las 4 fuentes
// que usa LeadsUnificadosClient.tsx (ver app/panel/leads/ARCHITECTURE.md) --
// no se junta en una tabla nueva, cada fila linkea directo al detalle real
// del módulo Leads/WhatsApp.
type OrigenLead = "whatsapp" | "instagram" | "rodi" | "manual";
interface LeadFicha { id: string; origen: OrigenLead; nombre: string; estado_lead: string; created_at: string }
const ORIGEN_ICON_LEAD: Record<OrigenLead, typeof MessageCircle> = { whatsapp: MessageCircle, instagram: AtSign, rodi: Bot, manual: User };
const ORIGEN_LABEL_LEAD: Record<OrigenLead, string> = { whatsapp: "WhatsApp", instagram: "Instagram", rodi: "Rodi", manual: "Manual" };
const ESTADO_LEAD_LABEL: Record<string, string> = { nuevo: "Nuevo", asignado: "Contactado", calificando: "Interesado", convertido: "Cliente", perdido: "Perdido" };
function hrefLead(l: LeadFicha) {
  if (l.origen === "whatsapp" || l.origen === "instagram") return `/panel/whatsapp?tab=leads&lead=${l.id}&origen=${l.origen}`;
  return `/panel/leads?lead=${l.id}&origen=${l.origen}`;
}

function TabLeads({ vehiculoId }: { vehiculoId: string }) {
  const [leads, setLeads] = useState<LeadFicha[] | null>(null);

  useEffect(() => {
    Promise.all([
      supabase2.from("whatsapp_conversaciones").select("id, estado_lead, created_at, whatsapp_contactos ( nombre_perfil )").eq("vehiculo_id", vehiculoId),
      supabase2.from("instagram_conversaciones").select("id, estado_lead, created_at, instagram_contactos ( username )").eq("vehiculo_id", vehiculoId),
      supabase2.from("rodi_conversaciones").select("id, estado_lead, created_at, nombre_contacto").eq("vehiculo_id", vehiculoId),
      supabase2.from("leads_manuales").select("id, estado_lead, created_at, nombre").eq("vehiculo_id", vehiculoId),
    ]).then(([wa, ig, rodi, manual]) => {
      const lista: LeadFicha[] = [
        ...(wa.data || []).map((l: any) => ({ id: l.id, origen: "whatsapp" as const, nombre: l.whatsapp_contactos?.nombre_perfil || "Sin nombre", estado_lead: l.estado_lead, created_at: l.created_at })),
        ...(ig.data || []).map((l: any) => ({ id: l.id, origen: "instagram" as const, nombre: l.instagram_contactos?.username || "Sin usuario", estado_lead: l.estado_lead, created_at: l.created_at })),
        ...(rodi.data || []).map((l: any) => ({ id: l.id, origen: "rodi" as const, nombre: l.nombre_contacto || "Sin nombre", estado_lead: l.estado_lead, created_at: l.created_at })),
        ...(manual.data || []).map((l: any) => ({ id: l.id, origen: "manual" as const, nombre: l.nombre || "Sin nombre", estado_lead: l.estado_lead, created_at: l.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLeads(lista);
    });
  }, [vehiculoId]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Leads de esta unidad</p>
        <p className="text-xs text-slate-400">Consultas por WhatsApp, Instagram, Rodi y manuales vinculadas a este vehículo -- mismos datos del módulo Leads.</p>
      </div>
      {leads === null ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : leads.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Sin leads vinculados a este vehículo todavía.</p>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => {
            const Icono = ORIGEN_ICON_LEAD[l.origen];
            return (
              <Link key={`${l.origen}-${l.id}`} href={hrefLead(l)} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/10">
                <span className="flex items-center gap-2 min-w-0">
                  <Icono className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{l.nombre}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{ORIGEN_LABEL_LEAD[l.origen]}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">{ESTADO_LEAD_LABEL[l.estado_lead] || l.estado_lead}</span>
                  <span className="text-[11px] text-slate-400">{fmtFecha(l.created_at)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// "Gastos y margen" -- vista de solo lectura, misma fórmula y mismas tablas
// que useRentabilidadPorVehiculo.ts (Finanzas → Rentabilidad por vehículo):
// ganancia = precio de venta − costo de compra − comisión del vendedor −
// gastos del expediente a cargo de la agencia. Sin tabla ni cálculo propio
// -- si el número de Finanzas cambia, este cambia solo (mismas fuentes).
function TabGastos({ vehiculo }: { vehiculo: Vehiculo }) {
  const [cargando, setCargando] = useState(true);
  const [fila, setFila] = useState<{ moneda: string; precioVenta: number; costo: number; comision: number; gastos: number; ganancia: number; avisoMoneda: boolean; fecha: string | null } | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    supabase2.from("ventas").select("id, precio_venta, moneda_venta, fecha_cierre").eq("vehiculo_id", vehiculo.id).eq("estado", "cerrada").order("fecha_cierre", { ascending: false }).limit(1).maybeSingle()
      .then(async ({ data: venta }) => {
        if (cancelado) return;
        if (!venta) { setFila(null); setCargando(false); return; }
        const moneda = venta.moneda_venta;
        const [comRes, expRes] = await Promise.all([
          supabase2.from("comisiones").select("monto, moneda").eq("venta_id", venta.id),
          supabase2.from("expedientes").select("id").eq("venta_id", venta.id).maybeSingle(),
        ]);
        let gastosVenta: { monto: number; moneda: string }[] = [];
        if (expRes.data?.id) {
          const { data: gastos } = await supabase2.from("expediente_gastos").select("monto, moneda").eq("expediente_id", expRes.data.id).eq("a_cargo_de", "agencia");
          gastosVenta = gastos || [];
        }
        if (cancelado) return;

        const costoCoincide = vehiculo.precio_compra != null && vehiculo.moneda_compra === moneda;
        const costo = costoCoincide ? Number(vehiculo.precio_compra) : 0;
        const comisiones = comRes.data || [];
        const comisionCoincide = comisiones.filter((c) => c.moneda === moneda).reduce((acc, c) => acc + Number(c.monto), 0);
        const comisionOtraMoneda = comisiones.some((c) => c.moneda !== moneda);
        const gastosCoinciden = gastosVenta.filter((g) => g.moneda === moneda).reduce((acc, g) => acc + Number(g.monto), 0);
        const gastosOtraMoneda = gastosVenta.some((g) => g.moneda !== moneda);
        const ganancia = Number(venta.precio_venta || 0) - costo - comisionCoincide - gastosCoinciden;
        const avisoMoneda = (vehiculo.precio_compra != null && !costoCoincide) || comisionOtraMoneda || gastosOtraMoneda;

        setFila({ moneda, precioVenta: Number(venta.precio_venta || 0), costo, comision: comisionCoincide, gastos: gastosCoinciden, ganancia, avisoMoneda, fecha: venta.fecha_cierre });
        setCargando(false);
      });
    return () => { cancelado = true; };
  }, [vehiculo.id, vehiculo.precio_compra, vehiculo.moneda_compra]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Gastos y margen</p>
        <p className="text-xs text-slate-400">Mismo cálculo que Finanzas → Rentabilidad por vehículo, para esta unidad puntual.</p>
      </div>
      {cargando ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : !fila ? (
        <p className="text-sm text-slate-400 py-4">Todavía no tiene una venta cerrada -- el margen se calcula recién ahí (ver Finanzas).</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <MetricaBox label="Precio de venta" valor={fmtPrecio(fila.precioVenta, fila.moneda)} />
            <MetricaBox label="Costo de compra" valor={fmtPrecio(fila.costo, fila.moneda)} />
            <MetricaBox label="Comisión" valor={fmtPrecio(fila.comision, fila.moneda)} />
            <MetricaBox label="Gastos (agencia)" valor={fmtPrecio(fila.gastos, fila.moneda)} />
          </div>
          <div className={`rounded-xl p-3.5 border ${fila.ganancia >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ganancia</p>
            <p className={`text-xl font-black ${fila.ganancia >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{fmtPrecio(fila.ganancia, fila.moneda)}</p>
          </div>
          {fila.avisoMoneda && <p className="text-[11px] text-amber-600 dark:text-amber-400">Hay costos/comisiones/gastos en otra moneda que no se sumaron -- revisar en Finanzas.</p>}
          <p className="text-[11px] text-slate-400">Venta cerrada el {fmtFecha(fila.fecha)}.</p>
        </div>
      )}
    </div>
  );
}

// "Portal del propietario" -- vista de solo lectura conectada al código de
// seguimiento real de la seña/venta de este vehículo (mismo código que usa
// /seguimiento/[codigo], el portal público existente). No genera ningún
// portal nuevo: solo resuelve el código y linkea al que ya existe.
function TabPortal({ vehiculoId }: { vehiculoId: string }) {
  const [cargando, setCargando] = useState(true);
  const [info, setInfo] = useState<{ codigo: string; tipo: "Venta" | "Seña"; documentos: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    Promise.all([
      supabase2.from("ventas").select("codigo_seguimiento, created_at").eq("vehiculo_id", vehiculoId).not("codigo_seguimiento", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase2.from("senas").select("codigo_seguimiento, created_at").eq("vehiculo_id", vehiculoId).not("codigo_seguimiento", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(async ([ventaRes, senaRes]) => {
      if (cancelado) return;
      const masReciente = [
        ventaRes.data ? { codigo: ventaRes.data.codigo_seguimiento as string, tipo: "Venta" as const, created_at: ventaRes.data.created_at as string } : null,
        senaRes.data ? { codigo: senaRes.data.codigo_seguimiento as string, tipo: "Seña" as const, created_at: senaRes.data.created_at as string } : null,
      ].filter(Boolean).sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime())[0];

      if (!masReciente) { setInfo(null); setCargando(false); return; }
      const res = await fetch(`/api/seguimiento/documentos?codigo=${encodeURIComponent(masReciente.codigo)}`).then((r) => r.json()).catch(() => ({ documentos: [] }));
      if (cancelado) return;
      setInfo({ codigo: masReciente.codigo, tipo: masReciente.tipo, documentos: (res.documentos || []).length });
      setCargando(false);
    });
    return () => { cancelado = true; };
  }, [vehiculoId]);

  const copiarLink = () => {
    if (!info) return;
    navigator.clipboard.writeText(`${window.location.origin}/seguimiento/${info.codigo}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">Portal del propietario</p>
        <p className="text-xs text-slate-400">El mismo portal público de seguimiento (/seguimiento) que ya usa el cliente para esta operación.</p>
      </div>
      {cargando ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : !info ? (
        <p className="text-sm text-slate-400 py-4">No hay una operación (seña o venta) con código de seguimiento activo para esta unidad.</p>
      ) : (
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{info.tipo} · Código de seguimiento</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{info.codigo}</p>
            </div>
            <button onClick={copiarLink} className="p-2 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white" title="Copiar link">
              {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{info.documentos} documento{info.documentos === 1 ? "" : "s"} cargado{info.documentos === 1 ? "" : "s"} por el cliente.</p>
          <a href={`/seguimiento/${info.codigo}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0145F2] hover:bg-[#0138c9] text-white text-sm font-bold">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir portal público
          </a>
        </div>
      )}
    </div>
  );
}

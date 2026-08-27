"use client";

import { useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import {
  Phone, Repeat, Search, Camera, Upload, X, Loader2, Check,
  PhoneCall, Truck, ScanSearch, Wrench, Shield, FileText, TriangleAlert, Cake, Pin,
} from "lucide-react";
import EscanearBoletoModal from "./EscanearBoletoModal";
import ImportarExcelModal from "./ImportarExcelModal";
import { hoyLocalISO, parseFechaLocal, fmtFechaLocal } from "@/lib/panelV2/fechas";

interface Compra {
  id: string; comprador_nombre: string; comprador_telefono: string | null; comprador_dni: string | null;
  vehiculo_marca: string | null; vehiculo_modelo: string | null; vehiculo_anio: number | null; vehiculo_dominio: string | null;
  fecha_venta: string; precio: number | null; moneda: string | null; vendedor_nombre: string | null; origen: string;
}
interface Recordatorio {
  id: string; compra_id: string; tipo: string; fecha_vencimiento: string; descripcion: string | null; estado: string;
}
interface Perfil { id: string; nombre: string }

type Tab = "recontactos" | "compraron";

const TIPOS: { value: string; label: string; icon: any }[] = [
  { value: "llamada_seguimiento", label: "Llamada de seguimiento", icon: PhoneCall },
  { value: "control_post_entrega", label: "Control post-entrega", icon: Truck },
  { value: "vtv", label: "VTV / Revisión técnica", icon: ScanSearch },
  { value: "service", label: "Service / Mantenimiento", icon: Wrench },
  { value: "seguro", label: "Renovación de seguro", icon: Shield },
  { value: "patente", label: "Patente / Impuesto vehicular", icon: FileText },
  { value: "garantia", label: "Fin de garantía", icon: TriangleAlert },
  { value: "cumpleanos", label: "Cumpleaños del cliente", icon: Cake },
  { value: "otro", label: "Otro recordatorio", icon: Pin },
];
const TIPO_MAP = Object.fromEntries(TIPOS.map((t) => [t.value, t]));

function bucketUrgencia(fechaIso: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fecha = parseFechaLocal(fechaIso);
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0) return "Vencidos";
  if (dias === 0) return "Hoy";
  if (dias <= 7) return "Esta semana";
  if (dias <= 30) return "Este mes";
  return "Más adelante";
}
const ORDEN_BUCKETS = ["Vencidos", "Hoy", "Esta semana", "Este mes", "Más adelante"];
const BUCKET_COLOR: Record<string, string> = {
  "Vencidos": "text-rose-600 dark:text-rose-400", "Hoy": "text-amber-600 dark:text-amber-400",
  "Esta semana": "text-blue-600 dark:text-blue-400", "Este mes": "text-slate-500", "Más adelante": "text-slate-400",
};

function NuevoRecordatorioModal({ compras, miId, onClose, onCreado }: { compras: Compra[]; miId: string; onClose: () => void; onCreado: (r: Recordatorio) => void }) {
  const [compraId, setCompraId] = useState("");
  const [tipo, setTipo] = useState("llamada_seguimiento");
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    if (!compraId) { setError("Elegí un cliente."); return; }
    setGuardando(true);
    setError("");
    const { data, error: dbError } = await supabase2.from("postventa_recordatorios").insert({
      compra_id: compraId, tipo, fecha_vencimiento: fecha, descripcion: descripcion || null, creado_por: miId || null,
    }).select().single();
    if (dbError) { setError("No se pudo guardar el recordatorio."); setGuardando(false); return; }
    onCreado(data);
    onClose();
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo recordatorio</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Cliente</label>
            <select value={compraId} onChange={(e) => setCompraId(e.target.value)} className={inputClass}>
              <option value="">— Elegir —</option>
              {compras.map((c) => <option key={c.id} value={c.id}>{c.comprador_nombre} · {c.vehiculo_marca} {c.vehiculo_modelo}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Fecha</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Descripción (opcional)</label><input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} /></div>
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear recordatorio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostventaClient({
  comprasIniciales, recordatoriosIniciales, perfiles, miId,
}: { comprasIniciales: Compra[]; recordatoriosIniciales: Recordatorio[]; perfiles: Perfil[]; miId: string }) {
  const [compras, setCompras] = useState(comprasIniciales);
  const [recordatorios, setRecordatorios] = useState(recordatoriosIniciales);
  const [tab, setTab] = useState<Tab>("recontactos");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [query, setQuery] = useState("");
  const [modalBoleto, setModalBoleto] = useState(false);
  const [modalExcel, setModalExcel] = useState(false);
  const [modalRecordatorio, setModalRecordatorio] = useState(false);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const compraMap = useMemo(() => Object.fromEntries(compras.map((c) => [c.id, c])), [compras]);

  const recordatoriosFiltrados = useMemo(() => {
    let lista = recordatorios.filter((r) => compraMap[r.compra_id]);
    if (tipoFiltro) lista = lista.filter((r) => r.tipo === tipoFiltro);
    return lista;
  }, [recordatorios, tipoFiltro, compraMap]);

  const grupos = useMemo(() => {
    const acc: Record<string, Recordatorio[]> = {};
    recordatoriosFiltrados.forEach((r) => {
      const b = bucketUrgencia(r.fecha_vencimiento);
      (acc[b] ||= []).push(r);
    });
    return acc;
  }, [recordatoriosFiltrados]);

  const marcarHecho = async (r: Recordatorio) => {
    setMarcandoId(r.id);
    const { error } = await supabase2.from("postventa_recordatorios").update({ estado: "hecho", hecho_por: miId, hecho_en: new Date().toISOString() }).eq("id", r.id);
    if (!error) setRecordatorios((prev) => prev.filter((x) => x.id !== r.id));
    setMarcandoId(null);
  };

  const comprasFiltradas = useMemo(() => {
    if (!query.trim()) return compras;
    const q = query.trim().toLowerCase();
    return compras.filter((c) => [c.comprador_nombre, c.vehiculo_marca, c.vehiculo_modelo, c.vehiculo_dominio].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [compras, query]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Phone className="w-5 h-5 text-rose-600" /> Postventa</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tab === "recontactos" ? `Recontacto de clientes: service, VTV, seguro, garantía y seguimiento. ${recordatoriosFiltrados.length} pendientes.` : `Todos los que ya te compraron un auto. ${compras.length} clientes.`}
              </p>
            </div>
            {tab === "recontactos" ? (
              <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <option value="">Todos los tipos</option>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente o auto..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
              </div>
            )}
          </div>

          <div className="flex gap-1 mb-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 w-fit">
            <button onClick={() => setTab("recontactos")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tab === "recontactos" ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400"}`}><Phone className="w-3.5 h-3.5" /> Recontactos</button>
            <button onClick={() => setTab("compraron")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${tab === "compraron" ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400"}`}><Repeat className="w-3.5 h-3.5" /> Ya compraron</button>
          </div>

          {tab === "recontactos" ? (
            <>
              <div className="flex justify-end mb-3">
                <button onClick={() => setModalRecordatorio(true)} disabled={compras.length === 0} title={compras.length === 0 ? "Primero cargá una compra en «Ya compraron»" : undefined} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">+ Nuevo recordatorio</button>
              </div>
              {recordatoriosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Phone className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No hay recontactos pendientes</h3>
                  <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">Cuando una venta tenga recordatorios (service, VTV, seguro...), van a aparecer acá agrupados por urgencia.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {ORDEN_BUCKETS.filter((b) => grupos[b]?.length).map((bucket) => (
                    <div key={bucket}>
                      <p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${BUCKET_COLOR[bucket]}`}>{bucket} · {grupos[bucket].length}</p>
                      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5">
                        {grupos[bucket].map((r) => {
                          const compra = compraMap[r.compra_id];
                          const Icon = TIPO_MAP[r.tipo]?.icon || Pin;
                          return (
                            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{TIPO_MAP[r.tipo]?.label} — {compra?.comprador_nombre}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{compra?.vehiculo_marca} {compra?.vehiculo_modelo} · {fmtFechaLocal(r.fecha_vencimiento)}{r.descripcion ? ` · ${r.descripcion}` : ""}</p>
                                </div>
                              </div>
                              <button onClick={() => marcarHecho(r)} disabled={marcandoId === r.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 shrink-0 disabled:opacity-50">
                                <Check className="w-3.5 h-3.5" /> Hecho
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {comprasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Repeat className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Todavía no hay compras cerradas</h3>
                  <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">Cuando una venta pase a Cerrada, su comprador va a aparecer acá. También podés cargar compras viejas desde un Excel.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 mb-4">
                  {comprasFiltradas.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{c.comprador_nombre}</p>
                        <p className="text-[11px] text-slate-400">{[c.vehiculo_marca, c.vehiculo_modelo, c.vehiculo_anio].filter(Boolean).join(" ")} · {fmtFechaLocal(c.fecha_venta)}</p>
                      </div>
                      <div className="text-right">
                        {c.precio && <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.moneda} {c.precio.toLocaleString("es-AR")}</p>}
                        <span className="text-[9px] font-bold uppercase text-slate-400">{c.origen === "escaneo_boleto" ? "Boleto" : c.origen === "excel" ? "Excel" : "Manual"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center gap-2">
                <button onClick={() => setModalBoleto(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Camera className="w-3.5 h-3.5" /> Escanear boleto</button>
                <button onClick={() => setModalExcel(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Upload className="w-3.5 h-3.5" /> Importar Excel</button>
              </div>
            </>
          )}
        </div>
      </div>

      {modalBoleto && <EscanearBoletoModal miId={miId} onClose={() => setModalBoleto(false)} onCreado={(c) => setCompras((prev) => [c, ...prev])} />}
      {modalExcel && <ImportarExcelModal miId={miId} onClose={() => setModalExcel(false)} onImportadas={(nuevas) => setCompras((prev) => [...nuevas, ...prev])} />}
      {modalRecordatorio && <NuevoRecordatorioModal compras={compras} miId={miId} onClose={() => setModalRecordatorio(false)} onCreado={(r) => setRecordatorios((prev) => [...prev, r])} />}
    </div>
  );
}

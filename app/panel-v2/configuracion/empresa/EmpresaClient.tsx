"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Loader2 } from "lucide-react";
import { supabase2 } from "@/lib/supabase2/client";

const MODULO_LABEL: Record<string, string> = {
  cotizaciones: "Cotizaciones", pedidos: "Pedidos", consignaciones: "Consignaciones", gestoria: "Gestoría",
  taller: "Taller", service: "Service", postventa: "Postventa", reclamos: "Reclamos", infracciones: "Infracciones",
  telefonos_utiles: "Teléfonos útiles", tesoreria: "Tesorería", liquidaciones: "Liquidaciones", reportes: "Reportes",
  marketing: "Marketing", mensajes: "Mensajes", whatsapp: "WhatsApp", correos: "Correos", nps: "NPS",
  sugerencias: "Sugerencias", dormidos: "Dormidos", oportunidades: "Oportunidades",
};
const SECTORES = ["ventas", "recepcion", "finanzas", "gestoria", "taller", "cm"] as const;
const SECTOR_LABEL: Record<string, string> = { ventas: "Ventas", recepcion: "Recepción", finanzas: "Finanzas", gestoria: "Gestoría", taller: "Taller", cm: "CM" };

interface Modulo { modulo: string; activo: boolean; }
interface Visibilidad { modulo: string; sector: string; visible: boolean; }

export default function EmpresaClient() {
  const [subtab, setSubtab] = useState<"modulos" | "comisiones" | "plazos" | "routing" | "resumen" | "branding">("modulos");
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [visibilidad, setVisibilidad] = useState<Visibilidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/modulos");
    const data = await res.json();
    if (res.ok) { setModulos(data.modulos); setVisibilidad(data.visibilidad); }
    else setError(data.error || "No se pudo cargar.");
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleModulo = async (modulo: string, activo: boolean) => {
    setModulos((prev) => prev.map((m) => (m.modulo === modulo ? { ...m, activo } : m)));
    await fetch("/api/panel-v2/modulos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "modulo", modulo, activo }) });
  };

  const esVisible = (modulo: string, sector: string) => {
    const fila = visibilidad.find((v) => v.modulo === modulo && v.sector === sector);
    return fila ? fila.visible : true; // sin fila = visible por default
  };

  const toggleVisibilidad = async (modulo: string, sector: string) => {
    const nuevoValor = !esVisible(modulo, sector);
    setVisibilidad((prev) => {
      const existe = prev.some((v) => v.modulo === modulo && v.sector === sector);
      return existe
        ? prev.map((v) => (v.modulo === modulo && v.sector === sector ? { ...v, visible: nuevoValor } : v))
        : [...prev, { modulo, sector, visible: nuevoValor }];
    });
    await fetch("/api/panel-v2/modulos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "visibilidad", modulo, sector, visible: nuevoValor }) });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Configuración</h1>
        <p className="text-sm text-slate-400">Módulos que usa la agencia y qué ve cada sector.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10">
        <Link href="/panel-v2/configuracion" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Usuarios</Link>
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-rose-600 text-rose-600">Empresa</span>
        <Link href="/panel-v2/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">WhatsApp</Link>
        <Link href="/panel-v2/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Instagram</Link>
      </div>

      {error && <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</div>}

      <div className="flex items-center gap-1">
        <button onClick={() => setSubtab("modulos")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "modulos" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Módulos</button>
        <button onClick={() => setSubtab("comisiones")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "comisiones" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Comisiones</button>
        <button onClick={() => setSubtab("plazos")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "plazos" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Plazos / SLAs</button>
        <button onClick={() => setSubtab("routing")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "routing" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Lead Routing</button>
        <button onClick={() => setSubtab("resumen")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "resumen" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Resumen diario</button>
        <button onClick={() => setSubtab("branding")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subtab === "branding" ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"}`}>Branding</button>
      </div>

      {cargando ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : subtab === "modulos" ? (
        <>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Módulos</p>
            <p className="text-xs text-slate-400 mb-4">Lo que apagues desaparece del menú de todos los usuarios (también en el celular) y del acceso directo por URL.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {modulos.map((m) => (
                <label key={m.modulo} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{MODULO_LABEL[m.modulo] || m.modulo}</span>
                  <input type="checkbox" checked={m.activo} onChange={(e) => toggleModulo(m.modulo, e.target.checked)} className="w-4 h-4 accent-rose-600" />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Visibilidad por sector</p>
            <p className="text-xs text-slate-400 mb-4">Destildar esconde esa sección para ese sector (menú, celular, URL directa). Admin ve siempre todo. Un módulo apagado arriba no aparece para nadie, tenga o no tenga tilde acá.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                    <th className="py-2 pr-2">Módulo</th>
                    {SECTORES.map((s) => <th key={s} className="py-2 px-2 text-center">{SECTOR_LABEL[s]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {modulos.map((m) => (
                    <tr key={m.modulo} className={`border-b border-slate-50 dark:border-white/5 ${!m.activo ? "opacity-40" : ""}`}>
                      <td className="py-2 pr-2 font-bold text-slate-700 dark:text-slate-200">{MODULO_LABEL[m.modulo] || m.modulo}</td>
                      {SECTORES.map((s) => (
                        <td key={s} className="py-2 px-2 text-center">
                          <input type="checkbox" disabled={!m.activo} checked={esVisible(m.modulo, s)} onChange={() => toggleVisibilidad(m.modulo, s)} className="w-4 h-4 accent-rose-600" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : subtab === "comisiones" ? (
        <ComisionesConfig />
      ) : subtab === "plazos" ? (
        <PlazosConfig />
      ) : subtab === "routing" ? (
        <LeadRoutingConfig />
      ) : subtab === "resumen" ? (
        <ResumenDiarioConfig />
      ) : (
        <BrandingConfig />
      )}
    </div>
  );
}

interface ConfigEmpresa {
  modo_comision: "porcentaje" | "fijo" | "ninguna";
  comision_vendedor_pct_default: number;
  comision_consignacion_pct_default: number;
  monto_fijo_comision: number;
  comision_presets: number[];
  pct_toma_consignacion: number;
  exigir_resena_comision: boolean;
}

function ComisionesConfig() {
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [nuevoPreset, setNuevoPreset] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/configuracion-empresa");
    const data = await res.json();
    if (res.ok) setConfig(data.config);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (patch: Partial<ConfigEmpresa>) => {
    if (!config) return;
    const actualizado = { ...config, ...patch };
    setConfig(actualizado);
    setGuardando(true);
    setMensaje("");
    const res = await fetch("/api/panel-v2/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setGuardando(false);
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  const quitarPreset = (pct: number) => {
    if (!config) return;
    guardar({ comision_presets: config.comision_presets.filter((p) => p !== pct) });
  };

  const agregarPreset = () => {
    if (!config) return;
    const val = Number(nuevoPreset);
    if (!val || val <= 0 || config.comision_presets.includes(val)) return;
    guardar({ comision_presets: [...config.comision_presets, val].sort((a, b) => a - b) });
    setNuevoPreset("");
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Modo de comisión</p>
          <p className="text-xs text-slate-400 mb-2">"Ninguna" esconde la sección Mis Comisiones para todos los vendedores.</p>
          <div className="flex gap-2">
            {(["porcentaje", "fijo", "ninguna"] as const).map((m) => (
              <button key={m} onClick={() => guardar({ modo_comision: m })} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${config.modo_comision === m ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>
                {m === "porcentaje" ? "Por porcentaje" : m === "fijo" ? "Monto fijo por venta" : "Ninguna"}
              </button>
            ))}
          </div>
        </div>

        {config.modo_comision === "porcentaje" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Comisión default de venta (%)</label>
              <input type="number" step="0.1" defaultValue={config.comision_vendedor_pct_default} onBlur={(e) => guardar({ comision_vendedor_pct_default: Number(e.target.value) })} className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Porcentaje que sugiere el modal de venta cuando el vendedor no es responsable de consignación.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Bonus responsable de consignación (%)</label>
              <input type="number" step="0.1" defaultValue={config.comision_consignacion_pct_default} onBlur={(e) => guardar({ comision_consignacion_pct_default: Number(e.target.value) })} className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Bonus adicional cuando el responsable de consignación es distinto del vendedor.</p>
            </div>
          </div>
        )}

        {config.modo_comision === "fijo" && (
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Monto fijo por venta</label>
            <input type="number" defaultValue={config.monto_fijo_comision} onBlur={(e) => guardar({ monto_fijo_comision: Number(e.target.value) })} className={inputClass} />
          </div>
        )}

        {config.modo_comision === "porcentaje" && (
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Presets del selector de comisión</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.comision_presets.map((p) => (
                <span key={p} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {p}% <button onClick={() => quitarPreset(p)} className="text-slate-400 hover:text-rose-600">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" step="0.1" placeholder="Nuevo preset" value={nuevoPreset} onChange={(e) => setNuevoPreset(e.target.value)} className={inputClass} />
              <button onClick={agregarPreset} className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 shrink-0">Agregar</button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Botones rápidos del modal de venta.</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Valor de toma (cotizaciones)</label>
          <input type="number" step="0.1" defaultValue={config.pct_toma_consignacion} onBlur={(e) => guardar({ pct_toma_consignacion: Number(e.target.value) })} className={inputClass} />
          <p className="text-[11px] text-slate-400 mt-1">% que se descuenta al precio para sugerir la toma del usado. Sale en el listado de Cotizaciones ("TOMA -{config.pct_toma_consignacion}%") y en el PDF del presupuesto. Disponible sea cual sea el modo de comisión de arriba.</p>
        </div>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={config.exigir_resena_comision} onChange={(e) => guardar({ exigir_resena_comision: e.target.checked })} className="w-4 h-4 accent-rose-600 mt-0.5" />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Bloquear la comisión hasta pedir la reseña
            <span className="block text-[11px] text-slate-400 font-normal">Nadie marca su comisión como cobrada hasta pedir su reseña de Google. El admin puede pagar igual como excepción, queda registrado.</span>
          </span>
        </label>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
      {guardando && <p className="text-xs text-slate-400">Guardando...</p>}
    </div>
  );
}

interface ConfigPlazos {
  sla_cotizacion_horas: number;
  stock_dias_estancado: number;
  plazo_recontacto_meses: number;
  asignar_al_enviar: boolean;
  reasignar_pedidos: boolean;
  plazo_reasignacion_pedidos_horas: number;
  plazo_reconfirmacion_pedidos_dias: number;
}

function PlazosConfig() {
  const [config, setConfig] = useState<ConfigPlazos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/configuracion-empresa");
    const data = await res.json();
    if (res.ok) setConfig(data.config);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (patch: Partial<ConfigPlazos>) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setMensaje("");
    const res = await fetch("/api/panel-v2/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Umbrales de tiempo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">SLA de respuesta a cotización pendiente (horas)</label>
            <input type="number" defaultValue={config.sla_cotizacion_horas} onBlur={(e) => guardar({ sla_cotizacion_horas: Number(e.target.value) })} className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1">Barra de urgencia en Cotizaciones — verde/amarillo/rojo según cuánto pasó de este plazo.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Stock estancado (días)</label>
            <input type="number" defaultValue={config.stock_dias_estancado} onBlur={(e) => guardar({ stock_dias_estancado: Number(e.target.value) })} className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1">Días en stock a partir de los que un vehículo se marca como estancado.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Recontacto de clientes (meses)</label>
            <input type="number" defaultValue={config.plazo_recontacto_meses} onBlur={(e) => guardar({ plazo_recontacto_meses: Number(e.target.value) })} className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1">Filtro default en Recontactos: clientes que compraron hace más de este plazo.</p>
          </div>
        </div>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={config.asignar_al_enviar} onChange={(e) => guardar({ asignar_al_enviar: e.target.checked })} className="w-4 h-4 accent-rose-600 mt-0.5" />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Asignar el cliente al vendedor al enviar un recontacto
            <span className="block text-[11px] text-slate-400 font-normal">Si un cliente sin vendedor recibe un mensaje de recontacto, queda asignado a quien lo mandó.</span>
          </span>
        </label>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Reasignación de Pedidos</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2">
          Estos valores ya existen en la base pero todavía no hay una automatización en Pedidos que los lea — cambiarlos acá no tiene efecto hasta que se construya esa lógica.
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.reasignar_pedidos} onChange={(e) => guardar({ reasignar_pedidos: e.target.checked })} className="w-4 h-4 accent-rose-600" />
          <span className="text-sm text-slate-700 dark:text-slate-200">Reasignación automática de pedidos</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Plazo de reasignación (horas)</label>
            <input type="number" defaultValue={config.plazo_reasignacion_pedidos_horas} onBlur={(e) => guardar({ plazo_reasignacion_pedidos_horas: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Plazo de reconfirmación (días)</label>
            <input type="number" defaultValue={config.plazo_reconfirmacion_pedidos_dias} onBlur={(e) => guardar({ plazo_reconfirmacion_pedidos_dias: Number(e.target.value) })} className={inputClass} />
          </div>
        </div>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

interface ConfigRouting {
  lead_routing_activo: boolean;
  lead_routing_umbral_minutos: number;
  lead_routing_max_reasignaciones: number;
  cada_vendedor_ve_solo_sus_clientes: boolean;
}
interface VendedorRouting { id: string; nombre: string; recibirLeads: boolean }

function LeadRoutingConfig() {
  const [config, setConfig] = useState<ConfigRouting | null>(null);
  const [vendedores, setVendedores] = useState<VendedorRouting[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    const [resConfig, { data: perfiles }, { data: disponibilidad }] = await Promise.all([
      fetch("/api/panel-v2/configuracion-empresa").then((r) => r.json()),
      supabase2.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
      supabase2.from("disponibilidad_vendedor").select("vendedor_id, recibir_leads"),
    ]);
    setConfig(resConfig.config);
    const recibeMap = Object.fromEntries((disponibilidad || []).map((d) => [d.vendedor_id, d.recibir_leads]));
    setVendedores((perfiles || []).filter((p) => p.roles?.includes("ventas")).map((p) => ({ id: p.id, nombre: p.nombre, recibirLeads: recibeMap[p.id] ?? true })));
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardarConfig = async (patch: Partial<ConfigRouting>) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setMensaje("");
    const res = await fetch("/api/panel-v2/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  const toggleVendedor = async (id: string, recibirLeads: boolean) => {
    setVendedores((prev) => prev.map((v) => (v.id === id ? { ...v, recibirLeads } : v)));
    await supabase2.from("disponibilidad_vendedor").upsert({ vendedor_id: id, recibir_leads: recibirLeads, updated_at: new Date().toISOString() });
  };

  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Reasignación automática</p>
        <p className="text-xs text-slate-400">Si un vendedor no marca el lead como contactado en el plazo fijado, pasa al siguiente de la ronda. Corre cada 10 minutos.</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.lead_routing_activo} onChange={(e) => guardarConfig({ lead_routing_activo: e.target.checked })} className="w-4 h-4 accent-rose-600" />
          <span className="text-sm text-slate-700 dark:text-slate-200">Activar reasignación automática</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Plazo sin contactar (minutos)</label>
            <input type="number" defaultValue={config.lead_routing_umbral_minutos} onBlur={(e) => guardarConfig({ lead_routing_umbral_minutos: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Máximo de reasignaciones por lead</label>
            <input type="number" defaultValue={config.lead_routing_max_reasignaciones} onBlur={(e) => guardarConfig({ lead_routing_max_reasignaciones: Number(e.target.value) })} className={inputClass} />
            <p className="text-[11px] text-slate-400 mt-1">Al llegar al tope, deja de rotar y avisa a encargados/admin en vez de seguir dando vueltas.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Vendedores en la ronda</p>
        <p className="text-xs text-slate-400 mb-4">Destildar saca al vendedor del reparto rotativo (leads nuevos de WhatsApp y reasignaciones por timeout). Es lo mismo que "seguir recibiendo leads" en Mi disponibilidad — cambiarlo acá afecta a cualquier vendedor, no solo a vos.</p>
        <div className="space-y-1.5">
          {vendedores.map((v) => (
            <label key={v.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 text-sm">
              <span className="text-slate-700 dark:text-slate-200">{v.nombre}</span>
              <input type="checkbox" checked={v.recibirLeads} onChange={(e) => toggleVendedor(v.id, e.target.checked)} className="w-4 h-4 accent-rose-600" />
            </label>
          ))}
          {vendedores.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay vendedores activos con rol Ventas.</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-2">
        <p className="text-sm font-bold text-slate-800 dark:text-white">Visibilidad de clientes</p>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={config.cada_vendedor_ve_solo_sus_clientes} onChange={(e) => guardarConfig({ cada_vendedor_ve_solo_sus_clientes: e.target.checked })} className="w-4 h-4 accent-rose-600 mt-0.5" />
          <span className="text-sm text-slate-700 dark:text-slate-200">
            Cada vendedor ve solo sus clientes
            <span className="block text-[11px] text-slate-400 font-normal">Admin y recepción siguen viendo todo. Ojo: un cliente sin vendedor asignado no le aparece a ningún vendedor con esto prendido, solo a admin y recepción.</span>
          </span>
        </label>
      </div>

      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

interface ConfigGenerica { [key: string]: any }

function useConfigEmpresa() {
  const [config, setConfig] = useState<ConfigGenerica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/configuracion-empresa");
    const data = await res.json();
    if (res.ok) setConfig(data.config);
    else setMensaje(data.error || "No se pudo cargar.");
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (patch: ConfigGenerica) => {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setMensaje("");
    const res = await fetch("/api/panel-v2/configuracion-empresa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setMensaje(res.ok ? "Guardado." : data.error || "No se pudo guardar.");
    setTimeout(() => setMensaje(""), 2000);
  };

  return { config, cargando, mensaje, guardar };
}

function ResumenDiarioConfig() {
  const { config, cargando, mensaje, guardar } = useConfigEmpresa();
  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Resumen diario de la agencia</p>
          <p className="text-xs text-slate-400">Cada mañana se arma el resumen del día (ventas, leads nuevos, expedientes atrasados, cuotas por vencer, stock). Cada miembro lo recibe en la campanita según su rol.</p>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={config.resumen_diario_activo} onChange={(e) => guardar({ resumen_diario_activo: e.target.checked })} className="w-4 h-4 accent-rose-600" />
          <span className="text-sm text-slate-700 dark:text-slate-200">Resumen diario activo</span>
        </label>
        {config.resumen_diario_activo && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Hora de envío (0 a 23, hora Argentina)</label>
                <input type="number" min={0} max={23} defaultValue={config.resumen_diario_hora} onBlur={(e) => guardar({ resumen_diario_hora: Number(e.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Días para marcar expediente atrasado</label>
                <input type="number" min={1} defaultValue={config.resumen_diario_dias_expediente_atrasado} onBlur={(e) => guardar({ resumen_diario_dias_expediente_atrasado: Number(e.target.value) })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre en el texto del resumen</label>
              <input type="text" placeholder="Vacío = el nombre de tu agencia" defaultValue={config.resumen_diario_nombre || ""} onBlur={(e) => guardar({ resumen_diario_nombre: e.target.value || null })} className={inputClass} />
            </div>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={config.resumen_diario_whatsapp_activo} onChange={(e) => guardar({ resumen_diario_whatsapp_activo: e.target.checked })} className="w-4 h-4 accent-rose-600 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Enviar también por WhatsApp al dueño
                <span className="block text-[11px] text-slate-400 font-normal">Llega desde la línea del CRM con una plantilla aprobada por Meta.</span>
              </span>
            </label>
            {config.resumen_diario_whatsapp_activo && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Teléfono destino</label>
                  <input type="text" placeholder="5493425000000" defaultValue={config.resumen_diario_telefono_dueno || ""} onBlur={(e) => guardar({ resumen_diario_telefono_dueno: e.target.value || null })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Plantilla (Meta)</label>
                  <input type="text" defaultValue={config.resumen_diario_plantilla_meta} onBlur={(e) => guardar({ resumen_diario_plantilla_meta: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Idioma de la plantilla</label>
                  <input type="text" defaultValue={config.resumen_diario_idioma} onBlur={(e) => guardar({ resumen_diario_idioma: e.target.value })} className={inputClass} />
                </div>
              </div>
            )}
            <p className="text-[11px] text-amber-600 dark:text-amber-400">El armado y envío automático (cron + "Enviar prueba ahora") todavía no está construido — esto guarda la configuración para cuando se arme esa parte.</p>
          </>
        )}
      </div>
      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

function BrandingConfig() {
  const { config, cargando, mensaje, guardar } = useConfigEmpresa();
  if (cargando || !config) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Branding de la agencia</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg px-3 py-2 mt-2">
            Guarda estos datos, pero el generador de boleto/recibo/mandato todavía no los lee (usa texto fijo de la versión anterior) — conectarlo es un cambio aparte, más grande.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre de la agencia</label>
          <input type="text" defaultValue={config.branding_nombre || ""} onBlur={(e) => guardar({ branding_nombre: e.target.value || null })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Domicilio</label>
          <input type="text" defaultValue={config.branding_domicilio || ""} onBlur={(e) => guardar({ branding_domicilio: e.target.value || null })} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Teléfono</label>
            <input type="text" defaultValue={config.branding_telefono || ""} onBlur={(e) => guardar({ branding_telefono: e.target.value || null })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">CUIT</label>
            <input type="text" defaultValue={config.branding_cuit || ""} onBlur={(e) => guardar({ branding_cuit: e.target.value || null })} className={inputClass} />
          </div>
        </div>
      </div>
      {mensaje && <p className="text-xs font-bold text-emerald-600">{mensaje}</p>}
    </div>
  );
}

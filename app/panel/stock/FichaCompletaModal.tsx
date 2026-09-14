"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, Car, CheckCircle2, XCircle } from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";
import { vehiculoPendientes } from "@/lib/vehiculos";
import VehiculoSeguimientos from "./VehiculoSeguimientos";

interface Vehiculo {
  id: string; marca: string; modelo: string; anio: number; patente: string | null; color: string | null;
  condicion: string; km: number | null; precio_venta: number; moneda_venta: string; precio_compra: number | null; moneda_compra: string | null;
  ubicacion: string | null; provincia: string | null; estado: string; publicado_ml: boolean; fotos: string[];
  sucursal: { nombre: string } | null; vendedor_asignado_id: string | null; created_at: string;
  transmision: string | null; combustible: string | null; carroceria: string | null; motor_cilindrada: string | null;
  version: string | null; puertas: number | null; ["dueños_anteriores"]?: number | null;
  propietario_nombre: string | null; propietario_dni: string | null; propietario_telefono: string | null; propietario_email: string | null;
  consignado_por: string | null; manuales: boolean; duplicado_llaves: boolean; servicios_oficiales: boolean;
}
interface Perfil { id: string; nombre: string }
interface Lead { id: string; nombre: string | null; telefono: string | null; estado_lead: string | null; created_at: string }

const TABS = ["Resumen y fotos", "Clientes", "Documentación", "Gastos y margen", "Rendimiento", "Precios e historial", "Seguimientos"] as const;
type TabKey = typeof TABS[number];

function fmtPrecio(n: number | null, moneda: string | null) {
  if (!n || !moneda) return "—";
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}
function diasEnStock(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 dark:text-white text-right">{valor ?? "—"}</span>
    </div>
  );
}
function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
      <span className={ok ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}>{label}</span>
    </div>
  );
}

export default function FichaCompletaModal({
  vehiculo, perfiles, miId, diasEstancado = 90, onClose, onEditar,
}: { vehiculo: Vehiculo; perfiles: Perfil[]; miId: string; diasEstancado?: number; onClose: () => void; onEditar: () => void }) {
  const [tab, setTab] = useState<TabKey>("Resumen y fotos");
  const [fotoIndex, setFotoIndex] = useState(0);
  const [leads, setLeads] = useState<{ whatsapp: Lead[]; instagram: Lead[] } | null>(null);

  useEffect(() => {
    if (tab !== "Clientes" || leads) return;
    Promise.all([
      supabase2.from("whatsapp_conversaciones").select("id, nombre, telefono, estado_lead, created_at").eq("vehiculo_id", vehiculo.id).order("created_at", { ascending: false }),
      supabase2.from("instagram_conversaciones").select("id, nombre, telefono, estado_lead, created_at").eq("vehiculo_id", vehiculo.id).order("created_at", { ascending: false }),
    ]).then(([wa, ig]) => setLeads({ whatsapp: wa.data || [], instagram: ig.data || [] }));
  }, [tab, leads, vehiculo.id]);

  const pendientes = vehiculoPendientes(vehiculo);
  const dias = diasEnStock(vehiculo.created_at);
  const progresoPct = Math.min(100, Math.round((dias / diasEstancado) * 100));
  const mismaMoneda = vehiculo.precio_compra && vehiculo.moneda_compra === vehiculo.moneda_venta;
  const margen = mismaMoneda ? Number(vehiculo.precio_venta) - Number(vehiculo.precio_compra) : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ficha comercial y seguimiento de la unidad</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-1 px-5 mt-3 border-b border-slate-200 dark:border-white/10 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 whitespace-nowrap px-3 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${tab === t ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {pendientes.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 mb-4">
              <ul className="space-y-0.5">
                {pendientes.map((p) => <li key={p} className="text-xs text-amber-700 dark:text-amber-300">• {p}</li>)}
              </ul>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-300/60 mt-1.5">El estado de MercadoLibre corresponde a lo registrado en el CRM.</p>
            </div>
          )}

          {tab === "Resumen y fotos" && (
            <div>
              <div className="relative w-full h-56 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden mb-4">
                {vehiculo.fotos.length > 0 ? (
                  <>
                    <img src={vehiculo.fotos[fotoIndex]} alt="" className="w-full h-full object-contain" />
                    {vehiculo.fotos.length > 1 && (
                      <>
                        <button onClick={() => setFotoIndex((i) => (i - 1 + vehiculo.fotos.length) % vehiculo.fotos.length)} className="absolute left-2 p-1.5 rounded-full bg-black/50 text-white"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setFotoIndex((i) => (i + 1) % vehiculo.fotos.length)} className="absolute right-2 p-1.5 rounded-full bg-black/50 text-white"><ChevronRight className="w-4 h-4" /></button>
                        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{fotoIndex + 1}/{vehiculo.fotos.length}</span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1"><Car className="w-8 h-8 text-slate-300 dark:text-slate-600" /><span className="text-xs text-slate-400">Sin foto</span></div>
                )}
              </div>
              <Dato label="Estado" valor={vehiculo.estado} />
              <Dato label="Condición" valor={vehiculo.condicion} />
              <Dato label="Color" valor={vehiculo.color} />
              <Dato label="Versión" valor={vehiculo.version} />
              <Dato label="Combustible" valor={vehiculo.combustible} />
              <Dato label="Transmisión" valor={vehiculo.transmision} />
              <Dato label="Carrocería" valor={vehiculo.carroceria} />
              <Dato label="Motor" valor={vehiculo.motor_cilindrada} />
              <Dato label="Puertas" valor={vehiculo.puertas} />
              <Dato label="Ubicación" valor={vehiculo.sucursal?.nombre || vehiculo.ubicacion} />
            </div>
          )}

          {tab === "Clientes" && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Propietario / consignatario</p>
              <Dato label="Nombre" valor={vehiculo.propietario_nombre} />
              <Dato label="DNI/CUIT" valor={vehiculo.propietario_dni} />
              <Dato label="Teléfono" valor={vehiculo.propietario_telefono} />
              <Dato label="Email" valor={vehiculo.propietario_email} />
              <Dato label="Consignado por" valor={vehiculo.consignado_por} />

              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 mb-2">Leads interesados en esta unidad</p>
              {leads === null ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...</div>
              ) : leads.whatsapp.length + leads.instagram.length === 0 ? (
                <p className="text-xs text-slate-400">Todavía no hay conversaciones vinculadas a esta unidad (WhatsApp/Instagram).</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...leads.whatsapp.map((l) => ({ ...l, canal: "WhatsApp" })), ...leads.instagram.map((l) => ({ ...l, canal: "Instagram" }))].map((l) => (
                    <li key={`${l.canal}-${l.id}`} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{l.nombre || l.telefono || "Sin nombre"}</span>
                      <span className="text-slate-400">{l.canal} · {l.estado_lead || "nuevo"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "Documentación" && (
            <div>
              <Dato label="Patente/VIN" valor={vehiculo.patente} />
              <Dato label="Provincia radicado" valor={vehiculo.provincia} />
              <Dato label="Dueños anteriores" valor={vehiculo["dueños_anteriores"]} />
              <Dato label="Fecha de alta" valor={new Date(vehiculo.created_at).toLocaleDateString("es-AR")} />
              <div className="flex flex-col gap-2 mt-3">
                <Check ok={vehiculo.manuales} label="Manuales" />
                <Check ok={vehiculo.duplicado_llaves} label="Duplicado de llaves" />
                <Check ok={vehiculo.servicios_oficiales} label="Service oficial al día" />
              </div>
            </div>
          )}

          {tab === "Gastos y margen" && (
            <div>
              <Dato label="Precio de compra" valor={fmtPrecio(vehiculo.precio_compra, vehiculo.moneda_compra)} />
              <Dato label="Precio de venta" valor={fmtPrecio(vehiculo.precio_venta, vehiculo.moneda_venta)} />
              <Dato label="Margen bruto" valor={margen !== null ? fmtPrecio(margen, vehiculo.moneda_venta) : "No calculable (monedas distintas o sin precio de compra)"} />
              <p className="text-xs text-slate-400 mt-4">Todavía no hay gastos individuales (service, preparación, comisiones) registrados por unidad en este módulo — el margen de arriba es bruto, precio de venta menos precio de compra.</p>
            </div>
          )}

          {tab === "Rendimiento" && (
            <div>
              <Dato label="Días en stock" valor={`${dias}d`} />
              <div className="mt-2 mb-4">
                <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${progresoPct >= 100 ? "bg-rose-500" : progresoPct >= 50 ? "bg-amber-400" : "bg-sky-400"}`} style={{ width: `${progresoPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{dias}d / {diasEstancado}d hasta considerarse estancado ({progresoPct}%)</p>
              </div>
              <Dato label="Publicado en MercadoLibre" valor={vehiculo.publicado_ml ? "Sí" : "No"} />
            </div>
          )}

          {tab === "Precios e historial" && (
            <div>
              <Dato label="Precio de compra" valor={fmtPrecio(vehiculo.precio_compra, vehiculo.moneda_compra)} />
              <Dato label="Precio de venta actual" valor={fmtPrecio(vehiculo.precio_venta, vehiculo.moneda_venta)} />
              <p className="text-xs text-slate-400 mt-4">Todavía no se registra un historial de cambios de precio — solo se muestra el valor vigente.</p>
            </div>
          )}

          {tab === "Seguimientos" && <VehiculoSeguimientos vehiculoId={vehiculo.id} perfiles={perfiles} miId={miId} />}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-white/10 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">Cerrar</button>
          <button onClick={onEditar} className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Editar</button>
        </div>
      </div>
    </div>
  );
}

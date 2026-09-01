"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { notificarEncargados } from "@/lib/panelV2/notificaciones";
import { FileText, Save, X } from "lucide-react";
import ClienteBuscador, { ClienteSeleccionado } from "@/components/panelV2/ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "@/components/panelV2/VehiculoSelector";
import ConfirmarPrecioModal from "@/components/panelV2/ConfirmarPrecioModal";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-white/10 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5";

export default function NuevoPresupuestoModal({
  clientes, vehiculos, vendedores, sucursales, onClose,
}: { clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; onClose: () => void }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [vendedorId, setVendedorId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [miId, setMiId] = useState<string | null>(null);

  useEffect(() => {
    supabase2.auth.getUser().then(({ data }) => setMiId(data.user?.id || null));
  }, []);
  const vendedoresSinYo = vendedores.filter((v) => v.id !== miId);

  const [precioArs, setPrecioArs] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [imprimirEn, setImprimirEn] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarModalPrecio, setMostrarModalPrecio] = useState(false);

  useEffect(() => {
    if (!vehiculo?.vehiculo_id) return;
    if (vehiculo.precio_publicado_ars) setPrecioArs(String(vehiculo.precio_publicado_ars));
    if (vehiculo.precio_publicado_usd) setPrecioUsd(String(vehiculo.precio_publicado_usd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.vehiculo_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Elegí o cargá un cliente.");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return alert("Elegí o cargá el vehículo.");
    setMostrarModalPrecio(true);
  };

  const guardarPresupuesto = async (precioConfirmado: boolean) => {
    if (!cliente || !vehiculo) return;
    setMostrarModalPrecio(false);
    setGuardando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { data: ultimo } = await supabase2.from("presupuestos").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const tokenPublico = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

      const { data, error } = await supabase2.from("presupuestos").insert({
        numero: siguienteNumero,
        fecha: new Date().toISOString().split("T")[0],
        token_publico: tokenPublico,
        vendedor_id: vendedorId || user?.id,
        cliente_id: cliente.id,
        cliente_nombre: `${cliente.apellido || ""} ${cliente.nombre}`.trim(),
        dominio: vehiculo.dominio,
        segmento: vehiculo.segmento,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        tipo: vehiculo.tipo,
        modelo_anio: vehiculo.modelo_anio ? Number(vehiculo.modelo_anio) : null,
        color: vehiculo.color,
        kilometros: vehiculo.kilometros ? Number(vehiculo.kilometros) : null,
        combustible: vehiculo.combustible,
        vehiculo_id: vehiculo.vehiculo_id,
        precio_ars: precioArs ? Number(precioArs) : null,
        precio_usd: precioUsd ? Number(precioUsd) : null,
        imprimir_en: imprimirEn || null,
        observaciones: observaciones || null,
        precio_confirmado: precioConfirmado,
      }).select("id").single();

      if (error) throw error;

      if (!precioConfirmado) {
        await notificarEncargados(
          supabase2,
          `${cliente.nombre} ${cliente.apellido || ""} — Presupuesto N° ${siguienteNumero}: el vendedor no confirmó el precio ($${(Number(precioArs) || 0).toLocaleString("es-AR")}). Verificalo.`,
          `/panel-v2/presupuestos/imprimir/${data.id}`
        );
      }

      onClose();
      router.push(`/panel-v2/presupuestos/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el presupuesto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-rose-600" /> Nuevo Presupuesto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-6">
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Cliente</h3>
              <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Vehículo</h3>
              {!vehiculo?.vehiculo_id && (
                <div>
                  <label className={labelClass}>Sucursal (para cargar un auto nuevo al stock)</label>
                  <select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              )}
              <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} persistirManual sucursalId={sucursalId} />
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Datos comerciales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Precio de venta ($)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} disabled={!!precioUsd} placeholder="0" /></div>
                <div><label className={labelClass}>Precio de venta (US$)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} disabled={!!precioArs} placeholder="0" /></div>
                <div>
                  <label className={labelClass}>Vendedor</label>
                  <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                    <option value="">Vos (usuario actual)</option>
                    {vendedoresSinYo.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Imprimir en</label><input className={inputClass} value={imprimirEn} onChange={(e) => setImprimirEn(e.target.value)} placeholder="Ej: Casa Central" /></div>
              </div>
              <div><label className={labelClass}>Observaciones</label><textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div>
            </div>
          </div>

          <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
            <button type="button" onClick={onClose} disabled={guardando} className="ml-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Presupuesto"}
            </button>
          </div>
        </form>
      </div>

      {mostrarModalPrecio && (
        <ConfirmarPrecioModal
          precioTexto={`$ ${(Number(precioArs) || 0).toLocaleString("es-AR")}${precioUsd ? ` (US$ ${Number(precioUsd).toLocaleString("es-AR")})` : ""}`}
          onConfirmar={() => guardarPresupuesto(true)}
          onNoSeguro={() => guardarPresupuesto(false)}
          onCancelar={() => setMostrarModalPrecio(false)}
        />
      )}
    </div>
  );
}

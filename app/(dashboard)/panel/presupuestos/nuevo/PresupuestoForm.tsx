"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { notificarEncargados } from "@/lib/notificaciones";
import { ArrowLeft, FileText, Save } from "lucide-react";
import ClienteBuscador, { ClienteSeleccionado } from "../../ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "../../VehiculoSelector";
import ConfirmarPrecioModal from "../../ConfirmarPrecioModal";

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function PresupuestoForm({ clientes, vehiculos, vendedores, sucursales, vehiculoInicial, cotizacionId }: { clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; vehiculoInicial?: any | null; cotizacionId?: string | null }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(
    vehiculoInicial
      ? {
          vehiculo_id: vehiculoInicial.id,
          dominio: vehiculoInicial.patente || "",
          segmento: vehiculoInicial.segmento || "",
          marca: vehiculoInicial.marca || "",
          modelo: vehiculoInicial.modelo || "",
          tipo: vehiculoInicial.tipo || "",
          marca_motor: vehiculoInicial.marca || "",
          numero_motor: vehiculoInicial.numero_motor || "",
          marca_chasis: vehiculoInicial.marca || "",
          numero_chasis: vehiculoInicial.numero_chasis || "",
          modelo_anio: String(vehiculoInicial.anio || ""),
          color: vehiculoInicial.color || "",
          kilometros: String(vehiculoInicial.kilometraje || ""),
          combustible: vehiculoInicial.tipo_combustible || "",
        }
      : null
  );
  const [vendedorId, setVendedorId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
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
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ultimo } = await supabase.from("presupuestos").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const tokenPublico = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

      const { data, error } = await supabase.from("presupuestos").insert({
        numero: siguienteNumero,
        fecha: new Date().toISOString().split("T")[0],
        token_publico: tokenPublico,
        vendedor_id: vendedorId || user?.id,
        cotizacion_id: cotizacionId || null,
        cliente_id: cliente.id,
        cliente: `${cliente.apellido} ${cliente.nombre}`,
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
        precio_venta_ars: precioArs ? Number(precioArs) : null,
        precio_venta_usd: precioUsd ? Number(precioUsd) : null,
        imprimir_en: imprimirEn || null,
        observaciones: observaciones || null,
        precio_confirmado: precioConfirmado,
      }).select("id").single();

      if (error) throw error;

      if (!precioConfirmado) {
        await notificarEncargados(
          supabase,
          `${cliente.nombre} ${cliente.apellido} — Presupuesto N° ${siguienteNumero}: el vendedor no confirmó el precio ($${(Number(precioArs) || 0).toLocaleString("es-AR")}). Verificalo.`,
          `/panel/presupuestos/imprimir/${data.id}`,
          "presupuestos"
        );
      }

      router.push(`/panel/presupuestos/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el presupuesto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-[#0a2a6b] pb-4">
          <div>
            <Link href="/panel/presupuestos" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors mb-2 font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-sky-300" /> Nuevo Presupuesto
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Cliente</h2>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Vehículo</h2>
            {!vehiculo?.vehiculo_id && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Sucursal (para cargar un auto nuevo al stock)</label>
                <select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
                </select>
              </div>
            )}
            <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} persistirManual sucursalId={sucursalId} />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Datos comerciales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Precio de venta ($)</label>
                <input type="number" step="0.01" className={inputClass} value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Precio de venta (US$)</label>
                <input type="number" step="0.01" className={inputClass} value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Vendedor</label>
                <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  <option value="">Vos (usuario actual)</option>
                  {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Imprimir en</label>
                <input className={inputClass} value={imprimirEn} onChange={(e) => setImprimirEn(e.target.value)} placeholder="Ej: Casa Central" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Observaciones</label>
              <textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Presupuesto"}
          </button>
        </form>

        {mostrarModalPrecio && (
          <ConfirmarPrecioModal
            precioTexto={`$ ${(Number(precioArs) || 0).toLocaleString("es-AR")}${precioUsd ? ` (US$ ${Number(precioUsd).toLocaleString("es-AR")})` : ""}`}
            onConfirmar={() => guardarPresupuesto(true)}
            onNoSeguro={() => guardarPresupuesto(false)}
            onCancelar={() => setMostrarModalPrecio(false)}
          />
        )}
      </div>
    </div>
  );
}

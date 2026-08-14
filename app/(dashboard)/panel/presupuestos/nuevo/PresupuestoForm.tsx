"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Save } from "lucide-react";
import ClienteBuscador, { ClienteSeleccionado } from "../../ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "../../VehiculoSelector";

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400";

export default function PresupuestoForm({ clientes, vehiculos, vendedores }: { clientes: any[]; vehiculos: any[]; vendedores: any[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [vendedorId, setVendedorId] = useState("");
  const [precioArs, setPrecioArs] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [imprimirEn, setImprimirEn] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Elegí o cargá un cliente.");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return alert("Elegí o cargá el vehículo.");

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ultimo } = await supabase.from("presupuestos").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;

      const { data, error } = await supabase.from("presupuestos").insert({
        numero: siguienteNumero,
        fecha: new Date().toISOString().split("T")[0],
        vendedor_id: vendedorId || user?.id,
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
      }).select("id").single();

      if (error) throw error;
      router.push(`/panel/presupuestos/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el presupuesto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <div>
            <Link href="/panel/presupuestos" className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-sm transition-colors mb-2 font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Nuevo Presupuesto
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Cliente</h2>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Vehículo</h2>
            <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Datos comerciales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Precio de venta ($)</label>
                <input type="number" step="0.01" className={inputClass} value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Precio de venta (US$)</label>
                <input type="number" step="0.01" className={inputClass} value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Vendedor</label>
                <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  <option value="">Vos (usuario actual)</option>
                  {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Imprimir en</label>
                <input className={inputClass} value={imprimirEn} onChange={(e) => setImprimirEn(e.target.value)} placeholder="Ej: Casa Central" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Observaciones</label>
              <textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Presupuesto"}
          </button>
        </form>
      </div>
    </div>
  );
}

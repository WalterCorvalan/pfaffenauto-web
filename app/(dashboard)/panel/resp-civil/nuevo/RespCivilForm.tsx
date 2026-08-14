"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, ShieldCheck, Save } from "lucide-react";
import ClienteBuscador, { ClienteSeleccionado } from "../../ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "../../VehiculoSelector";

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400";

export default function RespCivilForm({ clientes, vehiculos, vendedores }: { clientes: any[]; vehiculos: any[]; vendedores: any[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [vendedorId, setVendedorId] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Elegí o cargá un cliente.");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return alert("Elegí o cargá el vehículo.");

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ultimo } = await supabase.from("resp_civil").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const ahora = new Date();

      const { data, error } = await supabase.from("resp_civil").insert({
        numero: siguienteNumero,
        fecha: ahora.toISOString().split("T")[0],
        hora: ahora.toTimeString().slice(0, 5),
        vendedor_id: vendedorId || user?.id,
        cliente_id: cliente.id,
        dni: cliente.dni,
        fecha_nacimiento: cliente.fecha_nacimiento || null,
        apellido: cliente.apellido,
        nombre: cliente.nombre,
        calle: cliente.calle,
        numero_calle: cliente.numero,
        depto: cliente.depto,
        localidad: cliente.localidad,
        codigo_postal: cliente.codigo_postal,
        provincia: cliente.provincia,
        telefono_linea: cliente.telefono_linea,
        telefono_celular: cliente.telefono_celular,
        correo_electronico: cliente.correo_electronico,
        cuit_cuil: cliente.cuit_cuil,
        estado_civil: cliente.estado_civil,
        profesion: cliente.profesion,
        vehiculo_id: vehiculo.vehiculo_id,
        dominio: vehiculo.dominio,
        segmento: vehiculo.segmento,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        tipo: vehiculo.tipo,
        marca_motor: vehiculo.marca_motor,
        numero_motor: vehiculo.numero_motor,
        marca_chasis: vehiculo.marca_chasis,
        numero_chasis: vehiculo.numero_chasis,
        modelo_anio: vehiculo.modelo_anio ? Number(vehiculo.modelo_anio) : null,
        color: vehiculo.color,
        observaciones: observaciones || null,
      }).select("id").single();

      if (error) throw error;
      router.push(`/panel/resp-civil/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el recibo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
          <div>
            <Link href="/panel/resp-civil" className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-sm transition-colors mb-2 font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" /> Nuevo Recibo de Resp. Civil
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Vendedor</h2>
            <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Vos (usuario actual)</option>
              {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Cliente</h2>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">Vehículo</h2>
            <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Observaciones</label>
            <textarea className={inputClass} rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej: Vehículo para venta a consumidor final. Deberá entregarse transferido..." />
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Recibo"}
          </button>
        </form>
      </div>
    </div>
  );
}

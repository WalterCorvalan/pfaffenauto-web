"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { notificarEncargados } from "@/lib/notificaciones";
import { ArrowLeft, Wallet, Save } from "lucide-react";
import { mostrarToast } from "@/lib/toast";
import ClienteBuscador, { ClienteSeleccionado } from "../../ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "../../VehiculoSelector";
import ConfirmarPrecioModal from "../../ConfirmarPrecioModal";

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function SenaForm({ clientes, vehiculos, vendedores, sucursales, vinculoLead }: { clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; vinculoLead?: { campo: string; id: string } | null }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [sucursalId, setSucursalId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [ventaArs, setVentaArs] = useState("");
  const [ventaUsd, setVentaUsd] = useState("");
  const [senaArs, setSenaArs] = useState("");
  const [senaUsd, setSenaUsd] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [patentTransf, setPatentTransf] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarModalPrecio, setMostrarModalPrecio] = useState(false);
  const [miId, setMiId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMiId(data.user?.id || null));
  }, []);

  // "Vos (usuario actual)" ya cubre al usuario logueado — si además aparece
  // en la lista de vendedores, queda duplicado.
  const vendedoresSinYo = vendedores.filter((v) => v.id !== miId);

  // Al elegir un auto del stock, el precio de venta sale directo de su ficha
  // (en pesos, dólares, o ambos según cómo esté publicado) en vez de tipearlo a mano.
  useEffect(() => {
    if (!vehiculo?.vehiculo_id) return;
    if (vehiculo.precio_publicado_ars) setVentaArs(String(vehiculo.precio_publicado_ars));
    if (vehiculo.precio_publicado_usd) setVentaUsd(String(vehiculo.precio_publicado_usd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.vehiculo_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return mostrarToast("Elegí o cargá un cliente.", "error");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return mostrarToast("Elegí o cargá el vehículo.", "error");
    if (!sucursalId) return mostrarToast("Elegí la sucursal.", "error");
    setMostrarModalPrecio(true);
  };

  const guardarSena = async (precioConfirmado: boolean) => {
    if (!cliente || !vehiculo) return;
    setMostrarModalPrecio(false);
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ultimo } = await supabase.from("senas").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const generarCodigoSeguimiento = () =>
        Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
      const codigoSeguimiento = generarCodigoSeguimiento();

      const { data, error } = await supabase.from("senas").insert({
        numero: siguienteNumero,
        codigo_seguimiento: codigoSeguimiento,
        etapa_seguimiento: "Seña",
        fecha: new Date().toISOString().split("T")[0],
        sucursal_id: sucursalId,
        vendedor_id: vendedorId || user?.id,
        estado: "Activa",
        ...(vinculoLead ? { [vinculoLead.campo]: vinculoLead.id } : {}),
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
        venta_ars: ventaArs ? Number(ventaArs) : null,
        venta_usd: ventaUsd ? Number(ventaUsd) : null,
        sena_ars: senaArs ? Number(senaArs) : null,
        sena_usd: senaUsd ? Number(senaUsd) : null,
        tipo_cambio: tipoCambio ? Number(tipoCambio) : null,
        patentamiento_transferencia_ars: patentTransf ? Number(patentTransf) : null,
        observaciones: observaciones || null,
        precio_confirmado: precioConfirmado,
      }).select("id").single();

      if (error) throw error;

      if (vehiculo.vehiculo_id) {
        // Vía API con service role: RLS de "vehiculos" no deja que un vendedor
        // cambie el estado directo (solo admin/encargado desde AccionesAuto),
        // y el UPDATE del cliente se perdía en silencio (éxito, 0 filas).
        try {
          const resReservar = await fetch("/api/vehiculos/reservar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehiculoId: vehiculo.vehiculo_id, estado: "Reservado" }),
          });
          if (!resReservar.ok) throw new Error();
        } catch {
          mostrarToast("La seña se guardó, pero no se pudo marcar el auto como Reservado. Avisá a un encargado para que lo actualice a mano.", "error");
        }
      }

      if (!precioConfirmado) {
        await notificarEncargados(
          supabase,
          `${cliente.nombre} ${cliente.apellido} — Seña N° ${siguienteNumero}: el vendedor no confirmó el precio ($${(Number(ventaArs) || 0).toLocaleString("es-AR")}). Verificalo.`,
          `/panel/senas/imprimir/${data.id}`,
          "senas"
        );
      }

      router.push(`/panel/senas/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar la seña.", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-[#0a2a6b] pb-4">
          <div>
            <Link href="/panel/senas" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors mb-2 font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-300" /> Nueva Seña
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Sucursal y vendedor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Sucursal *</label>
                <select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} required>
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Vendedor</label>
                <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vos (usuario actual)</option>
                  {vendedoresSinYo.map((v) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Cliente</h2>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Vehículo</h2>
            <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} persistirManual sucursalId={sucursalId} />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Datos comerciales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Venta ($)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={ventaArs} onChange={(e) => setVentaArs(e.target.value)} disabled={!!ventaUsd} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Venta (US$)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={ventaUsd} onChange={(e) => setVentaUsd(e.target.value)} disabled={!!ventaArs} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Seña ($)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={senaArs} onChange={(e) => setSenaArs(e.target.value)} disabled={!!senaUsd} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Seña (US$)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={senaUsd} onChange={(e) => setSenaUsd(e.target.value)} disabled={!!senaArs} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Tipo de cambio</label>
                <input type="number" step="0.01" className={inputClass} value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Patentamiento / Transferencia ($)</label>
                <input type="number" step="0.01" className={inputClass} value={patentTransf} onChange={(e) => setPatentTransf(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Observaciones</label>
              <textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Seña"}
          </button>
        </form>

        {mostrarModalPrecio && (
          <ConfirmarPrecioModal
            precioTexto={`Venta $ ${(Number(ventaArs) || 0).toLocaleString("es-AR")}${senaArs ? ` · Seña $ ${Number(senaArs).toLocaleString("es-AR")}` : ""}`}
            onConfirmar={() => guardarSena(true)}
            onNoSeguro={() => guardarSena(false)}
            onCancelar={() => setMostrarModalPrecio(false)}
          />
        )}
      </div>
    </div>
  );
}

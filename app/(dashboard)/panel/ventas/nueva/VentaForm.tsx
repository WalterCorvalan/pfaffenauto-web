"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, CarFront, User, DollarSign, FileText, 
  CheckCircle2, ChevronRight, ChevronLeft, Save, Printer 
} from "lucide-react";

// ================= 1. ESQUEMA DE VALIDACIÓN (TEXTOS PUROS PARA EVITAR TS ERRORS) =================
const operacionSchema = z.object({
  tipo_operacion: z.enum(["Presupuesto", "Seña", "Venta"]),
  sucursal_id: z.string().min(1, "Debe seleccionar una sucursal"),
  vehiculo_id: z.string().min(1, "Debe seleccionar un vehículo"),
  cliente_id: z.string().optional(),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  apellido: z.string().min(2, "El apellido es obligatorio"),
  dni: z.string().min(6, "DNI inválido"),
  cuit_cuil: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  estado_civil: z.string().optional(),
  profesion: z.string().optional(),
  calle: z.string().optional(),
  numero: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  telefono_celular: z.string().min(8, "Celular obligatorio"),
  correo_electronico: z.string().email("Email inválido").optional().or(z.literal("")),
  
  // Guardamos como string en el form para que TS no moleste, los convertimos a int en el onSubmit
  precio_venta_ars: z.string().min(1, "El precio es obligatorio"),
  monto_sena_ars: z.string().optional(),
  gastos_transferencia_ars: z.string().optional(),
  banco_prenda: z.string().optional(),
  monto_prenda_ars: z.string().optional(),
  cantidad_cuotas: z.string().optional(),
  
  compania_seguro: z.string().optional(),
  observaciones: z.string().optional(),
});

type OperacionValues = z.infer<typeof operacionSchema>;

export default function VentaForm({ vehiculos, clientes, sucursales }: { vehiculos: any[], clientes: any[], sucursales: any[] }) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const totalPasos = 4;
  const [loading, setLoading] = useState(false);
  const [operacionGeneradaId, setOperacionGeneradaId] = useState<string | null>(null);
  
  // Bloqueo anti-doble-click para no saltarse el paso 4
  const [bloqueoSeguridad, setBloqueoSeguridad] = useState(true);

  // Hook Form con Zod Resolver
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<OperacionValues>({
    resolver: zodResolver(operacionSchema),
    defaultValues: {
      tipo_operacion: "Venta",
      gastos_transferencia_ars: "0",
      monto_sena_ars: "0",
      monto_prenda_ars: "0",
      cantidad_cuotas: "0",
    }
  });

  const watchTipoOp = watch("tipo_operacion");

  // Activar botón de enviar recién 400ms después de llegar al paso 4
  useEffect(() => {
    if (paso === 4) {
      setBloqueoSeguridad(true);
      const timer = setTimeout(() => setBloqueoSeguridad(false), 400);
      return () => clearTimeout(timer);
    }
  }, [paso]);

  const handleSelectVehiculo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setValue("vehiculo_id", id);
    const auto = vehiculos.find(v => v.id === id);
    if (auto) {
      // Forzamos a String para evitar que RHF y Zod peleen
      setValue("precio_venta_ars", String(auto.precio_publicado_ars || "0"));
    }
  };

  const handleSelectCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const cli = clientes.find(c => c.id === id);
    if (cli) {
      setValue("cliente_id", cli.id);
      setValue("nombre", cli.nombre);
      setValue("apellido", cli.apellido);
      setValue("dni", cli.dni);
      setValue("cuit_cuil", cli.cuit_cuil || "");
      setValue("telefono_celular", cli.telefono_celular);
      setValue("correo_electronico", cli.correo_electronico || "");
      setValue("calle", cli.calle || "");
      setValue("numero", cli.numero || "");
      setValue("localidad", cli.localidad || "");
      setValue("provincia", cli.provincia || "");
      setValue("estado_civil", cli.estado_civil || "");
      setValue("profesion", cli.profesion || "");
      setValue("fecha_nacimiento", cli.fecha_nacimiento || "");
    }
  };

  const calcularSaldo = () => {
    const v = Number(watch("precio_venta_ars")) || 0;
    const s = Number(watch("monto_sena_ars")) || 0;
    const p = Number(watch("monto_prenda_ars")) || 0;
    const g = Number(watch("gastos_transferencia_ars")) || 0;
    return (v + g) - s - p;
  };

  // VALIDACIÓN OBLIGATORIA POR BLOQUES
  const handleSiguiente = async () => {
    let camposAValidar: any[] = [];
    
    if (paso === 1) camposAValidar = ["tipo_operacion", "sucursal_id", "vehiculo_id"];
    else if (paso === 2) camposAValidar = ["nombre", "apellido", "dni", "telefono_celular"];
    else if (paso === 3) camposAValidar = ["precio_venta_ars"];

    const esValido = await trigger(camposAValidar);
    if (esValido) {
      setPaso((prev) => Math.min(prev + 1, totalPasos));
    }
  };

  // Bloqueo de Enter solo en pasos anteriores al 4
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (paso < totalPasos) {
        e.preventDefault(); 
        handleSiguiente(); 
      }
    }
  };

  const onSubmit: SubmitHandler<OperacionValues> = async (data) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Cliente
      let cliente_id_final = data.cliente_id;
      if (!cliente_id_final) {
        const { data: newClient, error: errCli } = await supabase.from("clientes").insert({
          nombre: data.nombre, apellido: data.apellido, dni: data.dni,
          cuit_cuil: data.cuit_cuil, telefono_celular: data.telefono_celular,
          correo_electronico: data.correo_electronico, calle: data.calle, numero: data.numero,
          localidad: data.localidad, provincia: data.provincia, estado_civil: data.estado_civil,
          profesion: data.profesion, fecha_nacimiento: data.fecha_nacimiento || null
        }).select("id").single();
        
        if (errCli) throw errCli;
        cliente_id_final = newClient.id;
      }

      // 2. Parseo estricto a números para guardar en Supabase sin errores
      const p_venta = Number(data.precio_venta_ars) || 0;
      const p_sena = Number(data.monto_sena_ars) || 0;
      const p_transf = Number(data.gastos_transferencia_ars) || 0;
      const p_prenda = Number(data.monto_prenda_ars) || 0;
      const p_cuotas = Number(data.cantidad_cuotas) || 0;

      const saldoFinal = calcularSaldo();
      
      const { data: nuevaOperacion, error: errVenta } = await supabase.from("ventas").insert({
        vehiculo_id: data.vehiculo_id,
        cliente_id: cliente_id_final,
        vendedor_id: user?.id,
        precio_final_ars: p_venta,
        forma_pago: p_prenda > 0 ? "Financiado" : "Contado",
        observaciones: data.observaciones,
        tipo_operacion: data.tipo_operacion,
        saldo_pendiente: saldoFinal,
        seña_ars: p_sena,
        gastos_transferencia: p_transf,
        datos_prenda: data.banco_prenda ? { banco: data.banco_prenda, monto: p_prenda, cuotas: p_cuotas } : null
      }).select("id").single();

      if (errVenta) throw errVenta;

      // 3. Update stock si corresponde
      const nuevoEstadoAuto = data.tipo_operacion === "Seña" ? "Reservado" : "Vendido";
      if (data.tipo_operacion !== "Presupuesto") {
        await supabase.from("vehiculos").update({ estado: nuevoEstadoAuto }).eq("id", data.vehiculo_id);
      }

      setOperacionGeneradaId(nuevaOperacion.id);
      setPaso(5); 
    } catch (error) {
      console.error(error);
      alert("Error al procesar la operación.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0ea5e9] transition-colors text-white placeholder:text-slate-500";

  if (paso === 5) {
    return (
      <div className="text-center py-20 bg-[#121212] border border-white/10 rounded-3xl animate-fadeIn max-w-2xl mx-auto mt-6">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Operación Registrada</h2>
        <p className="text-slate-400 mb-8">El {watchTipoOp} se ha guardado correctamente en el sistema.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => router.push(`/panel/ventas/imprimir/${operacionGeneradaId}`)} className="w-full sm:w-auto bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg">
            <Printer className="w-4 h-4" /> Imprimir Documento
          </button>
          <button onClick={() => router.push("/panel/gastos")} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            Ver en Tesorería
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="text-2xl md:text-3xl font-serif text-[#0ea5e9] flex items-center gap-3">
            <FileText className="w-7 h-7" /> Nueva Operación
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-3 py-1 rounded-full border border-[#0ea5e9]/20">
            Paso {paso} de {totalPasos}
          </span>
        </div>
      </div>

      <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full mb-8 overflow-hidden">
        <div className="bg-[#0ea5e9] h-full transition-all duration-300" style={{ width: `${(paso / totalPasos) * 100}%` }}></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
        
        {paso === 1 && (
          <SectionCard title="1. Detalle de la Operación" icon={<CarFront />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Campo label="Tipo de Documento *" error={errors.tipo_operacion?.message}>
                <select {...register("tipo_operacion")} className={inputClass}>
                  <option value="Presupuesto">Solo Presupuesto (No reserva el auto)</option>
                  <option value="Seña">Recibo de Seña (Pasa a Reservado)</option>
                  <option value="Venta">Boleto de Compraventa (Pasa a Vendido)</option>
                </select>
              </Campo>
              
              <Campo label="Sucursal *" error={errors.sucursal_id?.message}>
                <select {...register("sucursal_id")} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </Campo>

              <div className="md:col-span-2 pt-4 border-t border-white/5">
                <Campo label="Vehículo a operar *" error={errors.vehiculo_id?.message}>
                  <select {...register("vehiculo_id")} onChange={handleSelectVehiculo} className={inputClass}>
                    <option value="">Seleccione el auto del stock...</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.patente || "0KM"} - {v.marca} {v.modelo} {v.anio} ({v.estado})
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </div>
          </SectionCard>
        )}

        {paso === 2 && (
          <SectionCard title="2. Datos del Cliente" icon={<User />}>
            <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <Campo label="Buscador rápido (Clientes existentes)">
                <select onChange={handleSelectCliente} className={inputClass}>
                  <option value="">Nuevo Cliente (Llenar datos a mano)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.apellido}, {c.nombre} - DNI: {c.dni}</option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Campo label="Nombre *" error={errors.nombre?.message}><input {...register("nombre")} className={inputClass} /></Campo>
              <Campo label="Apellido *" error={errors.apellido?.message}><input {...register("apellido")} className={inputClass} /></Campo>
              <Campo label="DNI *" error={errors.dni?.message}><input {...register("dni")} className={inputClass} /></Campo>
              <Campo label="CUIT/CUIL" error={errors.cuit_cuil?.message}><input {...register("cuit_cuil")} className={inputClass} /></Campo>
              <Campo label="Celular *" error={errors.telefono_celular?.message}><input {...register("telefono_celular")} className={inputClass} /></Campo>
              <Campo label="Email" error={errors.correo_electronico?.message}><input type="email" {...register("correo_electronico")} className={inputClass} /></Campo>
              <Campo label="Calle y Número"><input {...register("calle")} className={inputClass} placeholder="Ej: Av. San Martín 1234" /></Campo>
              <Campo label="Localidad"><input {...register("localidad")} className={inputClass} /></Campo>
            </div>
          </SectionCard>
        )}

        {paso === 3 && (
          <SectionCard title="3. Datos Comerciales (Liquidación)" icon={<DollarSign />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Campo label="Precio de Venta ($) *" error={errors.precio_venta_ars?.message}>
                <input type="number" {...register("precio_venta_ars")} className={`${inputClass} text-emerald-400 font-bold text-lg`} />
              </Campo>
              <Campo label="Monto de Seña / Anticipo ($)" error={errors.monto_sena_ars?.message}>
                <input type="number" {...register("monto_sena_ars")} className={inputClass} />
              </Campo>
              <Campo label="Gastos Gestoría / Transf. ($)" error={errors.gastos_transferencia_ars?.message}>
                <input type="number" {...register("gastos_transferencia_ars")} className={inputClass} />
              </Campo>
              <Campo label="Saldo a Abonar ($) (Automático)">
                <div className="w-full bg-[#1A1A1A] border border-slate-700 p-3 rounded-xl text-lg font-mono text-white">
                  $ {calcularSaldo().toLocaleString("es-AR")}
                </div>
              </Campo>

              <div className="md:col-span-2 pt-4 mt-2 border-t border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos de Prenda / Financiación</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Campo label="Banco / Entidad"><input {...register("banco_prenda")} className={inputClass} /></Campo>
                  <Campo label="Monto Financiado ($)" error={errors.monto_prenda_ars?.message}><input type="number" {...register("monto_prenda_ars")} className={inputClass} /></Campo>
                  <Campo label="Cantidad de Cuotas" error={errors.cantidad_cuotas?.message}><input type="number" {...register("cantidad_cuotas")} className={inputClass} /></Campo>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {paso === 4 && (
          <SectionCard title="4. Información Adicional" icon={<FileText />}>
            <div className="space-y-5">
              <Campo label="¿Contrata Seguro? (Compañía)">
                <input {...register("compania_seguro")} placeholder="Ej: Federación Patronal" className={inputClass} />
              </Campo>
              <Campo label="Observaciones en el Boleto (IMPORTANTE)" error={errors.observaciones?.message}>
                <textarea 
                  {...register("observaciones")} 
                  className={`${inputClass} min-h-[150px] leading-relaxed`} 
                  placeholder="Ej: Entrega como parte de pago un Focus 2015 + $24M de diferencia..."
                />
              </Campo>
            </div>
          </SectionCard>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
          {paso > 1 && (
            <button type="button" onClick={() => setPaso(p => p - 1)} className="w-1/3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          )}

          {paso < totalPasos ? (
            <button type="button" onClick={handleSiguiente} className={`${paso === 1 ? "w-full" : "w-2/3"} bg-[#0ea5e9] hover:bg-[#0284c7] py-4 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition-all flex items-center justify-center gap-2 shadow-lg`}>
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={loading || bloqueoSeguridad} className="w-2/3 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {loading ? "Generando..." : <><Save className="w-4 h-4" /> Guardar Operación</>}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl w-full animate-fadeIn">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
        <span className="text-[#0ea5e9]">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="text-xs text-slate-400 block mb-1.5 font-bold tracking-wide">{label}</label>
      {children}
      {error && <span className="text-rose-500 text-[10px] mt-1.5 block font-bold">{error}</span>}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // <--- ESTA ES LA LÍNEA QUE FALTABA
import { ArrowLeft, Save, User, MapPin, Phone, FileText, X } from "lucide-react";
import { useForm } from "react-hook-form";

// Tipado basado exactamente en la imagen enviada
type ClienteFormValues = {
  sucursal: string;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  cuit_cuil: string;
  estado_civil: string;
  profesion: string;
  clave_fiscal: string;
  calle: string;
  numero: string;
  depto: string;
  localidad: string;
  codigo_postal: string;
  provincia: string;
  telefono_linea: string;
  telefono_celular: string;
  correo_electronico: string;
  observaciones: string;
};

export default function NuevoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormValues>();

  const onSubmit = async (data: ClienteFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('clientes').insert({
        sucursal_id: data.sucursal, 
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
        fecha_nacimiento: data.fecha_nacimiento || null,
        calle: data.calle,
        numero: data.numero,
        depto: data.depto,
        localidad: data.localidad,
        codigo_postal: data.codigo_postal,
        provincia: data.provincia,
        estado_civil: data.estado_civil,
        profesion: data.profesion,
        cuit_cuil: data.cuit_cuil,
        clave_fiscal: data.clave_fiscal,
        telefono_linea: data.telefono_linea,
        telefono_celular: data.telefono_celular,
        correo_electronico: data.correo_electronico,
        observaciones: data.observaciones
      });

      if (error) throw error;
      
      alert("Cliente guardado con éxito.");
      router.push("/panel"); // Te devuelve al panel principal
    } catch (error) {
      console.error(error);
      alert("Error al guardar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4] transition-colors text-white placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-[#0b1329] text-white w-full overflow-x-hidden pt-4 pb-16">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <h1 className="text-2xl md:text-3xl font-serif text-[#0ea5e9] flex items-center gap-3">
              <User className="w-7 h-7" /> Cliente Nuevo
            </h1>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            (Los datos resaltados con <span className="text-rose-500">*</span> son obligatorios)
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* SECCIÓN 1: INFORMACIÓN DEL CLIENTE */}
          <SectionCard title="Información del Cliente" icon={<User className="w-4 h-4 text-[#0ea5e9]" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              
              <div className="md:col-span-2 border-b border-white/5 pb-4 mb-2">
                <Campo label="Sucursal *" error={errors.sucursal?.message}>
                  <select {...register("sucursal", { required: "Requerido" })} className={inputClass}>
                    <option value="">Seleccionar sucursal...</option>
                    <option value="Panamericana">Panamericana</option>
                    <option value="Olivos">Olivos</option>
                    <option value="Villa de Mayo">Villa de Mayo</option>
                  </select>
                </Campo>
              </div>

              <Campo label="Nombre *" error={errors.nombre?.message}>
                <input type="text" {...register("nombre", { required: "Requerido" })} className={inputClass} placeholder="Nombre completo" />
              </Campo>
              <Campo label="Apellido *" error={errors.apellido?.message}>
                <input type="text" {...register("apellido", { required: "Requerido" })} className={inputClass} placeholder="Apellido completo" />
              </Campo>

              <Campo label="D.N.I. *" error={errors.dni?.message}>
                <input type="text" {...register("dni", { required: "Requerido" })} className={inputClass} placeholder="Sin puntos" />
              </Campo>
              <Campo label="Fecha de Nacimiento (día/mes/año)">
                <input type="date" {...register("fecha_nacimiento")} className={inputClass} />
              </Campo>

              <Campo label="Cuit/Cuil">
                <input type="text" {...register("cuit_cuil")} className={inputClass} placeholder="Sin guiones" />
              </Campo>
              <Campo label="Clave Fiscal">
                <input type="text" {...register("clave_fiscal")} className={inputClass} />
              </Campo>

              <Campo label="Estado Civil">
                <select {...register("estado_civil")} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                </select>
              </Campo>
              <Campo label="Profesión">
                <input type="text" {...register("profesion")} className={inputClass} placeholder="Ej: Empleado, Comerciante..." />
              </Campo>

              {/* DOMICILIO INCORPORADO */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-[#0ea5e9] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Domicilio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Campo label="Calle"><input type="text" {...register("calle")} className={inputClass} /></Campo>
                  </div>
                  <div>
                    <Campo label="Número"><input type="text" {...register("numero")} className={inputClass} /></Campo>
                  </div>
                  <div>
                    <Campo label="Depto"><input type="text" {...register("depto")} className={inputClass} /></Campo>
                  </div>
                  <div className="md:col-span-2">
                    <Campo label="Localidad"><input type="text" {...register("localidad")} className={inputClass} /></Campo>
                  </div>
                  <div>
                    <Campo label="Cód. Postal"><input type="text" {...register("codigo_postal")} className={inputClass} /></Campo>
                  </div>
                  <div>
                    <Campo label="Provincia">
                      <select {...register("provincia")} className={inputClass}>
                        <option value="">Seleccionar...</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="CABA">CABA</option>
                        <option value="Córdoba">Córdoba</option>
                        <option value="Santa Fe">Santa Fe</option>
                        {/* Agregar más si es necesario */}
                      </select>
                    </Campo>
                  </div>
                </div>
              </div>

            </div>
          </SectionCard>

          {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO */}
          <SectionCard title="Información de Contacto" icon={<Phone className="w-4 h-4 text-[#0ea5e9]" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Campo label="Teléfono Celular *">
                <input type="tel" {...register("telefono_celular", { required: "Requerido" })} className={inputClass} placeholder="Ej: 1122334455" />
              </Campo>
              <Campo label="Teléfono de Línea">
                <input type="tel" {...register("telefono_linea")} className={inputClass} placeholder="Opcional" />
              </Campo>
              <div className="md:col-span-2">
                <Campo label="Correo Electrónico">
                  <input type="email" {...register("correo_electronico")} className={inputClass} placeholder="ejemplo@correo.com" />
                </Campo>
              </div>
            </div>
          </SectionCard>

          {/* SECCIÓN 3: INFORMACIÓN ADICIONAL */}
          <SectionCard title="Información Adicional" icon={<FileText className="w-4 h-4 text-[#0ea5e9]" />}>
            <Campo label="Observaciones">
              <textarea 
                {...register("observaciones")} 
                className={`${inputClass} min-h-[120px] resize-y`} 
                placeholder="Notas sobre el cliente, preferencias de compra, etc."
              ></textarea>
            </Campo>
          </SectionCard>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar Cliente</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// Subcomponentes UI para mantener la limpieza
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div className="bg-[#0f172a] p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl w-full">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/80">
        {icon} {title}
      </h2>
      <div className="w-full">{children}</div>
    </div>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode; }) {
  return (
    <div className="w-full">
      <label className="text-xs text-slate-400 block mb-1.5 font-bold tracking-wide">
        {label.includes('*') ? (
          <>{label.replace('*', '')} <span className="text-rose-500">*</span></>
        ) : label}
      </label>
      {children}
      {error && <span className="text-rose-500 text-[10px] mt-1.5 block font-bold tracking-wide">{error}</span>}
    </div>
  );
}
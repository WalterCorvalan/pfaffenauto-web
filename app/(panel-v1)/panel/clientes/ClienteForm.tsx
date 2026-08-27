"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Phone,
  FileText,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { mostrarToast } from "@/lib/toast";

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
  como_nos_conocio: string;
};

export default function ClienteForm({ modo, clienteId }: { modo: "crear" | "editar"; clienteId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(modo === "editar");
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteFormValues>();

  useEffect(() => {
    supabase.from("sucursales").select("id, nombre").order("nombre").then(({ data }) => {
      if (data) setSucursales(data);
    });
  }, []);

  useEffect(() => {
    if (modo !== "editar" || !clienteId) return;
    supabase.from("clientes").select("*").eq("id", clienteId).single().then(({ data }) => {
      if (data) {
        reset({
          sucursal: data.sucursal_id || "",
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          dni: data.dni || "",
          fecha_nacimiento: data.fecha_nacimiento || "",
          cuit_cuil: data.cuit_cuil || "",
          estado_civil: data.estado_civil || "",
          profesion: data.profesion || "",
          clave_fiscal: data.clave_fiscal || "",
          calle: data.calle || "",
          numero: data.numero || "",
          depto: data.depto || "",
          localidad: data.localidad || "",
          codigo_postal: data.codigo_postal || "",
          provincia: data.provincia || "",
          telefono_linea: data.telefono_linea || "",
          telefono_celular: data.telefono_celular || "",
          correo_electronico: data.correo_electronico || "",
          observaciones: data.observaciones || "",
          como_nos_conocio: data.como_nos_conocio || "",
        });
      }
      setLoadingDatos(false);
    });
  }, [modo, clienteId, reset]);

  const onSubmit = async (data: ClienteFormValues) => {
    setLoading(true);
    try {
      const payload = {
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
        observaciones: data.observaciones,
        como_nos_conocio: data.como_nos_conocio || null,
      };

      const { error } =
        modo === "editar" && clienteId
          ? await supabase.from("clientes").update(payload).eq("id", clienteId)
          : await supabase.from("clientes").insert(payload);

      if (error) throw error;

      mostrarToast(modo === "editar" ? "Cliente actualizado con éxito." : "Cliente guardado con éxito.");
      setTimeout(() => router.push("/panel/clientes"), 900);
    } catch (error) {
      console.error(error);
      mostrarToast(`Error al ${modo === "editar" ? "actualizar" : "guardar"} el cliente.`, "error");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";

  if (loadingDatos) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#F9FAFB] dark:bg-[#001233]">
        <p className="text-sm text-slate-400 dark:text-slate-500">Cargando cliente...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] dark:bg-[#001233] overflow-hidden font-sans">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
                {modo === "editar" ? "Editar Cliente" : "Cliente Nuevo"}
              </h1>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 ml-6">
              {modo === "editar" ? "Actualizá los datos del cliente." : "Ingreso de datos al sistema de gestión."}
            </p>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
          (Los datos con <span className="text-rose-500 dark:text-rose-300 font-bold">*</span> son obligatorios)
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* SECCIÓN 1: INFORMACIÓN DEL CLIENTE */}
            <SectionCard
              title="Información del Cliente"
              icon={<User className="w-4 h-4 text-indigo-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2 border-b border-slate-100 pb-5 mb-1">
                  <Campo label="Sucursal *" error={errors.sucursal?.message}>
                    <select
                      {...register("sucursal", { required: "Requerido" })}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="" disabled className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar sucursal...</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <Campo label="Nombre *" error={errors.nombre?.message}>
                  <input
                    type="text"
                    {...register("nombre", { required: "Requerido" })}
                    className={inputClass}
                    placeholder="Nombre completo"
                  />
                </Campo>
                <Campo label="Apellido *" error={errors.apellido?.message}>
                  <input
                    type="text"
                    {...register("apellido", { required: "Requerido" })}
                    className={inputClass}
                    placeholder="Apellido completo"
                  />
                </Campo>

                <Campo label="D.N.I. *" error={errors.dni?.message}>
                  <input
                    type="text"
                    {...register("dni", { required: "Requerido" })}
                    className={inputClass}
                    placeholder="Sin puntos"
                  />
                </Campo>
                <Campo label="Fecha de Nacimiento">
                  <input
                    type="date"
                    {...register("fecha_nacimiento")}
                    className={inputClass}
                  />
                </Campo>

                <Campo label="Cuit/Cuil">
                  <input
                    type="text"
                    {...register("cuit_cuil")}
                    className={inputClass}
                    placeholder="Sin guiones"
                  />
                </Campo>
                <Campo label="Clave Fiscal">
                  <input
                    type="text"
                    {...register("clave_fiscal")}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </Campo>

                <Campo label="Estado Civil">
                  <select {...register("estado_civil")} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    <option value="Soltero/a" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Soltero/a</option>
                    <option value="Casado/a" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Casado/a</option>
                    <option value="Divorciado/a" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Divorciado/a</option>
                    <option value="Viudo/a" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Viudo/a</option>
                  </select>
                </Campo>
                <Campo label="Profesión">
                  <input
                    type="text"
                    {...register("profesion")}
                    className={inputClass}
                    placeholder="Ej: Empleado, Comerciante..."
                  />
                </Campo>
                <div className="md:col-span-2">
                  <Campo label="¿Cómo nos conoció?">
                    <select {...register("como_nos_conocio")} className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                      <option value="MercadoLibre" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">MercadoLibre</option>
                      <option value="Meta Ads (Instagram/Facebook)" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Meta Ads (Instagram/Facebook)</option>
                      <option value="Google Ads" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Google Ads</option>
                      <option value="Referido / boca en boca" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Referido / boca en boca</option>
                      <option value="Pasó por la sucursal" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Pasó por la sucursal</option>
                      <option value="Cliente anterior" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Cliente anterior</option>
                      <option value="Otro" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Otro</option>
                    </select>
                  </Campo>
                </div>

                {/* DOMICILIO INCORPORADO */}
                <div className="md:col-span-2 mt-2 pt-5 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-300" /> Domicilio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Campo label="Calle">
                        <input
                          type="text"
                          {...register("calle")}
                          className={inputClass}
                        />
                      </Campo>
                    </div>
                    <div>
                      <Campo label="Número">
                        <input
                          type="text"
                          {...register("numero")}
                          className={inputClass}
                        />
                      </Campo>
                    </div>
                    <div>
                      <Campo label="Depto">
                        <input
                          type="text"
                          {...register("depto")}
                          className={inputClass}
                        />
                      </Campo>
                    </div>
                    <div className="md:col-span-2">
                      <Campo label="Localidad">
                        <input
                          type="text"
                          {...register("localidad")}
                          className={inputClass}
                        />
                      </Campo>
                    </div>
                    <div>
                      <Campo label="Cód. Postal">
                        <input
                          type="text"
                          {...register("codigo_postal")}
                          className={inputClass}
                        />
                      </Campo>
                    </div>
                    <div>
                      <Campo label="Provincia">
                        <select {...register("provincia")} className={`${inputClass} appearance-none cursor-pointer`}>
                          <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                          <option value="Buenos Aires" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Buenos Aires</option>
                          <option value="CABA" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">CABA</option>
                          <option value="Córdoba" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Córdoba</option>
                          <option value="Santa Fe" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Santa Fe</option>
                        </select>
                      </Campo>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO */}
            <SectionCard
              title="Información de Contacto"
              icon={<Phone className="w-4 h-4 text-indigo-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Campo label="Teléfono Celular *">
                  <input
                    type="tel"
                    {...register("telefono_celular", { required: "Requerido" })}
                    className={inputClass}
                    placeholder="Ej: 1122334455"
                  />
                </Campo>
                <Campo label="Teléfono de Línea">
                  <input
                    type="tel"
                    {...register("telefono_linea")}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </Campo>
                <div className="md:col-span-2">
                  <Campo label="Correo Electrónico">
                    <input
                      type="email"
                      {...register("correo_electronico")}
                      className={inputClass}
                      placeholder="ejemplo@correo.com"
                    />
                  </Campo>
                </div>
              </div>
            </SectionCard>

            {/* SECCIÓN 3: INFORMACIÓN ADICIONAL */}
            <SectionCard
              title="Información Adicional"
              icon={<FileText className="w-4 h-4 text-indigo-600" />}
            >
              <Campo label="Observaciones">
                <textarea
                  {...register("observaciones")}
                  className={`${inputClass} min-h-[120px] resize-y custom-scrollbar`}
                  placeholder="Notas sobre el cliente, preferencias de compra, etc."
                ></textarea>
              </Campo>
            </SectionCard>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-8">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-[#00246b] transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {modo === "editar" ? "Guardar Cambios" : "Guardar Cliente"}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

// Subcomponentes UI para mantener la limpieza
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#001c55] p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] shadow-sm w-full">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6 pb-3 border-b border-slate-100 dark:border-[#0a2a6b]">
        {icon} {title}
      </h2>
      <div className="w-full">{children}</div>
    </div>
  );
}

function Campo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">
        {label.includes("*") ? (
          <>
            {label.replace("*", "")} <span className="text-rose-500 dark:text-rose-300 font-black">*</span>
          </>
        ) : (
          label
        )}
      </label>
      {children}
      {error && (
        <span className="text-rose-500 dark:text-rose-300 text-[10px] mt-1.5 block font-bold tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}

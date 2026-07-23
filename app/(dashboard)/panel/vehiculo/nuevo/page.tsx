"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAutoImage } from "@/lib/upload";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Car,
  Shield,
  DollarSign,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  patente: z.string().min(6, "Patente inválida").toUpperCase(),
  marca: z.string().min(2, "Obligatorio"),
  modelo: z.string().min(2, "Obligatorio"),
  anio: z.number().min(1950, "Año inválido"),
  kilometraje: z.number().min(0, "No puede ser negativo"),
  segmento: z.string().optional(),
  tipo: z.string().optional(),
  color: z.string().optional(),
  tipo_combustible: z.string().optional(),
  transmision: z.string().optional(),
  origen: z.enum(["Propio", "Consignacion"]),
  stock_fisico: z.boolean(),
  sucursal_id: z.string().min(1, "Seleccioná una sucursal"),
  precio_costo_ars: z.number().optional(),
  precio_costo_usd: z.number().optional(),
  precio_publicado_ars: z.number().positive("Obligatorio y mayor a 0"),
  precio_publicado_usd: z.number().optional(),
  numero_motor: z.string().optional(),
  numero_chasis: z.string().optional(),
  radicado_localidad: z.string().optional(),
  radicado_provincia: z.string().optional(),
  destacado: z.boolean(),
  observaciones_internas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Función auxiliar para generar el slug amigable para las URLs
const generarSlug = (marca: string, modelo: string, anio: number) => {
  return `${marca}-${modelo}-${anio}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export default function NuevoAutoPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const totalPasos = 5;
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [sucursales, setSucursales] = useState<
    { id: string; nombre: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origen: "Propio",
      stock_fisico: true,
      destacado: false,
      anio: 2024,
    },
  });

  useEffect(() => {
    const fetchSucursales = async () => {
      const { data } = await supabase.from("sucursales").select("id, nombre");
      if (data) setSucursales(data);
    };
    fetchSucursales();
  }, []);

  // Validación y avance paso a paso
  const handleSiguiente = async () => {
    let camposAValidar: (keyof FormValues)[] = [];
    if (paso === 1) {
      camposAValidar = ["patente", "marca", "modelo", "anio", "kilometraje"];
    } else if (paso === 2) {
      camposAValidar = ["sucursal_id"];
    } else if (paso === 3) {
      camposAValidar = ["precio_publicado_ars"];
    }

    const esValido = await trigger(camposAValidar);
    if (esValido) {
      setPaso((prev) => Math.min(prev + 1, totalPasos));
    }
  };

  const handleAnterior = () => {
    setPaso((prev) => Math.max(prev - 1, 1));
  };

  const handleSeleccionarArchivos = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const nuevos = Array.from(e.target.files);
      setArchivos((prev) => [...prev, ...nuevos]);
      setPrevisualizaciones((prev) => [
        ...prev,
        ...nuevos.map((f) => URL.createObjectURL(f)),
      ]);
      setErrorArchivos("");
    }
  };

  const eliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setPrevisualizaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    if (archivos.length === 0) {
      setErrorArchivos("Debés seleccionar al menos una foto o video.");
      return;
    }
    setErrorArchivos("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insertamos el vehículo incluyendo su slug generado automáticamente
      const { data: vehiculoNuevo, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .insert({
          patente: data.patente,
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio,
          kilometraje: data.kilometraje,
          slug: generarSlug(data.marca, data.modelo, data.anio), // <--- Slug incluido correctamente
          segmento: data.segmento || null,
          tipo: data.tipo || null,
          color: data.color || null,
          tipo_combustible: data.tipo_combustible || null,
          transmision: data.transmision || null,
          origen: data.origen,
          stock_fisico: data.stock_fisico,
          sucursal_id: data.sucursal_id,
          precio_costo_ars: data.precio_costo_ars || null,
          precio_costo_usd: data.precio_costo_usd || null,
          precio_publicado_ars: data.precio_publicado_ars,
          precio_publicado_usd: data.precio_publicado_usd || null,
          numero_motor: data.numero_motor || null,
          numero_chasis: data.numero_chasis || null,
          radicado_localidad: data.radicado_localidad || null,
          radicado_provincia: data.radicado_provincia || null,
          destacado: data.destacado,
          observaciones_internas: data.observaciones_internas || null,
          vendedor_asignado_id: user?.id || null,
          estado: "Disponible",
        })
        .select("id")
        .single();

      if (errorVehiculo) throw errorVehiculo;

      let orden = 0;
      for (const archivo of archivos) {
        const url = await uploadAutoImage(archivo);
        if (url) {
          await supabase.from("multimedia_vehiculos").insert({
            vehiculo_id: vehiculoNuevo.id,
            url_archivo: url,
            tipo: archivo.type.startsWith("video") ? "video" : "foto",
            orden: orden,
          });
          orden++;
        }
      }

      router.push("/panel");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Hubo un error al registrar el vehículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors py-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </button>

        {/* Encabezado y Progreso */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif">
              Registrar Vehículo
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Paso {paso} de {totalPasos}:{" "}
              {paso === 1
                ? "Información Principal"
                : paso === 2
                  ? "Especificaciones y Sucursal"
                  : paso === 3
                    ? "Esquema de Precios"
                    : paso === 4
                      ? "Datos Legales"
                      : "Multimedia y Observaciones"}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0055A4] bg-[#0055A4]/10 px-3 py-1 rounded-full border border-[#0055A4]/20">
            {Math.round((paso / totalPasos) * 100)}%
          </span>
        </div>

        <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-[#0055A4] h-full transition-all duration-300"
            style={{ width: `${(paso / totalPasos) * 100}%` }}
          ></div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* PASO 1 */}
          {paso === 1 && (
            <SectionCard
              title="1. Información Principal"
              icon={<Car className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Patente *" error={errors.patente?.message}>
                  <input
                    {...register("patente")}
                    placeholder="Ej: AB123CD"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Marca *" error={errors.marca?.message}>
                  <input
                    {...register("marca")}
                    placeholder="Ej: Volkswagen"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Modelo *" error={errors.modelo?.message}>
                  <input
                    {...register("modelo")}
                    placeholder="Ej: Amarok V6"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Año *" error={errors.anio?.message}>
                  <input
                    type="number"
                    {...register("anio", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </Campo>
                <Campo
                  label="Kilometraje *"
                  error={errors.kilometraje?.message}
                >
                  <input
                    type="number"
                    {...register("kilometraje", { valueAsNumber: true })}
                    placeholder="Ej: 45000"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Color">
                  <input
                    {...register("color")}
                    placeholder="Ej: Gris Indio"
                    className={inputClass}
                  />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <SectionCard
              title="2. Especificaciones y Sucursal"
              icon={<Shield className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Segmento">
                  <input
                    {...register("segmento")}
                    placeholder="Ej: SUV / Pick-up"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Tipo de Vehículo">
                  <input
                    {...register("tipo")}
                    placeholder="Ej: Utilitario"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Combustible">
                  <select
                    {...register("tipo_combustible")}
                    className={inputClass}
                  >
                    <option value="">Seleccionar...</option>
                    <option>Nafta</option>
                    <option>Diesel</option>
                    <option>GNC</option>
                    <option>Híbrido</option>
                    <option>Eléctrico</option>
                  </select>
                </Campo>
                <Campo label="Transmisión">
                  <select {...register("transmision")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option>Manual</option>
                    <option>Automática</option>
                  </select>
                </Campo>
                <Campo label="Sucursal *" error={errors.sucursal_id?.message}>
                  <select {...register("sucursal_id")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Origen">
                  <select {...register("origen")} className={inputClass}>
                    <option value="Propio">Propio</option>
                    <option value="Consignacion">Consignación</option>
                  </select>
                </Campo>
              </div>

              <div className="flex gap-8 pt-4 border-t border-white/5 mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("stock_fisico")}
                    className="w-4 h-4 accent-[#0055A4]"
                  />
                  En stock físico
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("destacado")}
                    className="w-4 h-4 accent-[#0055A4]"
                  />
                  Destacado en la web
                </label>
              </div>
            </SectionCard>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <SectionCard
              title="3. Esquema de Precios"
              icon={<DollarSign className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo
                  label="Precio Publicado ARS *"
                  error={errors.precio_publicado_ars?.message}
                >
                  <input
                    type="number"
                    {...register("precio_publicado_ars", {
                      valueAsNumber: true,
                    })}
                    placeholder="Ej: 25000000"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Precio Publicado USD">
                  <input
                    type="number"
                    {...register("precio_publicado_usd", {
                      valueAsNumber: true,
                    })}
                    placeholder="Ej: 22000"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Precio Costo ARS (Interno)">
                  <input
                    type="number"
                    {...register("precio_costo_ars", { valueAsNumber: true })}
                    placeholder="Solo visible internamente"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Precio Costo USD (Interno)">
                  <input
                    type="number"
                    {...register("precio_costo_usd", { valueAsNumber: true })}
                    placeholder="Solo visible internamente"
                    className={inputClass}
                  />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 4 */}
          {paso === 4 && (
            <SectionCard
              title="4. Datos Legales (Transferencia)"
              icon={<FileText className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Número de Motor">
                  <input
                    {...register("numero_motor")}
                    placeholder="Nro de motor"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Número de Chasis">
                  <input
                    {...register("numero_chasis")}
                    placeholder="Nro de chasis / cuadro"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Radicado - Localidad">
                  <input
                    {...register("radicado_localidad")}
                    placeholder="Ej: San Isidro"
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Radicado - Provincia">
                  <input
                    {...register("radicado_provincia")}
                    placeholder="Ej: Buenos Aires"
                    className={inputClass}
                  />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 5 */}
          {paso === 5 && (
            <SectionCard
              title="5. Multimedia y Observaciones"
              icon={<ImageIcon className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Observaciones Internas
                  </label>
                  <textarea
                    {...register("observaciones_internas")}
                    placeholder="Notas privadas sobre el estado del vehículo..."
                    className={`${inputClass} h-24`}
                  />
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${errorArchivos ? "border-red-500/50 bg-red-500/5" : "border-white/10 hover:border-[#0055A4]/50 bg-[#0A0A0A]"}`}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    id="file-upload"
                    onChange={handleSeleccionarArchivos}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                    <span className="text-sm font-bold text-gray-200">
                      Subir Fotografías o Videos
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      La primera foto elegida será la portada principal
                    </span>
                  </label>
                </div>
                {errorArchivos && (
                  <span className="text-red-500 text-xs block">
                    {errorArchivos}
                  </span>
                )}

                {previsualizaciones.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {previsualizaciones.map((src, index) => (
                      <div
                        key={index}
                        className="relative group h-24 bg-black rounded-lg overflow-hidden border border-white/10"
                      >
                        {archivos[index]?.type.startsWith("video") ? (
                          <video
                            src={src}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={src}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => eliminarArchivo(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Botones de Navegación Anterior / Siguiente / Guardar */}
          <div className="flex items-center gap-4 pt-4">
            {paso > 1 && (
              <button
                type="button"
                onClick={handleAnterior}
                className="w-1/3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            )}

            {paso < totalPasos ? (
              <button
                type="button"
                onClick={handleSiguiente}
                className={`${paso === 1 ? "w-full" : "w-2/3"} bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-xl`}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  "Registrando unidad..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar y Publicar
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]";

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
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 space-y-5 shadow-lg">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2 pb-2 border-b border-white/5">
        {icon} {title}
      </h2>
      {children}
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
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      {children}
      {error && (
        <span className="text-red-500 text-[11px] mt-1 block">{error}</span>
      )}
    </div>
  );
}
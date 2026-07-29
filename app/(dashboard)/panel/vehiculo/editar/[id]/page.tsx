"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditarAutoPage() {
  const router = useRouter();
  const params = useParams();
  const autoId = params.id as string;

  // ESTADO NUEVO: Rol del usuario
  const [rol, setRol] = useState<string>("vendedor"); // Por defecto el menor permiso

  const [paso, setPaso] = useState(1);
  const totalPasos = 5;
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // Archivos nuevos a subir
  const [archivos, setArchivos] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);

  // Imágenes que ya existían en la base de datos
  const [imagenesExistentes, setImagenesExistentes] = useState<any[]>([]);
  const [imagenesA_Eliminar, setImagenesA_Eliminar] = useState<string[]>([]);

  const [errorArchivos, setErrorArchivos] = useState("");
  const [sucursales, setSucursales] = useState<
    { id: string; nombre: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // 1. CARGAR DATOS DEL AUTO, SUCURSALES Y ROL
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDatos(true);

      // Traer el rol del usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single();
        if (perfil) setRol(perfil.rol);
      }

      // Traer sucursales
      const { data: dataSucursales } = await supabase
        .from("sucursales")
        .select("id, nombre");
      if (dataSucursales) setSucursales(dataSucursales);

      // Traer datos del vehículo
      const { data: vehiculo, error } = await supabase
        .from("vehiculos")
        .select(`*, multimedia_vehiculos(*)`)
        .eq("id", autoId)
        .single();

      if (error || !vehiculo) {
        alert("No se encontró el vehículo.");
        router.push("/panel");
        return;
      }

      // Pre-llenar el formulario adaptando los nulls a undefined para Zod
      reset({
        patente: vehiculo.patente || "",
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        kilometraje: vehiculo.kilometraje,
        segmento: vehiculo.segmento || undefined,
        tipo: vehiculo.tipo || undefined,
        color: vehiculo.color || undefined,
        tipo_combustible: vehiculo.tipo_combustible || undefined,
        transmision: vehiculo.transmision || undefined,
        origen: vehiculo.origen,
        stock_fisico: vehiculo.stock_fisico,
        sucursal_id: vehiculo.sucursal_id,
        precio_costo_ars: vehiculo.precio_costo_ars || undefined,
        precio_costo_usd: vehiculo.precio_costo_usd || undefined,
        precio_publicado_ars: vehiculo.precio_publicado_ars,
        precio_publicado_usd: vehiculo.precio_publicado_usd || undefined,
        numero_motor: vehiculo.numero_motor || undefined,
        numero_chasis: vehiculo.numero_chasis || undefined,
        radicado_localidad: vehiculo.radicado_localidad || undefined,
        radicado_provincia: vehiculo.radicado_provincia || undefined,
        destacado: vehiculo.destacado,
        observaciones_internas: vehiculo.observaciones_internas || undefined,
      });

      // Guardar imágenes que ya estaban subidas
      if (vehiculo.multimedia_vehiculos) {
        // Ordenarlas por su campo 'orden'
        const ordenadas = vehiculo.multimedia_vehiculos.sort(
          (a: any, b: any) => a.orden - b.orden,
        );
        setImagenesExistentes(ordenadas);
      }

      setLoadingDatos(false);
    };

    if (autoId) fetchData();
  }, [autoId, reset, router]);

  // Navegación de pasos
  const handleSiguiente = async () => {
    let camposAValidar: (keyof FormValues)[] = [];
    if (paso === 1)
      camposAValidar = ["patente", "marca", "modelo", "anio", "kilometraje"];
    else if (paso === 2) camposAValidar = ["sucursal_id"];
    else if (paso === 3) camposAValidar = ["precio_publicado_ars"];

    const esValido = await trigger(camposAValidar);
    if (esValido) setPaso((prev) => Math.min(prev + 1, totalPasos));
  };

  const handleAnterior = () => setPaso((prev) => Math.max(prev - 1, 1));

  // Manejo de nuevas imágenes
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

  const eliminarArchivoNuevo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setPrevisualizaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const eliminarImagenExistente = (idImg: string) => {
    setImagenesExistentes((prev) => prev.filter((img) => img.id !== idImg));
    setImagenesA_Eliminar((prev) => [...prev, idImg]);
  };

  const onSubmit = async (data: FormValues) => {
    if (imagenesExistentes.length === 0 && archivos.length === 0) {
      setErrorArchivos("Debés mantener o subir al menos una foto o video.");
      return;
    }
    setErrorArchivos("");
    setLoadingGuardar(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. SI ES ADMIN O ENCARGADO, ACTUALIZAMOS LOS DATOS TÉCNICOS. EL VENDEDOR NO PASA POR ACÁ.
      if (rol !== "vendedor") {
        const { error: errorVehiculo } = await supabase
          .from("vehiculos")
          .update({
            patente: data.patente,
            marca: data.marca,
            modelo: data.modelo,
            anio: data.anio,
            kilometraje: data.kilometraje,
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
            updated_at: new Date().toISOString(),
          })
          .eq("id", autoId);

        if (errorVehiculo) throw errorVehiculo;
      }

      // 2. ELIMINAR FOTOS QUE EL USUARIO BORRÓ
      if (imagenesA_Eliminar.length > 0) {
        await supabase
          .from("multimedia_vehiculos")
          .delete()
          .in("id", imagenesA_Eliminar);
      }
// 3. SUBIR FOTOS NUEVAS (Optimizado en Paralelo y Tipado estricto)
      let ordenSiguiente = imagenesExistentes.length; 
      
      const promesasSubida = archivos.map(async (archivo, index) => {
        try {
          const url = await uploadAutoImage(archivo);
          if (url) {
            return {
              vehiculo_id: autoId, // Cambiar a vehiculoNuevo.id si estás en "nuevo/page.tsx"
              url_archivo: url,
              tipo: archivo.type.startsWith("video") ? "video" : "foto",
              orden: ordenSiguiente + index,
            };
          }
          return undefined; // <-- Retorno explícito para TS
        } catch (imgErr) {
          console.error("Fallo al subir foto:", archivo.name, imgErr);
          return undefined; // <-- Retorno explícito para TS
        }
      });

      const resultadosSubida = await Promise.all(promesasSubida);
      
      // TYPE GUARD: Filtramos los undefined y le aseguramos a TypeScript el tipo de dato exacto
      const imagenesAInsertar = resultadosSubida.filter(
        (res): res is { vehiculo_id: string; url_archivo: string; tipo: string; orden: number } => 
          res !== undefined && res !== null
      );

      if (imagenesAInsertar.length > 0) {
        const { error: insertError } = await supabase
          .from("multimedia_vehiculos")
          .insert(imagenesAInsertar);
        
        if (insertError) throw insertError;
      }

      // 4. DEJAR REGISTRO EN HISTORIAL (Auditoría basada en rol)
      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos",
        registro_id: autoId,
        campo_modificado:
          rol === "vendedor" ? "galeria_multimedia" : "edicion_completa",
        valor_nuevo:
          rol === "vendedor"
            ? "El vendedor actualizó las fotos/videos de la unidad."
            : "El vehículo fue editado completamente.",
        usuario_id: user?.id,
      });

      router.push("/panel");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Hubo un error al actualizar el vehículo.");
    } finally {
      setLoadingGuardar(false);
    }
  };

  if (loadingDatos) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white w-full">
        <div className="flex flex-col items-center gap-3">
          <Car className="w-8 h-8 text-[#0055A4] animate-pulse" />
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            Cargando datos del vehículo...
          </p>
        </div>
      </div>
    );
  }

  return (
    // Agregamos w-full overflow-x-hidden acá para evitar scrolleos horizontales forzados
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-16 px-4 w-full overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors py-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </button>

        {/* Encabezado y Progreso (Condicional por rol) */}
        {rol !== "vendedor" ? (
          <>
            <div className="flex justify-between items-end mb-2 w-full">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-[#0055A4]">
                  Editar Vehículo
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
              <span className="text-xs font-mono font-bold text-[#0055A4] bg-[#0055A4]/10 px-3 py-1 rounded-full border border-[#0055A4]/20 shrink-0">
                {Math.round((paso / totalPasos) * 100)}%
              </span>
            </div>

            <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full mb-8 overflow-hidden">
              <div
                className="bg-[#0055A4] h-full transition-all duration-300"
                style={{ width: `${(paso / totalPasos) * 100}%` }}
              ></div>
            </div>
          </>
        ) : (
          <div className="mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-serif text-[#0055A4]">
              Galería del Vehículo
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Solo tenés permisos para gestionar el material visual de esta
              unidad.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
          {/* PASO 1 */}
          {rol !== "vendedor" && paso === 1 && (
            <SectionCard
              title="1. Información Principal"
              icon={<Car className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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
          {rol !== "vendedor" && paso === 2 && (
            <SectionCard
              title="2. Especificaciones y Sucursal"
              icon={<Shield className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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

              <div className="flex flex-wrap gap-4 sm:gap-8 pt-4 border-t border-white/5 mt-4 w-full">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    {...register("stock_fisico")}
                    className="w-4 h-4 accent-[#0055A4]"
                  />
                  En stock físico
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer shrink-0">
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
          {rol !== "vendedor" && paso === 3 && (
            <SectionCard
              title="3. Esquema de Precios"
              icon={<DollarSign className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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
          {rol !== "vendedor" && paso === 4 && (
            <SectionCard
              title="4. Datos Legales (Transferencia)"
              icon={<FileText className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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

          {/* PASO 5 / VENDEDOR */}
          {(paso === 5 || rol === "vendedor") && (
            <SectionCard
              title={
                rol === "vendedor"
                  ? "Imágenes"
                  : "5. Multimedia y Observaciones"
              }
              icon={<ImageIcon className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="space-y-4 w-full">
                {rol !== "vendedor" && (
                  <div className="w-full">
                    <label className="text-xs text-gray-400 block mb-1">
                      Observaciones Internas
                    </label>
                    <textarea
                      {...register("observaciones_internas")}
                      placeholder="Notas privadas sobre el estado del vehículo..."
                      className={`${inputClass} h-24`}
                    />
                  </div>
                )}

                <div
                  className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors ${errorArchivos ? "border-red-500/50 bg-red-500/5" : "border-white/10 hover:border-[#0055A4]/50 bg-[#0A0A0A]"}`}
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
                      Subir Más Fotografías
                    </span>
                  </label>
                </div>
                {errorArchivos && (
                  <span className="text-red-500 text-xs block">
                    {errorArchivos}
                  </span>
                )}

                {/* GALERÍA DE IMÁGENES MIXTA (Viejas y Nuevas) */}
                {(imagenesExistentes.length > 0 ||
                  previsualizaciones.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 w-full">
                    {/* Imágenes Viejas (Base de datos) */}
                    {imagenesExistentes.map((img) => (
                      <div
                        key={img.id}
                        className="relative group h-24 bg-black rounded-lg overflow-hidden border border-white/10 w-full"
                      >
                        {img.tipo === "video" ? (
                          <video
                            src={img.url_archivo}
                            className="w-full h-full object-cover opacity-70"
                            muted
                          />
                        ) : (
                          <img
                            src={img.url_archivo}
                            alt="Existente"
                            className="w-full h-full object-cover opacity-70"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded font-bold tracking-widest">
                            GUARDADA
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarImagenExistente(img.id)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Imágenes Nuevas (A subir) */}
                    {previsualizaciones.map((src, index) => (
                      <div
                        key={`nuevo-${index}`}
                        className="relative group h-24 bg-black rounded-lg overflow-hidden border border-emerald-500/30 w-full"
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
                            alt="Nueva"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold tracking-widest">
                            NUEVA
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarArchivoNuevo(index)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow transition-colors cursor-pointer"
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

          {/* Botones de Navegación / Guardar */}
          <div className="flex items-center gap-4 pt-4 w-full">
            {rol !== "vendedor" ? (
              <>
                {paso > 1 && (
                  <button
                    type="button"
                    onClick={handleAnterior}
                    className="w-1/3 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />{" "}
                    <span className="hidden sm:inline">Anterior</span>
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
                    disabled={loadingGuardar}
                    className="w-2/3 bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                  >
                    {loadingGuardar ? (
                      "Guardando..."
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Actualizar Vehículo
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={loadingGuardar}
                className="w-full bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {loadingGuardar ? (
                  "Actualizando Galería..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar Cambios
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
  "w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4] transition-colors";

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
    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 space-y-5 shadow-lg animate-fadeIn w-full overflow-hidden">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2 pb-2 border-b border-white/5">
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
    <div className="w-full min-w-0">
      <label className="text-xs text-gray-400 block mb-1 font-bold tracking-wide truncate">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-red-500 text-[11px] mt-1.5 block font-bold tracking-wide truncate">
          {error}
        </span>
      )}
    </div>
  );
}

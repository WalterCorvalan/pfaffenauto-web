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

// ================= SCHEMAS DE VALIDACIÓN =================
const formSchema = z.object({
  patente: z.string().min(6, "Patente inválida").toUpperCase(),
  marca: z.string().min(2, "Obligatorio"),
  modelo: z.string().min(2, "Obligatorio"),
  anio: z.string().min(4, "Año inválido"),
  kilometraje: z.string().min(1, "Obligatorio"),
  segmento: z.string().optional(),
  tipo: z.string().optional(),
  color: z.string().optional(),
  tipo_combustible: z.string().optional(),
  transmision: z.string().optional(),
  origen: z.string().optional(),
  estado: z.string().optional(),

  stock_fisico: z.boolean(),
  destacado: z.boolean(),

  condicion_web: z.string().optional(),
  sucursal_id: z.string().min(1, "Seleccioná una sucursal"),

  precio_costo_ars: z.string().optional(),
  precio_costo_usd: z.string().optional(),
  precio_publicado_ars: z.string().min(1, "Obligatorio"),
  precio_publicado_usd: z.string().optional(),

  numero_motor: z.string().optional(),
  numero_chasis: z.string().optional(),
  radicado_localidad: z.string().optional(),
  radicado_provincia: z.string().optional(),
  observaciones_internas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const generarSlug = (marca: string, modelo: string, anio: number) => {
  const base = `${marca}-${modelo}-${anio}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString().slice(-4)}`;
};

interface VehiculoFormProps {
  modo: "crear" | "editar";
  autoId?: string;
}

export default function VehiculoForm({ modo, autoId }: VehiculoFormProps) {
  const router = useRouter();
  const [rol, setRol] = useState<string>("vendedor");
  const [paso, setPaso] = useState(1);
  const totalPasos = 5;
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(modo === "editar");

  const [archivos, setArchivos] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
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
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origen: "Comprado",
      estado: "Disponible",
      stock_fisico: true,
      destacado: false,
      anio: String(new Date().getFullYear()),
      kilometraje: "0",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
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

      const { data: dataSucursales } = await supabase
        .from("sucursales")
        .select("id, nombre");
      if (dataSucursales) setSucursales(dataSucursales);

      if (modo === "editar" && autoId) {
        const { data: vehiculo } = await supabase
          .from("vehiculos")
          .select(`*, multimedia_vehiculos(*)`)
          .eq("id", autoId)
          .single();
        if (vehiculo) {
          reset({
            ...vehiculo,
            patente: vehiculo.patente || "",
            anio: vehiculo.anio ? String(vehiculo.anio) : "",
            kilometraje:
              vehiculo.kilometraje !== null ? String(vehiculo.kilometraje) : "",
            precio_costo_ars: vehiculo.precio_costo_ars
              ? String(vehiculo.precio_costo_ars)
              : "",
            precio_costo_usd: vehiculo.precio_costo_usd
              ? String(vehiculo.precio_costo_usd)
              : "",
            precio_publicado_ars: vehiculo.precio_publicado_ars
              ? String(vehiculo.precio_publicado_ars)
              : "",
            precio_publicado_usd: vehiculo.precio_publicado_usd
              ? String(vehiculo.precio_publicado_usd)
              : "",
            segmento: vehiculo.segmento || "",
            tipo: vehiculo.tipo || "",
            color: vehiculo.color || "",
            tipo_combustible: vehiculo.tipo_combustible || "",
            transmision: vehiculo.transmision || "",
            origen: vehiculo.origen || "",
            estado: vehiculo.estado || "",
            stock_fisico: vehiculo.stock_fisico !== false,
            destacado: vehiculo.destacado === true,
            condicion_web: vehiculo.condicion_web || "",
            numero_motor: vehiculo.numero_motor || "",
            numero_chasis: vehiculo.numero_chasis || "",
            radicado_localidad: vehiculo.radicado_localidad || "",
            radicado_provincia: vehiculo.radicado_provincia || "",
            observaciones_internas: vehiculo.observaciones_internas || "",
          });

          if (vehiculo.multimedia_vehiculos) {
            setImagenesExistentes(
              vehiculo.multimedia_vehiculos.sort(
                (a: any, b: any) => a.orden - b.orden,
              ),
            );
          }
        }
      }
      setLoadingDatos(false);
    };
    fetchData();
  }, [modo, autoId, reset]);

  const esEdicionVendedor = modo === "editar" && rol === "vendedor";

  const handleSiguiente = async () => {
    let camposAValidar: (keyof FormValues)[] = [];
    if (paso === 1)
      camposAValidar = ["patente", "marca", "modelo", "anio", "kilometraje"];
    else if (paso === 2)
      camposAValidar = [
        "sucursal_id",
        "segmento",
        "tipo",
        "tipo_combustible",
        "transmision",
      ];
    else if (paso === 3) camposAValidar = ["precio_publicado_ars"];

    const esValido = await trigger(camposAValidar);
    if (esValido) setPaso((prev) => Math.min(prev + 1, totalPasos));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLButtonElement
      ) {
        return;
      }
      e.preventDefault();
      if (paso < totalPasos) {
        handleSiguiente();
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (archivos.length === 0 && imagenesExistentes.length === 0) {
      setErrorArchivos("Debés mantener o subir al menos una foto o video.");
      return;
    }
    setErrorArchivos("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const estadoDB = data.estado === "Señado" ? "Reservado" : data.estado;
      let vehiculoTargetId = autoId;

      const payloadVehiculo = {
        patente: data.patente,
        marca: data.marca,
        modelo: data.modelo,
        anio: Number(data.anio),
        kilometraje: Number(data.kilometraje),
        segmento: data.segmento || null,
        tipo: data.tipo || null,
        color: data.color || null,
        tipo_combustible: data.tipo_combustible || null,
        transmision: data.transmision || null,
        origen: data.origen || null,
        stock_fisico: data.stock_fisico,
        sucursal_id: data.sucursal_id,
        precio_costo_ars: data.precio_costo_ars
          ? Number(data.precio_costo_ars)
          : null,
        precio_costo_usd: data.precio_costo_usd
          ? Number(data.precio_costo_usd)
          : null,
        precio_publicado_ars: Number(data.precio_publicado_ars),
        precio_publicado_usd: data.precio_publicado_usd
          ? Number(data.precio_publicado_usd)
          : null,
        numero_motor: data.numero_motor || null,
        numero_chasis: data.numero_chasis || null,
        radicado_localidad: data.radicado_localidad || null,
        radicado_provincia: data.radicado_provincia || null,
        destacado: data.destacado,
      };

      if (modo === "crear") {
        let notas_finales = data.observaciones_internas || "";
        if (!data.stock_fisico && data.condicion_web) {
          notas_finales = `[VENTA ONLINE: ${data.condicion_web.toUpperCase()}] \n${notas_finales}`;
        }

        const slug = generarSlug(data.marca, data.modelo, Number(data.anio));

        const { data: vehiculoNuevo, error } = await supabase
          .from("vehiculos")
          .insert({
            ...payloadVehiculo,
            slug,
            estado: estadoDB,
            observaciones_internas: notas_finales,
            vendedor_asignado_id: user?.id || null,
          })
          .select("id")
          .single();

        if (error) throw error;
        vehiculoTargetId = vehiculoNuevo.id;
      } else if (modo === "editar" && !esEdicionVendedor) {
        const { error } = await supabase
          .from("vehiculos")
          .update({
            ...payloadVehiculo,
            observaciones_internas: data.observaciones_internas || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", autoId);
        if (error) throw error;
      }
      
      if (modo === "editar" && imagenesA_Eliminar.length > 0) {
        await supabase
          .from("multimedia_vehiculos")
          .delete()
          .in("id", imagenesA_Eliminar);
      }

      let ordenSiguiente = imagenesExistentes.length;
      const imagenesAInsertar = [];

      // Subimos las fotos de forma secuencial
      for (let i = 0; i < archivos.length; i++) {
        try {
          const archivo = archivos[i];
          const url = await uploadAutoImage(archivo);

          if (url) {
            imagenesAInsertar.push({
              vehiculo_id: vehiculoTargetId!,
              url_archivo: url,
              tipo: archivo.type.startsWith("video") ? "video" : "foto",
              orden: ordenSiguiente + i,
            });
          }
        } catch (imgErr) {
          console.error(`Error subiendo la foto ${i + 1}:`, imgErr);
        }
      }

      // Insertamos todas las imágenes válidas
      if (imagenesAInsertar.length > 0) {
        const { error: insertError } = await supabase
          .from("multimedia_vehiculos")
          .insert(imagenesAInsertar);
        if (insertError) throw insertError;
      }

      // Guardamos en el historial si es edición
      if (modo === "editar") {
        await supabase.from("historial_cambios").insert({
          tabla: "vehiculos",
          registro_id: autoId,
          campo_modificado:
            rol === "vendedor" ? "galeria_multimedia" : "edicion_completa",
          valor_nuevo:
            rol === "vendedor" ? "Actualizó multimedia" : "Vehículo editado",
          usuario_id: user?.id,
        });
      }

      router.push("/panel");
      router.refresh();
    } catch (err) {
      alert(`Error al ${modo} el vehículo.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarArchivos = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files) return;
    const nuevos = Array.from(e.target.files);
    setArchivos((prev) => [...prev, ...nuevos]);
    setPrevisualizaciones((prev) => [
      ...prev,
      ...nuevos.map((f) => URL.createObjectURL(f)),
    ]);
    setErrorArchivos("");
    e.target.value = ""; // Reseteamos el input
  };

  const eliminarArchivoNuevo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setPrevisualizaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const eliminarImagenExistente = (idImg: string) => {
    setImagenesExistentes((prev) => prev.filter((img) => img.id !== idImg));
    setImagenesA_Eliminar((prev) => [...prev, idImg]);
  };

  if (loadingDatos)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <Car className="w-8 h-8 text-[#0055A4] animate-pulse" />
      </div>
    );

  const inputClass =
    "w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4] transition-colors text-white placeholder:text-slate-500";

  return (
    <div className="w-full h-full text-white py-6 md:py-10 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        
        <button
          type="button" // BLINDAJE EXTRA AQUÍ
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors py-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </button>

        {esEdicionVendedor ? (
          <div className="mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-serif text-[#0055A4]">
              Galería del Vehículo
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Solo tenés permisos para gestionar el material visual de esta
              unidad.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-[#0055A4]">
                  {modo === "crear" ? "Registrar Vehículo" : "Editar Vehículo"}
                </h1>
                <p className="text-gray-400 text-xs md:text-sm mt-1">
                  Paso {paso} de {totalPasos}
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
          </>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
          className="space-y-6"
        >
          {/* PASO 1 */}
          {!esEdicionVendedor && paso === 1 && (
            <SectionCard
              title="1. Información Principal"
              icon={<Car className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Patente *" error={errors.patente?.message}>
                  <input {...register("patente")} className={inputClass} />
                </Campo>
                <Campo label="Marca *" error={errors.marca?.message}>
                  <input {...register("marca")} className={inputClass} />
                </Campo>
                <Campo label="Modelo *" error={errors.modelo?.message}>
                  <input {...register("modelo")} className={inputClass} />
                </Campo>
                <Campo label="Año *" error={errors.anio?.message}>
                  <input
                    type="number"
                    {...register("anio")}
                    className={inputClass}
                  />
                </Campo>
                <Campo
                  label="Kilometraje *"
                  error={errors.kilometraje?.message}
                >
                  <input
                    type="number"
                    {...register("kilometraje")}
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Color">
                  <input {...register("color")} className={inputClass} />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 2 */}
          {!esEdicionVendedor && paso === 2 && (
            <SectionCard
              title="2. Especificaciones y Sucursal"
              icon={<Shield className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Tipo de Vehículo *" error={errors.tipo?.message}>
                  <select {...register("tipo")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="Auto">Auto</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Todo Terreno | SUV">SUV</option>
                    <option value="Utilitarios">Utilitario</option>
                  </select>
                </Campo>
                <Campo
                  label="Combustible *"
                  error={errors.tipo_combustible?.message}
                >
                  <select
                    {...register("tipo_combustible")}
                    className={inputClass}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNC">GNC</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </Campo>
                <Campo
                  label="Transmisión *"
                  error={errors.transmision?.message}
                >
                  <select {...register("transmision")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="Manual">Manual</option>
                    <option value="Automática">Automática</option>
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
                {modo === "crear" && (
                  <Campo label="Estado *" error={errors.estado?.message}>
                    <select {...register("estado")} className={inputClass}>
                      <option value="Disponible">Disponible</option>
                      <option value="Señado">Señado</option>
                    </select>
                  </Campo>
                )}
              </div>
              <div className="flex flex-col gap-4 pt-6 border-t border-white/5 mt-6">
                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer bg-white/5 p-4 rounded-xl hover:bg-white/10 w-fit">
                  <input
                    type="checkbox"
                    {...register("stock_fisico")}
                    className="w-4 h-4 accent-[#0055A4]"
                  />{" "}
                  En stock físico
                </label>
                {!watch("stock_fisico") && modo === "crear" && (
                  <div className="ml-4 pl-4 border-l-2 border-[#0055A4]">
                    <Campo label="Condición Web *">
                      <select
                        {...register("condicion_web")}
                        className={inputClass}
                      >
                        <option value="A comprar">A comprar</option>
                        <option value="A patentar">A patentar</option>
                      </select>
                    </Campo>
                  </div>
                )}
                <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer bg-white/5 p-4 rounded-xl hover:bg-white/10 w-fit">
                  <input
                    type="checkbox"
                    {...register("destacado")}
                    className="w-4 h-4 accent-[#0055A4]"
                  />{" "}
                  Destacado en Web
                </label>
              </div>
            </SectionCard>
          )}

          {/* PASO 3 */}
          {!esEdicionVendedor && paso === 3 && (
            <SectionCard
              title="3. Precios"
              icon={<DollarSign className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo
                  label="Precio Publicado ARS *"
                  error={errors.precio_publicado_ars?.message}
                >
                  <input
                    type="number"
                    {...register("precio_publicado_ars")}
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Precio Publicado USD">
                  <input
                    type="number"
                    {...register("precio_publicado_usd")}
                    className={inputClass}
                  />
                </Campo>

                {/* Ocultamos los precios de costo para los vendedores */}
                {rol === "admin" || rol === "encargado" ? (
                  <>
                    <Campo label="Precio Costo ARS (Oculto)">
                      <input
                        type="number"
                        {...register("precio_costo_ars")}
                        className={inputClass}
                      />
                    </Campo>
                    <Campo label="Precio Costo USD (Oculto)">
                      <input
                        type="number"
                        {...register("precio_costo_usd")}
                        className={inputClass}
                      />
                    </Campo>
                  </>
                ) : null}
              </div>
            </SectionCard>
          )}

          {/* PASO 4 */}
          {!esEdicionVendedor && paso === 4 && (
            <SectionCard
              title="4. Datos Legales"
              icon={<FileText className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Número de Motor">
                  <input {...register("numero_motor")} className={inputClass} />
                </Campo>
                <Campo label="Número de Chasis">
                  <input
                    {...register("numero_chasis")}
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Radicado - Localidad">
                  <input
                    {...register("radicado_localidad")}
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Radicado - Provincia">
                  <input
                    {...register("radicado_provincia")}
                    className={inputClass}
                  />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 5 */}
          {(paso === 5 || esEdicionVendedor) && (
            <SectionCard
              title="Multimedia"
              icon={<ImageIcon className="w-4 h-4 text-[#0055A4]" />}
            >
              <div className="space-y-4">
                {!esEdicionVendedor && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Notas Internas
                    </label>
                    <textarea
                      {...register("observaciones_internas")}
                      className={`${inputClass} h-24`}
                    />
                  </div>
                )}
                
                {/* SOLUCIÓN FINAL: USANDO UN LABEL HTML ESTÁNDAR */}
                <label
                  htmlFor="file-upload"
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/5 hover:border-[#0055A4] ${errorArchivos ? "border-red-500" : "border-white/10"}`}
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    id="file-upload"
                    onChange={handleSeleccionarArchivos}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 text-[#0055A4] mb-3" />
                  <span className="block text-base font-semibold text-white">
                    Clickeá aquí para subir fotografías
                  </span>
                  <span className="block text-sm text-gray-400 mt-2">
                    Podés seleccionar una o varias imágenes o videos.
                  </span>
                </label>
                
                {errorArchivos && (
                  <span className="text-red-500 text-xs block text-center mt-2">
                    {errorArchivos}
                  </span>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {imagenesExistentes.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-24 bg-black rounded-lg overflow-hidden border border-white/10 group"
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
                          className="w-full h-full object-cover opacity-70"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagenExistente(img.id)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previsualizaciones.map((src, index) => (
                    <div
                      key={`nuevo-${index}`}
                      className="relative h-24 bg-black rounded-lg overflow-hidden border border-emerald-500/30 group"
                    >
                      {archivos[index]?.type.startsWith("video") ? (
                        <video
                          src={src}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img src={src} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarArchivoNuevo(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* BOTONES */}
          <div className="flex items-center gap-4 pt-4">
            {!esEdicionVendedor ? (
              <>
                {paso > 1 && (
                  <button
                    type="button"
                    onClick={() => setPaso((p) => p - 1)}
                    className="w-1/3 bg-[#1A1A1A] hover:bg-[#252525] py-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                )}
                {paso < totalPasos ? (
                  <button
                    type="button"
                    onClick={handleSiguiente}
                    className={`${paso === 1 ? "w-full" : "w-2/3"} bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl text-white`}
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 text-white"
                  >
                    {loading ? (
                      "Guardando..."
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Confirmar
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 text-white"
              >
                {loading ? (
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
      <label className="text-xs text-gray-400 block mb-1 font-bold">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-red-500 text-[11px] mt-1 block font-bold">
          {error}
        </span>
      )}
    </div>
  );
}
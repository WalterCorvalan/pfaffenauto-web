"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { uploadAutoImage } from "@/lib/upload";
import { ArrowLeft, Save, Upload, X, Car, Shield, DollarSign, FileText, Image as ImageIcon, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  traccion: z.string().optional(),
  potencia_cv: z.string().optional(),
  cantidad_plazas: z.string().optional(),
  origen: z.string().optional(),
  estado: z.string().optional(),
  stock_fisico: z.boolean(),
  destacado: z.boolean(),
  pautado: z.boolean(),
  canal_pauta: z.array(z.string()).optional(), // Transformado a Array para soportar múltiples checkboxes
  condicion_web: z.string().optional(),
  sucursal_id: z.string().min(1, "Seleccioná una sucursal"),
  precio_costo_ars: z.string().optional(),
  precio_costo_usd: z.string().optional(),
  precio_publicado_ars: z.string().min(1, "Obligatorio"),
  precio_publicado_usd: z.string().optional(),
  numero_motor: z.string().optional(),
  numero_chasis: z.string().optional(),
  marca_motor: z.string().optional(),
  marca_chasis: z.string().optional(),
  ubicacion: z.string().optional(),
  radicado_localidad: z.string().optional(),
  radicado_provincia: z.string().optional(),
  observaciones_internas: z.string().optional(),
  fecha_compra: z.string().optional(),
  sucursal_compra_id: z.string().optional(),
  importe_patente_anual: z.string().optional(),
  prov_nombre: z.string().optional(),
  prov_apellido: z.string().optional(),
  prov_dni: z.string().optional(),
  prov_fecha_nacimiento: z.string().optional(),
  prov_cuit_cuil: z.string().optional(),
  prov_calle: z.string().optional(),
  prov_numero: z.string().optional(),
  prov_depto: z.string().optional(),
  prov_localidad: z.string().optional(),
  prov_codigo_postal: z.string().optional(),
  prov_provincia: z.string().optional(),
  prov_telefono_linea: z.string().optional(),
  prov_telefono_celular: z.string().optional(),
  prov_email: z.string().optional(),
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
  const [puedeEditarCompleto, setPuedeEditarCompleto] = useState(false);
  const [puedeVerCosto, setPuedeVerCosto] = useState(false);
  const [paso, setPaso] = useState(1);
  const totalPasos = 7;
  const [titulares, setTitulares] = useState<{ nombre: string; porcentaje: string; cuit_cuil: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progresoFotos, setProgresoFotos] = useState<{ actual: number; total: number } | null>(null);
  const [loadingDatos, setLoadingDatos] = useState(modo === "editar");

  const [archivos, setArchivos] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<any[]>([]);
  const [imagenesA_Eliminar, setImagenesA_Eliminar] = useState<string[]>([]);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, trigger, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origen: "Comprado", estado: "Disponible", stock_fisico: true, destacado: false,
      pautado: false, canal_pauta: [], // Iniciamos el array vacío
      anio: String(new Date().getFullYear()), kilometraje: "0",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
        if (perfil) setRol(perfil.rol);
      }
      const [{ data: puedeEditar }, { data: puedeCosto }] = await Promise.all([
        supabase.rpc("tiene_permiso", { uid: user?.id, clave_permiso: "vehiculos.editar_completo" }),
        supabase.rpc("tiene_permiso", { uid: user?.id, clave_permiso: "vehiculos.ver_costo" }),
      ]);
      setPuedeEditarCompleto(!!puedeEditar);
      setPuedeVerCosto(!!puedeCosto);
      const { data: dataSucursales } = await supabase.from("sucursales").select("id, nombre");
      if (dataSucursales) setSucursales(dataSucursales);

      if (modo === "editar" && autoId) {
        const { data: vehiculo } = await supabase.from("vehiculos").select(`*, multimedia_vehiculos(*)`).eq("id", autoId).single();
        const { data: proveedor } = await supabase.from("vehiculo_proveedores").select("*").eq("vehiculo_id", autoId).maybeSingle();
        const { data: titularesData } = await supabase.from("vehiculo_titulares").select("*").eq("vehiculo_id", autoId).order("orden");
        if (vehiculo) {
          reset({
            ...vehiculo,
            patente: vehiculo.patente || "",
            anio: vehiculo.anio ? String(vehiculo.anio) : "",
            kilometraje: vehiculo.kilometraje !== null ? String(vehiculo.kilometraje) : "",
            precio_costo_ars: vehiculo.precio_costo_ars ? String(vehiculo.precio_costo_ars) : "",
            precio_costo_usd: vehiculo.precio_costo_usd ? String(vehiculo.precio_costo_usd) : "",
            precio_publicado_ars: vehiculo.precio_publicado_ars ? String(vehiculo.precio_publicado_ars) : "",
            precio_publicado_usd: vehiculo.precio_publicado_usd ? String(vehiculo.precio_publicado_usd) : "",
            segmento: vehiculo.segmento || "", tipo: vehiculo.tipo || "", color: vehiculo.color || "",
            tipo_combustible: vehiculo.tipo_combustible || "", transmision: vehiculo.transmision || "",
            traccion: vehiculo.traccion || "", potencia_cv: vehiculo.potencia_cv ? String(vehiculo.potencia_cv) : "",
            cantidad_plazas: vehiculo.cantidad_plazas ? String(vehiculo.cantidad_plazas) : "",
            origen: vehiculo.origen || "", estado: vehiculo.estado || "",
            stock_fisico: vehiculo.stock_fisico !== false, destacado: vehiculo.destacado === true,
            pautado: vehiculo.pautado === true,
            // Separamos el string guardado en la DB por comas para rellenar los checkboxes
            canal_pauta: vehiculo.canal_pauta ? vehiculo.canal_pauta.split(",").map((s: string) => s.trim()) : [],
            condicion_web: vehiculo.condicion_web || "", numero_motor: vehiculo.numero_motor || "",
            numero_chasis: vehiculo.numero_chasis || "", radicado_localidad: vehiculo.radicado_localidad || "",
            radicado_provincia: vehiculo.radicado_provincia || "", observaciones_internas: vehiculo.observaciones_internas || "",
            marca_motor: vehiculo.marca_motor || "", marca_chasis: vehiculo.marca_chasis || "",
            ubicacion: vehiculo.ubicacion || "",
            fecha_compra: vehiculo.fecha_compra || "", sucursal_compra_id: vehiculo.sucursal_compra_id || "",
            importe_patente_anual: vehiculo.importe_patente_anual ? String(vehiculo.importe_patente_anual) : "",
            prov_nombre: proveedor?.nombre || "", prov_apellido: proveedor?.apellido || "",
            prov_dni: proveedor?.dni || "", prov_fecha_nacimiento: proveedor?.fecha_nacimiento || "",
            prov_cuit_cuil: proveedor?.cuit_cuil || "", prov_calle: proveedor?.calle || "",
            prov_numero: proveedor?.numero || "", prov_depto: proveedor?.depto || "",
            prov_localidad: proveedor?.localidad || "", prov_codigo_postal: proveedor?.codigo_postal || "",
            prov_provincia: proveedor?.provincia || "", prov_telefono_linea: proveedor?.telefono_linea || "",
            prov_telefono_celular: proveedor?.telefono_celular || "", prov_email: proveedor?.email || "",
          });
          if (vehiculo.multimedia_vehiculos) {
            setImagenesExistentes(vehiculo.multimedia_vehiculos.sort((a: any, b: any) => a.orden - b.orden));
          }
          if (titularesData) {
            setTitulares(titularesData.map((t: any) => ({
              nombre: t.nombre || "", porcentaje: t.porcentaje !== null ? String(t.porcentaje) : "", cuit_cuil: t.cuit_cuil || "",
            })));
          }
        }
      }
      setLoadingDatos(false);
    };
    fetchData();
  }, [modo, autoId, reset]);

  const esEdicionVendedor = modo === "editar" && !puedeEditarCompleto;

  const handleSiguiente = async () => {
    let camposAValidar: (keyof FormValues)[] = [];
    if (paso === 1) camposAValidar = ["patente", "marca", "modelo", "anio", "kilometraje"];
    else if (paso === 2) camposAValidar = ["sucursal_id", "segmento", "tipo", "tipo_combustible", "transmision", "estado", "condicion_web", "stock_fisico", "destacado"];
    else if (paso === 3) camposAValidar = ["precio_publicado_ars", "precio_publicado_usd", "precio_costo_ars", "precio_costo_usd"];
    else if (paso === 4) camposAValidar = ["numero_motor", "numero_chasis", "marca_motor", "marca_chasis", "ubicacion", "radicado_localidad", "radicado_provincia"];
    else if (paso === 5) camposAValidar = ["fecha_compra", "sucursal_compra_id", "importe_patente_anual"];

    const esValido = camposAValidar.length > 0 ? await trigger(camposAValidar) : true;
    if (esValido) setPaso((prev) => Math.min(prev + 1, totalPasos));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (paso < totalPasos && !esEdicionVendedor) handleSiguiente();
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (archivos.length === 0 && imagenesExistentes.length === 0) {
      setErrorArchivos("Debés mantener o subir al menos una foto o video.");
      return;
    }
    setErrorArchivos("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const estadoDB = data.estado === "Señado" ? "Reservado" : data.estado;
      let vehiculoTargetId = autoId;

      const payloadVehiculo = {
        patente: data.patente, marca: data.marca, modelo: data.modelo, anio: Number(data.anio),
        kilometraje: Number(data.kilometraje), segmento: data.segmento || null, tipo: data.tipo || null,
        color: data.color || null, tipo_combustible: data.tipo_combustible || null, transmision: data.transmision || null,
        traccion: data.traccion || null, potencia_cv: data.potencia_cv ? Number(data.potencia_cv) : null,
        cantidad_plazas: data.cantidad_plazas ? Number(data.cantidad_plazas) : null,
        origen: data.origen || null, stock_fisico: data.stock_fisico, sucursal_id: data.sucursal_id,
        precio_costo_ars: data.precio_costo_ars ? Number(data.precio_costo_ars) : null,
        precio_costo_usd: data.precio_costo_usd ? Number(data.precio_costo_usd) : null,
        precio_publicado_ars: Number(data.precio_publicado_ars),
        precio_publicado_usd: data.precio_publicado_usd ? Number(data.precio_publicado_usd) : null,
        numero_motor: data.numero_motor || null, numero_chasis: data.numero_chasis || null,
        marca_motor: data.marca_motor || null, marca_chasis: data.marca_chasis || null,
        ubicacion: data.ubicacion || null,
        radicado_localidad: data.radicado_localidad || null, radicado_provincia: data.radicado_provincia || null, destacado: data.destacado,
        pautado: data.pautado,
        // Unimos el array con comas para guardarlo como string en la DB
        canal_pauta: data.pautado && data.canal_pauta?.length ? data.canal_pauta.join(", ") : null,
        fecha_compra: data.fecha_compra || null, sucursal_compra_id: data.sucursal_compra_id || null,
        importe_patente_anual: data.importe_patente_anual ? Number(data.importe_patente_anual) : null,
      };

      if (modo === "crear") {
        let notas_finales = data.observaciones_internas || "";
        if (!data.stock_fisico && data.condicion_web) notas_finales = `[VENTA ONLINE: ${data.condicion_web.toUpperCase()}] \n${notas_finales}`;
        const slug = generarSlug(data.marca, data.modelo, Number(data.anio));

        const { data: vehiculoNuevo, error } = await supabase.from("vehiculos")
          .insert({ ...payloadVehiculo, slug, estado: estadoDB, observaciones_internas: notas_finales, vendedor_asignado_id: user?.id || null })
          .select("id").single();
        if (error) throw error;
        vehiculoTargetId = vehiculoNuevo.id;
        if (estadoDB === "Disponible") {
          fetch("/api/vehiculos/reactivar-leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehiculoId: vehiculoNuevo.id }),
          }).catch(() => {});
        }
      } else if (modo === "editar" && !esEdicionVendedor) {
        const { error } = await supabase.from("vehiculos")
          .update({ ...payloadVehiculo, observaciones_internas: data.observaciones_internas || null, updated_at: new Date().toISOString() })
          .eq("id", autoId);
        if (error) throw error;
      }
      
      if (modo === "editar" && imagenesA_Eliminar.length > 0) {
        await supabase.from("multimedia_vehiculos").delete().in("id", imagenesA_Eliminar);
      }

      if (!esEdicionVendedor && vehiculoTargetId) {
        const proveedorPayload = {
          vehiculo_id: vehiculoTargetId, nombre: data.prov_nombre || null, apellido: data.prov_apellido || null,
          dni: data.prov_dni || null, fecha_nacimiento: data.prov_fecha_nacimiento || null, cuit_cuil: data.prov_cuit_cuil || null,
          calle: data.prov_calle || null, numero: data.prov_numero || null, depto: data.prov_depto || null,
          localidad: data.prov_localidad || null, codigo_postal: data.prov_codigo_postal || null, provincia: data.prov_provincia || null,
          telefono_linea: data.prov_telefono_linea || null, telefono_celular: data.prov_telefono_celular || null, email: data.prov_email || null,
        };
        const hayDatosProveedor = Object.entries(proveedorPayload).some(([k, v]) => k !== "vehiculo_id" && v);
        if (hayDatosProveedor) {
          await supabase.from("vehiculo_proveedores").upsert(proveedorPayload, { onConflict: "vehiculo_id" });
        }

        await supabase.from("vehiculo_titulares").delete().eq("vehiculo_id", vehiculoTargetId);
        const titularesConDatos = titulares.filter((t) => t.nombre || t.cuit_cuil);
        if (titularesConDatos.length > 0) {
          await supabase.from("vehiculo_titulares").insert(
            titularesConDatos.map((t, i) => ({
              vehiculo_id: vehiculoTargetId, orden: i + 1, nombre: t.nombre || null,
              porcentaje: t.porcentaje ? Number(t.porcentaje) : null, cuit_cuil: t.cuit_cuil || null,
            }))
          );
        }
      }

      let ordenSiguiente = imagenesExistentes.length;
      const imagenesAInsertar = [];
      if (archivos.length > 0) setProgresoFotos({ actual: 0, total: archivos.length });
      for (let i = 0; i < archivos.length; i++) {
        try {
          const archivo = archivos[i];
          const url = await uploadAutoImage(archivo);
          if (url) imagenesAInsertar.push({ vehiculo_id: vehiculoTargetId!, url_archivo: url, tipo: archivo.type.startsWith("video") ? "video" : "foto", orden: ordenSiguiente + i });
        } catch (imgErr) { console.error(`Error subiendo la foto ${i + 1}:`, imgErr); }
        setProgresoFotos({ actual: i + 1, total: archivos.length });
      }
      setProgresoFotos(null);

      if (imagenesAInsertar.length > 0) {
        const { error: insertError } = await supabase.from("multimedia_vehiculos").insert(imagenesAInsertar);
        if (insertError) throw insertError;
      }

      if (modo === "editar") {
        await supabase.from("historial_cambios").insert({
          tabla: "vehiculos", registro_id: autoId, campo_modificado: rol === "vendedor" ? "galeria_multimedia" : "edicion_completa",
          valor_nuevo: rol === "vendedor" ? "Actualizó multimedia" : "Vehículo editado", usuario_id: user?.id,
        });
      }

      router.push("/panel");
      router.refresh();
    } catch (err: any) {
      if (err?.code === "42501" || /row-level security|permission denied/i.test(err?.message || "")) {
        alert("No tenés permiso para hacer esto. Consultá con un admin o encargado.");
      } else {
        alert(`Error al ${modo} el vehículo.`);
      }
    } finally {
      setLoading(false);
      setProgresoFotos(null);
    }
  };

  const handleSeleccionarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nuevos = Array.from(e.target.files);
    setArchivos((prev) => [...prev, ...nuevos]);
    setPrevisualizaciones((prev) => [...prev, ...nuevos.map((f) => URL.createObjectURL(f))]);
    setErrorArchivos("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const eliminarArchivoNuevo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
    setPrevisualizaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const eliminarImagenExistente = (idImg: string) => {
    setImagenesExistentes((prev) => prev.filter((img) => img.id !== idImg));
    setImagenesA_Eliminar((prev) => [...prev, idImg]);
  };

  const abrirBuscadorArchivos = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!loading && fileInputRef.current) fileInputRef.current.click();
  };

  if (loadingDatos)
    return (
      <div className="flex-1 bg-[#F9FAFB] dark:bg-[#001233] flex items-center justify-center text-slate-400 dark:text-slate-500">
        <Car className="w-8 h-8 text-indigo-500 animate-pulse" />
      </div>
    );

  const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] text-slate-900 dark:text-white custom-scrollbar pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors py-2 mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inventario
        </button>

        {esEdicionVendedor ? (
          <div className="mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Galería del Vehículo
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
              Solo tenés permisos para gestionar el material visual de esta unidad.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {modo === "crear" ? "Registrar Vehículo" : "Editar Vehículo"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                  Paso {paso} de {totalPasos}
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-[#002a6e] px-3 py-1 rounded-md border border-indigo-100 dark:border-[#0a2a6b]">
                {Math.round((paso / totalPasos) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#00246b] h-1.5 rounded-full mb-8 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(paso / totalPasos) * 100}%` }}
              ></div>
            </div>
          </>
        )}

        <form onKeyDown={handleKeyDown} className="space-y-6">
          {/* PASO 1 */}
          {!esEdicionVendedor && paso === 1 && (
            <SectionCard title="1. Información Principal" icon={<Car className="w-4 h-4 text-indigo-600" />}>
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
                  <input type="number" {...register("anio")} className={inputClass} />
                </Campo>
                <Campo label="Kilometraje *" error={errors.kilometraje?.message}>
                  <input type="number" {...register("kilometraje")} className={inputClass} />
                </Campo>
                <Campo label="Color">
                  <input {...register("color")} className={inputClass} />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 2 */}
          {!esEdicionVendedor && paso === 2 && (
            <SectionCard title="2. Especificaciones y Sucursal" icon={<Shield className="w-4 h-4 text-indigo-600" />}>
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
                <Campo label="Combustible *" error={errors.tipo_combustible?.message}>
                  <select {...register("tipo_combustible")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNC">GNC</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </Campo>
                <Campo label="Transmisión *" error={errors.transmision?.message}>
                  <select {...register("transmision")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="Manual">Manual</option>
                    <option value="Automática">Automática</option>
                  </select>
                </Campo>
                <Campo label="Tracción" error={errors.traccion?.message}>
                  <select {...register("traccion")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="4x2">4x2</option>
                    <option value="4x4">4x4</option>
                    <option value="Delantera">Delantera</option>
                    <option value="Trasera">Trasera</option>
                    <option value="Integral (AWD)">Integral (AWD)</option>
                  </select>
                </Campo>
                <Campo label="Potencia (CV)" error={errors.potencia_cv?.message}>
                  <input type="number" {...register("potencia_cv")} className={inputClass} placeholder="Ej: 150" />
                </Campo>
                <Campo label="Cantidad de plazas" error={errors.cantidad_plazas?.message}>
                  <select {...register("cantidad_plazas")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {[2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>{n} plazas</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Sucursal *" error={errors.sucursal_id?.message}>
                  <select {...register("sucursal_id")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Segmento">
                  <input {...register("segmento")} className={inputClass} placeholder="Ej: Premium, Familiar..." />
                </Campo>
                <Campo label="Origen">
                  <select {...register("origen")} className={inputClass}>
                    <option value="Comprado">Comprado</option>
                    <option value="Consignado">Consignado</option>
                    <option value="Permuta">Permuta</option>
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
              <div className="flex flex-col gap-4 pt-6 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-4 rounded-xl hover:bg-white dark:hover:bg-[#002a6e] w-fit transition-colors font-medium">
                  <input type="checkbox" {...register("stock_fisico")} className="w-4 h-4 accent-indigo-600" /> En stock físico
                </label>
                {!watch("stock_fisico") && modo === "crear" && (
                  <div className="ml-4 pl-4 border-l-2 border-indigo-500">
                    <Campo label="Condición Web *">
                      <select {...register("condicion_web")} className={inputClass}>
                        <option value="A comprar">A comprar</option>
                        <option value="A patentar">A patentar</option>
                      </select>
                    </Campo>
                  </div>
                )}
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-4 rounded-xl hover:bg-white dark:hover:bg-[#002a6e] w-fit transition-colors font-medium">
                  <input type="checkbox" {...register("destacado")} className="w-4 h-4 accent-indigo-600" /> Destacado en Web
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-orange-50 dark:bg-[#002a6e] border border-orange-200 dark:border-[#0a2a6b] p-4 rounded-xl hover:bg-orange-100/50 dark:hover:bg-[#00246b] w-fit transition-colors font-medium">
                  <input type="checkbox" {...register("pautado")} className="w-4 h-4 accent-orange-600" /> Pautado
                </label>
                {watch("pautado") && (
                  <div className="ml-4 pl-4 border-l-2 border-orange-400">
                    <Campo label="Canales de la pauta">
                      <div className="flex flex-col gap-3 mt-3">
                        {[
                          { id: "MercadoLibre", label: "MercadoLibre" },
                          { id: "Meta Ads", label: "Meta Ads (Instagram/Facebook)" },
                          { id: "Google Ads", label: "Google Ads" },
                          { id: "Web", label: "Web" },
                        ].map((canal) => (
                          <label key={canal.id} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer font-medium hover:text-orange-600 dark:hover:text-orange-300 transition-colors w-fit">
                            <input
                              type="checkbox"
                              value={canal.id}
                              {...register("canal_pauta")}
                              className="w-4 h-4 accent-orange-600 rounded border-slate-300 cursor-pointer"
                            />
                            {canal.label}
                          </label>
                        ))}
                      </div>
                    </Campo>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* PASO 3 */}
          {!esEdicionVendedor && paso === 3 && (
            <SectionCard title="3. Precios" icon={<DollarSign className="w-4 h-4 text-indigo-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Precio Publicado ARS *" error={errors.precio_publicado_ars?.message}>
                  <input type="number" {...register("precio_publicado_ars")} className={inputClass} />
                </Campo>
                <Campo label="Precio Publicado USD">
                  <input type="number" {...register("precio_publicado_usd")} className={inputClass} />
                </Campo>

                {puedeVerCosto ? (
                  <>
                    <Campo label="Precio Costo ARS (Oculto)">
                      <input type="number" {...register("precio_costo_ars")} className={inputClass} />
                    </Campo>
                    <Campo label="Precio Costo USD (Oculto)">
                      <input type="number" {...register("precio_costo_usd")} className={inputClass} />
                    </Campo>
                  </>
                ) : null}
              </div>
            </SectionCard>
          )}

          {/* PASO 4 */}
          {!esEdicionVendedor && paso === 4 && (
            <SectionCard title="4. Datos Legales" icon={<FileText className="w-4 h-4 text-indigo-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Marca de Motor">
                  <input {...register("marca_motor")} className={inputClass} />
                </Campo>
                <Campo label="Número de Motor">
                  <input {...register("numero_motor")} className={inputClass} />
                </Campo>
                <Campo label="Marca de Chasis">
                  <input {...register("marca_chasis")} className={inputClass} />
                </Campo>
                <Campo label="Número de Chasis">
                  <input {...register("numero_chasis")} className={inputClass} />
                </Campo>
                <Campo label="Ubicación (playón/predio)">
                  <input {...register("ubicacion")} className={inputClass} />
                </Campo>
                <Campo label="Radicado - Localidad">
                  <input {...register("radicado_localidad")} className={inputClass} />
                </Campo>
                <Campo label="Radicado - Provincia">
                  <input {...register("radicado_provincia")} className={inputClass} />
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 5 */}
          {!esEdicionVendedor && paso === 5 && (
            <SectionCard title="5. Datos Comerciales y Patentes" icon={<DollarSign className="w-4 h-4 text-indigo-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Fecha de Compra">
                  <input type="date" {...register("fecha_compra")} className={inputClass} />
                </Campo>
                <Campo label="Sucursal que Compra">
                  <select {...register("sucursal_compra_id")} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Importe Anual de Patente">
                  <input type="number" {...register("importe_patente_anual")} className={inputClass} />
                  {!!watch("importe_patente_anual") && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                      ≈ $ {(Number(watch("importe_patente_anual")) / 12).toLocaleString("es-AR", { maximumFractionDigits: 0 })} / mes
                    </span>
                  )}
                </Campo>
              </div>
            </SectionCard>
          )}

          {/* PASO 6 */}
          {!esEdicionVendedor && paso === 6 && (
            <SectionCard title="6. Proveedor y Titulares" icon={<FileText className="w-4 h-4 text-indigo-600" />}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Datos del Proveedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Nombre"><input {...register("prov_nombre")} className={inputClass} /></Campo>
                <Campo label="Apellido"><input {...register("prov_apellido")} className={inputClass} /></Campo>
                <Campo label="DNI"><input {...register("prov_dni")} className={inputClass} /></Campo>
                <Campo label="Fecha de Nacimiento"><input type="date" {...register("prov_fecha_nacimiento")} className={inputClass} /></Campo>
                <Campo label="Cuit/Cuil"><input {...register("prov_cuit_cuil")} className={inputClass} /></Campo>
                <Campo label="Calle"><input {...register("prov_calle")} className={inputClass} /></Campo>
                <Campo label="Número"><input {...register("prov_numero")} className={inputClass} /></Campo>
                <Campo label="Depto"><input {...register("prov_depto")} className={inputClass} /></Campo>
                <Campo label="Localidad"><input {...register("prov_localidad")} className={inputClass} /></Campo>
                <Campo label="Código Postal"><input {...register("prov_codigo_postal")} className={inputClass} /></Campo>
                <Campo label="Provincia"><input {...register("prov_provincia")} className={inputClass} /></Campo>
                <Campo label="Teléfono de Línea"><input {...register("prov_telefono_linea")} className={inputClass} /></Campo>
                <Campo label="Teléfono Celular"><input {...register("prov_telefono_celular")} className={inputClass} /></Campo>
                <Campo label="Correo Electrónico"><input type="email" {...register("prov_email")} className={inputClass} /></Campo>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Titulares</h3>
                  {titulares.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setTitulares((prev) => [...prev, { nombre: "", porcentaje: "", cuit_cuil: "" }])}
                      className="text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200"
                    >
                      + Agregar titular
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {titulares.map((t, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-3">
                      <Campo label={`Titular #${i + 1}`}>
                        <input
                          value={t.nombre}
                          onChange={(e) => setTitulares((prev) => prev.map((x, idx) => (idx === i ? { ...x, nombre: e.target.value } : x)))}
                          className={inputClass}
                        />
                      </Campo>
                      <Campo label="Porcet. (%)">
                        <input
                          type="number"
                          value={t.porcentaje}
                          onChange={(e) => setTitulares((prev) => prev.map((x, idx) => (idx === i ? { ...x, porcentaje: e.target.value } : x)))}
                          className={inputClass}
                        />
                      </Campo>
                      <Campo label="Cuit/Cuil">
                        <input
                          value={t.cuit_cuil}
                          onChange={(e) => setTitulares((prev) => prev.map((x, idx) => (idx === i ? { ...x, cuit_cuil: e.target.value } : x)))}
                          className={inputClass}
                        />
                      </Campo>
                      <button
                        type="button"
                        onClick={() => setTitulares((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-600 p-3"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {titulares.length === 0 && (
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">Sin titulares cargados.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          {/* PASO 7: GALERÍA */}
          {(paso === 7 || esEdicionVendedor) && (
            <SectionCard title="Multimedia" icon={<ImageIcon className="w-4 h-4 text-indigo-600" />}>
              <div className="space-y-4">
                {!esEdicionVendedor && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">Notas Internas</label>
                    <textarea {...register("observaciones_internas")} className={`${inputClass} h-24 resize-none`} />
                  </div>
                )}

                <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} onChange={handleSeleccionarArchivos} className="hidden" />

                <button
                  type="button"
                  onClick={abrirBuscadorArchivos}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#00246b] hover:border-indigo-400 outline-none ${errorArchivos ? "border-red-400 bg-red-50 dark:bg-red-950/40" : "border-slate-300 dark:border-[#0a2a6b] bg-white dark:bg-[#001c55]"}`}
                >
                  <Upload className="w-10 h-10 text-indigo-500 mb-3" />
                  <span className="block text-base font-bold text-slate-700 dark:text-slate-200">Clickeá aquí para subir fotografías</span>
                  <span className="block text-sm text-slate-400 dark:text-slate-500 mt-2">Podés seleccionar una o varias imágenes o videos.</span>
                </button>

                {errorArchivos && (
                  <span className="text-red-500 text-xs font-bold block text-center mt-2">{errorArchivos}</span>
                )}

                {/* Galería visual */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {imagenesExistentes.map((img) => (
                    <div key={img.id} className="relative h-24 bg-slate-100 dark:bg-[#00246b] rounded-lg overflow-hidden border border-slate-200 dark:border-[#0a2a6b] group">
                      {img.tipo === "video" ? (
                        <video src={img.url_archivo} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={img.url_archivo} className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => eliminarImagenExistente(img.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previsualizaciones.map((src, index) => (
                    <div key={`nuevo-${index}`} className="relative h-24 bg-slate-100 dark:bg-[#00246b] rounded-lg overflow-hidden border-2 border-emerald-400 group">
                      {archivos[index]?.type.startsWith("video") ? (
                        <video src={src} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={src} className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => eliminarArchivoNuevo(index)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* BOTONES FINALES */}
          <div className="flex items-center gap-4 pt-4">
            {!esEdicionVendedor ? (
              <>
                {paso > 1 && (
                  <button
                    type="button"
                    onClick={() => setPaso((p) => p - 1)}
                    className="w-1/3 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] py-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                )}
                {paso < totalPasos ? (
                  <button
                    type="button"
                    onClick={handleSiguiente}
                    className={`${paso === 1 ? "w-full" : "w-2/3"} bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm text-white`}
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-white"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Confirmar</>}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-white"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando Galería...</> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <div className="text-center">
            <p className="text-white font-bold text-sm">
              {progresoFotos ? `Subiendo foto ${progresoFotos.actual} de ${progresoFotos.total}...` : "Guardando..."}
            </p>
            <p className="text-white/60 text-xs mt-1">No cierres esta ventana</p>
          </div>
          {progresoFotos && (
            <div className="w-56 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 transition-all duration-300"
                style={{ width: `${(progresoFotos.actual / progresoFotos.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#001c55] p-6 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] space-y-5 shadow-sm">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#0a2a6b]">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
      {error && <span className="text-rose-500 dark:text-rose-300 text-[11px] mt-1.5 block font-bold">{error}</span>}
    </div>
  );
}
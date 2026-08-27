"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { uploadAutoImage } from "@/lib/upload";
import { ArrowLeft, Save, Upload, X, Car, Shield, DollarSign, FileText, Image as ImageIcon, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { mostrarToast } from "@/lib/toast";
import { notificarGestoria } from "@/lib/notificaciones";
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
  razon_pauta: z.string().optional(),
  condicion_web: z.string().optional(),
  sucursal_id: z.string().min(1, "Seleccioná una sucursal"),
  precio_costo_ars: z.string().optional(),
  precio_costo_usd: z.string().optional(),
  precio_publicado_ars: z.string().optional(),
  precio_publicado_usd: z.string().optional(),
  numero_motor: z.string().optional(),
  numero_chasis: z.string().optional(),
  marca_motor: z.string().optional(),
  marca_chasis: z.string().optional(),
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
}).superRefine((data, ctx) => {
  // Un auto puede publicarse solo en dólares (importados, 0km de marcas chinas, etc.) —
  // el requisito real es tener AL MENOS uno de los dos precios cargados, no siempre ARS.
  if (!data.precio_publicado_ars?.trim() && !data.precio_publicado_usd?.trim()) {
    const mensaje = "Cargá el precio en pesos o en dólares (al menos uno).";
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: mensaje, path: ["precio_publicado_ars"] });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: mensaje, path: ["precio_publicado_usd"] });
  }
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
  const searchParams = useSearchParams();
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
  const [vendedorAsignadoId, setVendedorAsignadoId] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<{ id: string; nombre: string; moneda: string }[]>([]);
  const [cuentaPagoId, setCuentaPagoId] = useState("");
  const [comprobantePagoUrl, setComprobantePagoUrl] = useState("");
  const [subiendoComprobantePago, setSubiendoComprobantePago] = useState(false);
  const cuentaPagoSeleccionada = cuentas.find((c) => c.id === cuentaPagoId);

  const subirComprobantePago = async (file: File) => {
    setSubiendoComprobantePago(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el comprobante.");
      setComprobantePagoUrl(data.publicUrl);
    } catch {
      mostrarToast("No se pudo subir el comprobante.", "error");
    } finally {
      setSubiendoComprobantePago(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, trigger, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origen: searchParams.get("origen") || "Comprado", estado: "Disponible", stock_fisico: true, destacado: false,
      pautado: false, canal_pauta: [], razon_pauta: "", // Iniciamos el array vacío
      marca: searchParams.get("marca") || "", modelo: searchParams.get("modelo") || "",
      anio: searchParams.get("anio") || String(new Date().getFullYear()),
      kilometraje: searchParams.get("kilometraje") || "0",
      precio_costo_usd: searchParams.get("precio_costo_usd") || "",
      precio_costo_ars: searchParams.get("precio_costo_ars") || "",
      prov_nombre: searchParams.get("prov_nombre") || "",
      prov_telefono_celular: searchParams.get("prov_telefono_celular") || "",
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
      const { data: dataCuentas } = await supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true).order("nombre");
      if (dataCuentas) setCuentas(dataCuentas);

      if (modo === "editar" && autoId) {
        const { data: vehiculo } = await supabase.from("vehiculos").select(`*, multimedia_vehiculos(*)`).eq("id", autoId).single();
        const { data: proveedor } = await supabase.from("vehiculo_proveedores").select("*").eq("vehiculo_id", autoId).maybeSingle();
        const { data: titularesData } = await supabase.from("vehiculo_titulares").select("*").eq("vehiculo_id", autoId).order("orden");
        if (vehiculo) {
          setVendedorAsignadoId(vehiculo.vendedor_asignado_id || null);
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
            fecha_compra: vehiculo.fecha_compra || "", sucursal_compra_id: vehiculo.sucursal_compra_id || "",
            importe_patente_anual: vehiculo.importe_patente_anual ? String(vehiculo.importe_patente_anual) : "",
            razon_pauta: vehiculo.razon_pauta || "",
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
    else if (paso === 4) camposAValidar = ["numero_motor", "numero_chasis", "marca_motor", "marca_chasis", "radicado_localidad", "radicado_provincia"];
    else if (paso === 5) camposAValidar = ["fecha_compra", "sucursal_compra_id", "importe_patente_anual"];

    const esValido = camposAValidar.length > 0 ? await trigger(camposAValidar) : true;
    if (esValido) setPaso((prev) => Math.min(prev + 1, totalPasos));
  };

  // El botón "Confirmar" valida el formulario completo (los 7 pasos), pero
  // solo se ven los campos del paso actual — si falla algo de otro paso
  // (ej. falta Precio Publicado del paso 3), el submit se bloquea sin que se
  // note nada. Si eso pasa, saltamos directo al primer paso con error.
  const PASO_POR_CAMPO: Record<string, number> = {
    patente: 1, marca: 1, modelo: 1, anio: 1, kilometraje: 1,
    sucursal_id: 2, segmento: 2, tipo: 2, tipo_combustible: 2, transmision: 2, estado: 2, condicion_web: 2, stock_fisico: 2, destacado: 2,
    precio_publicado_ars: 3, precio_publicado_usd: 3, precio_costo_ars: 3, precio_costo_usd: 3,
    numero_motor: 4, numero_chasis: 4, marca_motor: 4, marca_chasis: 4, radicado_localidad: 4, radicado_provincia: 4,
    fecha_compra: 5, sucursal_compra_id: 5, importe_patente_anual: 5,
  };

  const onErrorSubmit = (errores: typeof errors) => {
    const camposConError = Object.keys(errores) as (keyof FormValues)[];
    const pasoConError = camposConError.map((c) => PASO_POR_CAMPO[c] || totalPasos).sort((a, b) => a - b)[0];
    if (pasoConError && pasoConError !== paso) {
      setPaso(pasoConError);
      alert("Faltan datos obligatorios en un paso anterior. Te llevamos ahí.");
    }
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
        precio_publicado_ars: data.precio_publicado_ars ? Number(data.precio_publicado_ars) : null,
        precio_publicado_usd: data.precio_publicado_usd ? Number(data.precio_publicado_usd) : null,
        numero_motor: data.numero_motor || null, numero_chasis: data.numero_chasis || null,
        marca_motor: data.marca_motor || null, marca_chasis: data.marca_chasis || null,
        radicado_localidad: data.radicado_localidad || null, radicado_provincia: data.radicado_provincia || null, destacado: data.destacado,
        pautado: data.pautado,
        // Unimos el array con comas para guardarlo como string en la DB
        canal_pauta: data.pautado && data.canal_pauta?.length ? data.canal_pauta.join(", ") : null,
        razon_pauta: data.pautado && data.razon_pauta ? data.razon_pauta : null,
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

        // Compra a un particular: si se eligió cuenta de pago, el egreso real
        // (lo que le pagamos) queda registrado en Tesorería. Opcional — sin
        // cuenta no se genera nada, compatible con el flujo de antes.
        if (data.origen === "Comprado" && cuentaPagoId) {
          const montoPago = cuentaPagoSeleccionada?.moneda === "USD" ? Number(data.precio_costo_usd) || 0 : Number(data.precio_costo_ars) || 0;
          if (montoPago > 0) {
            const { error: errorMov } = await supabase.from("movimientos_caja").insert({
              tipo: "egreso",
              monto: montoPago,
              forma_pago: "Transferencia",
              fecha: new Date().toISOString().split("T")[0],
              vehiculo_id: vehiculoNuevo.id,
              sucursal_id: data.sucursal_id,
              cuenta_id: cuentaPagoId,
              patente: data.patente,
              vendedor_id: user?.id || null,
              es_tercero: true,
              destino_dinero: `${data.prov_nombre || ""} ${data.prov_apellido || ""}`.trim() || null,
              tipo_movimiento: "Pago Compra",
              comprobante_url: comprobantePagoUrl || null,
              observaciones: `Compra a particular — ${data.marca} ${data.modelo} (${data.patente})`,
            });
            if (errorMov) {
              mostrarToast("El vehículo se cargó, pero no se pudo registrar el pago en Tesorería. Cargalo a mano en Gastos.", "error");
            } else {
              await notificarGestoria(
                supabase,
                `Nuevo pago pendiente de aprobar — compra ${data.marca} ${data.modelo} (${data.patente}, $${montoPago.toLocaleString("es-AR")})`,
                "/panel/ventas/gestoria/aprobaciones"
              );
            }
          }
        }

        if (estadoDB === "Disponible") {
          fetch("/api/vehiculos/reactivar-leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehiculoId: vehiculoNuevo.id }),
          }).catch(() => {});
        }
        const cotizacionOrigenId = searchParams.get("revertir_cotizacion_id");
        if (cotizacionOrigenId) {
          await supabase.from("cotizaciones").update({ vehiculo_id: vehiculoNuevo.id }).eq("id", cotizacionOrigenId);
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

        if (rol === "vendedor" || imagenesAInsertar.length > 0 || imagenesA_Eliminar.length > 0) {
          const nombreAuto = `${data.marca || ""} ${data.modelo || ""}`.trim() || "un auto";
          fetch("/api/vehiculos/notificar-cambio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              autoId,
              vendedorAsignadoId,
              actorId: user?.id || null,
              mensaje: `Se actualizaron las fotos del ${nombreAuto}.`,
              tipo: "fotos_actualizadas",
            }),
          }).catch((err) => console.error("Error notificando cambio de fotos:", err));
        }
      }

      const destino = data.origen === "Consignado" ? "/panel/consignaciones" : "/panel";
      if (modo === "editar") {
        mostrarToast("Vehículo actualizado correctamente.");
        setTimeout(() => {
          router.push(destino);
          router.refresh();
        }, 1100);
      } else {
        router.push(destino);
        router.refresh();
      }
    } catch (err: any) {
      if (err?.code === "42501" || /row-level security|permission denied/i.test(err?.message || "")) {
        mostrarToast("No tenés permiso para hacer esto. Consultá con un admin o encargado.", "error");
      } else {
        mostrarToast(`Error al ${modo} el vehículo.`, "error");
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
          onClick={async () => {
            const revertirId = searchParams.get("revertir_cotizacion_id");
            const estadoAnterior = searchParams.get("estado_anterior");
            if (revertirId) {
              await supabase.from("cotizaciones").update({ estado: estadoAnterior || "Pendiente" }).eq("id", revertirId);
            }
            router.back();
          }}
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
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    <option value="Auto" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Auto</option>
                    <option value="Pickup" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Pickup</option>
                    <option value="Todo Terreno | SUV" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">SUV</option>
                    <option value="Utilitarios" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Utilitario</option>
                  </select>
                </Campo>
                <Campo label="Combustible *" error={errors.tipo_combustible?.message}>
                  <select {...register("tipo_combustible")} className={inputClass}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    <option value="Nafta" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Nafta</option>
                    <option value="Diesel" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Diesel</option>
                    <option value="GNC" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">GNC</option>
                    <option value="Híbrido" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Híbrido</option>
                  </select>
                </Campo>
                <Campo label="Transmisión *" error={errors.transmision?.message}>
                  <select {...register("transmision")} className={inputClass}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    <option value="Manual" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Manual</option>
                    <option value="Automática" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Automática</option>
                  </select>
                </Campo>
                <Campo label="Tracción" error={errors.traccion?.message}>
                  <select {...register("traccion")} className={inputClass}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    <option value="4x2" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">4x2</option>
                    <option value="4x4" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">4x4</option>
                    <option value="Delantera" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Delantera</option>
                    <option value="Trasera" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Trasera</option>
                    <option value="Integral (AWD)" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Integral (AWD)</option>
                  </select>
                </Campo>
                <Campo label="Potencia (CV)" error={errors.potencia_cv?.message}>
                  <input type="number" {...register("potencia_cv")} className={inputClass} placeholder="Ej: 150" />
                </Campo>
                <Campo label="Cantidad de plazas" error={errors.cantidad_plazas?.message}>
                  <select {...register("cantidad_plazas")} className={inputClass}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    {[2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{n} plazas</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Sucursal *" error={errors.sucursal_id?.message}>
                  <select {...register("sucursal_id")} className={inputClass}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Segmento">
                  <input {...register("segmento")} className={inputClass} placeholder="Ej: Premium, Familiar..." />
                </Campo>
                <Campo label="Origen">
                  <select {...register("origen")} className={inputClass}>
                    <option value="Comprado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Comprado</option>
                    <option value="Consignado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Consignado</option>
                    <option value="Permuta" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Permuta</option>
                  </select>
                </Campo>
                {modo === "crear" && (
                  <Campo label="Estado *" error={errors.estado?.message}>
                    <select {...register("estado")} className={inputClass}>
                      <option value="Disponible" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Disponible</option>
                      <option value="Señado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Señado</option>
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
                        <option value="A comprar" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">A comprar</option>
                        <option value="A patentar" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">A patentar</option>
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
                    <Campo label="Razón de la pauta (opcional)">
                      <input
                        {...register("razon_pauta")}
                        placeholder="Ej: temporada de camionetas, rotación rápida, se quiere sacar de encima"
                        className={inputClass}
                      />
                    </Campo>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* PASO 3 */}
          {!esEdicionVendedor && paso === 3 && (
            <SectionCard title="3. Precios" icon={<DollarSign className="w-4 h-4 text-indigo-600" />}>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-2 mb-1 md:col-span-2">Completá al menos uno de los dos precios publicados (ARS o USD).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo label="Precio Publicado ARS" error={errors.precio_publicado_ars?.message}>
                  <input type="number" {...register("precio_publicado_ars")} className={inputClass} />
                </Campo>
                <Campo label="Precio Publicado USD" error={errors.precio_publicado_usd?.message}>
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
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
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

          {/* PASO 7 (extra): PAGO AL PARTICULAR, solo si es una compra nueva */}
          {paso === 7 && !esEdicionVendedor && modo === "crear" && watch("origen") === "Comprado" && (
            <SectionCard title="Pago al vendedor particular (opcional)" icon={<DollarSign className="w-4 h-4 text-indigo-600" />}>
              <div className="space-y-4">
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Si elegís una cuenta, el pago queda registrado en Tesorería como egreso a tercero (pendiente de aprobación).</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">Cuenta de pago</label>
                    <select value={cuentaPagoId} onChange={(e) => setCuentaPagoId(e.target.value)} className={inputClass}>
                      <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">No registrar en Tesorería</option>
                      {cuentas.map((c) => (<option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre} ({c.moneda})</option>))}
                    </select>
                  </div>
                  {cuentaPagoId && (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">Comprobante</label>
                      <label className="flex items-center gap-2 bg-slate-50 dark:bg-[#00246b] border border-dashed border-slate-300 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[#002a6e] transition-colors">
                        {subiendoComprobantePago ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Upload className="w-4 h-4 text-slate-400" />}
                        <span className="text-slate-500 dark:text-slate-400 truncate">{comprobantePagoUrl ? "Comprobante cargado ✓" : subiendoComprobantePago ? "Subiendo..." : "Subir comprobante"}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" disabled={subiendoComprobantePago} onChange={(e) => e.target.files?.[0] && subirComprobantePago(e.target.files[0])} />
                      </label>
                    </div>
                  )}
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
                    onClick={handleSubmit(onSubmit, onErrorSubmit)}
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
                onClick={handleSubmit(onSubmit, onErrorSubmit)}
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
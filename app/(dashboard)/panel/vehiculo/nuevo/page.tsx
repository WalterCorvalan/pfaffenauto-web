"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAutoImage } from "@/lib/upload";
import { ArrowLeft, Save, Upload, X, Car } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  marca: z.string().min(2, "Obligatorio"),
  modelo: z.string().min(2, "Obligatorio"),
  anio: z.number().min(1950, "Año inválido"),
  precio_ars: z.number().positive("Debe ser mayor a 0"), // Prioridad en pesos
  precio_usd: z.number().optional(), // Opcional en dólares
  kilometraje: z.number().min(0, "No puede ser negativo"),
  sucursal_id: z.string().min(1, "Seleccioná una sucursal"),
  origen: z.enum(["Propio", "Consignacion"]),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NuevoAutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
  const [errorFotos, setErrorFotos] = useState("");
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origen: "Propio",
      anio: 2024,
    }
  });

  useEffect(() => {
    const fetchSucursales = async () => {
      const { data } = await supabase.from("sucursales").select("id, nombre");
      if (data) setSucursales(data);
    };
    fetchSucursales();
  }, []);

  const handleSeleccionarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setFotos((prev) => [...prev, ...nuevosArchivos]);
      const nuevasPreviews = nuevosArchivos.map((file) => URL.createObjectURL(file));
      setPrevisualizaciones((prev) => [...prev, ...nuevasPreviews]);
      setErrorFotos("");
    }
  };

  const eliminarFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setPrevisualizaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    if (fotos.length === 0) {
      setErrorFotos("Debés seleccionar al menos una foto del vehículo.");
      return;
    }
    setErrorFotos("");
    setLoading(true);

    try {
      const { data: vehiculoNuevo, error: errorVehiculo } = await supabase
        .from("vehiculos")
        .insert({
          marca: data.marca,
          modelo: data.modelo,
          anio: data.anio,
          precio_ars: data.precio_ars,
          precio_usd: data.precio_usd || null,
          kilometraje: data.kilometraje,
          sucursal_id: data.sucursal_id,
          origen: data.origen,
          color: data.color || null,
          estado: "Disponible",
        })
        .select("id")
        .single();

      if (errorVehiculo) throw errorVehiculo;

      let orden = 0;
      for (const foto of fotos) {
        const url = await uploadAutoImage(foto);
        if (url) {
          await supabase.from("multimedia_vehiculos").insert({
            vehiculo_id: vehiculoNuevo.id,
            url_archivo: url,
            tipo: "foto",
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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-serif mb-1">Registrar Vehículo</h1>
        <p className="text-gray-400 text-xs md:text-sm mb-6">Completá los datos técnicos y comerciales para publicar el auto.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#0055A4]" /> Información Principal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Marca</label>
                <input {...register("marca")} placeholder="Ej: Volkswagen" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
                {errors.marca && <span className="text-red-500 text-xs mt-1 block">{errors.marca.message}</span>}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Modelo</label>
                <input {...register("modelo")} placeholder="Ej: Amarok V6" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
                {errors.modelo && <span className="text-red-500 text-xs mt-1 block">{errors.modelo.message}</span>}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Año</label>
                <input type="number" {...register("anio", { valueAsNumber: true })} className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
                {errors.anio && <span className="text-red-500 text-xs mt-1 block">{errors.anio.message}</span>}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Kilometraje</label>
                <input type="number" {...register("kilometraje", { valueAsNumber: true })} placeholder="Ej: 45000" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
                {errors.kilometraje && <span className="text-red-500 text-xs mt-1 block">{errors.kilometraje.message}</span>}
              </div>

              {/* PRIORIDAD 1: PRECIO EN PESOS */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Precio en Pesos (ARS) *Principal*</label>
                <input type="number" {...register("precio_ars", { valueAsNumber: true })} placeholder="Ej: 25000000" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
                {errors.precio_ars && <span className="text-red-500 text-xs mt-1 block">{errors.precio_ars.message}</span>}
              </div>

              {/* PRIORIDAD 2: PRECIO EN DÓLARES (Opcional) */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Precio en Dólares (USD) *Opcional*</label>
                <input type="number" {...register("precio_usd", { valueAsNumber: true })} placeholder="Ej: 20000" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Color</label>
                <input {...register("color")} placeholder="Ej: Gris Indio" className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Sucursal de Ubicación</label>
                <select {...register("sucursal_id")} className="w-full bg-[#0A0A0A] border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-[#0055A4]">
                  <option value="">Seleccionar Sucursal...</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                {errors.sucursal_id && <span className="text-red-500 text-xs mt-1 block">{errors.sucursal_id.message}</span>}
              </div>
            </div>
          </div>

          {/* FOTOS */}
          <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#0055A4]" /> Fotografías del Vehículo
            </h2>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${errorFotos ? "border-red-500/50 bg-red-500/5" : "border-white/10 hover:border-[#0055A4]/50 bg-[#0A0A0A]"}`}>
              <input type="file" accept="image/*" multiple id="file-upload" onChange={handleSeleccionarFotos} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-500 mb-3" />
                <span className="text-sm font-bold text-gray-200">Hacé clic para seleccionar fotos</span>
              </label>
            </div>
            {errorFotos && <span className="text-red-500 text-xs block">{errorFotos}</span>}

            {previsualizaciones.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {previsualizaciones.map((src, index) => (
                  <div key={index} className="relative group h-28 bg-black rounded-lg overflow-hidden border border-white/10">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => eliminarFoto(index)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
            {loading ? "Publicando vehículo..." : <><Save className="w-4 h-4" /> Guardar y Publicar</>}
          </button>
        </form>
      </div>
    </div>
  );
}
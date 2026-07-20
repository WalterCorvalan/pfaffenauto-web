"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAutoImage } from "@/lib/upload";
import { ArrowLeft, Upload, Save } from "lucide-react";

export default function NuevoAutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // 1. Cambiamos el estado para que guarde una lista de archivos en lugar de uno solo
  const [fotos, setFotos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // 2. Subir todas las imágenes una por una usando tu función uploadAutoImage
      let imageUrls: string[] = [];
      
      if (fotos.length > 0) {
        for (const foto of fotos) {
          // Limpiamos el nombre para que no tenga caracteres raros que rompan la URL
          const fileName = `${Date.now()}-${foto.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
          const url = await uploadAutoImage(foto, fileName);
          
          if (url) {
            imageUrls.push(url);
          }
        }
      }

      // 3. Insertar datos en la tabla 'autos', guardando la lista completa de fotos
      const { error } = await supabase.from("autos").insert({
        marca: formData.get("marca"),
        modelo: formData.get("modelo"),
        anio: parseInt(formData.get("anio") as string),
        precio: parseFloat(formData.get("precio") as string),
        kilometraje: parseInt(formData.get("kilometraje") as string),
        sucursal: formData.get("sucursal"),
        fotos: imageUrls, // Acá pasamos el array lleno de URLs
      });

      if (error) throw error;

      alert("¡Auto cargado con éxito!");
      router.push("/panel");
    } catch (err) {
      console.error(err);
      alert("Error al guardar el auto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </button>

        <h1 className="text-3xl font-serif text-white mb-8">Ingresar Nuevo Vehículo</h1>

        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] p-8 rounded-xl border border-white/10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input name="marca" placeholder="Marca" required className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white" />
            <input name="modelo" placeholder="Modelo" required className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white" />
            <input name="anio" type="number" placeholder="Año" required className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white" />
            <input name="precio" type="number" placeholder="Precio (USD)" required className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white" />
            <input name="kilometraje" type="number" placeholder="Kilometraje" required className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white" />
            <select name="sucursal" className="bg-[#0A0A0A] p-3 rounded border border-white/10 text-white">
              <option>Casa Central</option>
              <option>Panamericana</option>
              <option>La Lucila</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-white/10 p-8 text-center rounded-lg">
            {/* Agregamos la propiedad 'multiple' y actualizamos el onChange */}
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setFotos(Array.from(e.target.files));
                }
              }} 
              className="text-gray-400 w-full cursor-pointer" 
            />
            <p className="text-sm text-gray-500 mt-2">
              Seleccionar fotos (podés elegir varias a la vez)
            </p>
            {/* Indicador visual de cuántas fotos seleccionó */}
            {fotos.length > 0 && (
              <p className="text-sm text-[#4A90E2] mt-2 font-bold">
                {fotos.length} fotos seleccionadas.
              </p>
            )}
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#0055A4] py-4 rounded font-bold text-white hover:bg-[#1E6FD9] transition-colors"
          >
            {loading ? "Guardando..." : "Publicar Vehículo"}
          </button>
        </form>
      </div>
    </div>
  );
}
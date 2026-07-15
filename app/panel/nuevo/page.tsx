"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadAutoImage } from "@/lib/upload";
import { ArrowLeft, Upload, Save } from "lucide-react";

export default function NuevoAutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // 1. Subir imagen primero
      let imageUrl = "";
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        imageUrl = await uploadAutoImage(file, fileName);
      }

      // 2. Insertar datos en la tabla 'autos'
      const { error } = await supabase.from("autos").insert({
        marca: formData.get("marca"),
        modelo: formData.get("modelo"),
        anio: parseInt(formData.get("anio") as string),
        precio: parseFloat(formData.get("precio") as string),
        kilometraje: parseInt(formData.get("kilometraje") as string),
        sucursal: formData.get("sucursal"),
        fotos: imageUrl ? [imageUrl] : [],
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
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Seleccionar foto principal</p>
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
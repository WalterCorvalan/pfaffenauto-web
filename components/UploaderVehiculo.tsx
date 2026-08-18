"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";

interface UploaderVehiculoProps {
  // Esta función recibe el array de URLs cuando terminan de subirse
  onUploadComplete: (urls: string[]) => void; 
}

export default function UploaderVehiculo({ onUploadComplete }: UploaderVehiculoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    // Subimos las fotos una por una (o podés usar Promise.all para hacerlas en paralelo)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload-bunny", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        
        if (response.ok && data.publicUrl) {
          newUrls.push(data.publicUrl);
        } else {
          console.error("Fallo al subir:", data.error);
        }
      } catch (error) {
        console.error("Error de red al subir archivo", error);
      }
    }

    // Actualizamos el estado y le avisamos al componente padre
    const finalUrls = [...uploadedUrls, ...newUrls];
    setUploadedUrls(finalUrls);
    onUploadComplete(finalUrls);
    setIsUploading(false);
    
    // Reseteamos el input por si quiere subir más fotos después
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    const newUrls = uploadedUrls.filter((_, idx) => idx !== indexToRemove);
    setUploadedUrls(newUrls);
    onUploadComplete(newUrls);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      
      {/* CAJA PUNTEADA PARA SUBIR */}
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
          isUploading 
            ? "border-slate-600 bg-slate-800/50 cursor-not-allowed opacity-70" 
            : "border-red-500/50 hover:border-red-500 bg-black/20 hover:bg-black/40 cursor-pointer"
        }`}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
            <span className="text-sm font-medium text-white">Subiendo fotos a máxima velocidad...</span>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-white mb-3" />
            <span className="text-sm font-bold text-white">Clickeá para subir fotografías</span>
            <span className="text-xs text-red-400 mt-2">Podés seleccionar múltiples archivos a la vez.</span>
          </>
        )}
      </div>

      {/* GALERÍA DE MINIATURAS (Para que veas qué subiste) */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {uploadedUrls.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
              <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}
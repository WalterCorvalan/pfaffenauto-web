"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

export default function CrearRecordatorioButton({
  vehiculoId,
  ventaId,
  nombreContacto,
  telefonoContacto,
}: {
  vehiculoId: string;
  ventaId?: string;
  nombreContacto: string;
  telefonoContacto: string;
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);

  const crearCaso = async () => {
    setCreando(true);
    try {
      const { error } = await supabase.from("postventa_casos").insert({
        vehiculo_id: vehiculoId,
        venta_id: ventaId || null,
        nombre_contacto: nombreContacto,
        telefono_contacto: telefonoContacto,
        tipo: "Service",
        estado: "Pendiente",
        descripcion: "Recordatorio de service generado automáticamente por antigüedad de la venta.",
        fecha: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      alert("No se pudo crear el caso de service.");
    } finally {
      setCreando(false);
    }
  };

  return (
    <button
      onClick={crearCaso}
      disabled={creando}
      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
    >
      <Wrench className="w-3.5 h-3.5" /> {creando ? "Creando..." : "Crear caso de service"}
    </button>
  );
}

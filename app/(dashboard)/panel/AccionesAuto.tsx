"use client";

import { useState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";

interface AccionesAutoProps {
  autoId: string;
  autoMarca?: string;
  autoModelo?: string;
  vendedorAsignadoId?: string | null;
  estadoActual: string;
  puedeGestionar: boolean;
  mostrarBadge?: boolean;
  mostrarArchivar?: boolean;
}

// Solo lectura a propósito: el estado del auto ya no se toca a mano desde
// acá. Lo mueven las acciones reales — Señas (Reservado/Disponible),
// Boletos de venta (Vendido) — así nunca queda desincronizado entre módulos.
// Para vender o reservar un auto, usar Ventas > Nuevo Boleto o Señas > Nueva.
// Excepción: Archivado/Disponible es la única transición manual que queda,
// porque ningún otro módulo la dispara — requiere admin/encargado (ver
// /api/vehiculos/reservar).
export default function AccionesAuto({ autoId, estadoActual, puedeGestionar, mostrarBadge = true, mostrarArchivar = true }: AccionesAutoProps) {
  const [estado, setEstado] = useState(estadoActual);
  const [cargando, setCargando] = useState(false);
  const estadoVisual = estado === "Reservado" ? "Señado" : estado;

  const colorClasses = `
    ${estadoVisual === "Borrador" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Disponible" ? "bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-sky-300 border-blue-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Señado" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Vendido" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Archivado" ? "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-[#0a2a6b]" : ""}
  `;

  const toggleArchivado = async () => {
    const nuevoEstado = estado === "Archivado" ? "Disponible" : "Archivado";
    setCargando(true);
    try {
      const res = await fetch("/api/vehiculos/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculoId: autoId, estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      setEstado(nuevoEstado);
    } catch {
      alert("No se pudo actualizar el estado del vehículo.");
    } finally {
      setCargando(false);
    }
  };

  const puedeArchivar = puedeGestionar && (estado === "Disponible" || estado === "Archivado");

  return (
    <div className="inline-flex items-center gap-1.5">
      {mostrarBadge && (
        <div
          title="El estado lo definen las acciones (seña, venta, etc.) — no se edita a mano"
          className={`inline-flex items-center justify-center text-[10px] md:text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm cursor-default uppercase tracking-wider ${colorClasses}`}
        >
          {estadoVisual}
        </div>
      )}
      {mostrarArchivar && puedeArchivar && (
        <button
          type="button"
          onClick={toggleArchivado}
          disabled={cargando}
          title={estado === "Archivado" ? "Desarchivar (volver a Disponible)" : "Archivar (sacar de circulación sin venderlo)"}
          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#002a6e] rounded-lg transition-colors disabled:opacity-40"
        >
          {estado === "Archivado" ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

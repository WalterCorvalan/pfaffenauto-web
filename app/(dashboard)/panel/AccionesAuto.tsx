"use client";

interface AccionesAutoProps {
  autoId: string;
  autoMarca?: string;
  autoModelo?: string;
  vendedorAsignadoId?: string | null;
  estadoActual: string;
  puedeGestionar: boolean;
}

// Solo lectura a propósito: el estado del auto ya no se toca a mano desde
// acá. Lo mueven las acciones reales — Señas (Reservado/Disponible),
// Boletos de venta (Vendido) — así nunca queda desincronizado entre módulos.
// Para vender o reservar un auto, usar Ventas > Nuevo Boleto o Señas > Nueva.
export default function AccionesAuto({ estadoActual }: AccionesAutoProps) {
  const estadoVisual = estadoActual === "Reservado" ? "Señado" : estadoActual;

  const colorClasses = `
    ${estadoVisual === "Borrador" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Disponible" ? "bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-sky-300 border-blue-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Señado" ? "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Vendido" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]" : ""}
    ${estadoVisual === "Archivado" ? "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-[#0a2a6b]" : ""}
  `;

  return (
    <div
      title="El estado lo definen las acciones (seña, venta, etc.) — no se edita a mano"
      className={`inline-flex items-center justify-center text-[10px] md:text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm cursor-default uppercase tracking-wider ${colorClasses}`}
    >
      {estadoVisual}
    </div>
  );
}

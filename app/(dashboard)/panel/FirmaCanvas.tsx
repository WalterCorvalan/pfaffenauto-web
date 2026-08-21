"use client";

import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Eraser, Check, Loader2, PenLine } from "lucide-react";

// Firma digital genérica: el cliente firma con el dedo/mouse sobre un canvas,
// se sube como PNG (mismo endpoint que cualquier documento, /api/upload-documento)
// y se guarda la URL en la columna `firma_url` de la tabla que le pases.
// Reusable para señas/boletos/resp-civil — solo cambia `tabla` e `id`.
export default function FirmaCanvas({
  tabla,
  id,
  firmaUrlActual,
  onGuardada,
}: {
  tabla: string;
  id: string;
  firmaUrlActual: string | null;
  onGuardada: (url: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [refirmando, setRefirmando] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || firmaUrlActual) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // El canvas se ve a tamaño CSS pero el buffer real va en más resolución
    // (devicePixelRatio) para que la firma no salga pixelada en el PDF.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, [firmaUrlActual, refirmando]);

  const posDesdeEvento = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const punto = "touches" in e ? e.touches[0] : e;
    return { x: punto.clientX - rect.left, y: punto.clientY - rect.top };
  };

  const empezarTrazo = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    dibujando.current = true;
    setTieneTrazo(true);
    const { x, y } = posDesdeEvento(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const seguirTrazo = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posDesdeEvento(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const terminarTrazo = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
  };

  const guardarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !tieneTrazo) return;
    setError("");
    setGuardando(true);
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("No se pudo generar la firma.");

      const formData = new FormData();
      formData.append("file", blob, `firma-${id}.png`);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la firma.");

      const { error: dbError } = await supabase.from(tabla).update({ firma_url: data.publicUrl }).eq("id", id);
      if (dbError) throw dbError;

      setRefirmando(false);
      onGuardada(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la firma.");
    } finally {
      setGuardando(false);
    }
  };

  if (firmaUrlActual && !refirmando) {
    return (
      <div className="flex flex-col items-center">
        <img src={firmaUrlActual} alt="Firma del cliente" className="h-20 object-contain" />
        <button
          type="button"
          onClick={() => setRefirmando(true)}
          className="print:hidden text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-sky-300 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"
        >
          <PenLine className="w-3 h-3" /> Firmar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="print:hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-24 bg-slate-50 dark:bg-[#00246b] border-2 border-dashed border-slate-300 dark:border-[#0a2a6b] rounded-xl touch-none cursor-crosshair"
        onMouseDown={empezarTrazo}
        onMouseMove={seguirTrazo}
        onMouseUp={terminarTrazo}
        onMouseLeave={terminarTrazo}
        onTouchStart={empezarTrazo}
        onTouchMove={seguirTrazo}
        onTouchEnd={terminarTrazo}
      />
      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={limpiar}
          disabled={!tieneTrazo || guardando}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> Limpiar
        </button>
        <button
          type="button"
          onClick={guardarFirma}
          disabled={!tieneTrazo || guardando}
          className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar firma
        </button>
      </div>
    </div>
  );
}

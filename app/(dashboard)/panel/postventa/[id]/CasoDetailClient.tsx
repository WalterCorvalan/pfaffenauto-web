"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowLeft, Wrench, Phone, CarFront, Calendar, ShieldCheck, ShieldAlert,
  Paperclip, Send, Loader2, User, FileText,
} from "lucide-react";

const TIPO_COLOR: Record<string, string> = {
  Service: "bg-blue-500 text-white",
  Reclamo: "bg-rose-500 text-white",
  Garantia: "bg-purple-500 text-white",
};

const ESTADOS = ["Pendiente", "En proceso", "Resuelto"];
const COLOR_ESTADO: Record<string, string> = {
  "Pendiente": "bg-amber-500 text-white border-amber-500",
  "En proceso": "bg-amber-500 text-white border-amber-500",
  "Resuelto": "bg-emerald-500 text-white border-emerald-500",
};

export default function CasoDetailClient({
  caso,
  eventosIniciales,
  adjuntosIniciales,
  vendedores,
  mesesGarantia,
}: {
  caso: any;
  eventosIniciales: any[];
  adjuntosIniciales: any[];
  vendedores: { id: string; nombre: string }[];
  mesesGarantia: number;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [estado, setEstado] = useState(caso.estado);
  const [asignadoA, setAsignadoA] = useState(caso.asignado_a || "");
  const [eventos, setEventos] = useState(eventosIniciales);
  const [adjuntos, setAdjuntos] = useState(adjuntosIniciales);
  const [nota, setNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [guardandoAsignado, setGuardandoAsignado] = useState(false);

  const registrarEvento = async (tipo: string, descripcion: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("postventa_eventos")
      .insert({ caso_id: caso.id, tipo, descripcion, creado_por: user?.id || null })
      .select("*, perfiles ( nombre )")
      .single();
    if (data) setEventos((prev) => [...prev, data]);
  };

  const cambiarEstado = async (nuevo: string) => {
    setGuardandoEstado(true);
    const anterior = estado;
    setEstado(nuevo);
    const { error } = await supabase.from("postventa_casos").update({ estado: nuevo }).eq("id", caso.id);
    setGuardandoEstado(false);
    if (error) {
      setEstado(anterior);
      alert("Error al cambiar el estado.");
      return;
    }
    await registrarEvento("estado", `Estado cambiado a "${nuevo}"`);
    router.refresh();
  };

  const cambiarAsignado = async (nuevoId: string) => {
    setGuardandoAsignado(true);
    const { error } = await supabase.from("postventa_casos").update({ asignado_a: nuevoId || null }).eq("id", caso.id);
    setGuardandoAsignado(false);
    if (error) {
      alert("Error al asignar el caso.");
      return;
    }
    setAsignadoA(nuevoId);
    const nombre = vendedores.find((v) => v.id === nuevoId)?.nombre;
    await registrarEvento("asignacion", nuevoId ? `Caso asignado a ${nombre}` : "Caso sin asignar");
    router.refresh();
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    setGuardandoNota(true);
    await registrarEvento("nota", nota.trim());
    setNota("");
    setGuardandoNota(false);
  };

  const subirAdjunto = async (file: File) => {
    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el archivo.");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adjunto } = await supabase
        .from("postventa_adjuntos")
        .insert({ caso_id: caso.id, url_archivo: data.publicUrl, nombre: file.name, creado_por: user?.id || null })
        .select("*")
        .single();
      if (adjunto) setAdjuntos((prev) => [adjunto, ...prev]);
      await registrarEvento("adjunto", `Adjuntó "${file.name}"`);
    } catch (err: any) {
      alert(err.message || "Error al subir el archivo.");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  // ================= GARANTÍA VIGENTE =================
  const venta = caso.venta;
  let garantiaInfo: { vigente: boolean; texto: string } | null = null;
  if (venta?.fecha) {
    const fechaVenta = new Date(`${venta.fecha}T12:00:00Z`);
    const fechaLimite = new Date(fechaVenta);
    fechaLimite.setMonth(fechaLimite.getMonth() + mesesGarantia);
    const vigente = new Date() <= fechaLimite;
    garantiaInfo = {
      vigente,
      texto: vigente
        ? `Garantía vigente hasta el ${fechaLimite.toLocaleDateString("es-AR")}`
        : `Garantía vencida el ${fechaLimite.toLocaleDateString("es-AR")}`,
    };
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <Link href="/panel/postventa" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          <Wrench className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight truncate">{caso.nombre_contacto}</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Caso de {caso.tipo}</p>
        </div>
        <span className={`ml-auto shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${TIPO_COLOR[caso.tipo] || TIPO_COLOR.Service}`}>
          {caso.tipo}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Datos generales */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">Estado</span>
                <select
                  value={estado}
                  disabled={guardandoEstado}
                  onChange={(e) => cambiarEstado(e.target.value)}
                  className={`text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border outline-none cursor-pointer disabled:opacity-50 ${COLOR_ESTADO[estado]}`}
                >
                  {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
                </select>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">Asignado a</span>
                <select
                  value={asignadoA}
                  disabled={guardandoAsignado}
                  onChange={(e) => cambiarAsignado(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[12px] font-medium text-slate-800 dark:text-white outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
                  {vendedores.map((v) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>))}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b] grid grid-cols-1 sm:grid-cols-2 gap-3">
              <p className="text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" /> {caso.telefono_contacto || "Sin teléfono"}
              </p>
              {caso.vehiculos && (
                <p className="text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CarFront className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" /> {caso.vehiculos.marca} {caso.vehiculos.modelo} {caso.vehiculos.patente ? `(${caso.vehiculos.patente})` : ""}
                </p>
              )}
              <p className="text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" /> Caso creado el {new Date(`${caso.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" })}
              </p>
              {venta && (
                <Link href={`/panel/ventas/seguimiento/${venta.id}`} className="text-[13px] text-indigo-600 dark:text-sky-300 hover:underline flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" /> Ver venta N° {venta.numero}
                </Link>
              )}
            </div>

            {caso.descripcion && (
              <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">Descripción original</span>
                <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">{caso.descripcion}</p>
              </div>
            )}

            {garantiaInfo && (
              <div className={`flex items-center gap-2.5 rounded-xl p-3 text-[12px] font-bold ${garantiaInfo.vigente ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"}`}>
                {garantiaInfo.vigente ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                {garantiaInfo.texto}
              </div>
            )}
          </div>

          {/* Adjuntos */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5" /> Adjuntos ({adjuntos.length})
              </h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoArchivo}
                className="text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {subiendoArchivo && <Loader2 className="w-3 h-3 animate-spin" />}
                {subiendoArchivo ? "Subiendo..." : "+ Adjuntar archivo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && subirAdjunto(e.target.files[0])}
              />
            </div>
            {adjuntos.length === 0 ? (
              <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">Sin adjuntos todavía.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {adjuntos.map((a) => (
                  <a
                    key={a.id}
                    href={a.url_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg p-2.5 text-[11px] text-slate-600 dark:text-slate-300 truncate hover:border-indigo-300 dark:hover:border-sky-400/50 transition-colors"
                    title={a.nombre}
                  >
                    {a.nombre}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Historial del caso</h2>
            <div className="space-y-3 mb-5">
              {eventos.length === 0 ? (
                <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">Sin actividad todavía.</p>
              ) : (
                eventos.map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#00246b] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-slate-800 dark:text-slate-100">{ev.descripcion}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {ev.perfiles?.nombre || "Sistema"} · {new Date(ev.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-[#0a2a6b]">
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarNota()}
                placeholder="Agregar una nota de seguimiento..."
                className="flex-1 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={agregarNota}
                disabled={guardandoNota || !nota.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                {guardandoNota ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

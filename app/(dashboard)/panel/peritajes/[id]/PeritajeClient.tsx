"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ESTADOS_ITEM_PERITAJE, ESTADO_NEUMATICO_RECAPABLE, ACCESORIOS_PERITAJE, calcularPuntaje } from "@/lib/peritajeChecklist";
import DiagramaCarroceria from "./DiagramaCarroceria";
import {
  ArrowLeft, ClipboardCheck, CarFront, User, Phone, Paperclip, Loader2, CheckCircle2, Printer, Wrench, X,
} from "lucide-react";

const COLOR_ESTADO_ITEM: Record<string, string> = {
  Bueno: "bg-emerald-500 text-white border-emerald-500",
  Regular: "bg-amber-500 text-white border-amber-500",
  Malo: "bg-rose-500 text-white border-rose-500",
  Recapable: "bg-sky-500 text-white border-sky-500",
  "No aplica": "bg-slate-300 dark:bg-slate-600 text-white border-slate-300 dark:border-slate-600",
};

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[12px] text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400";

export default function PeritajeClient({ peritaje, itemsIniciales }: { peritaje: any; itemsIniciales: any[] }) {
  const router = useRouter();
  const [items, setItems] = useState(itemsIniciales);
  const [estadoPeritaje, setEstadoPeritaje] = useState(peritaje.estado);
  const [finalizando, setFinalizando] = useState(false);
  const [subiendoFotoId, setSubiendoFotoId] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const [accesorios, setAccesorios] = useState<Record<string, boolean>>(peritaje.accesorios || {});
  const [guardandoAccesorios, setGuardandoAccesorios] = useState(false);

  const [usoInterno, setUsoInterno] = useState({
    estado_general_vu: peritaje.estado_general_vu || "",
    tipo_cliente: peritaje.tipo_cliente || "",
    valor_retoma: peritaje.valor_retoma ?? "",
    gastos_reparacion: peritaje.gastos_reparacion ?? "",
    gastos_preparacion: peritaje.gastos_preparacion ?? "",
    precio_venta: peritaje.precio_venta ?? "",
    observaciones_uso_interno: peritaje.observaciones_uso_interno || "",
    tasador: peritaje.tasador || "",
    ok_dto_vu: peritaje.ok_dto_vu || "",
    ok_gerencia_ventas: peritaje.ok_gerencia_ventas || "",
  });
  const [guardandoUsoInterno, setGuardandoUsoInterno] = useState(false);

  const puntaje = useMemo(() => calcularPuntaje(items), [items]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, any[]>();
    for (const it of items) {
      if (it.categoria === "Neumáticos") continue; // se renderiza aparte
      if (!mapa.has(it.categoria)) mapa.set(it.categoria, []);
      mapa.get(it.categoria)!.push(it);
    }
    return Array.from(mapa.entries());
  }, [items]);

  const neumaticos = useMemo(() => items.filter((it) => it.categoria === "Neumáticos"), [items]);

  const actualizarItem = async (id: string, cambios: Partial<{ estado: string; observacion: string; foto_url: string; necesita_reparacion: boolean; gastos_reparacion: number | null }>) => {
    // Usamos la forma funcional de setItems para que el puntaje se calcule siempre
    // sobre el estado más reciente, incluso si dos ítems se tocan casi al mismo tiempo
    // (evita una condición de carrera que podía guardar un puntaje desactualizado).
    let nuevosItems: typeof items = items;
    setItems((prev) => {
      nuevosItems = prev.map((it) => (it.id === id ? { ...it, ...cambios } : it));
      return nuevosItems;
    });
    const { error } = await supabase.from("peritaje_items").update(cambios).eq("id", id);
    if (error) console.error("Error guardando ítem de peritaje:", error);

    if (cambios.estado) {
      const nuevoPuntaje = calcularPuntaje(nuevosItems);
      await supabase.from("peritajes").update({ puntaje: nuevoPuntaje, updated_at: new Date().toISOString() }).eq("id", peritaje.id);
    }
  };

  const toggleAccesorio = async (clave: string) => {
    const nuevo = { ...accesorios, [clave]: !accesorios[clave] };
    setAccesorios(nuevo);
    setGuardandoAccesorios(true);
    const { error } = await supabase.from("peritajes").update({ accesorios: nuevo }).eq("id", peritaje.id);
    if (error) console.error("Error guardando accesorios:", error);
    setGuardandoAccesorios(false);
  };

  const guardarUsoInterno = async () => {
    setGuardandoUsoInterno(true);
    const payload = {
      ...usoInterno,
      valor_retoma: usoInterno.valor_retoma === "" ? null : Number(usoInterno.valor_retoma),
      gastos_reparacion: usoInterno.gastos_reparacion === "" ? null : Number(usoInterno.gastos_reparacion),
      gastos_preparacion: usoInterno.gastos_preparacion === "" ? null : Number(usoInterno.gastos_preparacion),
      precio_venta: usoInterno.precio_venta === "" ? null : Number(usoInterno.precio_venta),
    };
    const { error } = await supabase.from("peritajes").update(payload).eq("id", peritaje.id);
    if (error) console.error("Error guardando uso interno:", error);
    setGuardandoUsoInterno(false);
  };

  const subirFoto = async (itemId: string, file: File) => {
    setSubiendoFotoId(itemId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la foto.");
      await actualizarItem(itemId, { foto_url: data.publicUrl });
    } catch (err: any) {
      alert(err.message || "Error al subir la foto.");
    } finally {
      setSubiendoFotoId(null);
    }
  };

  const finalizarPeritaje = async () => {
    setFinalizando(true);
    const { error } = await supabase
      .from("peritajes")
      .update({ estado: "Completado", puntaje, updated_at: new Date().toISOString() })
      .eq("id", peritaje.id);
    setFinalizando(false);
    if (error) {
      alert("No se pudo finalizar el peritaje.");
      return;
    }
    setEstadoPeritaje("Completado");
    router.refresh();
  };

  const vehiculo = peritaje.vehiculos || peritaje.cotizaciones;
  const idLeadOrigen = peritaje.cotizacion_id || peritaje.whatsapp_conversacion_id || peritaje.web_chat_conversacion_id;
  const volverA = idLeadOrigen ? `/panel/crm/${idLeadOrigen}` : "/panel/peritajes";

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <Link href={volverA} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              Peritaje
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${estadoPeritaje === "Completado" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                {estadoPeritaje}
              </span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <CarFront className="w-3 h-3" /> {vehiculo?.marca} {vehiculo?.modelo} {peritaje.cotizaciones?.anio ? `(${peritaje.cotizaciones.anio})` : ""}
              {peritaje.cotizaciones?.nombre && <> · <User className="w-3 h-3" /> {peritaje.cotizaciones.nombre}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {puntaje !== null && (
            <div className="text-center">
              <span className={`text-2xl font-black ${puntaje >= 70 ? "text-emerald-600 dark:text-emerald-300" : puntaje >= 40 ? "text-amber-600 dark:text-amber-300" : "text-rose-600 dark:text-rose-300"}`}>
                {puntaje}%
              </span>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Puntaje</p>
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-700 dark:text-slate-300 p-2.5 rounded-xl transition-colors"
            title="Imprimir informe"
          >
            <Printer className="w-4 h-4" />
          </button>
          {estadoPeritaje !== "Completado" && (
            <button
              onClick={finalizarPeritaje}
              disabled={finalizando}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {finalizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {finalizando ? "Guardando..." : "Marcar completado"}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* ================= CHECKLIST TÉCNICO ================= */}
          {grupos.map(([categoria, itemsGrupo]) => (
            <div key={categoria} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b]">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">{categoria}</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                {itemsGrupo.map((item: any) => (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100">{item.item}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ESTADOS_ITEM_PERITAJE.map((e) => (
                          <button
                            key={e}
                            onClick={() => actualizarItem(item.id, { estado: e })}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors ${
                              item.estado === e ? COLOR_ESTADO_ITEM[e] : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                        <button
                          onClick={() => fileInputsRef.current[item.id]?.click()}
                          disabled={subiendoFotoId === item.id}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 hover:border-indigo-300 dark:hover:border-sky-400/50 transition-colors disabled:opacity-50"
                          title="Adjuntar foto"
                        >
                          {subiendoFotoId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          ref={(el) => { fileInputsRef.current[item.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && subirFoto(item.id, e.target.files[0])}
                        />
                      </div>
                    </div>

                    {/* Reparar + Gastos R. — igual que la columna del papel */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!item.necesita_reparacion}
                          onChange={(e) => actualizarItem(item.id, { necesita_reparacion: e.target.checked })}
                          className="w-3.5 h-3.5 accent-indigo-600"
                        />
                        <Wrench className="w-3 h-3" /> Reparar
                      </label>
                      {item.necesita_reparacion && (
                        <input
                          type="number"
                          defaultValue={item.gastos_reparacion ?? ""}
                          onBlur={(e) => {
                            const val = e.target.value === "" ? null : Number(e.target.value);
                            if (val !== (item.gastos_reparacion ?? null)) actualizarItem(item.id, { gastos_reparacion: val });
                          }}
                          placeholder="Gastos R. ($)"
                          className="w-32 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-2.5 py-1 text-[11px] text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                      )}
                    </div>

                    {(item.estado === "Regular" || item.estado === "Malo") && (
                      <input
                        type="text"
                        defaultValue={item.observacion || ""}
                        onBlur={(e) => e.target.value !== (item.observacion || "") && actualizarItem(item.id, { observacion: e.target.value })}
                        placeholder="Observación (opcional)..."
                        className={inputClass}
                      />
                    )}
                    {item.foto_url && (
                      <div className="relative inline-block w-16 h-16">
                        <a href={item.foto_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={item.foto_url} alt={item.item} className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-[#0a2a6b]" />
                        </a>
                        <button
                          type="button"
                          onClick={() => actualizarItem(item.id, { foto_url: "" })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm"
                          title="Quitar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ================= NEUMÁTICOS (marca + B/R/M/Recapable, aparte del resto) ================= */}
          {neumaticos.length > 0 && (
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b]">
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Neumáticos</h2>
              </div>
              <div>
                {[
                  { titulo: "Delanteros", items: neumaticos.filter((n: any) => n.item.startsWith("Delantero")) },
                  { titulo: "Traseros", items: neumaticos.filter((n: any) => n.item.startsWith("Trasero")) },
                  { titulo: "Auxilio", items: neumaticos.filter((n: any) => !n.item.startsWith("Delantero") && !n.item.startsWith("Trasero")) },
                ].filter((grupo) => grupo.items.length > 0).map((grupo, i) => (
                  <div key={grupo.titulo} className={i > 0 ? "border-t-4 border-slate-100 dark:border-[#0a2a6b]" : ""}>
                    <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{grupo.titulo}</p>
                    <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                      {grupo.items.map((item: any) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-[13px] font-medium text-slate-800 dark:text-slate-100 sm:w-40 sm:shrink-0">{item.item}</span>
                    <input
                      type="text"
                      defaultValue={item.observacion || ""}
                      onBlur={(e) => e.target.value !== (item.observacion || "") && actualizarItem(item.id, { observacion: e.target.value })}
                      placeholder="Marca..."
                      className="w-28 sm:flex-1 sm:min-w-[120px] bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-1.5 text-[12px] text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[...ESTADOS_ITEM_PERITAJE, ESTADO_NEUMATICO_RECAPABLE].map((e) => (
                        <button
                          key={e}
                          onClick={() => actualizarItem(item.id, { estado: e })}
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors ${
                            item.estado === e ? COLOR_ESTADO_ITEM[e] : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                          }`}
                        >
                          {e === ESTADO_NEUMATICO_RECAPABLE ? "Rec" : e}
                        </button>
                      ))}
                      <button
                        onClick={() => fileInputsRef.current[item.id]?.click()}
                        disabled={subiendoFotoId === item.id}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 hover:border-indigo-300 dark:hover:border-sky-400/50 transition-colors disabled:opacity-50"
                        title="Adjuntar foto"
                      >
                        {subiendoFotoId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        ref={(el) => { fileInputsRef.current[item.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && subirFoto(item.id, e.target.files[0])}
                      />
                    </div>
                    {item.foto_url && (
                      <div className="relative inline-block w-16 h-16">
                        <a href={item.foto_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={item.foto_url} alt={item.item} className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-[#0a2a6b]" />
                        </a>
                        <button
                          type="button"
                          onClick={() => actualizarItem(item.id, { foto_url: "" })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-sm"
                          title="Quitar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= DIAGRAMA INTERACTIVO DE CARROCERÍA ================= */}
          <DiagramaCarroceria peritajeId={peritaje.id} marcasIniciales={peritaje.carroceria_marcas || {}} />

          {/* ================= ACCESORIOS (checklist Sí/No) ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Accesorios</h2>
              {guardandoAccesorios && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCESORIOS_PERITAJE.map((acc) => (
                <label key={acc} className="flex items-center gap-2 text-[12px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!accesorios[acc]}
                    onChange={() => toggleAccesorio(acc)}
                    className="w-4 h-4 accent-indigo-600 shrink-0"
                  />
                  {acc}
                </label>
              ))}
            </div>
          </div>

          {/* ================= USO INTERNO EXCLUSIVO ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-amber-200 dark:border-amber-400/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-amber-50 dark:bg-amber-400/10 border-b border-amber-100 dark:border-amber-400/20">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Uso interno exclusivo</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Estado general del V.U.</label>
                  <div className="flex gap-1.5">
                    {ESTADOS_ITEM_PERITAJE.map((e) => (
                      <button
                        key={e} type="button"
                        onClick={() => setUsoInterno((p) => ({ ...p, estado_general_vu: e }))}
                        className={`flex-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg border transition-colors ${usoInterno.estado_general_vu === e ? COLOR_ESTADO_ITEM[e] : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Cliente</label>
                  <div className="flex gap-1.5">
                    {["Publico", "Revendedor"].map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setUsoInterno((p) => ({ ...p, tipo_cliente: t }))}
                        className={`flex-1 text-[11px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${usoInterno.tipo_cliente === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400"}`}
                      >
                        {t === "Publico" ? "Público" : "Revendedor"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Valor de retoma</label>
                  <input type="number" value={usoInterno.valor_retoma} onChange={(e) => setUsoInterno((p) => ({ ...p, valor_retoma: e.target.value }))} className={inputClass} placeholder="$" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">+ Gastos Rep.</label>
                  <input type="number" value={usoInterno.gastos_reparacion} onChange={(e) => setUsoInterno((p) => ({ ...p, gastos_reparacion: e.target.value }))} className={inputClass} placeholder="$" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">+ Gastos Prep.</label>
                  <input type="number" value={usoInterno.gastos_preparacion} onChange={(e) => setUsoInterno((p) => ({ ...p, gastos_preparacion: e.target.value }))} className={inputClass} placeholder="$" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Precio de venta</label>
                  <input type="number" value={usoInterno.precio_venta} onChange={(e) => setUsoInterno((p) => ({ ...p, precio_venta: e.target.value }))} className={inputClass} placeholder="$" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Observaciones</label>
                <textarea
                  value={usoInterno.observaciones_uso_interno}
                  onChange={(e) => setUsoInterno((p) => ({ ...p, observaciones_uso_interno: e.target.value }))}
                  rows={2}
                  className={inputClass}
                  placeholder="Ej: Selectora rota, embrague roto, pérdida de fluido..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Tasador</label>
                  <input type="text" value={usoInterno.tasador} onChange={(e) => setUsoInterno((p) => ({ ...p, tasador: e.target.value }))} className={inputClass} placeholder="Nombre" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">O.K. Dto. V.U.</label>
                  <input type="text" value={usoInterno.ok_dto_vu} onChange={(e) => setUsoInterno((p) => ({ ...p, ok_dto_vu: e.target.value }))} className={inputClass} placeholder="Nombre" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">O.K. Gerencia de Ventas</label>
                  <input type="text" value={usoInterno.ok_gerencia_ventas} onChange={(e) => setUsoInterno((p) => ({ ...p, ok_gerencia_ventas: e.target.value }))} className={inputClass} placeholder="Nombre" />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={guardarUsoInterno}
                  disabled={guardandoUsoInterno}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-widest px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {guardandoUsoInterno ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {guardandoUsoInterno ? "Guardando..." : "Guardar uso interno"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

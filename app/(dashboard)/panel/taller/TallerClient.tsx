"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CarFront, Plus, X, Search, Loader2, Wrench, Sparkles, Rocket, PackageCheck, Check } from "lucide-react";

const ETAPAS = ["Ingreso", "Taller", "Detailing", "Publicado"];

const ETAPA_CONFIG: Record<string, { icon: typeof CarFront; color: string; bg: string; border: string; barra: string }> = {
  Ingreso: { icon: PackageCheck, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-400", barra: "bg-slate-400" },
  Taller: { icon: Wrench, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-400", barra: "bg-amber-500" },
  Detailing: { icon: Sparkles, color: "text-sky-700", bg: "bg-sky-100", border: "border-sky-400", barra: "bg-sky-500" },
  Publicado: { icon: Rocket, color: "text-violet-700", bg: "bg-violet-100", border: "border-violet-400", barra: "bg-violet-500" },
};

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  patente: string | null;
  color: string | null;
  etapa_preparacion: string | null;
}

export default function TallerClient({ vehiculosIniciales }: { vehiculosIniciales: Vehiculo[] }) {
  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);
  const [cargandoId, setCargandoId] = useState<string | null>(null);

  // Selector para agregar un auto existente al proceso de preparación
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [disponibles, setDisponibles] = useState<Vehiculo[]>([]);
  const [agregandoId, setAgregandoId] = useState<string | null>(null);

  const abrirSelector = async () => {
    setSelectorAbierto(true);
    setBuscando(true);
    const { data } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, anio, patente, color, etapa_preparacion")
      .is("etapa_preparacion", null)
      .order("created_at", { ascending: false })
      .limit(50);
    setDisponibles(data || []);
    setBuscando(false);
  };

  const agregarAlProceso = async (v: Vehiculo) => {
    setAgregandoId(v.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("vehiculos").update({ etapa_preparacion: "Ingreso" }).eq("id", v.id);
      if (error) throw error;

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos",
        registro_id: v.id,
        campo_modificado: "etapa_preparacion",
        valor_anterior: null,
        valor_nuevo: "Ingreso",
        usuario_id: user?.id,
      });

      setVehiculos((prev) => [{ ...v, etapa_preparacion: "Ingreso" }, ...prev]);
      setDisponibles((prev) => prev.filter((x) => x.id !== v.id));
      setSelectorAbierto(false);
    } catch (err) {
      console.error("Error al agregar al proceso:", err);
      alert("No se pudo agregar el auto. Reintentá.");
    } finally {
      setAgregandoId(null);
    }
  };

  const cambiarEtapa = async (v: Vehiculo, nuevaEtapa: string) => {
    const etapaActual = v.etapa_preparacion || "Ingreso";
    if (nuevaEtapa === etapaActual) return;

    setCargandoId(v.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("vehiculos").update({ etapa_preparacion: nuevaEtapa }).eq("id", v.id);
      if (error) throw error;

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos",
        registro_id: v.id,
        campo_modificado: "etapa_preparacion",
        valor_anterior: etapaActual,
        valor_nuevo: nuevaEtapa,
        usuario_id: user?.id,
      });

      setVehiculos((prev) => prev.map((x) => (x.id === v.id ? { ...x, etapa_preparacion: nuevaEtapa } : x)));
    } catch (err) {
      console.error("Error al cambiar etapa:", err);
      alert("No se pudo actualizar la etapa. Reintentá.");
    } finally {
      setCargandoId(null);
    }
  };

  const disponiblesFiltrados = disponibles.filter((v) => {
    const texto = `${v.marca} ${v.modelo} ${v.patente || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#F4F5F7]">
      <button
        onClick={abrirSelector}
        className="w-full py-5 bg-white border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/40 text-slate-500 hover:text-orange-600 font-black rounded-2xl uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" /> Agregar vehículo al proceso
      </button>

      {vehiculos.map((v) => {
        const etapaActual = v.etapa_preparacion || "Ingreso";
        const idx = ETAPAS.indexOf(etapaActual);
        const cfg = ETAPA_CONFIG[etapaActual];
        const Icon = cfg.icon;

        return (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-14 h-14 rounded-2xl ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-[20px] text-slate-900 truncate leading-tight">{v.marca} {v.modelo}</h3>
                <p className="text-[13px] text-slate-500 font-medium truncate">{v.anio} · {v.patente || "Sin patente"} · {v.color || "-"}</p>
              </div>
            </div>

            {/* Lista vertical grande de etapas — tocá cualquiera para saltar (adelante o atrás) */}
            <div className="space-y-2">
              {ETAPAS.map((etapa, i) => {
                const activa = etapa === etapaActual;
                const completada = i < idx;
                const eCfg = ETAPA_CONFIG[etapa];
                const EIcon = eCfg.icon;
                return (
                  <button
                    key={etapa}
                    disabled={cargandoId === v.id}
                    onClick={() => cambiarEtapa(v, etapa)}
                    className={`w-full flex items-center gap-3 py-3.5 px-4 rounded-xl border-2 transition-all disabled:opacity-50 ${
                      activa
                        ? `${eCfg.bg} ${eCfg.border}`
                        : completada
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activa ? `${eCfg.barra} text-white` : completada ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {completada && !activa ? <Check className="w-4.5 h-4.5" /> : <EIcon className="w-4.5 h-4.5" />}
                    </div>
                    <span className={`text-[15px] font-bold ${activa ? eCfg.color : completada ? "text-slate-500" : "text-slate-400"}`}>
                      {etapa}
                    </span>
                    {activa && (
                      <span className={`ml-auto text-[10px] font-black uppercase tracking-widest ${eCfg.color}`}>
                        Actual
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {vehiculos.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <CarFront className="w-8 h-8 text-slate-300 mb-2" />
          <h3 className="text-[14px] font-bold text-slate-700">Sin autos en preparación</h3>
          <p className="text-slate-500 text-xs mt-1">Agregá un vehículo con el botón de arriba.</p>
        </div>
      )}

      {selectorAbierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectorAbierto(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Elegí el vehículo</h3>
              <button onClick={() => setSelectorAbierto(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por marca, modelo o patente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none focus:border-orange-400"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {buscando && (
                <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
              )}

              {!buscando && disponiblesFiltrados.map((v) => (
                <div
                  key={v.id}
                  onClick={() => agregandoId === null && agregarAlProceso(v)}
                  className="flex items-center gap-3 border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 rounded-xl p-3 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <CarFront className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[13px] text-slate-900 truncate">{v.marca} {v.modelo}</p>
                    <p className="text-[11px] text-slate-500 truncate">{v.anio} · {v.patente || "Sin patente"}</p>
                  </div>
                  {agregandoId === v.id && <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />}
                </div>
              ))}

              {!buscando && disponiblesFiltrados.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs font-medium">
                  Sin vehículos disponibles para agregar.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

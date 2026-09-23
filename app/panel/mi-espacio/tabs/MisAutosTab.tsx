"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, X, Save, Trash2, Pencil } from "lucide-react";
import { inputClass, labelClass } from "./shared";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

const TIPOS_SUGERIDOS = ["Auto", "Moto", "Lancha", "Camión", "Van", "Maquinaria", "Otro"];

interface Vencimiento { label: string; fecha: string }

export default function MisAutosTab({ miId }: { miId: string }) {
  const [autos, setAutos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [f, setF] = useState<any>({});
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_autos_personales").select("*").eq("perfil_id", miId).order("created_at", { ascending: false });
    setAutos(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const abrirNuevo = () => { setEditando(null); setF({}); setVencimientos([]); setShowNuevo(true); };
  const abrirEdicion = (a: any) => { setEditando(a); setF(a); setVencimientos(Array.isArray(a.vencimientos) ? a.vencimientos : []); setShowNuevo(true); };

  const agregarVencimiento = () => setVencimientos((prev) => [...prev, { label: "", fecha: "" }]);
  const actualizarVencimiento = (i: number, campo: "label" | "fecha", valor: string) => setVencimientos((prev) => prev.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  const quitarVencimiento = (i: number) => setVencimientos((prev) => prev.filter((_, idx) => idx !== i));

  const guardar = async () => {
    if (!f.marca?.trim()) return alert("Completá al menos la marca o el nombre del vehículo.");
    setGuardando(true);
    try {
      const vencimientosLimpios = vencimientos.filter((v) => v.label.trim() && v.fecha);
      const payload = {
        marca: f.marca.trim(), modelo: f.modelo || null, tipo: f.tipo || null, anio: f.anio ? Number(f.anio) : null, patente: f.patente || null,
        titular: f.titular || null, km: f.km ? Number(f.km) : null, valor_estimado_usd: f.valor_estimado_usd ? Number(f.valor_estimado_usd) : null,
        vencimientos: vencimientosLimpios, notas: f.notas || null,
      };
      if (editando) {
        const { data, error } = await supabase2.from("espacio_autos_personales").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setAutos((prev) => prev.map((a) => (a.id === editando.id ? data : a)));
      } else {
        const { data, error } = await supabase2.from("espacio_autos_personales").insert({ perfil_id: miId, ...payload }).select().single();
        if (error) throw error;
        setAutos((prev) => [data, ...prev]);
      }
      setShowNuevo(false);
    } catch (err: any) { console.error(err); alert(err?.message ? `No se pudo guardar: ${err.message}` : "No se pudo guardar."); } finally { setGuardando(false); }
  };

  const eliminar = (a: any) => {
    setConfirmDialog({
      mensaje: `¿Eliminar ${a.marca} ${a.modelo || ""}?`,
      accion: async () => {
        await supabase2.from("espacio_autos_personales").delete().eq("id", a.id);
        setAutos((prev) => prev.filter((x) => x.id !== a.id));
      },
    });
  };

  const valorTotal = autos.reduce((a, x) => a + Number(x.valor_estimado_usd || 0), 0);

  const hoy = new Date().toISOString().slice(0, 10);
  const en7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const estadoVencimiento = (fecha: string | null): "vencido" | "por_vencer" | null => {
    if (!fecha) return null;
    if (fecha < hoy) return "vencido";
    if (fecha <= en7dias) return "por_vencer";
    return null;
  };
  const badgeVencimiento = (v: Vencimiento) => {
    const estado = estadoVencimiento(v.fecha);
    if (!estado) return `${v.label}: ${v.fecha}`;
    const color = estado === "vencido" ? "text-rose-600 font-bold" : "text-amber-600 font-bold";
    return <span className={color}>{v.label}: {v.fecha} {estado === "vencido" ? "· vencido" : "· por vencer"}</span>;
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Mis vehículos — {autos.length} registrado{autos.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Valor estimado total: USD {valorTotal.toLocaleString("es-AR")}</p></div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo vehículo</button>
      </div>

      {autos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin vehículos registrados</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {autos.map((a) => (
            <div key={a.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{a.marca} {a.modelo} {a.anio}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {a.tipo && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{a.tipo}</span>}
                    {a.patente && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{a.patente}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0"><button onClick={() => abrirEdicion(a)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => eliminar(a)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Titular: {a.titular || "—"} {a.km ? `· ${Number(a.km).toLocaleString("es-AR")} km` : ""} {a.valor_estimado_usd ? <span className="font-bold text-emerald-600">· USD {Number(a.valor_estimado_usd).toLocaleString("es-AR")}</span> : ""}</p>
              {Array.isArray(a.vencimientos) && a.vencimientos.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-1">
                  {a.vencimientos.map((v: Vencimiento, i: number) => <span key={i}>{badgeVencimiento(v)}{i < a.vencimientos.length - 1 ? " ·" : ""}</span>)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-1"><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Tus vehículos personales (auto, moto, lancha, lo que sea) — separados del stock de la agencia.</p>

            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelClass}>Marca / Nombre *</label><input value={f.marca || ""} onChange={(e) => setF({ ...f, marca: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={f.modelo || ""} onChange={(e) => setF({ ...f, modelo: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Año</label><input type="number" value={f.anio || ""} onChange={(e) => setF({ ...f, anio: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className={labelClass}>Tipo</label>
                <input value={f.tipo || ""} onChange={(e) => setF({ ...f, tipo: e.target.value })} list="tipos-vehiculo-espacio" placeholder="Auto, Moto, Lancha..." className={inputClass} />
                <datalist id="tipos-vehiculo-espacio">{TIPOS_SUGERIDOS.map((t) => <option key={t} value={t} />)}</datalist>
              </div>
              <div><label className={labelClass}>Patente / Matrícula</label><input value={f.patente || ""} onChange={(e) => setF({ ...f, patente: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Titular</label><input value={f.titular || ""} onChange={(e) => setF({ ...f, titular: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Kilómetros / Horas</label><input type="text" inputMode="numeric" value={f.km || ""} onChange={(e) => setF({ ...f, km: e.target.value.replace(/\D/g, "") })} className={inputClass} /></div>
              <div><label className={labelClass}>Valor estimado (USD)</label><input type="text" inputMode="numeric" value={f.valor_estimado_usd || ""} onChange={(e) => setF({ ...f, valor_estimado_usd: e.target.value.replace(/\D/g, "") })} className={inputClass} /></div>
            </div>

            <div className="flex items-center justify-between mt-4 mb-1.5">
              <label className={labelClass + " mb-0"}>Vencimientos a controlar</label>
              <button type="button" onClick={agregarVencimiento} className="text-[11px] font-bold text-[#0145F2] dark:text-sky-300 hover:text-[#0138c9] dark:hover:text-sky-200">+ Agregar vencimiento</button>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">Ej: VTV, Seguro, Matrícula, Habilitación náutica, RTO — lo que corresponda según el vehículo. Avisa 7 días antes.</p>
            <div className="space-y-2">
              {vencimientos.map((v, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-end">
                  <div><input placeholder="Ej: VTV, Seguro, Matrícula..." value={v.label} onChange={(e) => actualizarVencimiento(i, "label", e.target.value)} className={inputClass} /></div>
                  <div><input type="date" value={v.fecha} onChange={(e) => actualizarVencimiento(i, "fecha", e.target.value)} className={inputClass} /></div>
                  <button type="button" onClick={() => quitarVencimiento(i)} className="p-2.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {vencimientos.length === 0 && <p className="text-xs text-slate-400">Sin vencimientos cargados.</p>}
            </div>

            <label className={labelClass + " mt-4"}>Notas</label>
            <textarea value={f.notas || ""} onChange={(e) => setF({ ...f, notas: e.target.value })} rows={2} className={inputClass} />

            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar cambios" : "Crear"}</button></div>
          </div>
        </div>
      )}
      <ConfirmDialog
        abierto={!!confirmDialog}
        mensaje={confirmDialog?.mensaje || ""}
        onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }}
        onCancelar={() => setConfirmDialog(null)}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";

interface Perfil { id: string; nombre: string }
interface Seguimiento { id: string; proxima_accion: string; responsable_id: string | null; fecha: string | null; completado: boolean }

// Usado por FichaRapidaModal y FichaCompletaModal -- no duplicar esta lógica
// en ninguno de los dos, es el único lugar que lee/escribe
// vehiculo_seguimientos (tabla nueva, ver migraciones/sql_vehiculo_seguimientos.sql).
export default function VehiculoSeguimientos({ vehiculoId, perfiles, miId }: { vehiculoId: string; perfiles: Perfil[]; miId: string }) {
  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));
  const [seguimientos, setSeguimientos] = useState<Seguimiento[] | null>(null);
  const [proximaAccion, setProximaAccion] = useState("");
  const [responsableId, setResponsableId] = useState(miId);
  const [fecha, setFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorTabla, setErrorTabla] = useState(false);

  useEffect(() => {
    let activo = true;
    supabase2.from("vehiculo_seguimientos").select("id, proxima_accion, responsable_id, fecha, completado")
      .eq("vehiculo_id", vehiculoId).eq("completado", false).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) { setErrorTabla(true); setSeguimientos([]); return; }
        setSeguimientos(data || []);
      });
    return () => { activo = false; };
  }, [vehiculoId]);

  const agendarSeguimiento = async () => {
    if (!proximaAccion.trim()) return;
    setGuardando(true);
    const { data, error } = await supabase2.from("vehiculo_seguimientos")
      .insert({ vehiculo_id: vehiculoId, proxima_accion: proximaAccion.trim(), responsable_id: responsableId || null, fecha: fecha || null, creado_por: miId })
      .select("id, proxima_accion, responsable_id, fecha, completado").maybeSingle();
    setGuardando(false);
    if (error || !data) { setErrorTabla(true); return; }
    setSeguimientos((prev) => [data, ...(prev || [])]);
    setProximaAccion(""); setFecha("");
  };

  return (
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-white">Plan de trabajo</p>
      <p className="text-[11px] text-slate-400 mb-2">Asigná una acción y dejá registrado qué se resolvió.</p>

      {seguimientos === null ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...</div>
      ) : errorTabla ? (
        <p className="text-xs text-slate-400 italic">El seguimiento comercial de la unidad todavía no está habilitado.</p>
      ) : seguimientos.length === 0 ? (
        <p className="text-xs text-slate-400 mb-3">Todavía no hay seguimientos agendados.</p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {seguimientos.map((s) => (
            <li key={s.id} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
              <p className="font-semibold text-slate-700 dark:text-slate-200">{s.proxima_accion}</p>
              <p className="text-slate-400">{s.responsable_id ? perfilMap[s.responsable_id] : "Sin responsable"}{s.fecha ? ` · ${s.fecha}` : ""}</p>
            </li>
          ))}
        </ul>
      )}

      {!errorTabla && seguimientos !== null && (
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-2">
          <input value={proximaAccion} onChange={(e) => setProximaAccion(e.target.value)} placeholder="Ej. Revisar precio con el propietario" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-rose-500" />
          <div className="grid grid-cols-2 gap-2">
            <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs">
              {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs" />
          </div>
          <button onClick={agendarSeguimiento} disabled={!proximaAccion.trim() || guardando} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold">
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Agendar seguimiento"}
          </button>
        </div>
      )}
    </div>
  );
}

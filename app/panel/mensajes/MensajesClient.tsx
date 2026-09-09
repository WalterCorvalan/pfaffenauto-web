"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Search, Paperclip, Smile, Send, Plus, Users, Globe, X, Trash2, ArrowLeft, Check, CheckCheck } from "lucide-react";

interface Perfil { id: string; nombre: string; roles?: string[] }
interface Canal { id: string; tipo: "general" | "directo" | "grupo"; nombre: string | null; par_clave: string | null; created_at: string; otroMiembro?: Perfil }
interface Mensaje { id: string; canal_id: string; autor_id: string; texto: string | null; adjuntos: { url: string; nombre: string }[]; created_at: string }

const HEARTBEAT_MS = 20000;
const ONLINE_UMBRAL_MS = 45000;

function estaEnLinea(lastSeenAt: string | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_UMBRAL_MS;
}

function nombreCanal(c: Canal, miId: string) {
  if (c.tipo === "general") return "General";
  if (c.tipo === "grupo") return c.nombre || "Grupo";
  return c.otroMiembro?.nombre || "Usuario";
}

export default function MensajesClient({ miId, miNombre, staff }: { miId: string; miNombre: string; staff: Perfil[] }) {
  const [canales, setCanales] = useState<Canal[]>([]);
  const [mensajesMeta, setMensajesMeta] = useState<{ id: string; canal_id: string; autor_id: string; created_at: string }[]>([]);
  const [lecturas, setLecturas] = useState<Record<string, string>>({});
  const [presencia, setPresencia] = useState<Record<string, string>>({});
  const [canalActivoId, setCanalActivoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [showNuevoDirecto, setShowNuevoDirecto] = useState(false);
  const [showNuevoGrupo, setShowNuevoGrupo] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [miembrosGrupo, setMiembrosGrupo] = useState<string[]>([]);
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cargarListado = useCallback(async () => {
    const { data: misMembresias } = await supabase2.from("mensajes_canal_miembros").select("canal_id").eq("perfil_id", miId);
    const idsPropios = (misMembresias || []).map((m) => m.canal_id);
    const { data: canalesRaw } = await supabase2.from("mensajes_canales").select("*").or(`tipo.eq.general,id.in.(${idsPropios.length ? idsPropios.join(",") : "00000000-0000-0000-0000-000000000000"})`);
    const lista = canalesRaw || [];

    const directoIds = lista.filter((c) => c.tipo === "directo").map((c) => c.id);
    let otrosMap: Record<string, Perfil> = {};
    if (directoIds.length) {
      const { data: miembrosDirectos } = await supabase2.from("mensajes_canal_miembros").select("canal_id, perfil:perfiles(id, nombre)").in("canal_id", directoIds).neq("perfil_id", miId);
      (miembrosDirectos || []).forEach((m: any) => { otrosMap[m.canal_id] = m.perfil; });
    }

    const conOtro: Canal[] = lista.map((c) => ({ ...c, otroMiembro: otrosMap[c.id] }));
    conOtro.sort((a, b) => (a.tipo === "general" ? -1 : b.tipo === "general" ? 1 : 0));
    setCanales(conOtro);

    const idsTodos = conOtro.map((c) => c.id);
    if (idsTodos.length) {
      const [{ data: metaMsgs }, { data: lecturasRaw }] = await Promise.all([
        supabase2.from("mensajes").select("id, canal_id, autor_id, created_at").in("canal_id", idsTodos).order("created_at", { ascending: false }).limit(500),
        supabase2.from("mensajes_lecturas").select("canal_id, last_read_at").eq("perfil_id", miId),
      ]);
      setMensajesMeta(metaMsgs || []);
      const map: Record<string, string> = {};
      (lecturasRaw || []).forEach((l) => { map[l.canal_id] = l.last_read_at; });
      setLecturas(map);
    }
  }, [miId]);

  useEffect(() => { cargarListado(); }, [cargarListado]);

  // Heartbeat de presencia — mientras la pantalla está abierta, avisa que estoy activo.
  useEffect(() => {
    if (!miId) return;
    const marcar = () => supabase2.from("mensajes_presencia").upsert({ perfil_id: miId, last_seen_at: new Date().toISOString() });
    marcar();
    const interval = setInterval(marcar, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [miId]);

  useEffect(() => {
    supabase2.from("mensajes_presencia").select("perfil_id, last_seen_at").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((p) => { map[p.perfil_id] = p.last_seen_at; });
      setPresencia(map);
    });
    const canal = supabase2.channel(`mensajes-presencia-realtime-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "*", schema: "public", table: "mensajes_presencia" }, (payload: any) => {
      const row = payload.new;
      if (row) setPresencia((prev) => ({ ...prev, [row.perfil_id]: row.last_seen_at }));
    }).subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, []);

  // Realtime: cualquier mensaje nuevo en cualquiera de mis canales visibles actualiza el listado; si es del canal abierto, se agrega al hilo.
  useEffect(() => {
    const canal = supabase2.channel(`mensajes-realtime-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload: any) => {
      const row: Mensaje = payload.new;
      setMensajesMeta((prev) => [{ id: row.id, canal_id: row.canal_id, autor_id: row.autor_id, created_at: row.created_at }, ...prev]);
      setCanalActivoId((activoActual) => {
        if (row.canal_id === activoActual) setMensajes((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        return activoActual;
      });
    }).subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [mensajes]);

  const abrirCanal = async (canalId: string) => {
    setCanalActivoId(canalId);
    const { data } = await supabase2.from("mensajes").select("*").eq("canal_id", canalId).order("created_at", { ascending: true });
    setMensajes(data || []);
    const ahora = new Date().toISOString();
    setLecturas((prev) => ({ ...prev, [canalId]: ahora }));
    await supabase2.from("mensajes_lecturas").upsert({ canal_id: canalId, perfil_id: miId, last_read_at: ahora });
  };

  const noLeidos = useMemo(() => {
    const map: Record<string, number> = {};
    canales.forEach((c) => {
      const desde = lecturas[c.id] ? new Date(lecturas[c.id]).getTime() : 0;
      map[c.id] = mensajesMeta.filter((m) => m.canal_id === c.id && m.autor_id !== miId && new Date(m.created_at).getTime() > desde).length;
    });
    return map;
  }, [canales, mensajesMeta, lecturas, miId]);

  const totalNoLeidos = useMemo(() => Object.values(noLeidos).reduce((a, b) => a + b, 0), [noLeidos]);

  const ultimoMensajePorCanal = useMemo(() => {
    const map: Record<string, { texto: string | null; created_at: string }> = {};
    canales.forEach((c) => {
      const propios = mensajesMeta.filter((m) => m.canal_id === c.id);
      if (propios.length) map[c.id] = { texto: null, created_at: propios[0].created_at };
    });
    return map;
  }, [canales, mensajesMeta]);

  const canalesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return canales;
    const q = busqueda.trim().toLowerCase();
    return canales.filter((c) => nombreCanal(c, miId).toLowerCase().includes(q));
  }, [canales, busqueda, miId]);

  const enviar = async () => {
    if (!canalActivoId || (!texto.trim() && archivos.length === 0)) return;
    setSubiendo(true);
    try {
      const adjuntos: { url: string; nombre: string }[] = [];
      for (const file of archivos.slice(0, 4)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("carpeta", "mensajes");
        const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) adjuntos.push({ url: data.publicUrl, nombre: file.name });
      }
      const { data, error } = await supabase2.from("mensajes").insert({ canal_id: canalActivoId, autor_id: miId, texto: texto.trim() || null, adjuntos }).select("*").single();
      if (error) throw error;
      setMensajes((prev) => [...prev, data]);
      setTexto("");
      setArchivos([]);
      const ahora = new Date().toISOString();
      await supabase2.from("mensajes_lecturas").upsert({ canal_id: canalActivoId, perfil_id: miId, last_read_at: ahora });
      setLecturas((prev) => ({ ...prev, [canalActivoId]: ahora }));
    } catch {
      alert("No se pudo enviar el mensaje.");
    } finally {
      setSubiendo(false);
    }
  };

  const iniciarDirecto = async (otroId: string) => {
    setShowNuevoDirecto(false);
    const parClave = [miId, otroId].sort().join(":");
    const { data: existente } = await supabase2.from("mensajes_canales").select("id").eq("tipo", "directo").eq("par_clave", parClave).maybeSingle();
    let canalId = existente?.id;
    if (!canalId) {
      const { data: nuevo, error } = await supabase2.from("mensajes_canales").insert({ tipo: "directo", par_clave: parClave, created_by: miId }).select("id").single();
      if (error) { alert("No se pudo iniciar la conversación."); return; }
      canalId = nuevo.id;
      await supabase2.from("mensajes_canal_miembros").insert([{ canal_id: canalId, perfil_id: miId }, { canal_id: canalId, perfil_id: otroId }]);
    }
    await cargarListado();
    await abrirCanal(canalId!);
  };

  const crearGrupo = async () => {
    if (!nombreGrupo.trim() || miembrosGrupo.length === 0) return;
    setCreandoGrupo(true);
    try {
      const { data: nuevo, error } = await supabase2.from("mensajes_canales").insert({ tipo: "grupo", nombre: nombreGrupo.trim(), created_by: miId }).select("id").single();
      if (error) throw error;
      const filas = [miId, ...miembrosGrupo].map((perfil_id) => ({ canal_id: nuevo.id, perfil_id }));
      await supabase2.from("mensajes_canal_miembros").insert(filas);
      setShowNuevoGrupo(false);
      setNombreGrupo("");
      setMiembrosGrupo([]);
      await cargarListado();
      await abrirCanal(nuevo.id);
    } catch {
      alert("No se pudo crear el grupo.");
    } finally {
      setCreandoGrupo(false);
    }
  };

  const canalActivo = canales.find((c) => c.id === canalActivoId) || null;

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-[#0A0A0A]">
      <div className={`w-full sm:w-80 border-r border-slate-200 dark:border-white/10 flex flex-col shrink-0 ${canalActivoId ? "hidden sm:flex" : "flex"}`}>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Mensajes</h1>
          <p className="text-[11px] text-slate-400">Conectado como {miNombre}</p>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar chat..." className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-full pl-9 pr-3 py-2 text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {canalesFiltrados.map((c) => {
            const activo = c.id === canalActivoId;
            const n = noLeidos[c.id] || 0;
            const enLinea = c.tipo === "directo" && c.otroMiembro && estaEnLinea(presencia[c.otroMiembro.id]);
            return (
              <button key={c.id} onClick={() => abrirCanal(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 dark:border-white/5 ${activo ? "bg-indigo-600 text-white" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${c.tipo === "general" ? "bg-sky-500 text-white" : "bg-indigo-500 text-white"}`}>
                    {c.tipo === "general" ? <Globe className="w-4 h-4" /> : c.tipo === "grupo" ? <Users className="w-4 h-4" /> : nombreCanal(c, miId).slice(0, 1).toUpperCase()}
                  </div>
                  {enLinea && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0A0A0A]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${activo ? "text-white" : "text-slate-900 dark:text-white"}`}>{nombreCanal(c, miId)}</p>
                  <p className={`text-[11px] truncate ${activo ? "text-white/70" : "text-slate-400"}`}>{ultimoMensajePorCanal[c.id] ? "Mensaje nuevo" : "Tocá para chatear"}</p>
                </div>
                {n > 0 && <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0 ${activo ? "bg-white text-indigo-600" : "bg-rose-600 text-white"}`}>{n}</span>}
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t border-slate-100 dark:border-white/10 space-y-1">
          <button onClick={() => setShowNuevoDirecto(true)} className="w-full flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg px-2 py-2"><Plus className="w-4 h-4" /> Nuevo mensaje directo</button>
          <button onClick={() => setShowNuevoGrupo(true)} className="w-full flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg px-2 py-2"><Plus className="w-4 h-4" /> Crear grupo</button>
        </div>
      </div>

      <div className={`flex-1 flex-col ${canalActivoId ? "flex" : "hidden sm:flex"}`}>
        {!canalActivo ? (
          <div className="flex-1 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm">Elegí una conversación</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
              <button onClick={() => setCanalActivoId(null)} className="sm:hidden text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{nombreCanal(canalActivo, miId)}</p>
                {canalActivo.tipo === "directo" && canalActivo.otroMiembro && (
                  <p className="text-[11px] text-slate-400">{estaEnLinea(presencia[canalActivo.otroMiembro.id]) ? "En línea" : "Desconectado"}</p>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-[#111]">
              {mensajes.length === 0 ? (
                <p className="text-center text-sm text-slate-400 mt-10">Sé el primero en escribir algo</p>
              ) : mensajes.map((m) => {
                const esMio = m.autor_id === miId;
                return (
                  <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${esMio ? "bg-indigo-600 text-white" : "bg-white dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"}`}>
                      {m.texto && <p className="whitespace-pre-wrap break-words">{m.texto}</p>}
                      {m.adjuntos?.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noreferrer" className={`flex items-center gap-1 text-xs mt-1 underline ${esMio ? "text-white/90" : "text-indigo-600 dark:text-indigo-400"}`}><Paperclip className="w-3 h-3" /> {a.nombre}</a>
                      ))}
                      <p className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${esMio ? "text-white/60" : "text-slate-400"}`}>
                        {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {esMio && <CheckCheck className="w-3 h-3" />}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-white/10">
              {archivos.length > 0 && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {archivos.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-full">
                      {f.name} <button onClick={() => setArchivos((prev) => prev.filter((_, x) => x !== i))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-full px-3 py-1.5">
                <label className="cursor-pointer text-slate-400 hover:text-indigo-600 shrink-0">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" multiple className="hidden" onChange={(e) => setArchivos((prev) => [...prev, ...Array.from(e.target.files || [])].slice(0, 4))} />
                </label>
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder={`Mensaje en ${nombreCanal(canalActivo, miId)}...`}
                  className="flex-1 bg-transparent outline-none text-sm py-1.5"
                />
                <button onClick={enviar} disabled={subiendo} className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-50"><Send className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Enter para enviar · Shift+Enter para nueva línea · hasta 4 archivos por mensaje</p>
            </div>
          </>
        )}
      </div>

      {showNuevoDirecto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNuevoDirecto(false)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold">Nuevo mensaje directo</h3><button onClick={() => setShowNuevoDirecto(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="space-y-1">
              {staff.map((p) => (
                <button key={p.id} onClick={() => iniciarDirecto(p.id)} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">{p.nombre.slice(0, 1).toUpperCase()}</div>
                    {estaEnLinea(presencia[p.id]) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#141414]" />}
                  </div>
                  <span className="text-sm font-semibold">{p.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNuevoGrupo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !creandoGrupo && setShowNuevoGrupo(false)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold">Crear grupo</h3><button onClick={() => setShowNuevoGrupo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Nombre del grupo</label>
            <input value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} placeholder="Ej: Equipo Ventas, Gestión Marzo..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none mb-4" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Agregar miembros ({miembrosGrupo.length} seleccionados)</p>
            <div className="space-y-1 mb-4">
              {staff.map((p) => (
                <label key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" checked={miembrosGrupo.includes(p.id)} onChange={(e) => setMiembrosGrupo((prev) => e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id))} className="w-4 h-4 accent-rose-600" />
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">{p.nombre.slice(0, 1).toUpperCase()}</div>
                  <div><p className="text-sm font-semibold">{p.nombre}</p><p className="text-[10px] text-slate-400">{p.roles?.[0] || ""}</p></div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNuevoGrupo(false)} disabled={creandoGrupo} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl disabled:opacity-50">Cancelar</button>
              <button onClick={crearGrupo} disabled={creandoGrupo || !nombreGrupo.trim() || miembrosGrupo.length === 0} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50"><Users className="w-4 h-4" /> Crear grupo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import {
  UserSearch, Search, MessageCircle, Ban, ThumbsUp, ThumbsDown, Undo2,
  Car, Handshake, Wrench, MessagesSquare, Send,
} from "lucide-react";

interface Cliente {
  id: string; nombre: string; telefono: string | null; vehiculo_interes_texto: string | null;
  busca_marca: string | null; busca_modelo: string | null; segmento: string | null;
  no_contactar: boolean; ultimo_contacto: string | null; vendedor_id: string | null; created_at: string;
}
interface Perfil { id: string; nombre: string; roles: string[] }
type Config = {
  plazo_recontacto_meses: number; asignar_al_enviar: boolean;
  plantilla_busca_auto: string; plantilla_quiere_vender: string; plantilla_taller_service: string; plantilla_consulta_general: string;
} | null;
interface Recontacto {
  id: string; cliente_id: string; segmento_usado: string; mensaje_usado: string;
  vendedor_id: string | null; enviado_en: string; disponible_desde: string;
  resultado: string; resultado_en: string | null; resultado_por: string | null;
  cliente: { nombre: string; telefono: string | null } | null;
  vendedor: { nombre: string } | null;
}

type Tab = "para" | "recontactados";

const SEGMENTOS: { value: string; label: string; icon: any; color: string }[] = [
  { value: "busca_auto", label: "Busca un auto", icon: Car, color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20" },
  { value: "quiere_vender", label: "Quiere vender", icon: Handshake, color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20" },
  { value: "taller_service", label: "Taller / service", icon: Wrench, color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20" },
  { value: "consulta_general", label: "Consulta general", icon: MessagesSquare, color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10" },
];
const SEGMENTO_MAP = Object.fromEntries(SEGMENTOS.map((s) => [s.value, s]));

const RESULTADOS = [
  { value: "quiere_avanzar", label: "Quieren avanzar", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" },
  { value: "pendiente", label: "Sin respuesta", color: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10" },
  { value: "no_interesa", label: "No les interesa", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" },
  { value: "pidio_baja", label: "Pidieron baja", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20" },
];

function mesesDesde(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.44);
}
function vehiculoDeCliente(c: Cliente) {
  return c.vehiculo_interes_texto || [c.busca_marca, c.busca_modelo].filter(Boolean).join(" ") || "";
}
function armarMensaje(c: Cliente, segmento: string, config: Config, miNombre: string): { texto: string; esGenerico: boolean } {
  const vehiculo = vehiculoDeCliente(c);
  let plantilla = config?.plantilla_consulta_general || "Hola {nombre}! Soy {vendedor} de Pfaffen Autos.";
  let esGenerico = false;
  if (segmento === "busca_auto" && vehiculo) {
    plantilla = config?.plantilla_busca_auto || plantilla;
  } else if (segmento === "busca_auto" && !vehiculo) {
    esGenerico = true;
  } else if (segmento === "quiere_vender") {
    plantilla = config?.plantilla_quiere_vender || plantilla;
  } else if (segmento === "taller_service") {
    plantilla = config?.plantilla_taller_service || plantilla;
  }
  const texto = plantilla
    .replaceAll("{nombre}", c.nombre)
    .replaceAll("{vendedor}", miNombre)
    .replaceAll("{vehiculo}", vehiculo || "tu auto");
  return { texto, esGenerico };
}

export default function RecontactosClient({
  clientesIniciales, perfiles, config, idsCompraron, recontactosIniciales, miId,
}: { clientesIniciales: Cliente[]; perfiles: Perfil[]; config: Config; idsCompraron: string[]; recontactosIniciales: Recontacto[]; miId: string }) {
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [recontactos, setRecontactos] = useState(recontactosIniciales);
  const [tab, setTab] = useState<Tab>("para");
  const [plazoFiltro, setPlazoFiltro] = useState(String(config?.plazo_recontacto_meses || 4));
  const [segmentoFiltro, setSegmentoFiltro] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [query, setQuery] = useState("");
  const [ocultarYaContactados, setOcultarYaContactados] = useState(false);
  const [resultadoFiltro, setResultadoFiltro] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [segmentosLocal, setSegmentosLocal] = useState<Record<string, string>>({});

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const miNombre = perfilMap[miId] || "el equipo";
  const esAdmin = perfiles.find((p) => p.id === miId)?.roles?.includes("admin") ?? false;
  const compraronSet = useMemo(() => new Set(idsCompraron), [idsCompraron]);

  // Última vez que cada cliente recibió un recontacto (para el enfriamiento).
  const ultimoRecontactoPorCliente = useMemo(() => {
    const map: Record<string, Recontacto> = {};
    for (const r of recontactos) {
      if (!map[r.cliente_id] || new Date(r.enviado_en) > new Date(map[r.cliente_id].enviado_en)) map[r.cliente_id] = r;
    }
    return map;
  }, [recontactos]);

  const elegibles = useMemo(() => {
    const hoy = Date.now();
    return clientes.filter((c) => {
      if (compraronSet.has(c.id)) return false;
      if (!esAdmin && c.vendedor_id && c.vendedor_id !== miId) return false;
      const ultimo = ultimoRecontactoPorCliente[c.id];
      if (ultimo && new Date(ultimo.disponible_desde).getTime() > hoy) return false;
      return true;
    });
  }, [clientes, compraronSet, esAdmin, miId, ultimoRecontactoPorCliente]);

  const filtrados = useMemo(() => {
    const minMeses = Number(plazoFiltro);
    let lista = elegibles.filter((c) => mesesDesde(c.ultimo_contacto || c.created_at) >= minMeses);
    if (segmentoFiltro) lista = lista.filter((c) => (c.segmento || "consulta_general") === segmentoFiltro);
    if (vendedorFiltro) lista = lista.filter((c) => c.vendedor_id === vendedorFiltro);
    if (ocultarYaContactados) lista = lista.filter((c) => !ultimoRecontactoPorCliente[c.id]);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((c) => [c.nombre, c.telefono, vehiculoDeCliente(c)].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista.sort((a, b) => new Date(a.ultimo_contacto || a.created_at).getTime() - new Date(b.ultimo_contacto || b.created_at).getTime());
  }, [elegibles, plazoFiltro, segmentoFiltro, vendedorFiltro, ocultarYaContactados, query, ultimoRecontactoPorCliente]);

  // Duplicados (mismo teléfono) → una sola fila, con contador.
  const filtradosAgrupados = useMemo(() => {
    const grupos: Record<string, Cliente[]> = {};
    const sinTelefono: Cliente[] = [];
    for (const c of filtrados) {
      const tel = (c.telefono || "").replace(/\D/g, "");
      if (!tel) { sinTelefono.push(c); continue; }
      (grupos[tel] ||= []).push(c);
    }
    const agrupados = Object.values(grupos).map((fichas) => ({ representante: fichas[0], fichas }));
    return [...agrupados, ...sinTelefono.map((c) => ({ representante: c, fichas: [c] }))];
  }, [filtrados]);

  const enviadosHoy = useMemo(() => {
    const hoyStr = new Date().toDateString();
    return recontactos.filter((r) => new Date(r.enviado_en).toDateString() === hoyStr).length;
  }, [recontactos]);

  const nuncaContactados = filtrados.filter((c) => !ultimoRecontactoPorCliente[c.id]).length;
  const buscanAuto = filtrados.filter((c) => (c.segmento || "consulta_general") === "busca_auto").length;
  const quierenVender = filtrados.filter((c) => c.segmento === "quiere_vender").length;

  const recontactadosFiltrados = useMemo(() => {
    let lista = resultadoFiltro ? recontactos.filter((r) => r.resultado === resultadoFiltro) : recontactos;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((r) => [r.cliente?.nombre, r.cliente?.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [recontactos, resultadoFiltro, query]);

  const contadoresResultado = useMemo(() => {
    const acc: Record<string, number> = { quiere_avanzar: 0, pendiente: 0, no_interesa: 0, pidio_baja: 0 };
    recontactos.forEach((r) => { acc[r.resultado] = (acc[r.resultado] || 0) + 1; });
    return acc;
  }, [recontactos]);

  const mandarRecontacto = async (c: Cliente) => {
    const tel = (c.telefono || "").replace(/\D/g, "");
    if (!tel) return alert("Este cliente no tiene teléfono cargado.");
    const segmento = segmentosLocal[c.id] || c.segmento || "consulta_general";
    const { texto } = armarMensaje(c, segmento, config, miNombre);
    setEnviando(c.id);
    try {
      const plazoMeses = config?.plazo_recontacto_meses || 4;
      const disponibleDesde = new Date();
      disponibleDesde.setMonth(disponibleDesde.getMonth() + plazoMeses);
      const { data, error } = await supabase2
        .from("recontactos")
        .insert({
          cliente_id: c.id,
          segmento_usado: segmento,
          mensaje_usado: texto,
          vendedor_id: miId || null,
          disponible_desde: disponibleDesde.toISOString().slice(0, 10),
        })
        .select("*, cliente:cliente_id ( nombre, telefono ), vendedor:vendedor_id ( nombre )")
        .single();
      if (error) throw error;
      setRecontactos((prev) => [data as any, ...prev]);
      if (config?.asignar_al_enviar) {
        setClientes((prev) => prev.map((x) => (x.id === c.id && !x.vendedor_id ? { ...x, vendedor_id: miId } : x)));
      }
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar el recontacto.");
    } finally {
      setEnviando(null);
    }
  };

  const marcarNoContactar = async (c: Cliente) => {
    if (!confirm(`¿Marcar a ${c.nombre} como "no contactar"? No va a recibir más mensajes de ninguna campaña.`)) return;
    const { error } = await supabase2.from("clientes").update({ no_contactar: true }).eq("id", c.id);
    if (!error) setClientes((prev) => prev.filter((x) => x.id !== c.id));
  };

  const cambiarSegmento = (c: Cliente, segmento: string) => {
    setSegmentosLocal((prev) => ({ ...prev, [c.id]: segmento }));
    supabase2.from("clientes").update({ segmento }).eq("id", c.id).then(() => {
      setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, segmento } : x)));
    });
  };

  const marcarResultado = async (r: Recontacto, resultado: string) => {
    const { error } = await supabase2
      .from("recontactos")
      .update({ resultado, resultado_en: new Date().toISOString(), resultado_por: miId || null })
      .eq("id", r.id);
    if (!error) {
      setRecontactos((prev) => prev.map((x) => (x.id === r.id ? { ...x, resultado, resultado_en: new Date().toISOString(), resultado_por: miId } : x)));
      // Los triggers de la DB ya corrieron (auto-asignación / no_contactar) —
      // se refleja acá mismo para no depender de un refresh completo.
      if (resultado === "quiere_avanzar") {
        setClientes((prev) => prev.map((c) => (c.id === r.cliente_id && !c.vendedor_id ? { ...c, vendedor_id: r.vendedor_id } : c)));
      } else if (resultado === "pidio_baja") {
        setClientes((prev) => prev.map((c) => (c.id === r.cliente_id ? { ...c, no_contactar: true } : c)));
      }
      router.refresh();
    }
  };

  const deshacerRecontacto = async (r: Recontacto) => {
    if (!confirm(`¿Deshacer este recontacto a ${r.cliente?.nombre}? Vuelve a estar disponible.`)) return;
    const { error } = await supabase2.from("recontactos").delete().eq("id", r.id);
    if (!error) setRecontactos((prev) => prev.filter((x) => x.id !== r.id));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
              <UserSearch className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Recontactos</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gente que consultó hace {plazoFiltro}+ meses y nunca compró. A los que ya compraron los ves en Postventa y Dormidos — acá están los que no vuelve a mirar nadie.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Para recontactar</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filtrados.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{plazoFiltro}+ meses sin hablar</p>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Con filtro</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filtrados.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">nunca contactados: {nuncaContactados}</p>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-500/[0.04] border border-purple-100 dark:border-purple-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscan auto</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{buscanAuto}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">quieren vender: {quierenVender}</p>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enviados hoy</p>
              <p className={`text-2xl font-black mt-1 ${enviadosHoy > 30 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>{enviadosHoy}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">sugerido hasta 30 por día</p>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-4 border-b border-slate-200 dark:border-white/10">
            <button onClick={() => setTab("para")} className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "para" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Para recontactar ({filtrados.length})</button>
            <button onClick={() => setTab("recontactados")} className={`px-3 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "recontactados" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>Ya recontactados ({recontactos.length})</button>
          </div>

          {tab === "para" ? (
            <>
              <div className="flex flex-wrap items-end gap-3 mb-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Sin contacto hace</label>
                  <select value={plazoFiltro} onChange={(e) => setPlazoFiltro(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {[3, 4, 6, 9, 12].map((m) => <option key={m} value={m}>{m} meses</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Segmento</label>
                  <select value={segmentoFiltro} onChange={(e) => setSegmentoFiltro(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <option value="">Todos</option>
                    {SEGMENTOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                {esAdmin && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Vendedor</label>
                    <select value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <option value="">Todos</option>
                      {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre, teléfono o vehículo" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 pb-2 cursor-pointer">
                  <input type="checkbox" checked={ocultarYaContactados} onChange={(e) => setOcultarYaContactados(e.target.checked)} className="w-4 h-4 accent-rose-600" /> Ocultar ya contactados
                </label>
              </div>

              {filtradosAgrupados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <UserSearch className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Nadie para recontactar</h3>
                  <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">No hay clientes sin compra con {plazoFiltro}+ meses sin contacto que cumplan los filtros. Probá bajando el mínimo de meses.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtradosAgrupados.map(({ representante: c, fichas }) => {
                    const segmento = segmentosLocal[c.id] || c.segmento || "consulta_general";
                    const seg = SEGMENTO_MAP[segmento];
                    const { texto, esGenerico } = armarMensaje(c, segmento, config, miNombre);
                    const SegIcon = seg.icon;
                    return (
                      <div key={c.id} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{c.nombre}</p>
                              {fichas.length > 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{fichas.length} fichas</span>}
                              {esGenerico && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-500/20">Mensaje general</span>}
                              <span className="text-[11px] text-slate-400">{c.telefono || "sin teléfono"}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 whitespace-pre-wrap">{texto}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <select value={segmento} onChange={(e) => cambiarSegmento(c, e.target.value)} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${seg.color}`}>
                              {SEGMENTOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <button onClick={() => marcarNoContactar(c)} title="No contactar más" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg"><Ban className="w-4 h-4" /></button>
                            <button onClick={() => mandarRecontacto(c)} disabled={enviando === c.id || !c.telefono} title="Mandar por WhatsApp" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {RESULTADOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setResultadoFiltro((prev) => (prev === r.value ? "" : r.value))}
                    className={`text-left rounded-2xl p-4 border transition-colors ${resultadoFiltro === r.value ? r.color : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5"}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{contadoresResultado[r.value] || 0}</p>
                  </button>
                ))}
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre, teléfono o vehículo" className="w-full max-w-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>

              {recontactadosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
                  <Send className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Todavía no recontactaste a nadie</h3>
                  <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">Cuando mandes el primero desde la otra pestaña, acá queda el registro con la fecha en la que vuelve a estar disponible.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02]">
                  {recontactadosFiltrados.map((r) => {
                    const cliente = clientes.find((c) => c.id === r.cliente_id);
                    const seg = SEGMENTO_MAP[r.segmento_usado] || SEGMENTO_MAP.consulta_general;
                    const resultado = RESULTADOS.find((x) => x.value === r.resultado)!;
                    return (
                      <div key={r.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{r.cliente?.nombre || "Cliente eliminado"}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${seg.color}`}>{seg.label}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${resultado.color}`}>{resultado.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Enviado {new Date(r.enviado_en).toLocaleDateString("es-AR")} por {r.vendedor?.nombre || "—"} · Disponible de nuevo el {new Date(r.disponible_desde).toLocaleDateString("es-AR")}
                            </p>
                            {r.resultado === "quiere_avanzar" && (
                              cliente?.vendedor_id
                                ? <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Asignado a {perfilMap[cliente.vendedor_id] || "—"}</p>
                                : <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Sin vendedor asignado</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => marcarResultado(r, "quiere_avanzar")} title="Quiere avanzar" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-emerald-600 hover:text-white text-slate-400 rounded-lg"><ThumbsUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => marcarResultado(r, "no_interesa")} title="No le interesa" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-amber-500 hover:text-white text-slate-400 rounded-lg"><ThumbsDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => marcarResultado(r, "pidio_baja")} title="Pidió baja" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg"><Ban className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deshacerRecontacto(r)} title="Deshacer" className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 rounded-lg"><Undo2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

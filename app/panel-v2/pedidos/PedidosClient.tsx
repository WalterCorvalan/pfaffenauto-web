"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Search, Clock, MessageSquareText, Filter, Plus, Star, CheckCircle2, Sparkles, RefreshCw, FlagOff, Flag, X } from "lucide-react";
import NuevoPedidoModal from "./NuevoPedidoModal";

const ESTADO_LABEL: Record<string, string> = { activo: "Activo", cumplido: "Cumplido", cancelado: "Cancelado" };
const ESTADO_STYLES: Record<string, string> = {
  activo: "bg-blue-500 text-white border-blue-500",
  cumplido: "bg-emerald-500 text-white border-emerald-500",
  cancelado: "bg-rose-500 text-white border-rose-500",
};
const ESTADO_BORDER: Record<string, string> = {
  activo: "border-t-blue-400",
  cumplido: "border-t-emerald-400",
  cancelado: "border-t-rose-400",
};
const TIPO_LABEL: Record<string, string> = { avisame: "Avisame", busqueda: "Búsqueda" };

function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Number(n).toLocaleString("es-AR")}` : `${moneda} ${Number(n).toLocaleString("es-AR")}`;
}

export default function PedidosClient({ pedidosIniciales, vendedores, clientes, vehiculosStock, miId }: { pedidosIniciales: any[]; vendedores: any[]; clientes: any[]; vehiculosStock: any[]; miId: string }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtroEstado, setFiltroEstado] = useState("activo");
  const [query, setQuery] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState<any | null>(null);
  const [reconfirmando, setReconfirmando] = useState<any | null>(null);
  const [notaReconfirmacion, setNotaReconfirmacion] = useState("");
  const [guardandoReconfirmacion, setGuardandoReconfirmacion] = useState(false);
  const [matcheando, setMatcheando] = useState<any | null>(null);

  const counts = useMemo(() => ({
    activo: pedidos.filter((p) => p.estado === "activo").length,
    cumplido: pedidos.filter((p) => p.estado === "cumplido").length,
    cancelado: pedidos.filter((p) => p.estado === "cancelado").length,
    todos: pedidos.length,
  }), [pedidos]);

  const filtrados = useMemo(() => {
    let lista = filtroEstado === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtroEstado);
    if (soloMios) lista = lista.filter((p) => p.vendedor_id === miId);
    else if (vendedorFiltro) lista = lista.filter((p) => p.vendedor_id === vendedorFiltro);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((p) => [p.nombre_cliente, p.marca, p.modelo, p.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [pedidos, filtroEstado, query, vendedorFiltro, soloMios, miId]);

  const actualizarUno = (p: any) => {
    if (p._eliminado) { setPedidos((prev) => prev.filter((x) => x.id !== p.id)); return; }
    setPedidos((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)) : [p, ...prev]));
  };

  const cambiarEstado = async (id: string, estado: string) => {
    actualizarUno({ id, estado });
    const { error } = await supabase2.from("pedidos").update({ estado }).eq("id", id);
    if (error) { alert("No se pudo actualizar el estado."); router.refresh(); }
  };

  const confirmarContacto = async (p: any) => {
    const ahora = new Date().toISOString();
    actualizarUno({ id: p.id, contacto_confirmado_at: ahora, ultima_reconfirmacion_at: ahora });
    const { error } = await supabase2.from("pedidos").update({ contacto_confirmado_at: ahora, ultima_reconfirmacion_at: ahora }).eq("id", p.id);
    if (error) alert("No se pudo confirmar el contacto.");
  };

  const toggleReservaSenada = async (p: any) => {
    const nuevo = !p.reserva_senada;
    actualizarUno({ id: p.id, reserva_senada: nuevo });
    const { error } = await supabase2.from("pedidos").update({ reserva_senada: nuevo }).eq("id", p.id);
    if (error) { alert("No se pudo actualizar."); actualizarUno({ id: p.id, reserva_senada: !nuevo }); }
  };

  const toggleGestionFinalizada = async (p: any) => {
    const nuevo = !p.gestion_finalizada;
    actualizarUno({ id: p.id, gestion_finalizada: nuevo });
    const { error } = await supabase2.from("pedidos").update({ gestion_finalizada: nuevo }).eq("id", p.id);
    if (error) { alert("No se pudo actualizar."); actualizarUno({ id: p.id, gestion_finalizada: !nuevo }); }
  };

  const abrirReconfirmar = (p: any) => { setReconfirmando(p); setNotaReconfirmacion(""); };
  const guardarReconfirmacion = async () => {
    if (!reconfirmando) return;
    setGuardandoReconfirmacion(true);
    try {
      const { error: err1 } = await supabase2.from("pedidos_reconfirmaciones").insert({ pedido_id: reconfirmando.id, nota: notaReconfirmacion || null, autor_id: miId });
      if (err1) throw err1;
      const ahora = new Date().toISOString();
      const { error: err2 } = await supabase2.from("pedidos").update({ ultima_reconfirmacion_at: ahora }).eq("id", reconfirmando.id);
      if (err2) throw err2;
      actualizarUno({ id: reconfirmando.id, ultima_reconfirmacion_at: ahora });
      setReconfirmando(null);
    } catch {
      alert("No se pudo guardar la reconfirmación.");
    } finally {
      setGuardandoReconfirmacion(false);
    }
  };

  const asignarMatchManual = async (p: any, vehiculoId: string) => {
    const vehiculo = vehiculosStock.find((v) => v.id === vehiculoId) || null;
    actualizarUno({ id: p.id, vehiculo_match_id: vehiculoId || null, vehiculo_match: vehiculo, match_detectado_at: vehiculoId ? new Date().toISOString() : null });
    const { error } = await supabase2.from("pedidos").update({ vehiculo_match_id: vehiculoId || null, match_detectado_at: vehiculoId ? new Date().toISOString() : null }).eq("id", p.id);
    if (error) alert("No se pudo vincular el vehículo.");
    setMatcheando(null);
  };

  const abrirNuevo = () => { setPedidoAEditar(null); setModalAbierto(true); };
  const abrirEdicion = (p: any) => { setPedidoAEditar(p); setModalAbierto(true); };

  const busquedaTexto = (p: any) => [p.marca, p.modelo, p.anio_desde || p.anio_hasta ? `(${p.anio_desde ?? ""}${p.anio_desde && p.anio_hasta ? "-" : ""}${p.anio_hasta ?? ""})` : "", p.color_preferido].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Pedidos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Búsqueda de vehículos específicos para clientes</p>
          </div>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Nuevo pedido
        </button>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-6 pt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, marca, modelo..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0 hidden md:block" />
          {["activo", "cumplido", "cancelado", "todos"].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${filtroEstado === est ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              {est === "todos" ? "Todos" : ESTADO_LABEL[est]}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtroEstado === est ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{counts[est as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 pt-2 flex-wrap">
        <button
          onClick={() => setSoloMios((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${soloMios ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"}`}
        >
          Solo míos
        </button>
        <select
          value={vendedorFiltro}
          onChange={(e) => { setVendedorFiltro(e.target.value); setSoloMios(false); }}
          disabled={soloMios}
          className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold outline-none disabled:opacity-50 text-slate-600 dark:text-slate-300"
        >
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#141414]">
        {filtrados.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin pedidos</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Con este filtro no se encontraron resultados.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vehículo buscado</th>
                    <th className="px-4 py-3">Presupuesto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 w-px"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filtrados.map((p) => {
                    const tieneMatch = p.vehiculo_match_id && p.estado === "activo";
                    const sinConfirmar = p.estado === "activo" && !p.contacto_confirmado_at;
                    return (
                      <tr key={p.id} onClick={() => abrirEdicion(p)} className="hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">{(p.nombre_cliente || "?").substring(0, 2).toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">{p.nombre_cliente} {p.wishlist && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}</p>
                              <button onClick={(e) => { e.stopPropagation(); toggleReservaSenada(p); }} className={`text-[10px] font-bold ${p.reserva_senada ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600 hover:text-indigo-500"}`}>
                                💰 {p.reserva_senada ? "Señada" : "Marcar señada"}
                              </button>
                              {p.gestion_finalizada && <p className="text-[10px] font-bold text-slate-400">🏁 Gestión finalizada</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 font-medium">{busquedaTexto(p) || "—"}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{p.presupuesto_max ? fmtMoneda(p.presupuesto_max, p.moneda) : "—"}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{TIPO_LABEL[p.tipo] || p.tipo}</span></td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {tieneMatch ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded-full">
                              <Sparkles className="w-3 h-3" /> {p.vehiculo_match?.marca} {p.vehiculo_match?.modelo}
                              <button onClick={() => asignarMatchManual(p, "")} title="Quitar match" className="ml-0.5 hover:text-rose-600"><X className="w-3 h-3" /></button>
                            </span>
                          ) : (
                            <button onClick={() => setMatcheando(p)} className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Match manual
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.estado}
                            onChange={(e) => cambiarEstado(p.id, e.target.value)}
                            className={`text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${ESTADO_STYLES[p.estado]}`}
                          >
                            <option value="activo" className="bg-white text-slate-900">Activo</option>
                            <option value="cumplido" className="bg-white text-slate-900">Cumplido</option>
                            <option value="cancelado" className="bg-white text-slate-900">Cancelado</option>
                          </select>
                          {sinConfirmar && (
                            <button onClick={(e) => { e.stopPropagation(); confirmarContacto(p); }} className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline">
                              <CheckCircle2 className="w-3 h-3" /> Confirmé contacto
                            </button>
                          )}
                          {p.estado === "activo" && !p.gestion_finalizada && (
                            <button onClick={(e) => { e.stopPropagation(); abrirReconfirmar(p); }} className="mt-1 flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-400 hover:underline">
                              <RefreshCw className="w-3 h-3" /> Reconfirmar
                            </button>
                          )}
                          {p.estado === "activo" && (
                            <button onClick={(e) => { e.stopPropagation(); toggleGestionFinalizada(p); }} className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                              {p.gestion_finalizada ? <><FlagOff className="w-3 h-3" /> Reabrir gestión</> : <><Flag className="w-3 h-3" /> Finalizar gestión</>}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 w-px" onClick={(e) => e.stopPropagation()}>
                          {p.telefono && (
                            <a
                              href={`https://wa.me/${p.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${p.nombre_cliente}! Te contactamos de Pfaffen Autos respecto a tu búsqueda: ${busquedaTexto(p)}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-md transition-colors inline-flex"
                              title="Contactar por WhatsApp"
                            >
                              <MessageSquareText className="w-4 h-4" strokeWidth={2.5} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalAbierto && (
        <NuevoPedidoModal
          pedido={pedidoAEditar}
          vendedores={vendedores}
          clientes={clientes}
          miId={miId}
          onClose={() => setModalAbierto(false)}
          onGuardado={(p) => { actualizarUno(p); setModalAbierto(false); }}
        />
      )}

      {reconfirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardandoReconfirmacion && setReconfirmando(null)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Reconfirmar gestión</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{reconfirmando.nombre_cliente} — reinicia el plazo de aviso.</p>
            <textarea value={notaReconfirmacion} onChange={(e) => setNotaReconfirmacion(e.target.value)} rows={3} placeholder="Nota (opcional)" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setReconfirmando(null)} disabled={guardandoReconfirmacion} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl disabled:opacity-50">Cancelar</button>
              <button onClick={guardarReconfirmacion} disabled={guardandoReconfirmacion} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">{guardandoReconfirmacion ? "Guardando..." : "Reconfirmar"}</button>
            </div>
          </div>
        </div>
      )}

      {matcheando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMatcheando(null)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Match manual</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Vincular un vehículo del stock a este pedido de {matcheando.nombre_cliente}.</p>
            <select onChange={(e) => e.target.value && asignarMatchManual(matcheando, e.target.value)} defaultValue="" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500">
              <option value="">— Elegir vehículo —</option>
              {vehiculosStock.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio} — {v.moneda_venta} {Number(v.precio_venta).toLocaleString("es-AR")}</option>)}
            </select>
            <div className="flex justify-end mt-4">
              <button onClick={() => setMatcheando(null)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Search, Clock, MessageSquareText, CarFront, Filter, Plus, Star, CheckCircle2, Sparkles } from "lucide-react";
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

export default function PedidosClient({ pedidosIniciales, vendedores, clientes, miId }: { pedidosIniciales: any[]; vendedores: any[]; clientes: any[]; miId: string }) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtroEstado, setFiltroEstado] = useState("activo");
  const [query, setQuery] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState<any | null>(null);

  const counts = useMemo(() => ({
    activo: pedidos.filter((p) => p.estado === "activo").length,
    cumplido: pedidos.filter((p) => p.estado === "cumplido").length,
    cancelado: pedidos.filter((p) => p.estado === "cancelado").length,
    todos: pedidos.length,
  }), [pedidos]);

  const filtrados = useMemo(() => {
    let lista = filtroEstado === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtroEstado);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((p) => [p.nombre_cliente, p.marca, p.modelo, p.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [pedidos, filtroEstado, query]);

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

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#141414]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-[1800px] mx-auto">
          {filtrados.map((p) => {
            const tieneMatch = p.vehiculo_match_id && p.estado === "activo";
            const sinConfirmar = p.estado === "activo" && !p.contacto_confirmado_at;
            return (
              <div
                key={p.id}
                onClick={() => abrirEdicion(p)}
                className={`bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer ${ESTADO_BORDER[p.estado]}`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${ESTADO_STYLES[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{TIPO_LABEL[p.tipo] || p.tipo}</span>
                    {p.wishlist && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">{(p.nombre_cliente || "?").substring(0, 2).toUpperCase()}</div>
                  <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{p.nombre_cliente}</h3>
                </div>

                {tieneMatch && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-2.5 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      ¡Match! {p.vehiculo_match?.marca} {p.vehiculo_match?.modelo} {p.vehiculo_match?.anio}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-lg mb-3 flex-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 block mb-1 flex items-center gap-1"><CarFront className="w-3 h-3" /> Vehículo buscado</span>
                  <p className="text-[13px] font-semibold text-rose-700 dark:text-rose-400 leading-tight">{busquedaTexto(p) || "—"}</p>
                  {p.presupuesto_max && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Hasta {fmtMoneda(p.presupuesto_max, p.moneda)}</p>}
                </div>

                {p.reserva_senada && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-2">💰 Reserva señada</p>}
                {sinConfirmar && (
                  <button onClick={(e) => { e.stopPropagation(); confirmarContacto(p); }} className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg py-1.5 mb-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmé contacto
                  </button>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={p.estado}
                    onChange={(e) => cambiarEstado(p.id, e.target.value)}
                    className={`text-[11px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none cursor-pointer flex-1 border ${ESTADO_STYLES[p.estado]}`}
                  >
                    <option value="activo" className="bg-white text-slate-900">Activo</option>
                    <option value="cumplido" className="bg-white text-slate-900">Cumplido</option>
                    <option value="cancelado" className="bg-white text-slate-900">Cancelado</option>
                  </select>
                  {p.telefono && (
                    <a
                      href={`https://wa.me/${p.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${p.nombre_cliente}! Te contactamos de Pfaffen Autos respecto a tu búsqueda: ${busquedaTexto(p)}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-md transition-colors shrink-0"
                      title="Contactar por WhatsApp"
                    >
                      <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {filtrados.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin pedidos</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Con este filtro no se encontraron resultados.</p>
            </div>
          )}
        </div>
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
    </div>
  );
}

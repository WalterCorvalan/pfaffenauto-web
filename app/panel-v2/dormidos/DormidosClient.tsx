"use client";

import { useMemo, useState } from "react";
import { Moon, Crown, MessageCircle, X, Send } from "lucide-react";

interface Venta { cliente_id: string; fecha_cierre: string; precio_venta: number; moneda_venta: string; vehiculo_marca: string | null; vehiculo_modelo: string | null }
interface Cliente { id: string; nombre: string; telefono: string | null; vendedor_id: string | null }
interface Perfil { id: string; nombre: string; roles: string[] }

function mesesDesde(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}
function fmtPrecio(n: number, m: string) {
  return m === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${m} ${n.toLocaleString("es-AR")}`;
}

export default function DormidosClient({
  ventas, clientes, perfiles, plantilla, miId,
}: { ventas: Venta[]; clientes: Cliente[]; perfiles: Perfil[]; plantilla: string | null; miId: string }) {
  const [plazoFiltro, setPlazoFiltro] = useState("18");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [modalCampana, setModalCampana] = useState(false);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const clienteMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c])), [clientes]);
  const miNombre = perfilMap[miId] || "el equipo";
  const esAdmin = perfiles.find((p) => p.id === miId)?.roles?.includes("admin") ?? false;

  // Agrupa ventas cerradas por cliente: última compra, cantidad histórica.
  const dormidosBase = useMemo(() => {
    const porCliente: Record<string, Venta[]> = {};
    ventas.forEach((v) => { (porCliente[v.cliente_id] ||= []).push(v); });
    return Object.entries(porCliente).map(([clienteId, compras]) => {
      const ultima = compras[0]; // ya viene ordenado desc por fecha_cierre
      const cliente = clienteMap[clienteId];
      return {
        clienteId,
        nombre: cliente?.nombre || "Cliente eliminado",
        telefono: cliente?.telefono || null,
        vendedorId: cliente?.vendedor_id || null,
        ultimaFecha: ultima.fecha_cierre,
        marca: ultima.vehiculo_marca,
        modelo: ultima.vehiculo_modelo,
        precio: ultima.precio_venta,
        moneda: ultima.moneda_venta,
        cantidadCompras: compras.length,
        mesesDormido: Math.floor(mesesDesde(ultima.fecha_cierre)),
      };
    });
  }, [ventas, clienteMap]);

  const marcas = useMemo(() => Array.from(new Set(dormidosBase.map((d) => d.marca).filter(Boolean))).sort() as string[], [dormidosBase]);

  const elegibles = useMemo(() => dormidosBase.filter((d) => esAdmin || !d.vendedorId || d.vendedorId === miId), [dormidosBase, esAdmin, miId]);
  const totalDormidos = useMemo(() => elegibles.filter((d) => d.mesesDormido >= Number(plazoFiltro)).length, [elegibles, plazoFiltro]);

  const filtrados = useMemo(() => {
    let lista = elegibles.filter((d) => d.mesesDormido >= Number(plazoFiltro));
    if (marcaFiltro) lista = lista.filter((d) => d.marca === marcaFiltro);
    if (vendedorFiltro) lista = lista.filter((d) => d.vendedorId === vendedorFiltro);
    return lista.sort((a, b) => b.mesesDormido - a.mesesDormido);
  }, [elegibles, plazoFiltro, marcaFiltro, vendedorFiltro]);

  const conTelefono = filtrados.filter((d) => d.telefono);
  const vip = filtrados.filter((d) => d.cantidadCompras >= 2);
  const precioPromedioUsd = useMemo(() => {
    const usd = ventas.filter((v) => v.moneda_venta === "USD");
    if (!usd.length) return 6000;
    return Math.round(usd.reduce((acc, v) => acc + Number(v.precio_venta || 0), 0) / usd.length);
  }, [ventas]);
  const potencialRenovacion = Math.round(conTelefono.length * 0.15 * precioPromedioUsd);

  const armarMensaje = (d: typeof filtrados[number]) => {
    const vehiculo = [d.marca, d.modelo].filter(Boolean).join(" ") || "tu auto";
    const base = plantilla || "Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Vimos que tu {vehiculo} ya tiene un tiempo — ¿pensaste en renovar? Tenemos excelentes condiciones para vos.";
    return base.replaceAll("{nombre}", d.nombre).replaceAll("{vendedor}", miNombre).replaceAll("{vehiculo}", vehiculo);
  };

  const toggleSeleccion = (clienteId: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(clienteId) ? next.delete(clienteId) : next.add(clienteId);
      return next;
    });
  };
  const toggleTodos = () => {
    const idsConTelefono = conTelefono.map((d) => d.clienteId);
    const todosMarcados = idsConTelefono.every((id) => seleccionados.has(id)) && idsConTelefono.length > 0;
    setSeleccionados(todosMarcados ? new Set() : new Set(idsConTelefono));
  };

  const seleccionadosData = filtrados.filter((d) => seleccionados.has(d.clienteId));

  const colorFila = (meses: number) =>
    meses >= 30 ? "border-l-4 border-l-rose-500" : meses >= 24 ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-slate-300 dark:border-l-white/10";

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Clientes Dormidos</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clientes que compraron hace {plazoFiltro}+ meses y podrían estar listos para renovar.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total dormidos</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalDormidos}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">últimos {plazoFiltro}+ meses</p>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Con filtro</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filtrados.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">con teléfono: {conTelefono.length}</p>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-500/[0.04] border border-amber-100 dark:border-amber-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clientes VIP</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{vip.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">2+ compras históricas</p>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-500/[0.04] border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potencial renovación</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">USD {potencialRenovacion.toLocaleString("es-AR")}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">15% renueva × USD {precioPromedioUsd.toLocaleString("es-AR")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 mb-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Meses dormido (mín)</label>
              <select value={plazoFiltro} onChange={(e) => setPlazoFiltro(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {[12, 18, 24, 30, 36].map((m) => <option key={m} value={m}>{m} meses</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Marca</label>
              <select value={marcaFiltro} onChange={(e) => setMarcaFiltro(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <option value="">Todas</option>
                {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
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
            {seleccionados.size > 0 && (
              <button onClick={() => setModalCampana(true)} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">
                <Send className="w-3.5 h-3.5" /> Enviar campaña WhatsApp ({seleccionados.size})
              </button>
            )}
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <Moon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin clientes dormidos</h3>
              <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">No hay clientes con última compra hace {plazoFiltro}+ meses que cumplan los filtros.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                    <th className="px-4 py-3 w-px">
                      <input type="checkbox" checked={conTelefono.length > 0 && conTelefono.every((d) => seleccionados.has(d.clienteId))} onChange={toggleTodos} className="w-4 h-4 accent-rose-600" />
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Última compra</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Precio</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Dormido hace</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Vendedor</th>
                    <th className="px-4 py-3 w-px">WA</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((d) => (
                    <tr key={d.clienteId} className={`border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${colorFila(d.mesesDormido)}`}>
                      <td className="px-4 py-3">
                        {d.telefono && <input type="checkbox" checked={seleccionados.has(d.clienteId)} onChange={() => toggleSeleccion(d.clienteId)} className="w-4 h-4 accent-rose-600" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {d.cantidadCompras >= 2 && <span title="Cliente VIP"><Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" /></span>}
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{d.nombre}</p>
                        </div>
                        <p className={`text-[11px] ${d.telefono ? "text-slate-400" : "text-rose-500 font-semibold"}`}>{d.telefono || "sin teléfono"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{[d.marca, d.modelo].filter(Boolean).join(" ") || "—"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{fmtPrecio(d.precio, d.moneda)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className={`font-bold ${d.mesesDormido >= 30 ? "text-rose-600 dark:text-rose-400" : d.mesesDormido >= 24 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>{d.mesesDormido}m</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{d.vendedorId ? perfilMap[d.vendedorId] || "—" : "Sin asignar"}</td>
                      <td className="px-4 py-3 w-px">
                        {d.telefono && (
                          <a
                            href={`https://wa.me/${d.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(armarMensaje(d))}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Mandar WhatsApp"
                            className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-emerald-600 hover:text-white text-slate-400 rounded-lg inline-flex"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalCampana && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalCampana(false)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaña WhatsApp ({seleccionadosData.length})</h3>
              <button onClick={() => setModalCampana(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">El navegador no deja abrir varios WhatsApp de un solo click — tocá cada uno.</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {seleccionadosData.map((d) => (
                <div key={d.clienteId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{d.nombre}</p>
                    <p className="text-[11px] text-slate-400 truncate">{armarMensaje(d)}</p>
                  </div>
                  <a
                    href={`https://wa.me/${(d.telefono || "").replace(/\D/g, "")}?text=${encodeURIComponent(armarMensaje(d))}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setSeleccionados((prev) => { const n = new Set(prev); n.delete(d.clienteId); return n; })}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Mandar
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

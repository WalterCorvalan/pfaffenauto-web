"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, Trash2, History } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";

export default function NuevoPedidoModal({ pedido, vendedores, clientes, miId, onClose, onGuardado }: { pedido?: any; vendedores: any[]; clientes: any[]; miId: string; onClose: () => void; onGuardado: (p: any) => void }) {
  const isEditing = !!pedido?.id;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState(pedido?.cliente_id || "");
  const [nombreCliente, setNombreCliente] = useState(pedido?.nombre_cliente || "");
  const [telefono, setTelefono] = useState(pedido?.telefono || "");
  const [tipo, setTipo] = useState(pedido?.tipo || "avisame");
  const [marca, setMarca] = useState(pedido?.marca || "");
  const [modelo, setModelo] = useState(pedido?.modelo || "");
  const [anioDesde, setAnioDesde] = useState(pedido?.anio_desde ? String(pedido.anio_desde) : "");
  const [anioHasta, setAnioHasta] = useState(pedido?.anio_hasta ? String(pedido.anio_hasta) : "");
  const [presupuestoMax, setPresupuestoMax] = useState(pedido?.presupuesto_max ? String(pedido.presupuesto_max) : "");
  const [moneda, setMoneda] = useState(pedido?.moneda || "USD");
  const [colorPreferido, setColorPreferido] = useState(pedido?.color_preferido || "");
  const [vendedorId, setVendedorId] = useState(pedido?.vendedor_id || miId || "");
  const [wishlist, setWishlist] = useState(pedido?.wishlist || false);
  const [reservaSenada, setReservaSenada] = useState(pedido?.reserva_senada || false);
  const [notas, setNotas] = useState(pedido?.notas || "");
  const [reconfirmaciones, setReconfirmaciones] = useState<any[]>([]);

  useEffect(() => {
    if (!isEditing) return;
    supabase2.from("pedidos_reconfirmaciones").select("*, autor:perfiles(nombre)").eq("pedido_id", pedido.id).order("created_at", { ascending: false })
      .then(({ data }) => setReconfirmaciones(data || []));
  }, [isEditing, pedido?.id]);

  const elegirCliente = (id: string) => {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) { setNombreCliente(c.nombre); setTelefono(c.telefono || ""); }
  };

  const guardar = async () => {
    if (!nombreCliente.trim() || !marca.trim()) {
      setError("Completá al menos el nombre del cliente y la marca buscada.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const payload = {
        cliente_id: clienteId || null,
        nombre_cliente: nombreCliente.trim(),
        telefono: telefono || null,
        tipo,
        marca: marca.trim(),
        modelo: modelo || null,
        anio_desde: anioDesde ? Number(anioDesde) : null,
        anio_hasta: anioHasta ? Number(anioHasta) : null,
        presupuesto_max: presupuestoMax ? Number(presupuestoMax) : null,
        moneda,
        color_preferido: colorPreferido || null,
        vendedor_id: vendedorId || null,
        wishlist,
        reserva_senada: reservaSenada,
        notas: notas || null,
      };
      const { data, error: err } = isEditing
        ? await supabase2.from("pedidos").update(payload).eq("id", pedido.id).select("*, vehiculo_match:vehiculo_match_id ( marca, modelo, anio, precio_venta, moneda_venta )").single()
        : await supabase2.from("pedidos").insert({ ...payload, estado: "activo", origen: "manual" }).select("*, vehiculo_match:vehiculo_match_id ( marca, modelo, anio, precio_venta, moneda_venta )").single();
      if (err) throw err;
      onGuardado(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo guardar el pedido.");
    } finally {
      setCargando(false);
    }
  };

  const borrar = async () => {
    if (!confirm(`¿Eliminar el pedido de ${pedido.nombre_cliente}?`)) return;
    setCargando(true);
    try {
      const { error: err } = await supabase2.from("pedidos").delete().eq("id", pedido.id);
      if (err) throw err;
      onGuardado({ ...pedido, _eliminado: true });
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el pedido.");
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isEditing ? "Editar pedido" : "Nuevo pedido"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          {error && <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Cliente existente (opcional)</label>
              <select value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="">— Cargar nombre a mano —</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Nombre del cliente *</label><input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Teléfono</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} /></div>
          </div>

          <div>
            <label className={labelClass}>Tipo de pedido</label>
            <div className="flex gap-2">
              {[{ v: "avisame", l: "Avisame" }, { v: "busqueda", l: "Búsqueda activa" }].map((t) => (
                <button key={t.v} type="button" onClick={() => setTipo(t.v)} className={`flex-1 text-sm font-bold px-3 py-2 rounded-xl border transition-colors ${tipo === t.v ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"}`}>{t.l}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Vehículo buscado</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Marca *</label><input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className={labelClass}>Año desde</label><input type="number" value={anioDesde} onChange={(e) => setAnioDesde(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Año hasta</label><input type="number" value={anioHasta} onChange={(e) => setAnioHasta(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="mt-3"><label className={labelClass}>Color preferido</label><input value={colorPreferido} onChange={(e) => setColorPreferido(e.target.value)} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className={labelClass}>Presupuesto máx.</label><input type="number" value={presupuestoMax} onChange={(e) => setPresupuestoMax(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={`${inputClass} cursor-pointer`}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Vendedor asignado</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">— Sin asignar —</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={wishlist} onChange={(e) => setWishlist(e.target.checked)} className="w-4 h-4 rounded accent-rose-600" /> Wishlist
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={reservaSenada} onChange={(e) => setReservaSenada(e.target.checked)} className="w-4 h-4 rounded accent-rose-600" /> Reserva señada
            </label>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className={inputClass} />
          </div>

          {isEditing && reconfirmaciones.length > 0 && (
            <div>
              <p className={labelClass + " flex items-center gap-1.5"}><History className="w-3.5 h-3.5" /> Historial de reconfirmaciones</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {reconfirmaciones.map((r) => (
                  <div key={r.id} className="bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center justify-between"><span className="font-bold">{r.autor?.nombre || "—"}</span><span className="text-slate-400">{new Date(r.created_at).toLocaleString("es-AR")}</span></div>
                    {r.nota && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{r.nota}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          {isEditing && (
            <button onClick={borrar} disabled={cargando} className="mr-auto p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50" title="Eliminar pedido">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} disabled={cargando} className={`px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 ${!isEditing && "ml-auto"}`}>Cancelar</button>
          <button onClick={guardar} disabled={cargando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {cargando ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}

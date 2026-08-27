"use client";

import { useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Car, Search, X, MessageCircle, Gauge, Calendar, MapPin } from "lucide-react";

interface Vehiculo {
  id: string; categoria: string; marca: string; modelo: string; anio: number; color: string | null; condicion: string;
  km: number | null; precio_venta: number; moneda_venta: string; ubicacion: string; fotos: string[]; version: string | null;
  combustible: string | null; transmision: string | null; carroceria: string | null;
}

const WHATSAPP_AGENCIA = "5491100000000"; // TODO: reemplazar por el número real de la agencia cuando esté en Configuración.

function fmtPrecio(v: Vehiculo, mostrarPrecios: boolean) {
  if (!mostrarPrecios) return "Consultar";
  return `${v.moneda_venta} ${v.precio_venta.toLocaleString("es-AR")}`;
}

export default function CatalogoClient({ vehiculos, mostrarPrecios }: { vehiculos: Vehiculo[]; mostrarPrecios: boolean }) {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [seleccionado, setSeleccionado] = useState<Vehiculo | null>(null);

  const categorias = useMemo(() => Array.from(new Set(vehiculos.map((v) => v.categoria))).sort(), [vehiculos]);

  const filtrados = useMemo(() => {
    let lista = vehiculos;
    if (categoria) lista = lista.filter((v) => v.categoria === categoria);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((v) => `${v.marca} ${v.modelo} ${v.anio}`.toLowerCase().includes(q));
    }
    return lista;
  }, [vehiculos, categoria, query]);

  const abrirFicha = async (v: Vehiculo) => {
    setSeleccionado(v);
    await supabase2.rpc("incrementar_stat_catalogo", { campo: "ficha" });
  };

  const consultarWhatsapp = async (v: Vehiculo) => {
    await supabase2.rpc("incrementar_stat_catalogo", { campo: "whatsapp" });
    const texto = encodeURIComponent(`Hola! Me interesa el ${v.marca} ${v.modelo} ${v.anio} que vi en el catálogo.`);
    window.open(`https://wa.me/${WHATSAPP_AGENCIA}?text=${texto}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0"><Car className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-black leading-none">Pfaffen Autos</p>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">{vehiculos.length} vehículos disponibles</p>
            </div>
          </div>
          <a href={`https://wa.me/${WHATSAPP_AGENCIA}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar marca, modelo, año..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-500 placeholder:text-slate-400" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setCategoria("")} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${!categoria ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>Todos</button>
            {categorias.map((c) => (
              <button key={c} onClick={() => setCategoria(c)} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${categoria === c ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>{c}</button>
            ))}
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-1">Sin resultados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Probá con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((v) => (
              <button key={v.id} onClick={() => abrirFicha(v)} className="text-left bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  {v.fotos?.[0] ? <img src={v.fotos[0]} alt={`${v.marca} ${v.modelo}`} className="w-full h-full object-cover" /> : <Car className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{v.marca} {v.modelo}</p>
                  <p className="text-[11px] text-slate-400 mb-2">{v.anio} · {v.km?.toLocaleString("es-AR") ?? "—"} km · {v.condicion}</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400">{fmtPrecio(v, mostrarPrecios)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {seleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSeleccionado(null)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 flex items-center justify-center relative">
              {seleccionado.fotos?.[0] ? <img src={seleccionado.fotos[0]} alt="" className="w-full h-full object-cover" /> : <Car className="w-14 h-14 text-slate-300 dark:text-slate-600" />}
              <button onClick={() => setSeleccionado(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 dark:bg-black/60 text-slate-600 dark:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{seleccionado.marca} {seleccionado.modelo}{seleccionado.version ? ` ${seleccionado.version}` : ""}</h3>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 mb-4">{fmtPrecio(seleccionado, mostrarPrecios)}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Calendar className="w-3.5 h-3.5" /> {seleccionado.anio}</span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Gauge className="w-3.5 h-3.5" /> {seleccionado.km?.toLocaleString("es-AR") ?? "—"} km</span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><MapPin className="w-3.5 h-3.5" /> {seleccionado.ubicacion}</span>
                <span className="text-slate-500 dark:text-slate-400">{seleccionado.condicion}</span>
                {seleccionado.combustible && <span className="text-slate-500 dark:text-slate-400">{seleccionado.combustible}</span>}
                {seleccionado.transmision && <span className="text-slate-500 dark:text-slate-400">{seleccionado.transmision}</span>}
              </div>
              <button onClick={() => consultarWhatsapp(seleccionado)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold">
                <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Search, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import ConfirmDialog from "@/components/panel/ConfirmDialog";

type Tipo = "ventas" | "expedientes" | "clientes" | "taller_ordenes";

const TABS: { value: Tipo; label: string }[] = [
  { value: "ventas", label: "Ventas" },
  { value: "expedientes", label: "Expedientes" },
  { value: "clientes", label: "Clientes" },
  { value: "taller_ordenes", label: "Órdenes de taller" },
];

// Antes de agregar un tipo nuevo acá, dale su propio flujo de "eliminar"
// primero (ver ARCHITECTURE.md) -- taller_ordenes ya tiene las columnas de
// borrado lógico listas pero el módulo Taller todavía no tiene un botón
// de eliminar orden en ningún lado, así que esta pestaña va a quedar
// siempre vacía hasta que eso se construya.

function tiempoRelativo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type ItemPapelera = Record<string, string | number | null> & { id: string; deleted_at: string; deleted_by_nombre: string | null; motivo_eliminacion: string | null };

function titulo(tipo: Tipo, item: ItemPapelera): string {
  if (tipo === "ventas") return `${item.comprador_nombre || "Sin comprador"} — ${[item.vehiculo_marca, item.vehiculo_modelo, item.vehiculo_anio].filter(Boolean).join(" ") || "sin vehículo"}`;
  if (tipo === "expedientes") return String(item.titulo || "Expediente sin título");
  if (tipo === "clientes") return `${item.nombre || ""} ${item.apellido || ""}`.trim() || "Cliente sin nombre";
  return `${item.cliente_nombre || "Sin cliente"} — ${[item.marca, item.modelo].filter(Boolean).join(" ") || "sin vehículo"}`;
}

function subtitulo(tipo: Tipo, item: ItemPapelera): string {
  if (tipo === "ventas") return [item.vehiculo_patente, item.precio_venta ? `${item.moneda_venta} ${Number(item.precio_venta).toLocaleString("es-AR")}` : null].filter(Boolean).join(" · ") || "—";
  if (tipo === "expedientes") return String(item.tipo || "—");
  if (tipo === "clientes") return [item.dni_cuit ? `DNI ${item.dni_cuit}` : null, item.telefono].filter(Boolean).join(" · ") || "—";
  return String(item.patente || "—");
}

export default function PapeleraClient() {
  const [tab, setTab] = useState<Tipo>("ventas");
  const [items, setItems] = useState<ItemPapelera[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const cargarConteos = useCallback(async () => {
    const res = await fetch("/api/panel/papelera");
    const data = await res.json();
    if (res.ok) setConteos(data.conteos);
  }, []);

  const cargarItems = useCallback(async (t: Tipo) => {
    setCargando(true);
    const res = await fetch(`/api/panel/papelera?tipo=${t}`);
    const data = await res.json();
    if (res.ok) setItems(data.items);
    setCargando(false);
  }, []);

  useEffect(() => { cargarConteos(); }, [cargarConteos]);
  useEffect(() => { cargarItems(tab); }, [tab, cargarItems]);

  const filtrados = items.filter((i) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return [titulo(tab, i), i.motivo_eliminacion, i.deleted_by_nombre].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const restaurar = async (id: string) => {
    setOcupadoId(id);
    const res = await fetch("/api/panel/papelera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "restaurar", tipo: tab, id }) });
    setOcupadoId(null);
    if (!res.ok) { alert("No se pudo restaurar."); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    cargarConteos();
  };

  const eliminarDefinitivo = (id: string) => {
    setConfirmDialog({
      mensaje: "¿Eliminar definitivamente? Esto no se puede deshacer, ni siquiera desde acá.",
      accion: async () => {
        setOcupadoId(id);
        const res = await fetch("/api/panel/papelera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "eliminar_definitivo", tipo: tab, id }) });
        setOcupadoId(null);
        if (!res.ok) { alert("No se pudo eliminar."); return; }
        setItems((prev) => prev.filter((i) => i.id !== id));
        cargarConteos();
      },
    });
  };

  const tabLabel = TABS.find((t) => t.value === tab)?.label.toLowerCase() || "";

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-indigo-600" /> Papelera</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Docs eliminados de la empresa activa. Podés restaurarlos desde acá; no se borran solos.</p>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => setTab(t.value)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${tab === t.value ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
                {t.label} {conteos[t.value] > 0 && <span className={`px-1.5 rounded-full text-[10px] ${tab === t.value ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{conteos[t.value]}</span>}
              </button>
            ))}
          </div>

          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por título, motivo o quién borró..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400" />
          </div>

          {cargando ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <Trash2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No hay {tabLabel} en la papelera</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">Si borrás {tabLabel}, van a aparecer acá y vas a poder restaurarlas o eliminarlas definitivamente.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
              {filtrados.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{titulo(tab, item)}</p>
                    <p className="text-[11px] text-slate-400">{subtitulo(tab, item)}</p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      Eliminado por <span className="font-semibold text-slate-600 dark:text-slate-300">{item.deleted_by_nombre || "—"}</span>, hace {tiempoRelativo(item.deleted_at)}
                      {item.motivo_eliminacion && <> — {item.motivo_eliminacion}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => restaurar(item.id)} disabled={ocupadoId === item.id} title="Restaurar" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50">
                      {ocupadoId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Restaurar
                    </button>
                    <button onClick={() => eliminarDefinitivo(item.id)} disabled={ocupadoId === item.id} title="Eliminar definitivamente" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        abierto={!!confirmDialog}
        mensaje={confirmDialog?.mensaje || ""}
        onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }}
        onCancelar={() => setConfirmDialog(null)}
      />
    </div>
  );
}

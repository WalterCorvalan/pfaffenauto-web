"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Landmark, Car, AlertTriangle, CheckCircle2, Clock, Filter } from "lucide-react";

interface Financiacion {
  id: string;
  venta_id: string;
  tipo: string | null;
  entidad: string | null;
  monto: number | null;
  cuotas: number | null;
  fecha_vencimiento: string | null;
  estado: string | null;
  created_at: string;
  boleto: {
    nombre: string | null;
    apellido: string | null;
    marca: string | null;
    modelo: string | null;
    dominio: string | null;
  } | null;
}

const ESTADOS = ["Pendiente", "Cobrado", "Vencido"];

const badgeEstado = (estado: string) => {
  switch (estado) {
    case "Cobrado": return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "Vencido": return "bg-rose-50 text-rose-600 border-rose-200";
    default: return "bg-amber-50 text-amber-600 border-amber-200";
  }
};

export default function FinanciacionesClient({ financiacionesIniciales }: { financiacionesIniciales: Financiacion[] }) {
  const [financiaciones, setFinanciaciones] = useState(financiacionesIniciales);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const hoy = new Date().toISOString().split("T")[0];

  // Auto-marcar como vencidas visualmente las que ya pasaron de fecha y siguen Pendiente
  const conVencimientoCalculado = financiaciones.map((f) => {
    if (f.estado === "Pendiente" && f.fecha_vencimiento && f.fecha_vencimiento < hoy) {
      return { ...f, estadoVisual: "Vencido" };
    }
    return { ...f, estadoVisual: f.estado || "Pendiente" };
  });

  const filtradas = conVencimientoCalculado.filter((f) => filtroEstado === "todos" || f.estadoVisual === filtroEstado);

  const totales = useMemo(() => {
    const pendiente = conVencimientoCalculado.filter((f) => f.estadoVisual === "Pendiente").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    const vencido = conVencimientoCalculado.filter((f) => f.estadoVisual === "Vencido").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    const cobrado = conVencimientoCalculado.filter((f) => f.estadoVisual === "Cobrado").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    return { pendiente, vencido, cobrado };
  }, [conVencimientoCalculado]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizandoId(id);
    try {
      const { error } = await supabase.from("financiaciones").update({ estado: nuevoEstado }).eq("id", id);
      if (error) throw error;
      setFinanciaciones((prev) => prev.map((f) => (f.id === id ? { ...f, estado: nuevoEstado } : f)));
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado.");
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Financiaciones</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Prendas bancarias y planes de pago de las ventas</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {["todos", ...ESTADOS].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                filtroEstado === e ? "bg-slate-100 text-slate-900 border border-slate-200" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pendiente de cobro</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-amber-600">$ {totales.pendiente.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vencido</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-rose-600">$ {totales.vencido.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Cobrado</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-emerald-600">$ {totales.cobrado.toLocaleString("es-AR")}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Vehículo / Cliente</th>
                    <th className="p-4">Entidad</th>
                    <th className="p-4 text-center">Cuotas</th>
                    <th className="p-4">Vencimiento</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 pr-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          {f.boleto?.marca} {f.boleto?.modelo}
                        </div>
                        <span className="text-[11px] text-slate-500">{f.boleto?.nombre} {f.boleto?.apellido}</span>
                      </td>
                      <td className="p-4 text-[13px] text-slate-600">{f.entidad || "—"}</td>
                      <td className="p-4 text-center text-[13px] font-mono text-slate-600">{f.cuotas || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600">
                        {f.fecha_vencimiento ? new Date(`${f.fecha_vencimiento}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-800">$ {Number(f.monto).toLocaleString("es-AR")}</td>
                      <td className="p-4 pr-6 text-center">
                        <select
                          value={f.estado || "Pendiente"}
                          onChange={(e) => cambiarEstado(f.id, e.target.value)}
                          disabled={actualizandoId === f.id}
                          className={`text-[10px] font-bold uppercase tracking-widest border rounded-md px-2 py-1 outline-none cursor-pointer ${badgeEstado(f.estadoVisual)}`}
                        >
                          {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 text-sm italic">
                        Sin financiaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

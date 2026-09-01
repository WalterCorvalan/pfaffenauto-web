"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Handshake } from "lucide-react";

interface Vehiculo { id: string; marca: string; modelo: string; precio_venta: number; moneda_venta: string }
interface Props { vehiculo: Vehiculo; miId: string; onClose: () => void; onGuardada: (vehiculoId: string) => void }

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";

export default function SenaModal({ vehiculo, miId, onClose, onGuardada }: Props) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState(vehiculo.moneda_venta || "USD");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    if (!clienteNombre.trim()) {
      setError("Falta el nombre del cliente.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { error: errInsert } = await supabase2.from("senas").insert({
        vehiculo_id: vehiculo.id,
        cliente_nombre: clienteNombre.trim(),
        monto: monto ? Number(monto) : null,
        moneda,
        notas: notas || null,
        vendedor_id: miId || null,
      });
      if (errInsert) throw errInsert;

      const { error: errUpdate } = await supabase2.from("vehiculos").update({ estado: "señado" }).eq("id", vehiculo.id);
      if (errUpdate) throw errUpdate;

      onGuardada(vehiculo.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar la seña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Handshake className="w-5 h-5 text-amber-500" /> Registrar seña</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{vehiculo.marca} {vehiculo.modelo} — el vehículo pasará a estado Señado.</p>

        {error && <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300">
            Precio de venta vigente: {vehiculo.moneda_venta} {Number(vehiculo.precio_venta).toLocaleString("es-AR")}
          </div>
          <div>
            <label className={labelClass}>Nombre del cliente *</label>
            <input autoFocus value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Apellido y nombre" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Monto (opcional)</label>
              <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Moneda</label>
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Condiciones, forma de pago, etc." className={inputClass} />
          </div>
        </div>

        <div className="flex gap-2 pt-5 mt-1 border-t border-slate-100 dark:border-white/10">
          <button onClick={onClose} disabled={guardando} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar seña"}
          </button>
        </div>
      </div>
    </div>
  );
}

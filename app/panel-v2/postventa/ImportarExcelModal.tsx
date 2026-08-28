"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

interface Props {
  miId: string;
  onClose: () => void;
  onImportadas: (compras: any[]) => void;
}

function buscarCampo(fila: Record<string, any>, nombres: string[]) {
  const claves = Object.keys(fila);
  for (const nombre of nombres) {
    const k = claves.find((c) => c.trim().toLowerCase() === nombre.toLowerCase());
    if (k !== undefined && fila[k] !== undefined && fila[k] !== "") return fila[k];
  }
  return undefined;
}

export default function ImportarExcelModal({ miId, onClose, onImportadas }: Props) {
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; errores: string[] } | null>(null);

  const procesarArchivo = async (file: File) => {
    setProcesando(true);
    setResultado(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const filas: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const payloads: any[] = [];
      const errores: string[] = [];

      filas.forEach((fila, i) => {
        const nombre = buscarCampo(fila, ["nombre", "Nombre"]);
        const marca = buscarCampo(fila, ["marca", "Marca"]);
        const modelo = buscarCampo(fila, ["modelo", "Modelo"]);
        if (!nombre || (!marca && !modelo)) {
          errores.push(`Fila ${i + 2}: falta nombre y/o auto (marca/modelo).`);
          return;
        }
        const fechaRaw = buscarCampo(fila, ["fecha de venta", "fecha_venta", "fecha"]);
        let fechaVenta = new Date().toISOString().slice(0, 10);
        if (fechaRaw) {
          const d = fechaRaw instanceof Date ? fechaRaw : new Date(fechaRaw);
          if (!isNaN(d.getTime())) fechaVenta = d.toISOString().slice(0, 10);
        }
        const moneda = buscarCampo(fila, ["moneda", "Moneda"]);
        payloads.push({
          comprador_nombre: String(nombre).trim(),
          comprador_telefono: buscarCampo(fila, ["teléfono", "telefono"]) || null,
          comprador_dni: buscarCampo(fila, ["dni", "DNI"]) || null,
          vehiculo_marca: marca ? String(marca).trim() : null,
          vehiculo_modelo: modelo ? String(modelo).trim() : null,
          vehiculo_anio: buscarCampo(fila, ["año", "ano"]) ? Number(buscarCampo(fila, ["año", "ano"])) : null,
          vehiculo_dominio: buscarCampo(fila, ["dominio", "patente"]) || null,
          fecha_venta: fechaVenta,
          precio: buscarCampo(fila, ["precio"]) ? Number(buscarCampo(fila, ["precio"])) : null,
          moneda: moneda && ["USD", "ARS"].includes(String(moneda).trim().toUpperCase()) ? String(moneda).trim().toUpperCase() : "USD",
          vendedor_nombre: buscarCampo(fila, ["vendedor"]) || null,
          origen: "excel", creado_por: miId || null,
        });
      });

      let insertadas: any[] = [];
      if (payloads.length > 0) {
        const { data, error } = await supabase2.from("postventa_compras").insert(payloads).select();
        if (error) errores.push(`Error al guardar: ${error.message}`);
        else insertadas = data || [];
      }
      setResultado({ ok: insertadas.length, errores });
      if (insertadas.length > 0) {
        onImportadas(insertadas);
        if (miId) {
          crearAlerta(supabase2, miId, `${insertadas.length} compra${insertadas.length === 1 ? "" : "s"} importada${insertadas.length === 1 ? "" : "s"} desde Excel`, {
            link: "/panel-v2/postventa", tipo: "cliente", prioridad: "novedad",
          });
        }
      }
    } catch (err) {
      console.error(err);
      setResultado({ ok: 0, errores: ["No se pudo leer el archivo. Verificá que sea un .xlsx válido."] });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !procesando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Cada fila se carga como compra histórica y aparece en Ya compraron.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rose-200 dark:border-rose-500/20 rounded-xl py-10 cursor-pointer hover:border-rose-400 transition-colors">
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && procesarArchivo(e.target.files[0])} disabled={procesando} />
          {procesando ? <Loader2 className="w-6 h-6 text-rose-500 animate-spin" /> : <Upload className="w-6 h-6 text-slate-400" />}
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{procesando ? "Procesando..." : "Elegí un archivo .xlsx"}</p>
          <p className="text-[11px] text-slate-400 text-center px-4">Columnas: nombre, teléfono, DNI, marca, modelo, año, dominio, fecha de venta, precio, moneda, vendedor. Alcanza con nombre + auto.</p>
        </label>

        {resultado && (
          <div className="mt-4 space-y-2">
            {resultado.ok > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {resultado.ok} compra{resultado.ok === 1 ? "" : "s"} importada{resultado.ok === 1 ? "" : "s"}.
              </p>
            )}
            {resultado.errores.length > 0 && (
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2 max-h-40 overflow-y-auto">
                <p className="flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {resultado.errores.length} fila{resultado.errores.length === 1 ? "" : "s"} con problemas:</p>
                <ul className="list-disc list-inside space-y-0.5 font-normal">{resultado.errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

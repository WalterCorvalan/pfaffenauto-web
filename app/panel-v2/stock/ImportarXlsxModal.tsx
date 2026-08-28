"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Upload, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

interface Props {
  miId: string;
  onClose: () => void;
  onImportados: (vehiculos: any[]) => void;
}

const CONDICIONES_VALIDAS = ["0km", "Excelente", "Muy bueno", "Bueno", "Regular"];

function buscarCampo(fila: Record<string, any>, nombres: string[]) {
  const claves = Object.keys(fila);
  for (const nombre of nombres) {
    const k = claves.find((c) => c.trim().toLowerCase() === nombre.toLowerCase());
    if (k !== undefined && fila[k] !== undefined && fila[k] !== "") return fila[k];
  }
  return undefined;
}

export default function ImportarXlsxModal({ miId, onClose, onImportados }: Props) {
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; errores: string[] } | null>(null);

  const descargarPlantilla = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Marca: "Toyota", Modelo: "Hilux SRX 4x4", "Año": 2022, Patente: "AB123CD", KM: 35000, Color: "Blanco", "Condición": "Muy bueno", "Ubicación": "Salón Principal", Precio: 45000, Moneda: "USD", "Precio compra": 38000, "Moneda compra": "USD", "TC ingreso": "", "Consignación": "", Propietario: "", "Categoría": "Camioneta", Notas: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla-stock.xlsx");
  };

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
        const marca = buscarCampo(fila, ["Marca"]);
        const modelo = buscarCampo(fila, ["Modelo"]);
        const anio = buscarCampo(fila, ["Año", "Ano"]);
        const patente = buscarCampo(fila, ["Patente", "Dominio", "VIN"]);
        const km = buscarCampo(fila, ["KM", "Km"]);
        const color = buscarCampo(fila, ["Color"]);
        const condicionRaw = buscarCampo(fila, ["Condición", "Condicion"]);
        const ubicacion = buscarCampo(fila, ["Ubicación", "Ubicacion"]);
        const precio = buscarCampo(fila, ["Precio"]);
        const moneda = buscarCampo(fila, ["Moneda"]);

        const faltantes = [
          !marca && "Marca", !modelo && "Modelo", !anio && "Año", !patente && "Patente/Dominio/VIN",
          !km && km !== 0 && "KM", !condicionRaw && "Condición", !ubicacion && "Ubicación", !precio && "Precio", !moneda && "Moneda",
        ].filter(Boolean);
        if (faltantes.length > 0) {
          errores.push(`Fila ${i + 2}: faltan ${faltantes.join(", ")}`);
          return;
        }
        const condicion = CONDICIONES_VALIDAS.find((c) => c.toLowerCase() === String(condicionRaw).trim().toLowerCase());
        if (!condicion) {
          errores.push(`Fila ${i + 2}: condición "${condicionRaw}" no es válida (0km / Excelente / Muy bueno / Bueno / Regular)`);
          return;
        }
        const monedaNorm = String(moneda).trim().toUpperCase();
        if (!["USD", "ARS"].includes(monedaNorm)) {
          errores.push(`Fila ${i + 2}: moneda "${moneda}" no es válida (USD / ARS)`);
          return;
        }

        const precioCompra = buscarCampo(fila, ["Precio compra"]);
        const monedaCompra = buscarCampo(fila, ["Moneda compra"]);
        const tcIngreso = buscarCampo(fila, ["TC ingreso"]);
        const propietario = buscarCampo(fila, ["Propietario"]);
        const categoria = buscarCampo(fila, ["Categoría", "Categoria"]);
        const notas = buscarCampo(fila, ["Notas"]);

        payloads.push({
          marca: String(marca).trim(), modelo: String(modelo).trim(), anio: Number(anio),
          patente: String(patente).trim().toUpperCase(), km: Number(km), color: color ? String(color).trim() : null,
          condicion, ubicacion: String(ubicacion).trim(), precio_venta: Number(precio), moneda_venta: monedaNorm,
          precio_compra: precioCompra ? Number(precioCompra) : null, moneda_compra: monedaCompra ? String(monedaCompra).trim().toUpperCase() : "USD",
          tc_ingreso: tcIngreso ? Number(tcIngreso) : null,
          propietario_nombre: propietario ? String(propietario).trim() : null,
          categoria: categoria && ["Auto", "Camioneta", "SUV", "Moto"].includes(String(categoria).trim()) ? String(categoria).trim() : "Auto",
          notas: notas ? String(notas).trim() : null,
          estado: "disponible", propio_agencia: !propietario,
          creado_por: miId || null,
        });
      });

      let insertados: any[] = [];
      if (payloads.length > 0) {
        const { data, error } = await supabase2.from("vehiculos").insert(payloads).select();
        if (error) {
          errores.push(`Error al guardar: ${error.message}`);
        } else {
          insertados = data || [];
        }
      }

      setResultado({ ok: insertados.length, errores });
      if (insertados.length > 0) {
        onImportados(insertados);
        if (miId) {
          crearAlerta(supabase2, miId, `${insertados.length} vehículo${insertados.length === 1 ? "" : "s"} importado${insertados.length === 1 ? "" : "s"} desde Excel`, {
            link: "/panel-v2/stock", tipo: "vehiculo", prioridad: "novedad",
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
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">Subí un .xlsx con los vehículos. La primera fila debe ser el header.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl py-10 cursor-pointer hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors">
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && procesarArchivo(e.target.files[0])} disabled={procesando} />
          {procesando ? <Loader2 className="w-6 h-6 text-rose-500 animate-spin" /> : <Upload className="w-6 h-6 text-slate-400" />}
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{procesando ? "Procesando..." : "Click para elegir un archivo XLSX"}</p>
          <p className="text-[11px] text-slate-400">La primera fila tiene que ser el header.</p>
        </label>

        {resultado && (
          <div className="mt-4 space-y-2">
            {resultado.ok > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {resultado.ok} vehículo{resultado.ok === 1 ? "" : "s"} importado{resultado.ok === 1 ? "" : "s"}.
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

        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 mt-4 text-xs">
          <p className="font-bold text-slate-600 dark:text-slate-300 mb-2">Columnas <span className="text-rose-500">requeridas</span> (en cualquier orden):</p>
          <div className="grid grid-cols-2 gap-1.5 text-slate-500 dark:text-slate-400">
            <span>Marca</span><span>Modelo</span>
            <span>Año</span><span>Patente / Dominio / VIN</span>
            <span>Color</span><span>KM</span>
            <span>Condición (0km / Excelente / Muy bueno / Bueno / Regular)</span><span>Ubicación</span>
            <span>Precio</span><span>Moneda (USD / ARS)</span>
          </div>
          <p className="font-bold text-slate-600 dark:text-slate-300 mt-3 mb-1">Opcionales:</p>
          <p className="text-slate-500 dark:text-slate-400">Precio compra, Moneda compra, TC ingreso (si la compra es en ARS, congela el costo en USD), Propietario, Categoría (Auto / Camioneta / SUV / Moto), Notas.</p>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <button type="button" onClick={descargarPlantilla} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600"><Download className="w-3.5 h-3.5" /> Descargar plantilla</button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

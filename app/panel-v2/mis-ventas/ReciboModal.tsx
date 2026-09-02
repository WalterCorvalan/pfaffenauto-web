"use client";

import { useState } from "react";
import { X, FileDown } from "lucide-react";
import { numeroALetras } from "@/lib/panelV2/numeroALetras";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

const inputClass = "w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs text-slate-500 dark:text-slate-400 block mb-1";

export default function ReciboModal({ miNombre, onClose }: { miNombre: string; onClose: () => void }) {
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [ciudad, setCiudad] = useState("");
  const [numeroRecibo, setNumeroRecibo] = useState("");

  const [recibiDeNombre, setRecibiDeNombre] = useState("");
  const [recibiDeDni, setRecibiDeDni] = useState("");
  const [recibiDeTelefono, setRecibiDeTelefono] = useState("");
  const [recibiDeDomicilio, setRecibiDeDomicilio] = useState("");

  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [concepto, setConcepto] = useState("");
  const [formaPago, setFormaPago] = useState("Contado");
  const [observaciones, setObservaciones] = useState("");

  const [firmaNombre, setFirmaNombre] = useState(miNombre || "");
  const [firmaDni, setFirmaDni] = useState("");

  const [emisorNombre, setEmisorNombre] = useState("");
  const [emisorDomicilio, setEmisorDomicilio] = useState("");
  const [emisorTelefono, setEmisorTelefono] = useState("");
  const [emisorCuit, setEmisorCuit] = useState("");

  const [generando, setGenerando] = useState(false);

  const montoNum = Number(monto) || 0;
  const monedaLabel = moneda === "USD" ? "dólares" : "pesos";

  const generarPdf = async () => {
    setGenerando(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margen = 18;
      let y = 20;
      const anchoTexto = 210 - margen * 2;

      const linea = (texto: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
        doc.setFontSize(opts.size || 10);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        const splitLines = doc.splitTextToSize(texto, anchoTexto);
        doc.text(splitLines, margen, y);
        y += splitLines.length * (opts.size ? opts.size * 0.42 : 4.6) + (opts.gap ?? 2);
      };

      linea("RECIBO DE PAGO", { size: 14, bold: true, gap: 1 });
      if (numeroRecibo.trim()) linea(`N° ${numeroRecibo.trim()}`, { size: 9, gap: 3 });
      linea(`En ${ciudad || "____________"}, a los ${fecha ? new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "____________"}.`, { gap: 4 });

      linea(`Recibí de: ${recibiDeNombre || "____________"}, DNI/CUIT ${recibiDeDni || "____________"}${recibiDeTelefono ? `, teléfono ${recibiDeTelefono}` : ""}${recibiDeDomicilio ? `, domiciliado en ${recibiDeDomicilio}` : ""},`, { gap: 4 });

      linea(`la suma de ${moneda} ${montoNum.toLocaleString("es-AR")} (son: ${numeroALetras(montoNum)} ${monedaLabel}),`);
      linea(`en concepto de: ${concepto || "____________"}.`);
      linea(`Forma de pago: ${formaPago}.`, { gap: 4 });

      if (observaciones.trim()) linea(`Observaciones: ${observaciones.trim()}`, { gap: 4 });

      y += 12;
      linea("_______________________________", { gap: 1 });
      linea(`${firmaNombre || ""}${firmaDni ? " — DNI " + firmaDni : ""}`, { size: 9 });
      linea("Firma de quien recibe el pago", { size: 8, gap: 8 });

      if (emisorNombre || emisorDomicilio || emisorTelefono || emisorCuit) {
        linea(`${emisorNombre || ""}${emisorCuit ? " — CUIT " + emisorCuit : ""}`, { size: 8 });
        linea(`${emisorDomicilio || ""}${emisorTelefono ? " — Tel. " + emisorTelefono : ""}`, { size: 8 });
      }

      const nombreArchivo = `recibo${numeroRecibo ? "-" + numeroRecibo.replace(/\s+/g, "-") : ""}-${(recibiDeNombre || "cliente").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      doc.save(nombreArchivo);
      onClose();
    } catch (e) {
      alert("No se pudo generar el PDF.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs text-slate-400">{new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="mx-5 mt-3 flex items-start gap-2 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl px-3 py-2.5">
          <FileDown className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-sky-700 dark:text-sky-300">Este recibo es un PDF suelto — completalo a mano y descargalo. No queda guardado en el CRM ni asociado a ninguna seña.</p>
        </div>

        <div className="px-5 pb-5 pt-4 space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Ciudad</label><input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="mt-3"><label className={labelClass}>N° de recibo (opcional)</label><input value={numeroRecibo} onChange={(e) => setNumeroRecibo(e.target.value)} placeholder="0001-00000001" className={inputClass} /></div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Recibí de</p>
            <div className="space-y-3">
              <div><label className={labelClass}>Nombre y Apellido</label><input value={recibiDeNombre} onChange={(e) => setRecibiDeNombre(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>DNI / CUIT</label><input value={recibiDeDni} onChange={(e) => setRecibiDeDni(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Teléfono</label><input value={recibiDeTelefono} onChange={(e) => setRecibiDeTelefono(e.target.value)} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Domicilio (opcional)</label><input value={recibiDeDomicilio} onChange={(e) => setRecibiDeDomicilio(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Importe y concepto</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Monto</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
            </div>
            {montoNum > 0 && <p className="text-xs italic text-indigo-600 dark:text-indigo-300 mt-1.5">Son: {numeroALetras(montoNum).replace(/^./, (c) => c.toUpperCase())} {monedaLabel}</p>}
            <div className="mt-3"><label className={labelClass}>Concepto</label><input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Seña / Saldo / Pago total de..." className={inputClass} /></div>
            <div className="mt-3">
              <label className={labelClass}>Forma de pago</label>
              <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className={inputClass}>
                <option>Contado</option><option value="Otro">Otro (especificar)</option><option>Permuta</option><option>Financiado</option>
              </select>
            </div>
            <div className="mt-3"><label className={labelClass}>Observaciones</label><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className={inputClass} /></div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Firma</p>
            <p className="text-[11px] text-slate-400 mb-2">Nombre y documento de quien recibe el pago y firma el recibo.</p>
            <div className="space-y-3">
              <div><label className={labelClass}>Nombre y apellido de quien firma</label><input value={firmaNombre} onChange={(e) => setFirmaNombre(e.target.value)} placeholder="Ej: Milagros Martin" className={inputClass} /></div>
              <div><label className={labelClass}>DNI de quien firma</label><input value={firmaDni} onChange={(e) => setFirmaDni(e.target.value)} placeholder="Ej: 36.171.177" className={inputClass} /></div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 mt-3 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos del emisor (la agencia)</p>
              <div><label className={labelClass}>Nombre</label><input value={emisorNombre} onChange={(e) => setEmisorNombre(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Domicilio</label><input value={emisorDomicilio} onChange={(e) => setEmisorDomicilio(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Teléfono</label><input value={emisorTelefono} onChange={(e) => setEmisorTelefono(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>CUIT</label><input value={emisorCuit} onChange={(e) => setEmisorCuit(e.target.value)} className={inputClass} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100 dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#111]">
          <button onClick={onClose} className="px-3 py-2 text-sm font-semibold text-slate-500">Cancelar</button>
          <button onClick={generarPdf} disabled={generando} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50">
            <FileDown className="w-4 h-4" /> {generando ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

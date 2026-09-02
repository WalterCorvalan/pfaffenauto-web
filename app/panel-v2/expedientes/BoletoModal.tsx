"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, FileDown, AlertTriangle } from "lucide-react";
import { numeroALetras } from "@/lib/panelV2/numeroALetras";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

const inputClass = "w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-500";
const labelClass = "text-xs text-slate-500 dark:text-slate-400 block mb-1";

interface Props {
  tipo: "venta" | "compra";
  expediente: any;
  venta: any;
  checklist: any[];
  miNombre: string;
  onClose: () => void;
}

export default function BoletoModal({ tipo, expediente, venta, checklist, miNombre, onClose }: Props) {
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [ciudad, setCiudad] = useState("");

  const [compradorNombre, setCompradorNombre] = useState(tipo === "venta" ? venta?.comprador_nombre || "" : "");
  const [compradorDni, setCompradorDni] = useState(tipo === "venta" ? venta?.comprador_dni || "" : "");
  const [compradorTelefono, setCompradorTelefono] = useState(tipo === "venta" ? venta?.comprador_telefono || "" : "");
  const [compradorDomicilio, setCompradorDomicilio] = useState("");

  const [monto, setMonto] = useState(tipo === "venta" && venta?.precio_venta ? String(venta.precio_venta) : "");
  const [moneda, setMoneda] = useState(venta?.moneda_venta || "ARS");

  const [vehiculoMarca, setVehiculoMarca] = useState(venta?.vehiculo_marca || "");
  const [vehiculoTipo, setVehiculoTipo] = useState("");
  const [vehiculoModelo, setVehiculoModelo] = useState(venta?.vehiculo_modelo || "");
  const [vehiculoMotor, setVehiculoMotor] = useState("");
  const [vehiculoChasis, setVehiculoChasis] = useState("");
  const [vehiculoDominio, setVehiculoDominio] = useState(venta?.vehiculo_patente || "");
  const [vehiculoKm, setVehiculoKm] = useState(venta?.km ? String(venta.km) : "");

  const [formaPago, setFormaPago] = useState("Contado");
  const [formaPagoDetalle, setFormaPagoDetalle] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [firmaNombre, setFirmaNombre] = useState(tipo === "venta" ? miNombre : "");
  const [firmaDni, setFirmaDni] = useState("");

  const [agenciaNombre, setAgenciaNombre] = useState("");
  const [agenciaDomicilio, setAgenciaDomicilio] = useState("");
  const [agenciaTelefono, setAgenciaTelefono] = useState("");
  const [agenciaCuit, setAgenciaCuit] = useState("");

  const [mostrarAvisoCedula, setMostrarAvisoCedula] = useState(true);
  const [generando, setGenerando] = useState(false);

  const faltaCedula = checklist.some((c) => c.nombre === "Cédula verde / azul" && !c.completado);

  useEffect(() => {
    if (tipo === "compra" && !compradorNombre) setCompradorNombre("");
  }, [tipo]);

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

      linea(`BOLETO DE ${tipo === "venta" ? "COMPRA-VENTA" : "COMPRA-VENTA"}`, { size: 14, bold: true, gap: 4 });
      linea(`En ${ciudad || "____________"}, a los ${fecha ? new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "____________"}, entre:`);
      linea(
        tipo === "venta"
          ? `${agenciaNombre || "la agencia"}, en carácter de VENDEDOR, y ${compradorNombre || "____________"}, DNI/CUIT ${compradorDni || "____________"}, domiciliado en ${compradorDomicilio || "____________"}, teléfono ${compradorTelefono || "____________"}, en carácter de COMPRADOR,`
          : `${compradorNombre || "____________"}, en carácter de COMPRADOR, y ${firmaNombre || "____________"}, DNI ${firmaDni || "____________"}, en carácter de VENDEDOR,`,
        { gap: 4 }
      );
      linea("se conviene la compra-venta del siguiente vehículo:", { gap: 2 });

      linea(
        `Marca: ${vehiculoMarca || "—"}   Tipo: ${vehiculoTipo || "—"}   Modelo: ${vehiculoModelo || "—"}`,
      );
      linea(`Motor: ${vehiculoMotor || "—"}   Chasis: ${vehiculoChasis || "—"}   Dominio: ${vehiculoDominio || "—"}   Km: ${vehiculoKm || "—"}`, { gap: 4 });

      linea(`Por un importe total de ${moneda} ${montoNum.toLocaleString("es-AR")} (son: ${numeroALetras(montoNum)} ${monedaLabel}).`);
      linea(`Forma de pago: ${formaPago}${formaPago === "Otro" && formaPagoDetalle ? " — " + formaPagoDetalle : ""}.`, { gap: 4 });

      if (observaciones.trim()) linea(`Observaciones: ${observaciones.trim()}`, { gap: 4 });

      y += 12;
      linea("_______________________________", { gap: 1 });
      linea(`${firmaNombre || ""}${firmaDni ? " — DNI " + firmaDni : ""}`, { size: 9 });
      linea("Firma en representación de la agencia", { size: 8, gap: 8 });

      if (agenciaNombre || agenciaDomicilio || agenciaTelefono || agenciaCuit) {
        linea(`${agenciaNombre || ""}${agenciaCuit ? " — CUIT " + agenciaCuit : ""}`, { size: 8 });
        linea(`${agenciaDomicilio || ""}${agenciaTelefono ? " — Tel. " + agenciaTelefono : ""}`, { size: 8 });
      }

      const nombreArchivo = `boleto-${tipo}-${(vehiculoDominio || vehiculoModelo || "vehiculo").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      doc.save(nombreArchivo);

      if (expediente?.id) {
        await supabase2.from("boletos").insert({
          expediente_id: expediente.id, venta_id: venta?.id || null, tipo, fecha, ciudad: ciudad || null,
          comprador_nombre: compradorNombre || null, comprador_dni: compradorDni || null, comprador_telefono: compradorTelefono || null, comprador_domicilio: compradorDomicilio || null,
          monto: monto ? Number(monto) : null, moneda,
          vehiculo_marca: vehiculoMarca || null, vehiculo_tipo: vehiculoTipo || null, vehiculo_modelo: vehiculoModelo || null,
          vehiculo_motor: vehiculoMotor || null, vehiculo_chasis: vehiculoChasis || null, vehiculo_dominio: vehiculoDominio || null, vehiculo_km: vehiculoKm ? Number(vehiculoKm) : null,
          forma_pago: formaPago, forma_pago_detalle: formaPagoDetalle || null, observaciones: observaciones || null,
          firma_nombre: firmaNombre || null, firma_dni: firmaDni || null,
          agencia_nombre: agenciaNombre || null, agencia_domicilio: agenciaDomicilio || null, agencia_telefono: agenciaTelefono || null, agencia_cuit: agenciaCuit || null,
        });
      }
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
        {faltaCedula && mostrarAvisoCedula && (
          <div className="absolute top-3 right-3 left-3 sm:left-auto sm:w-80 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 z-10 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Sin cédula verde cargada</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">El boleto sale igual, pero sin los datos que se leen de la cédula (motor, chasis, titular). Subila en Documentos del expediente para autocompletarlos.</p>
            </div>
            <button onClick={() => setMostrarAvisoCedula(false)} className="text-amber-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs text-slate-400">{new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!venta && (
          <div className="mx-5 mt-3 flex items-start gap-2 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl px-3 py-2.5">
            <FileDown className="w-4 h-4 text-sky-600 dark:text-sky-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-700 dark:text-sky-300">Este boleto es un PDF suelto — completalo a mano y descargalo. No queda guardado en el CRM ni asociado a ninguna venta.</p>
          </div>
        )}

        <div className="px-5 pb-5 pt-4 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Fecha y lugar</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Ciudad</label><input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Comprador</p>
            <div className="space-y-3">
              <div><label className={labelClass}>Nombre y Apellido</label><input value={compradorNombre} onChange={(e) => setCompradorNombre(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>DNI / CUIT</label><input value={compradorDni} onChange={(e) => setCompradorDni(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Teléfono</label><input value={compradorTelefono} onChange={(e) => setCompradorTelefono(e.target.value)} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Domicilio</label><input value={compradorDomicilio} onChange={(e) => setCompradorDomicilio(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Importe</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Monto</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
            </div>
            {montoNum > 0 && <p className="text-xs italic text-indigo-600 dark:text-indigo-300 mt-1.5">Son: {numeroALetras(montoNum).replace(/^./, (c) => c.toUpperCase())} {monedaLabel}</p>}
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Vehículo</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>Marca</label><input value={vehiculoMarca} onChange={(e) => setVehiculoMarca(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Tipo</label><input value={vehiculoTipo} onChange={(e) => setVehiculoTipo(e.target.value)} placeholder="Sedán, SUV..." className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={vehiculoModelo} onChange={(e) => setVehiculoModelo(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label className={labelClass}>Motor</label><input value={vehiculoMotor} onChange={(e) => setVehiculoMotor(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Chasis</label><input value={vehiculoChasis} onChange={(e) => setVehiculoChasis(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Dominio</label><input value={vehiculoDominio} onChange={(e) => setVehiculoDominio(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="mt-3 w-1/3"><label className={labelClass}>Kilómetros</label><input type="number" value={vehiculoKm} onChange={(e) => setVehiculoKm(e.target.value)} className={inputClass} /></div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Pago</p>
            <label className={labelClass}>Forma de pago</label>
            <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className={inputClass}>
              <option>Contado</option><option value="Otro">Otro (especificar)</option><option>Permuta</option><option>Financiado</option>
            </select>
            {formaPago === "Otro" && (
              <div className="mt-3">
                <label className={labelClass}>¿Cómo se realizó la transacción?</label>
                <input value={formaPagoDetalle} onChange={(e) => setFormaPagoDetalle(e.target.value)} placeholder="Ej: Transferencia bancaria + efectivo, financiación, etc." className={inputClass} />
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Observaciones</p>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} placeholder="Cualquier aclaración adicional..." className={inputClass} />
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Firma</p>
            <p className="text-[11px] text-slate-400 mb-2">Nombre y documento de quien firma en representación de la agencia. Va como aclaración debajo de la línea de firma.</p>
            <div className="space-y-3">
              <div><label className={labelClass}>Nombre y apellido de quien firma</label><input value={firmaNombre} onChange={(e) => setFirmaNombre(e.target.value)} placeholder="Ej: Milagros Martin" className={inputClass} /></div>
              <div><label className={labelClass}>DNI de quien firma</label><input value={firmaDni} onChange={(e) => setFirmaDni(e.target.value)} placeholder="Ej: 36.171.177" className={inputClass} /></div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 mt-3 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datos del vendedor (la agencia)</p>
              <div><label className={labelClass}>Nombre</label><input value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Domicilio</label><input value={agenciaDomicilio} onChange={(e) => setAgenciaDomicilio(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Teléfono</label><input value={agenciaTelefono} onChange={(e) => setAgenciaTelefono(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>DNI / CUIT</label><input value={agenciaCuit} onChange={(e) => setAgenciaCuit(e.target.value)} className={inputClass} /></div>
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

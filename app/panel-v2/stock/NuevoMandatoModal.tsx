"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Printer } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

interface Props {
  miId: string;
  miNombre: string;
  onClose: () => void;
  onCreado: (mandato: any, vehiculo: any | null) => void;
}

export default function NuevoMandatoModal({ miId, miNombre, onClose, onCreado }: Props) {
  const [mandanteNombre, setMandanteNombre] = useState("");
  const [mandanteDni, setMandanteDni] = useState("");
  const [mandanteDomicilio, setMandanteDomicilio] = useState("");
  const [mandanteTelefono, setMandanteTelefono] = useState("");
  const [mandanteEmail, setMandanteEmail] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [color, setColor] = useState("");
  const [patente, setPatente] = useState("");
  const [km, setKm] = useState("");
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [plazoDias, setPlazoDias] = useState("60");
  const [tipoTramite, setTipoTramite] = useState("Venta");
  const [mandatario, setMandatario] = useState(miNombre);
  const [seccionalRegistro, setSeccionalRegistro] = useState("");
  const [tipoCarroceria, setTipoCarroceria] = useState("");
  const [motorNro, setMotorNro] = useState("");
  const [chasisNro, setChasisNro] = useState("");
  const [duenosAnteriores, setDuenosAnteriores] = useState("1");
  const [serviciosOficiales, setServiciosOficiales] = useState<string>("");
  const [manuales, setManuales] = useState("Sí");
  const [duplicadoLlaves, setDuplicadoLlaves] = useState("Sí");
  const [auxilio, setAuxilio] = useState("No trae");
  const [valor, setValor] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [agregarAlStock, setAgregarAlStock] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandanteNombre.trim() || !mandanteDomicilio.trim() || !marca.trim() || !modelo.trim() || !anio || !plazoDias || !mandatario.trim()) {
      setError("Completá mandante, domicilio, marca, modelo, año, plazo y mandatario.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { data: mandato, error: dbError } = await supabase2
        .from("mandatos")
        .insert({
          mandante_nombre: mandanteNombre.trim(), mandante_dni_cuit: mandanteDni || null, mandante_domicilio: mandanteDomicilio.trim(),
          mandante_telefono: mandanteTelefono || null, mandante_email: mandanteEmail || null,
          vehiculo_marca: marca.trim(), vehiculo_modelo: modelo.trim(), vehiculo_anio: Number(anio), vehiculo_color: color || null,
          vehiculo_patente: patente || null, vehiculo_km: km ? Number(km) : null,
          fecha, plazo_dias: Number(plazoDias), tipo_tramite: tipoTramite, mandatario: mandatario.trim(), seccional_registro: seccionalRegistro || null,
          tipo_carroceria: tipoCarroceria || null, motor_nro: motorNro || null, chasis_nro: chasisNro || null,
          dueños_anteriores: duenosAnteriores ? Number(duenosAnteriores) : null,
          servicios_oficiales: serviciosOficiales === "" ? null : serviciosOficiales === "Sí",
          manuales: manuales === "Sí", duplicado_llaves: duplicadoLlaves === "Sí", auxilio,
          valor: valor ? Number(valor) : null, moneda,
          creado_por: miId || null,
        })
        .select()
        .single();
      if (dbError) throw dbError;

      let vehiculoCreado = null;
      if (agregarAlStock) {
        const { data: vehiculo, error: vError } = await supabase2
          .from("vehiculos")
          .insert({
            categoria: "Auto", marca: marca.trim(), modelo: modelo.trim(), anio: Number(anio), patente: (patente || `S/PATENTE-${mandato.id.slice(0, 8)}`).toUpperCase(),
            condicion: "Bueno", color: color || "—", km: km ? Number(km) : 0,
            precio_venta: valor ? Number(valor) : 0, moneda_venta: moneda,
            estado: "en_preparacion", propio_agencia: false,
            propietario_nombre: mandanteNombre.trim(), propietario_dni: mandanteDni || null, propietario_telefono: mandanteTelefono || null, propietario_email: mandanteEmail || null,
            dueños_anteriores: duenosAnteriores ? Number(duenosAnteriores) : null,
            servicios_oficiales: serviciosOficiales === "Sí", manuales: manuales === "Sí", duplicado_llaves: duplicadoLlaves === "Sí",
            mandato_id: mandato.id, creado_por: miId || null,
          })
          .select()
          .single();
        if (vError) throw vError;
        vehiculoCreado = vehiculo;
        await supabase2.from("mandatos").update({ vehiculo_id: vehiculo.id }).eq("id", mandato.id);
      }

      onCreado(mandato, vehiculoCreado);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el mandato.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";
  const seccionClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo mandato</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cargá los datos del cliente y del vehículo. Tildá "Agregar al stock" para que el vehículo también se cree en el inventario.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 mt-5">
          <div>
            <p className={seccionClass}>Mandante (cliente)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelClass}>Nombre completo *</label><input value={mandanteNombre} onChange={(e) => setMandanteNombre(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>DNI / CUIT</label><input value={mandanteDni} onChange={(e) => setMandanteDni(e.target.value)} className={inputClass} /></div>
              <div className="sm:col-span-2"><label className={labelClass}>Domicilio *</label><input value={mandanteDomicilio} onChange={(e) => setMandanteDomicilio(e.target.value)} placeholder="Calle, número, localidad, provincia" className={inputClass} /></div>
              <div><label className={labelClass}>Teléfono</label><input value={mandanteTelefono} onChange={(e) => setMandanteTelefono(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input value={mandanteEmail} onChange={(e) => setMandanteEmail(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Datos del vehículo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className={labelClass}>Marca *</label><input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Toyota" className={inputClass} /></div>
              <div><label className={labelClass}>Modelo *</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Hilux" className={inputClass} /></div>
              <div><label className={labelClass}>Año *</label><input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Color</label><input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Patente</label><input value={patente} onChange={(e) => setPatente(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Kilómetros</label><input type="number" value={km} onChange={(e) => setKm(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Datos del mandato</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Plazo (días) *</label><input type="number" value={plazoDias} onChange={(e) => setPlazoDias(e.target.value)} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Tipo de trámite</label>
                <select value={tipoTramite} onChange={(e) => setTipoTramite(e.target.value)} className={inputClass}>
                  <option>Venta</option><option>Consignación</option><option>Permuta</option><option>Otro</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className={labelClass}>Mandatario (representante de la agencia) *</label><input value={mandatario} onChange={(e) => setMandatario(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Seccional Registro</label><input value={seccionalRegistro} onChange={(e) => setSeccionalRegistro(e.target.value)} className={inputClass} /></div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Equipamiento y documentación</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Tipo de carrocería</label>
                <select value={tipoCarroceria} onChange={(e) => setTipoCarroceria(e.target.value)} className={inputClass}>
                  <option value="">—</option><option>Sedán</option><option>Hatchback</option><option>SUV</option><option>Pick-Up</option><option>Coupé</option><option>Furgón</option>
                </select>
              </div>
              <div><label className={labelClass}>Nº motor</label><input value={motorNro} onChange={(e) => setMotorNro(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Nº chasis</label><input value={chasisNro} onChange={(e) => setChasisNro(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Dueños anteriores</label><input type="number" value={duenosAnteriores} onChange={(e) => setDuenosAnteriores(e.target.value)} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Servicios oficiales</label>
                <select value={serviciosOficiales} onChange={(e) => setServiciosOficiales(e.target.value)} className={inputClass}>
                  <option value="">—</option><option value="Sí">Sí</option><option value="No">No</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Manuales</label>
                <select value={manuales} onChange={(e) => setManuales(e.target.value)} className={inputClass}><option value="Sí">Sí</option><option value="No">No</option></select>
              </div>
              <div>
                <label className={labelClass}>Duplicado de llaves</label>
                <select value={duplicadoLlaves} onChange={(e) => setDuplicadoLlaves(e.target.value)} className={inputClass}><option value="Sí">Sí</option><option value="No">No</option></select>
              </div>
              <div>
                <label className={labelClass}>Auxilio</label>
                <select value={auxilio} onChange={(e) => setAuxilio(e.target.value)} className={inputClass}><option value="No trae">No trae</option><option value="Trae">Trae</option></select>
              </div>
              <div><label className={labelClass}>Valor</label><input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 cursor-pointer">
            <input type="checkbox" checked={agregarAlStock} onChange={(e) => setAgregarAlStock(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
            <span>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">📦 Agregar también este vehículo al stock</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">Crea automáticamente el vehículo en el stock con estado "En preparación" y el mandante como propietario. El mandato queda linkeado al vehículo.</span>
            </span>
          </label>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Printer className="w-4 h-4" /> {agregarAlStock ? "Generar mandato + agregar al stock" : "Generar mandato"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

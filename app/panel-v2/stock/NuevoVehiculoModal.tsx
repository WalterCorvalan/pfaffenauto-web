"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, ScanLine, ClipboardPaste } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

export const MARCAS = ["Toyota", "Volkswagen", "Ford", "Chevrolet", "Renault", "Peugeot", "Fiat", "Honda", "Hyundai", "Nissan", "Jeep", "Citroën", "BMW", "Mercedes-Benz", "Audi", "Otra"];
const CATEGORIAS = ["Auto", "Camioneta", "SUV", "Moto", "Otro"];
const CONDICIONES = ["0km", "Excelente", "Muy bueno", "Bueno", "Regular"];
const ESTADOS = [
  { value: "disponible", label: "Disponible" },
  { value: "reservado", label: "Reservado" },
  { value: "señado", label: "Señado" },
  { value: "vendido", label: "Vendido" },
  { value: "en_preparacion", label: "En preparación" },
];

interface Perfil { id: string; nombre: string }
interface Cliente { id: string; nombre: string; telefono: string | null; dni_cuit: string | null }

interface Props {
  perfiles: Perfil[];
  clientes: Cliente[];
  miId: string;
  editando?: any;
  onClose: () => void;
  onCreado: (v: any) => void;
}

export default function NuevoVehiculoModal({ perfiles, clientes, miId, editando, onClose, onCreado }: Props) {
  const esEdicion = !!editando;
  const [categoria, setCategoria] = useState(editando?.categoria || "Auto");
  const [marca, setMarca] = useState(editando?.marca || "");
  const [modelo, setModelo] = useState(editando?.modelo || "");
  const [anio, setAnio] = useState(editando?.anio ? String(editando.anio) : String(new Date().getFullYear()));
  const [patente, setPatente] = useState(editando?.patente || "");
  const [condicion, setCondicion] = useState(editando?.condicion || "Muy bueno");
  const [color, setColor] = useState(editando?.color || "");
  const [km, setKm] = useState(editando?.km ? String(editando.km) : "");
  const [precioVenta, setPrecioVenta] = useState(editando?.precio_venta ? String(editando.precio_venta) : "");
  const [monedaVenta, setMonedaVenta] = useState(editando?.moneda_venta || "USD");
  const [precioCompra, setPrecioCompra] = useState(editando?.precio_compra ? String(editando.precio_compra) : "");
  const [monedaCompra, setMonedaCompra] = useState(editando?.moneda_compra || "USD");
  const [estadoInicial, setEstadoInicial] = useState(editando?.estado || "disponible");
  const [ubicacion, setUbicacion] = useState(editando?.ubicacion || "Salón Principal");
  const [duenosAnteriores, setDuenosAnteriores] = useState(editando?.["dueños_anteriores"] ? String(editando["dueños_anteriores"]) : "1");
  const [propioAgencia, setPropioAgencia] = useState(editando?.propio_agencia || false);
  const [propietarioNombre, setPropietarioNombre] = useState(editando?.propietario_nombre || "");
  const [clienteVinculadoId, setClienteVinculadoId] = useState(editando?.cliente_vinculado_id || "");
  const [propietarioTelefono, setPropietarioTelefono] = useState(editando?.propietario_telefono || "");
  const [propietarioEmail, setPropietarioEmail] = useState(editando?.propietario_email || "");
  const [consignadoPor, setConsignadoPor] = useState(editando?.consignado_por || "");
  const [motorNro, setMotorNro] = useState("");
  const [chasisNro, setChasisNro] = useState("");
  const [combustible, setCombustible] = useState(editando?.combustible || "");
  const [transmision, setTransmision] = useState(editando?.transmision || "");
  const [carroceria, setCarroceria] = useState(editando?.carroceria || "");
  const [puertas, setPuertas] = useState(editando?.puertas ? String(editando.puertas) : "");
  const [motorCilindrada, setMotorCilindrada] = useState(editando?.motor_cilindrada || "");
  const [version, setVersion] = useState(editando?.version || "");
  const [manuales, setManuales] = useState(editando?.manuales || false);
  const [duplicadoLlaves, setDuplicadoLlaves] = useState(editando?.duplicado_llaves || false);
  const [serviciosOficiales, setServiciosOficiales] = useState(editando?.servicios_oficiales || false);
  const [publicadoMl, setPublicadoMl] = useState(editando?.publicado_ml || false);
  const [publicadoPor, setPublicadoPor] = useState(editando?.publicado_por || "");
  const [linkMl, setLinkMl] = useState(editando?.link_ml || "");
  const [notas, setNotas] = useState(editando?.notas || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca.trim() || !modelo.trim() || !anio || !patente.trim() || !color.trim() || !km || !precioVenta) {
      setError("Completá marca, modelo, año, patente, color, kilómetros y precio de venta.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const payload = {
        categoria, marca: marca.trim(), modelo: modelo.trim(), anio: Number(anio), patente: patente.trim().toUpperCase(),
        condicion, color: color.trim(), km: Number(km), precio_venta: Number(precioVenta), moneda_venta: monedaVenta,
        precio_compra: precioCompra ? Number(precioCompra) : null, moneda_compra: monedaCompra,
        ubicacion, estado: estadoInicial, "dueños_anteriores": duenosAnteriores ? Number(duenosAnteriores) : null,
        propio_agencia: propioAgencia,
        propietario_nombre: propioAgencia ? null : (propietarioNombre || null),
        cliente_vinculado_id: clienteVinculadoId || null,
        propietario_telefono: propioAgencia ? null : (propietarioTelefono || null),
        propietario_email: propioAgencia ? null : (propietarioEmail || null),
        consignado_por: consignadoPor || null,
        combustible: combustible || null, transmision: transmision || null, carroceria: carroceria || null,
        puertas: puertas ? Number(puertas) : null, motor_cilindrada: motorCilindrada || null, version: version || null,
        manuales, duplicado_llaves: duplicadoLlaves, servicios_oficiales: serviciosOficiales,
        publicado_ml: publicadoMl, publicado_por: publicadoPor || null, link_ml: linkMl || null,
        notas: notas || null,
      };
      const { data, error: dbError } = esEdicion
        ? await supabase2.from("vehiculos").update(payload).eq("id", editando.id).select().single()
        : await supabase2.from("vehiculos").insert({ ...payload, creado_por: miId || null }).select().single();
      if (dbError) throw dbError;
      if (!esEdicion && miId) {
        crearAlerta(supabase2, miId, `Nuevo vehículo en stock — ${data.marca} ${data.modelo} ${data.anio}`, {
          mensaje: `Ingresó hoy. Estado: ${ESTADOS.find((e) => e.value === data.estado)?.label || data.estado}. Precio: ${data.moneda_venta} ${Number(data.precio_venta).toLocaleString("es-AR")}.`,
          link: "/panel-v2/stock", tipo: "vehiculo", prioridad: "novedad",
        });
      }
      onCreado(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el vehículo. Revisá que la patente no esté repetida.");
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{esEdicion ? "Editar vehículo" : "Nuevo vehículo"}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Datos básicos del vehículo. Fotos y cédula verde se cargan luego de crear el vehículo.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 mt-5">
          <button type="button" disabled title="Necesita la API de Google Vision, todavía no conectada" className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold opacity-60 cursor-not-allowed">
            <ScanLine className="w-4 h-4" /> Escanear cédula verde (opcional)
          </button>

          <div>
            <p className={seccionClass}>Identidad</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Tipo de vehículo</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Marca *</label>
                <input list="marcas-vehiculo" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Toyota, BMW" className={inputClass} />
                <datalist id="marcas-vehiculo">{MARCAS.map((m) => <option key={m} value={m} />)}</datalist>
              </div>
              <div>
                <label className={labelClass}>Modelo *</label>
                <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Hilux SRX 4x4" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Año *</label>
                <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Patente / VIN *</label>
                <input value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="AB123CD" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Condición *</label>
                <select value={condicion} onChange={(e) => setCondicion(e.target.value)} className={inputClass}>
                  {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Color *</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Precio y estado</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Kilómetros *</label>
                <input type="number" value={km} onChange={(e) => setKm(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Precio de venta *</label>
                <input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Moneda venta</label>
                <select value={monedaVenta} onChange={(e) => setMonedaVenta(e.target.value)} className={inputClass}>
                  <option value="USD">USD</option><option value="ARS">ARS</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Precio compra (opcional)</label>
                <input type="number" value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Moneda compra</label>
                <select value={monedaCompra} onChange={(e) => setMonedaCompra(e.target.value)} className={inputClass}>
                  <option value="USD">USD</option><option value="ARS">ARS</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado inicial</label>
                <select value={estadoInicial} onChange={(e) => setEstadoInicial(e.target.value)} className={inputClass}>
                  {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Ubicación y dueños</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ubicación *</label>
                <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Dueños anteriores</label>
                <input type="number" value={duenosAnteriores} onChange={(e) => setDuenosAnteriores(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Propietario</p>
            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer mb-3">
              <input type="checkbox" checked={propioAgencia} onChange={(e) => setPropioAgencia(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
              <span>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">Vehículo propio de la agencia</span>
                <span className="block text-[10px] text-slate-400">El auto es de la agencia, no consignado por un tercero. El "Precio de compra" se usa como costo para calcular el margen al venderlo.</span>
              </span>
            </label>
            {!propioAgencia && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input value={propietarioNombre} onChange={(e) => setPropietarioNombre(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cliente vinculado</label>
                  <select value={clienteVinculadoId} onChange={(e) => setClienteVinculadoId(e.target.value)} className={inputClass}>
                    <option value="">— Sin vincular —</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input value={propietarioTelefono} onChange={(e) => setPropietarioTelefono(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={propietarioEmail} onChange={(e) => setPropietarioEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Consignado por</label>
                  <select value={consignadoPor} onChange={(e) => setConsignadoPor(e.target.value)} className={inputClass}>
                    <option value="">— Sin asignar —</option>
                    {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Vendedor responsable de la consignación</p>
                </div>
                <div>
                  <label className={labelClass}>Nº motor</label>
                  <input value={motorNro} onChange={(e) => setMotorNro(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nº chasis</label>
                  <input value={chasisNro} onChange={(e) => setChasisNro(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className={seccionClass}>Ficha técnica</p>
              <button type="button" disabled title="Requiere el link de MercadoLibre y scraping — todavía no construido" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 opacity-60 cursor-not-allowed">
                <ClipboardPaste className="w-3.5 h-3.5" /> Traer ficha de ML
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Combustible</label>
                <select value={combustible} onChange={(e) => setCombustible(e.target.value)} className={inputClass}>
                  <option value="">— Sin especificar —</option>
                  <option>Nafta</option><option>Diésel</option><option>GNC</option><option>Híbrido</option><option>Eléctrico</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Transmisión</label>
                <select value={transmision} onChange={(e) => setTransmision(e.target.value)} className={inputClass}>
                  <option value="">— Sin especificar —</option>
                  <option>Manual</option><option>Automática</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Carrocería</label>
                <select value={carroceria} onChange={(e) => setCarroceria(e.target.value)} className={inputClass}>
                  <option value="">— Sin especificar —</option>
                  <option>Sedán</option><option>Hatchback</option><option>SUV</option><option>Pick-Up</option><option>Coupé</option><option>Furgón</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Puertas</label>
                <input type="number" value={puertas} onChange={(e) => setPuertas(e.target.value)} placeholder="Ej: 5" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Motor / cilindrada</label>
                <input value={motorCilindrada} onChange={(e) => setMotorCilindrada(e.target.value)} placeholder="Ej: 2.0 Turbo" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Versión</label>
                <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Ej: Titanium" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Documentación</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Manuales</label>
                <select value={manuales ? "Si" : "No"} onChange={(e) => setManuales(e.target.value === "Si")} className={inputClass}><option value="No">No</option><option value="Si">Sí</option></select>
              </div>
              <div>
                <label className={labelClass}>Duplicado de llaves</label>
                <select value={duplicadoLlaves ? "Si" : "No"} onChange={(e) => setDuplicadoLlaves(e.target.value === "Si")} className={inputClass}><option value="No">No</option><option value="Si">Sí</option></select>
              </div>
              <div>
                <label className={labelClass}>Servicios oficiales</label>
                <select value={serviciosOficiales ? "Si" : "No"} onChange={(e) => setServiciosOficiales(e.target.value === "Si")} className={inputClass}><option value="No">No</option><option value="Si">Sí</option></select>
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Publicación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>¿Publicado en MercadoLibre?</label>
                <select value={publicadoMl ? "Si" : "No"} onChange={(e) => setPublicadoMl(e.target.value === "Si")} className={inputClass}><option value="No">No</option><option value="Si">Sí</option></select>
              </div>
              <div>
                <label className={labelClass}>Publicado por</label>
                <input value={publicadoPor} onChange={(e) => setPublicadoPor(e.target.value)} placeholder="Ej: Richi, Lucía..." className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Link de MercadoLibre</label>
                <input value={linkMl} onChange={(e) => setLinkMl(e.target.value)} placeholder="https://articulo.mercadolibre.com.ar/..." className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : esEdicion ? "Guardar cambios" : "Dar de alta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

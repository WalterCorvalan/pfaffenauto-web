"use client";

import { useRef, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, ScanLine, ClipboardPaste, ImagePlus } from "lucide-react";
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
interface Sucursal { id: string; nombre: string }

interface Props {
  perfiles: Perfil[];
  clientes: Cliente[];
  sucursales: Sucursal[];
  miId: string;
  editando?: any;
  onClose: () => void;
  onCreado: (v: any) => void;
}

export default function NuevoVehiculoModal({ perfiles, clientes, sucursales, miId, editando, onClose, onCreado }: Props) {
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

  const [fotos, setFotos] = useState<string[]>(editando?.fotos || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const subirFotos = async (files: FileList) => {
    setSubiendoFotos(true);
    try {
      const subidas: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("carpeta", "vehiculos");
        const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error subiendo la imagen");
        subidas.push(data.publicUrl);
      }
      setFotos((prev) => [...prev, ...subidas]);
    } catch (err: any) {
      setError(err?.message || "No se pudieron subir una o más fotos.");
    } finally {
      setSubiendoFotos(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const quitarFoto = (url: string) => setFotos((prev) => prev.filter((f) => f !== url));

  // Técnicos (sumados a v2 — v1 los tenía)
  const [segmento, setSegmento] = useState(editando?.segmento || "");
  const [traccion, setTraccion] = useState(editando?.traccion || "");
  const [potenciaCv, setPotenciaCv] = useState(editando?.potencia_cv ? String(editando.potencia_cv) : "");
  const [cantidadPlazas, setCantidadPlazas] = useState(editando?.cantidad_plazas ? String(editando.cantidad_plazas) : "");
  const [origen, setOrigen] = useState(editando?.origen || "");
  const [numeroMotor, setNumeroMotor] = useState(editando?.numero_motor || "");
  const [marcaMotor, setMarcaMotor] = useState(editando?.marca_motor || "");
  const [numeroChasis, setNumeroChasis] = useState(editando?.numero_chasis || "");
  const [marcaChasis, setMarcaChasis] = useState(editando?.marca_chasis || "");
  const [radicadoLocalidad, setRadicadoLocalidad] = useState(editando?.radicado_localidad || "");
  const [radicadoProvincia, setRadicadoProvincia] = useState(editando?.radicado_provincia || "");

  // Gestión comercial
  const [stockFisico, setStockFisico] = useState(editando?.stock_fisico ?? true);
  const [destacado, setDestacado] = useState(editando?.destacado || false);
  const [fechaCompra, setFechaCompra] = useState(editando?.fecha_compra || "");
  const [importePatenteAnual, setImportePatenteAnual] = useState(editando?.importe_patente_anual ? String(editando.importe_patente_anual) : "");
  const [sucursalId, setSucursalId] = useState(editando?.sucursal_id || "");
  const [sucursalCompraId, setSucursalCompraId] = useState(editando?.sucursal_compra_id || "");

  // Precio publicado (el que se ve en el catálogo, distinto del venta interno)
  const [precioPublicadoUsd, setPrecioPublicadoUsd] = useState(editando?.precio_publicado_usd ? String(editando.precio_publicado_usd) : "");

  // Proveedor / dueño anterior — datos extra (nombre/teléfono/email ya
  // estaban arriba, esto suma lo que faltaba de v1)
  const [propietarioApellido, setPropietarioApellido] = useState(editando?.propietario_apellido || "");
  const [propietarioFechaNacimiento, setPropietarioFechaNacimiento] = useState(editando?.propietario_fecha_nacimiento || "");
  const [propietarioCuitCuil, setPropietarioCuitCuil] = useState(editando?.propietario_cuit_cuil || "");
  const [propietarioCalle, setPropietarioCalle] = useState(editando?.propietario_calle || "");
  const [propietarioNumero, setPropietarioNumero] = useState(editando?.propietario_numero || "");
  const [propietarioDepto, setPropietarioDepto] = useState(editando?.propietario_depto || "");
  const [propietarioLocalidad, setPropietarioLocalidad] = useState(editando?.propietario_localidad || "");
  const [propietarioCodigoPostal, setPropietarioCodigoPostal] = useState(editando?.propietario_codigo_postal || "");
  const [propietarioProvincia, setPropietarioProvincia] = useState(editando?.propietario_provincia || "");
  const [propietarioTelefonoCelular, setPropietarioTelefonoCelular] = useState(editando?.propietario_telefono_celular || "");

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
        notas: notas || null, fotos,
        segmento: segmento || null, traccion: traccion || null,
        potencia_cv: potenciaCv ? Number(potenciaCv) : null, cantidad_plazas: cantidadPlazas ? Number(cantidadPlazas) : null,
        origen: origen || null, numero_motor: numeroMotor || null, marca_motor: marcaMotor || null,
        numero_chasis: numeroChasis || null, marca_chasis: marcaChasis || null,
        radicado_localidad: radicadoLocalidad || null, radicado_provincia: radicadoProvincia || null,
        stock_fisico: stockFisico, destacado, fecha_compra: fechaCompra || null,
        importe_patente_anual: importePatenteAnual ? Number(importePatenteAnual) : null,
        sucursal_id: sucursalId || null, sucursal_compra_id: sucursalCompraId || null,
        precio_publicado_usd: precioPublicadoUsd ? Number(precioPublicadoUsd) : null,
        propietario_apellido: propioAgencia ? null : (propietarioApellido || null),
        propietario_fecha_nacimiento: propioAgencia ? null : (propietarioFechaNacimiento || null),
        propietario_cuit_cuil: propioAgencia ? null : (propietarioCuitCuil || null),
        propietario_calle: propioAgencia ? null : (propietarioCalle || null),
        propietario_numero: propioAgencia ? null : (propietarioNumero || null),
        propietario_depto: propioAgencia ? null : (propietarioDepto || null),
        propietario_localidad: propioAgencia ? null : (propietarioLocalidad || null),
        propietario_codigo_postal: propioAgencia ? null : (propietarioCodigoPostal || null),
        propietario_provincia: propioAgencia ? null : (propietarioProvincia || null),
        propietario_telefono_celular: propioAgencia ? null : (propietarioTelefonoCelular || null),
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Datos básicos del vehículo. Escaneo de cédula verde disponible luego de crear el vehículo.</p>
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
            <p className={seccionClass}>Fotos</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotos.map((url) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => quitarFoto(url)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${subiendoFotos ? "opacity-60 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-white/5"} border-slate-300 dark:border-white/20`}>
                {subiendoFotos ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <ImagePlus className="w-5 h-5 text-slate-400" />}
                <span className="text-[10px] font-semibold text-slate-400">{subiendoFotos ? "Subiendo..." : "Agregar"}</span>
                <input ref={fileRef} type="file" accept="image/*" multiple disabled={subiendoFotos} className="hidden" onChange={(e) => e.target.files?.length && subirFotos(e.target.files)} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">La primera foto es la que se usa como miniatura en el listado y en el catálogo.</p>
          </div>

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
              <div>
                <label className={labelClass}>Precio publicado USD (opcional)</label>
                <input type="number" value={precioPublicadoUsd} onChange={(e) => setPrecioPublicadoUsd(e.target.value)} className={inputClass} />
                <p className="text-[10px] text-slate-400 mt-1">Para catálogo/pautas, distinto del precio de venta interno.</p>
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
              <div>
                <label className={labelClass}>Sucursal</label>
                <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className={inputClass}>
                  <option value="">— Sin asignar —</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sucursal de compra</label>
                <select value={sucursalCompraId} onChange={(e) => setSucursalCompraId(e.target.value)} className={inputClass}>
                  <option value="">— Sin asignar —</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Gestión comercial</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Stock físico</label>
                <select value={stockFisico ? "Si" : "No"} onChange={(e) => setStockFisico(e.target.value === "Si")} className={inputClass}><option value="Si">Sí</option><option value="No">No</option></select>
              </div>
              <div>
                <label className={labelClass}>Destacado</label>
                <select value={destacado ? "Si" : "No"} onChange={(e) => setDestacado(e.target.value === "Si")} className={inputClass}><option value="No">No</option><option value="Si">Sí</option></select>
              </div>
              <div>
                <label className={labelClass}>Fecha de compra</label>
                <input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Patente anual</label>
                <input type="number" value={importePatenteAnual} onChange={(e) => setImportePatenteAnual(e.target.value)} className={inputClass} />
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
              </div>
            )}
            {!propioAgencia && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelClass}>Apellido</label>
                  <input value={propietarioApellido} onChange={(e) => setPropietarioApellido(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fecha de nacimiento</label>
                  <input type="date" value={propietarioFechaNacimiento} onChange={(e) => setPropietarioFechaNacimiento(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>CUIT/CUIL</label>
                  <input value={propietarioCuitCuil} onChange={(e) => setPropietarioCuitCuil(e.target.value)} placeholder="20-12345678-9" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Celular</label>
                  <input value={propietarioTelefonoCelular} onChange={(e) => setPropietarioTelefonoCelular(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Calle</label>
                  <input value={propietarioCalle} onChange={(e) => setPropietarioCalle(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input value={propietarioNumero} onChange={(e) => setPropietarioNumero(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Depto</label>
                  <input value={propietarioDepto} onChange={(e) => setPropietarioDepto(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Localidad</label>
                  <input value={propietarioLocalidad} onChange={(e) => setPropietarioLocalidad(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Código postal</label>
                  <input value={propietarioCodigoPostal} onChange={(e) => setPropietarioCodigoPostal(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Provincia</label>
                  <input value={propietarioProvincia} onChange={(e) => setPropietarioProvincia(e.target.value)} className={inputClass} />
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
              <div>
                <label className={labelClass}>Segmento</label>
                <input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ej: Sedán compacto" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tracción</label>
                <select value={traccion} onChange={(e) => setTraccion(e.target.value)} className={inputClass}>
                  <option value="">— Sin especificar —</option>
                  <option>4x2</option><option>4x4</option><option>AWD</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Potencia (CV)</label>
                <input type="number" value={potenciaCv} onChange={(e) => setPotenciaCv(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cantidad de plazas</label>
                <input type="number" value={cantidadPlazas} onChange={(e) => setCantidadPlazas(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Origen</label>
                <select value={origen} onChange={(e) => setOrigen(e.target.value)} className={inputClass}>
                  <option value="">— Sin especificar —</option>
                  <option>Nacional</option><option>Importado</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Motor, chasis y radicación</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Nº motor</label>
                <input value={numeroMotor} onChange={(e) => setNumeroMotor(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Marca motor</label>
                <input value={marcaMotor} onChange={(e) => setMarcaMotor(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nº chasis</label>
                <input value={numeroChasis} onChange={(e) => setNumeroChasis(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Marca chasis</label>
                <input value={marcaChasis} onChange={(e) => setMarcaChasis(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Radicado — localidad</label>
                <input value={radicadoLocalidad} onChange={(e) => setRadicadoLocalidad(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Radicado — provincia</label>
                <input value={radicadoProvincia} onChange={(e) => setRadicadoProvincia(e.target.value)} className={inputClass} />
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

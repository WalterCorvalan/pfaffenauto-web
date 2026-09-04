"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Save, Trash2, Plus, Bell, Star } from "lucide-react";
import { hoyLocalISO, parseFechaLocal, fmtFechaLocal } from "@/lib/panelV2/fechas";
import { crearAlerta } from "@/lib/panelV2/alertas";

const TIPOS_RECORDATORIO: { value: string; label: string }[] = [
  { value: "llamada_seguimiento", label: "📞 Llamada de seguimiento" },
  { value: "control_post_entrega", label: "🚗 Control post-entrega" },
  { value: "vtv", label: "🔍 VTV / Revisión técnica" },
  { value: "service", label: "🔧 Service / Mantenimiento" },
  { value: "seguro", label: "🛡️ Renovación de seguro" },
  { value: "patente", label: "📄 Patente / Impuesto vehicular" },
  { value: "garantia", label: "⚠️ Fin de garantía" },
  { value: "cumpleanos", label: "🎂 Cumpleaños del cliente" },
  { value: "otro", label: "📌 Otro recordatorio" },
];

interface Vehiculo { id: string; marca: string; modelo: string; anio: number; patente: string | null; km: number | null; precio_venta: number; moneda_venta: string; estado: string; color: string | null; condicion: string }
interface Cliente { id: string; nombre: string; telefono: string | null; email: string | null; dni_cuit: string | null }
interface Perfil { id: string; nombre: string; roles: string[] }

interface Seña { monto: string; moneda: string; fecha: string; cajaDestino: string }
interface Permuta { valor: string; moneda: string; precioPublicacion: string; marca: string; modelo: string; anio: string; km: string; patente: string; color: string; condicion: string; cargarAlStock: boolean; duenoNombre: string }

export interface VentaPrefill {
  compradorNombre?: string;
  vehiculoDescripcion?: string;
  precioVenta?: string;
  monedaVenta?: string;
  vehiculoId?: string;
}

interface Props {
  perfiles: Perfil[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  miId: string;
  initial?: VentaPrefill;
  editando?: any;
  onClose: () => void;
  onCreado: (venta: any) => void;
}

const CAJAS = ["Caja USD", "Caja ARS", "Banco", "Otro"];
const CONDICIONES = ["0km", "Excelente", "Muy bueno", "Bueno", "Regular"];
const nuevaPermuta = (): Permuta => ({ valor: "", moneda: "USD", precioPublicacion: "", marca: "", modelo: "", anio: "", km: "", patente: "", color: "", condicion: "Muy bueno", cargarAlStock: true, duenoNombre: "" });

export default function NuevaVentaModal({ perfiles, clientes, vehiculos, miId, initial, editando, onClose, onCreado }: Props) {
  const esEdicion = !!editando;
  const miPerfil = perfiles.find((p) => p.id === miId);
  const puedeGenerarCuotas = miPerfil?.roles?.some((r) => r === "admin" || r === "finanzas") ?? false;

  const [cargaManual, setCargaManual] = useState(false);

  const [vehiculoId, setVehiculoId] = useState(editando?.vehiculo_id || initial?.vehiculoId || "");
  const [vMarca, setVMarca] = useState(editando?.vehiculo_marca || initial?.vehiculoDescripcion?.split(" ")[0] || "");
  const [vModelo, setVModelo] = useState(editando?.vehiculo_modelo || initial?.vehiculoDescripcion?.split(" ").slice(1).join(" ") || "");
  const [vAnio, setVAnio] = useState(editando?.vehiculo_anio ? String(editando.vehiculo_anio) : "");
  const [vPatente, setVPatente] = useState(editando?.vehiculo_patente || "");
  const [vColor, setVColor] = useState(editando?.vehiculo_color || "");
  const [vCondicion, setVCondicion] = useState(editando?.vehiculo_condicion || "Muy bueno");
  const [km, setKm] = useState(editando?.km ? String(editando.km) : "");
  const [estado, setEstado] = useState(editando?.estado || "borrador");
  const [estadoTocado, setEstadoTocado] = useState(false);
  const [precioVenta, setPrecioVenta] = useState(editando?.precio_venta ? String(editando.precio_venta) : initial?.precioVenta || "");
  const [monedaVenta, setMonedaVenta] = useState(editando?.moneda_venta || initial?.monedaVenta || "USD");
  const [vendedorId, setVendedorId] = useState(editando?.vendedor_id || "");
  const [fechaCierre, setFechaCierre] = useState(editando?.fecha_cierre || hoyLocalISO());

  const [clienteId, setClienteId] = useState(editando?.cliente_id || "");
  const [compradorNombre, setCompradorNombre] = useState(editando?.comprador_nombre || initial?.compradorNombre || "");
  const [compradorTelefono, setCompradorTelefono] = useState(editando?.comprador_telefono || "");
  const [compradorEmail, setCompradorEmail] = useState(editando?.comprador_email || "");
  const [compradorDni, setCompradorDni] = useState(editando?.comprador_dni || "");
  const [propietarioNombre, setPropietarioNombre] = useState(editando?.propietario_nombre || "");
  const [propietarioTelefono, setPropietarioTelefono] = useState(editando?.propietario_telefono || "");

  const [senas, setSenas] = useState<Seña[]>([]);
  const [metodoPago, setMetodoPago] = useState(editando?.metodo_pago || "");
  const [cuotasPlazo, setCuotasPlazo] = useState(editando?.cuotas_plazo ? String(editando.cuotas_plazo) : "");
  const [montoFinanciacion, setMontoFinanciacion] = useState(editando?.monto_financiacion ? String(editando.monto_financiacion) : "");

  const [incluirPermuta, setIncluirPermuta] = useState(false);
  const [permutas, setPermutas] = useState<Permuta[]>([]);

  const [responsableConsignacion, setResponsableConsignacion] = useState(editando?.responsable_consignacion_id || "");
  const [gestorAsignado, setGestorAsignado] = useState(editando?.gestor_asignado_id || "");

  const [comisionManual, setComisionManual] = useState(editando?.comision_manual || false);
  const [comisionVendedorPct, setComisionVendedorPct] = useState(editando?.comision_vendedor_pct != null ? String(editando.comision_vendedor_pct) : "1");
  const [comisionConsignacionPct, setComisionConsignacionPct] = useState(editando?.comision_consignacion_pct != null ? String(editando.comision_consignacion_pct) : "0.5");
  const [extraMonto, setExtraMonto] = useState(editando?.extra_cobrado_monto ? String(editando.extra_cobrado_monto) : "");
  const [extraMoneda, setExtraMoneda] = useState(editando?.extra_cobrado_moneda || "USD");
  const [vendedorCompartido, setVendedorCompartido] = useState(editando?.vendedor_compartido || false);
  const [companeroId, setCompaneroId] = useState(editando?.vendedor_compartido_id || "");
  const [companeroPct, setCompaneroPct] = useState(editando?.vendedor_compartido_pct != null ? String(editando.vendedor_compartido_pct) : "0.5");

  const [entregaTuerca, setEntregaTuerca] = useState(editando?.entrega_tuerca_seguridad || false);
  const [entregaLlave, setEntregaLlave] = useState(editando?.entrega_duplicado_llave || false);
  const [entregaManuales, setEntregaManuales] = useState(editando?.entrega_manuales || false);
  const [entregaCedula, setEntregaCedula] = useState(editando?.entrega_cedula || false);
  const [fechaEntrega, setFechaEntrega] = useState(editando?.fecha_entrega || "");
  const [notas, setNotas] = useState(editando?.notas || "");
  const [comentarioGestoria, setComentarioGestoria] = useState(editando?.comentario_gestoria || "");
  const [comentarioFinanzas, setComentarioFinanzas] = useState(editando?.comentario_finanzas || "");

  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [recordatoriosNuevos, setRecordatoriosNuevos] = useState<{ tipo: string; fecha: string; notas: string }[]>([]);
  const [rTipo, setRTipo] = useState("llamada_seguimiento");
  const [rFecha, setRFecha] = useState("");
  const [rNotas, setRNotas] = useState("");
  const [calificacionPedida, setCalificacionPedida] = useState(editando?.calificacion_pedida || false);
  const [comisionPresets, setComisionPresets] = useState<number[]>([1, 1.5, 0.5]);

  // Defaults de comisión configurables en Configuración → Empresa →
  // Comisiones — solo pisan el estado inicial en una venta NUEVA, nunca una
  // ya guardada (esa mantiene lo que tenía cuando se cerró).
  useEffect(() => {
    supabase2.from("configuracion_empresa").select("comision_vendedor_pct_default, comision_consignacion_pct_default, comision_presets").eq("id", true).single().then(({ data }) => {
      if (!data) return;
      if (data.comision_presets) setComisionPresets(data.comision_presets);
      if (!esEdicion) {
        if (data.comision_vendedor_pct_default != null) setComisionVendedorPct(String(data.comision_vendedor_pct_default));
        if (data.comision_consignacion_pct_default != null) setComisionConsignacionPct(String(data.comision_consignacion_pct_default));
      }
    });
  }, []);

  useEffect(() => {
    if (!esEdicion) return;
    supabase2.from("venta_recordatorios").select("*").eq("venta_id", editando.id).eq("estado", "pendiente").order("fecha_vencimiento").then(({ data }) => setRecordatorios(data || []));
  }, [esEdicion, editando?.id]);

  const agregarRecordatorio = () => {
    if (!rFecha) return;
    setRecordatoriosNuevos((prev) => [...prev, { tipo: rTipo, fecha: rFecha, notas: rNotas.trim() }]);
    setRFecha(""); setRNotas("");
  };
  const quitarRecordatorioNuevo = (i: number) => setRecordatoriosNuevos((prev) => prev.filter((_, idx) => idx !== i));

  const generarRecordatoriosAutomaticos = () => {
    const base = fechaEntrega ? parseFechaLocal(fechaEntrega) : parseFechaLocal(fechaCierre);
    const sumarDias = (d: Date, dias: number) => { const n = new Date(d); n.setDate(n.getDate() + dias); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
    setRecordatoriosNuevos((prev) => [
      ...prev,
      { tipo: "control_post_entrega", fecha: sumarDias(base, 7), notas: "Llamado de control a los 7 días de la entrega." },
      { tipo: "service", fecha: sumarDias(base, 180), notas: "Recordar service/mantenimiento a los 6 meses." },
    ]);
  };

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const comisionVendedorEfectiva = vendedorCompartido ? "0.5" : comisionVendedorPct;
  const comisionEditable = comisionManual;

  const elegirVehiculo = (id: string) => {
    setVehiculoId(id);
    const v = vehiculos.find((x) => x.id === id);
    if (v) {
      setVMarca(v.marca); setVModelo(v.modelo); setVAnio(String(v.anio)); setVPatente(v.patente || ""); setVColor(v.color || ""); setVCondicion(v.condicion);
      setKm(v.km ? String(v.km) : ""); setPrecioVenta(String(v.precio_venta)); setMonedaVenta(v.moneda_venta);
      if (!estadoTocado) setEstado("activa");
    } else if (!estadoTocado) {
      setEstado("borrador");
    }
  };

  const elegirCliente = (id: string) => {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c) { setCompradorNombre(c.nombre); setCompradorTelefono(c.telefono || ""); setCompradorEmail(c.email || ""); setCompradorDni(c.dni_cuit || ""); }
  };

  const agregarSeña = () => setSenas((prev) => [...prev, { monto: "", moneda: monedaVenta, fecha: hoyLocalISO(), cajaDestino: "" }]);
  const quitarSeña = (i: number) => setSenas((prev) => prev.filter((_, idx) => idx !== i));
  const actualizarSeña = (i: number, campo: keyof Seña, val: string) => setSenas((prev) => prev.map((s, idx) => (idx === i ? { ...s, [campo]: val } : s)));

  const togglePermuta = (on: boolean) => {
    setIncluirPermuta(on);
    if (on && permutas.length === 0) setPermutas([nuevaPermuta()]);
    if (!on) setPermutas([]);
  };
  const agregarPermuta = () => setPermutas((prev) => [...prev, nuevaPermuta()]);
  const quitarPermuta = (i: number) => setPermutas((prev) => {
    const next = prev.filter((_, idx) => idx !== i);
    if (next.length === 0) setIncluirPermuta(false);
    return next;
  });
  const actualizarPermuta = (i: number, campo: keyof Permuta, val: string | boolean) => setPermutas((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: val } : p)));

  const resolverCliente = async (estadoFinal: string): Promise<string | null> => {
    if (clienteId) return clienteId;
    if (!compradorNombre.trim() || (!compradorTelefono.trim() && !compradorDni.trim())) return null;
    const filtros: string[] = [];
    if (compradorTelefono.trim()) filtros.push(`telefono.eq.${compradorTelefono.trim()}`);
    if (compradorDni.trim()) filtros.push(`dni_cuit.eq.${compradorDni.trim()}`);
    const { data: existentes } = await supabase2.from("clientes").select("id").or(filtros.join(","));
    if (existentes && existentes.length > 0) return existentes[0].id;

    const { data: nuevo } = await supabase2.from("clientes").insert({
      nombre: compradorNombre.trim(), telefono: compradorTelefono || null, email: compradorEmail || null, dni_cuit: compradorDni || null,
      origen: "Showroom", canal_ingreso: "walk_in", pipeline_stage: estadoFinal === "cerrada" ? "cerrado" : "negociacion", pipeline_stage_manual: true,
      vendedor_id: vendedorId || null, creado_por: miId || null,
    }).select().single();
    return nuevo?.id || null;
  };

  const guardarEdicion = async () => {
    if (!precioVenta || !compradorNombre.trim()) {
      setError("Completá al menos el precio de venta y el nombre del comprador.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const payload: any = {
        vehiculo_marca: vMarca || null, vehiculo_modelo: vModelo || null, vehiculo_anio: vAnio ? Number(vAnio) : null,
        vehiculo_patente: vPatente || null, vehiculo_color: vColor || null, vehiculo_condicion: vCondicion || null,
        km: km ? Number(km) : null, precio_venta: Number(precioVenta), moneda_venta: monedaVenta,
        vendedor_id: vendedorId || null, fecha_cierre: fechaCierre,
        comprador_nombre: compradorNombre.trim(), comprador_telefono: compradorTelefono || null,
        comprador_email: compradorEmail || null, comprador_dni: compradorDni || null,
        propietario_nombre: vehiculoId ? null : (propietarioNombre || null), propietario_telefono: vehiculoId ? null : (propietarioTelefono || null),
        metodo_pago: metodoPago || null, cuotas_plazo: metodoPago === "Financiado" && cuotasPlazo ? Number(cuotasPlazo) : null,
        monto_financiacion: montoFinanciacion ? Number(montoFinanciacion) : null,
        responsable_consignacion_id: responsableConsignacion || null,
        gestor_asignado_id: gestorAsignado || null,
        comision_manual: comisionManual, comision_vendedor_pct: Number(comisionVendedorEfectiva), comision_consignacion_pct: Number(comisionConsignacionPct),
        vendedor_compartido: vendedorCompartido, vendedor_compartido_id: vendedorCompartido ? (companeroId || null) : null,
        vendedor_compartido_pct: vendedorCompartido ? Number(companeroPct) : null,
        extra_cobrado_monto: extraMonto ? Number(extraMonto) : null, extra_cobrado_moneda: extraMoneda,
        entrega_tuerca_seguridad: entregaTuerca, entrega_duplicado_llave: entregaLlave, entrega_manuales: entregaManuales, entrega_cedula: entregaCedula,
        fecha_entrega: fechaEntrega || null, notas: notas || null, comentario_gestoria: comentarioGestoria || null, comentario_finanzas: comentarioFinanzas || null,
        calificacion_pedida: calificacionPedida,
        calificacion_pedida_en: calificacionPedida && !editando.calificacion_pedida ? new Date().toISOString() : (calificacionPedida ? editando.calificacion_pedida_en : null),
      };

      const { data: venta, error: dbError } = await supabase2.from("ventas").update(payload).eq("id", editando.id).select().single();
      if (dbError) throw dbError;

      if (recordatoriosNuevos.length > 0) {
        await supabase2.from("venta_recordatorios").insert(
          recordatoriosNuevos.map((r) => ({ venta_id: editando.id, tipo: r.tipo, fecha_vencimiento: r.fecha, notas: r.notas || null, creado_por: miId || null }))
        );
      }

      onCreado(venta);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async (forzarBorrador: boolean) => {
    if (esEdicion) return guardarEdicion();
    if (!precioVenta || !compradorNombre.trim()) {
      setError("Completá al menos el precio de venta y el nombre del comprador.");
      return;
    }
    if (!forzarBorrador && !vendedorId) {
      setError("Falta el vendedor que cerró la venta.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const estadoFinal = forzarBorrador ? "borrador" : cargaManual ? "cerrada" : estado;
      const clienteResueltoId = await resolverCliente(estadoFinal);
      // Código para que el comprador siga su operación en /seguimiento — mismo
      // generador que usa NuevaSenaModal, así el cliente usa el mismo tipo de
      // código sin importar si arrancó con una seña o una venta directa.
      const codigoSeguimiento = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

      const payload: any = {
        estado: estadoFinal, carga_manual: cargaManual, abre_expediente: true, codigo_seguimiento: codigoSeguimiento,
        vehiculo_id: vehiculoId || null, vehiculo_marca: vMarca || null, vehiculo_modelo: vModelo || null,
        vehiculo_anio: vAnio ? Number(vAnio) : null, vehiculo_patente: vPatente || null, vehiculo_color: vColor || null, vehiculo_condicion: vCondicion || null,
        km: km ? Number(km) : null, precio_venta: Number(precioVenta), moneda_venta: monedaVenta,
        vendedor_id: vendedorId || null, fecha_cierre: fechaCierre,
        cliente_id: clienteResueltoId, comprador_nombre: compradorNombre.trim(), comprador_telefono: compradorTelefono || null,
        comprador_email: compradorEmail || null, comprador_dni: compradorDni || null,
        propietario_nombre: vehiculoId ? null : (propietarioNombre || null), propietario_telefono: vehiculoId ? null : (propietarioTelefono || null),
        metodo_pago: metodoPago || null, cuotas_plazo: metodoPago === "Financiado" && cuotasPlazo ? Number(cuotasPlazo) : null,
        monto_financiacion: montoFinanciacion ? Number(montoFinanciacion) : null,
        responsable_consignacion_id: responsableConsignacion || null,
        gestor_asignado_id: gestorAsignado || null,
        comision_manual: comisionManual, comision_vendedor_pct: Number(comisionVendedorEfectiva), comision_consignacion_pct: Number(comisionConsignacionPct),
        vendedor_compartido: vendedorCompartido, vendedor_compartido_id: vendedorCompartido ? (companeroId || null) : null,
        vendedor_compartido_pct: vendedorCompartido ? Number(companeroPct) : null,
        extra_cobrado_monto: extraMonto ? Number(extraMonto) : null, extra_cobrado_moneda: extraMoneda,
        entrega_tuerca_seguridad: entregaTuerca, entrega_duplicado_llave: entregaLlave, entrega_manuales: entregaManuales, entrega_cedula: entregaCedula,
        fecha_entrega: fechaEntrega || null, notas: notas || null, comentario_gestoria: comentarioGestoria || null, comentario_finanzas: comentarioFinanzas || null,
        creado_por: miId || null,
      };

      const { data: venta, error: dbError } = await supabase2.from("ventas").insert(payload).select().single();
      if (dbError) throw dbError;

      if (senas.length > 0) {
        const filas = senas.filter((s) => s.monto).map((s) => ({ venta_id: venta.id, monto: Number(s.monto), moneda: s.moneda, fecha: s.fecha, caja_destino: s.cajaDestino || null }));
        if (filas.length > 0) await supabase2.from("venta_senas").insert(filas);
      }

      let totalPermutas = 0;
      if (incluirPermuta && permutas.length > 0) {
        for (const p of permutas) {
          if (!p.valor && !p.marca) continue;
          totalPermutas += Number(p.valor || 0);
          let vehiculoCreadoId: string | null = null;
          if (p.cargarAlStock && p.marca && p.modelo) {
            const { data: vCreado } = await supabase2.from("vehiculos").insert({
              categoria: "Auto", marca: p.marca.trim(), modelo: p.modelo.trim(), anio: p.anio ? Number(p.anio) : new Date().getFullYear(),
              km: p.km ? Number(p.km) : 0, patente: (p.patente || `PERMUTA-${venta.id.slice(0, 8)}`).toUpperCase(), color: p.color || "—",
              condicion: p.condicion, precio_venta: p.precioPublicacion ? Number(p.precioPublicacion) : Number(p.valor || 0), moneda_venta: p.moneda,
              estado: "disponible", propio_agencia: true, propietario_nombre: p.duenoNombre || compradorNombre.trim(),
              creado_por: miId || null,
            }).select().single();
            vehiculoCreadoId = vCreado?.id || null;
          }
          await supabase2.from("venta_permutas").insert({
            venta_id: venta.id, valor: p.valor ? Number(p.valor) : null, moneda: p.moneda, precio_publicacion: p.precioPublicacion ? Number(p.precioPublicacion) : null,
            marca: p.marca || null, modelo: p.modelo || null, anio: p.anio ? Number(p.anio) : null, km: p.km ? Number(p.km) : null,
            patente: p.patente || null, color: p.color || null, condicion: p.condicion, cargar_a_stock: p.cargarAlStock, dueno_nombre: p.duenoNombre || null,
            vehiculo_creado_id: vehiculoCreadoId,
          });
        }
      }

      if (metodoPago === "Financiado" && cuotasPlazo && Number(cuotasPlazo) > 0) {
        if (!puedeGenerarCuotas) {
          setComentarioFinanzas((prev: string) => `${prev ? prev + " — " : ""}Pedirle a Finanzas que genere el plan de cuotas (${cuotasPlazo} cuotas).`);
        } else {
          const totalSenas = senas.reduce((acc, s) => acc + Number(s.monto || 0), 0);
          const saldo = Number(precioVenta) - totalSenas - totalPermutas;
          const n = Number(cuotasPlazo);
          const cuotaMonto = Math.round((saldo / n) * 100) / 100;
          const primerVencimiento = parseFechaLocal(fechaCierre);
          const filas = Array.from({ length: n }, (_, i) => {
            const v = new Date(primerVencimiento); v.setMonth(v.getMonth() + i + 1);
            return { venta_id: venta.id, numero: i + 1, monto: cuotaMonto, moneda: monedaVenta, vencimiento: `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}` };
          });
          await supabase2.from("venta_cuotas").insert(filas);
        }
      }

      if (vehiculoId && estadoFinal === "cerrada") {
        await supabase2.from("vehiculos").update({ estado: "vendido" }).eq("id", vehiculoId);
      }

      // El expediente (con hitos + alerta al gestor) lo abre solo el trigger
      // abrir_expediente_al_cerrar_venta al insertar/actualizar la venta en
      // estado 'cerrada' — no hace falta insertarlo a mano acá.

      if (miId) {
        crearAlerta(supabase2, miId, `Nueva venta registrada — ${venta.comprador_nombre}`, {
          mensaje: `${venta.vehiculo_marca || ""} ${venta.vehiculo_modelo || ""} · ${venta.moneda_venta} ${Number(venta.precio_venta).toLocaleString("es-AR")}.`,
          link: "/panel-v2/ventas", tipo: "venta", prioridad: "novedad",
        });
      }

      onCreado(venta);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la venta.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-50";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";
  const seccionClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-6 pb-0 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 pr-4">{esEdicion ? "Editando la venta. El estado se cambia desde el detalle, no acá." : "Se crea en estado Activa si hay vehículo del stock asignado, caso contrario Borrador. El estado se cambia después desde el detalle."}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4 px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {!esEdicion && (
            <label className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer ${cargaManual ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"}`}>
              <input type="checkbox" checked={cargaManual} onChange={(e) => setCargaManual(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
              <span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">↓ Carga manual <span className="font-normal text-slate-400">(venta vieja importada desde Excel)</span></span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Para registrar ventas históricas: permite cargar el vehículo a mano (sin ficha en stock) y la venta nace en estado <strong>Cerrada</strong> directamente. El resto del formulario queda igual.</span>
              </span>
            </label>
          )}

          <div>
            <p className={seccionClass}>Datos de la operación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Vehículo</label>
                <select value={vehiculoId} onChange={(e) => elegirVehiculo(e.target.value)} className={inputClass}>
                  <option value="">— Buscar marca, modelo, patente... —</option>
                  {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio} · {v.patente || "s/patente"}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select value={estado} onChange={(e) => { setEstado(e.target.value); setEstadoTocado(true); }} disabled={cargaManual || esEdicion} className={inputClass}>
                  {cargaManual ? <option value="cerrada">Cerrada</option> : ["borrador", "activa", "reserva", "cerrada", "caida", "cancelada"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                {esEdicion ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-2.5 py-2 mt-1.5">
                    El estado actual es <strong>{estado.charAt(0).toUpperCase() + estado.slice(1)}</strong>. Para cambiarlo, cerrá este modal y usá el botón "Cambiar status" del detalle — el flow valida las transiciones permitidas y pide motivo cuando corresponde.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">{cargaManual ? "Carga manual nace Cerrada (paridad v1)" : "Por default según vehículo. Cambialo si la venta arranca en otro estado."}</p>
                )}
              </div>

              {cargaManual && (
                <div className="sm:col-span-2 bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3.5">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-2">💡 Carga manual — cargá los datos del auto a mano (no hace falta tener ficha en stock).</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Marca / Modelo</label><input value={`${vMarca} ${vModelo}`.trim()} onChange={(e) => { const [m, ...r] = e.target.value.split(" "); setVMarca(m || ""); setVModelo(r.join(" ")); }} placeholder="Ej: Volkswagen Vento GLI" className={inputClass} /></div>
                    <div><label className={labelClass}>Año</label><input type="number" value={vAnio} onChange={(e) => setVAnio(e.target.value)} placeholder="2023" className={inputClass} /></div>
                    <div className="col-span-2"><label className={labelClass}>Patente / Dominio</label><input value={vPatente} onChange={(e) => setVPatente(e.target.value)} placeholder="AG235VZ" className={inputClass} /></div>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Kilometraje del vehículo</label>
                <input type="number" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ej: 45000" className={inputClass} />
                <p className="text-[10px] text-slate-400 mt-1">Km del auto vendido al momento de la operación.</p>
              </div>
              <div />

              <div>
                <label className={labelClass}>Precio de Venta (al comprador) *</label>
                <div className="flex gap-2">
                  <select value={monedaVenta} onChange={(e) => setMonedaVenta(e.target.value)} className={`${inputClass} !w-24 shrink-0`}><option value="USD">USD</option><option value="ARS">ARS</option></select>
                  <input type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className={`${inputClass} flex-1 min-w-0`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Vendedor (cerró la venta) *</label>
                <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha de cierre</label>
                <input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <p className={seccionClass}>Comprador</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cliente del CRM</label>
                <select value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className={inputClass}>
                  <option value="">— Buscar por nombre, teléfono o DNI —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Nombre *</label><input value={compradorNombre} onChange={(e) => setCompradorNombre(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Teléfono</label><input value={compradorTelefono} onChange={(e) => setCompradorTelefono(e.target.value)} placeholder="+54 11 5555 5555" className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input value={compradorEmail} onChange={(e) => setCompradorEmail(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>DNI</label><input value={compradorDni} onChange={(e) => setCompradorDni(e.target.value)} className={inputClass} /></div>
            </div>
            {!clienteId && compradorNombre && (compradorTelefono || compradorDni) && <p className="text-[10px] text-indigo-500 mt-1.5">Se engancha solo a un cliente existente por teléfono/DNI, o se crea uno nuevo en Clientes.</p>}
          </div>

          {!vehiculoId && (
            <div>
              <p className={seccionClass}>🔑 Propietario del vehículo</p>
              <p className="text-[10px] text-slate-400 mb-2">Sin vehículo del stock linkeado — cargá los datos del propietario a mano (ventas históricas / vehículo libre).</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Nombre</label><input value={propietarioNombre} onChange={(e) => setPropietarioNombre(e.target.value)} placeholder="— s/d —" className={inputClass} /></div>
                <div><label className={labelClass}>Teléfono</label><input value={propietarioTelefono} onChange={(e) => setPropietarioTelefono(e.target.value)} placeholder="— s/d —" className={inputClass} /></div>
              </div>
            </div>
          )}

          <>
              {esEdicion && (
                <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">Señas y permutas se gestionan desde el expediente de la venta, no desde acá.</p>
              )}
              {!esEdicion && (
              <div>
                <p className={seccionClass}>Pago</p>
                <div className="bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300">💵 Seña / adelanto ({senas.length})</p>
                      <p className="text-[10px] text-amber-700/70 dark:text-amber-300/60">Cargá cada pago a cuenta con su monto, moneda y fecha, y adjuntá el comprobante. El total se acredita como seña en la liquidación del expediente — lo ven Tesorería y Gestoría.</p>
                    </div>
                    <button type="button" onClick={agregarSeña} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold shrink-0"><Plus className="w-3.5 h-3.5" /> Agregar seña</button>
                  </div>
                  {senas.length === 0 ? (
                    <p className="text-[11px] text-amber-700/70 dark:text-amber-300/60 text-center py-2">Sin seña registrada. Si el cliente abonó algo a cuenta, agregalo con el botón de arriba.</p>
                  ) : (
                    <div className="space-y-3">
                      {senas.map((s, i) => (
                        <div key={i} className="bg-white dark:bg-white/5 rounded-lg p-3 border border-amber-100 dark:border-amber-500/10 relative">
                          <button type="button" onClick={() => quitarSeña(i)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          <div className="grid grid-cols-2 gap-2 pr-6">
                            <div><label className={labelClass}>Monto</label><div className="flex gap-1"><select value={s.moneda} onChange={(e) => actualizarSeña(i, "moneda", e.target.value)} className={`${inputClass} !w-20 shrink-0 py-2`}><option value="USD">USD</option><option value="ARS">ARS</option></select><input type="number" value={s.monto} onChange={(e) => actualizarSeña(i, "monto", e.target.value)} className={`${inputClass} flex-1 min-w-0`} /></div></div>
                            <div><label className={labelClass}>Fecha</label><input type="date" value={s.fecha} onChange={(e) => actualizarSeña(i, "fecha", e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>Caja destino</label><select value={s.cajaDestino} onChange={(e) => actualizarSeña(i, "cajaDestino", e.target.value)} className={inputClass}><option value="">— elegir —</option>{CAJAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div>
                              <label className={labelClass}>Comprobante</label>
                              <button type="button" disabled title="Todavía no construido" className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[11px] font-bold text-amber-500 opacity-60 cursor-not-allowed">📎 Adjuntar</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Método de pago</label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={inputClass}>
                    <option value="">—</option><option>Contado</option><option>Financiado</option><option>Leasing</option><option>Permuta</option><option>Criptomonedas</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cuotas (plazo)</label>
                  <input type="number" value={cuotasPlazo} onChange={(e) => setCuotasPlazo(e.target.value)} disabled={metodoPago !== "Financiado"} placeholder="Ej. 12" className={inputClass} />
                  <p className="text-[10px] text-slate-400 mt-1">Solo si el método de pago es Financiado</p>
                </div>
                {metodoPago === "Financiado" && (
                  <div className="col-span-2">
                    <label className={labelClass}>Monto financiado por la financiera</label>
                    <input type="number" value={montoFinanciacion} onChange={(e) => setMontoFinanciacion(e.target.value)} className={inputClass} />
                    {!puedeGenerarCuotas && <p className="text-[10px] text-amber-600 mt-1">Tu rol no puede generar el plan de cuotas — quedará un aviso para Finanzas.</p>}
                  </div>
                )}
              </div>

              {!esEdicion && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Permuta</p>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={incluirPermuta} onChange={(e) => togglePermuta(e.target.checked)} className="w-4 h-4 accent-rose-600" /> Incluir vehículo en permuta</label>
                </div>
                {!incluirPermuta ? (
                  <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">Sin permuta. Activá el toggle si el comprador entrega un auto en parte de pago.</p>
                ) : (
                  <div className="space-y-3">
                    {permutas.map((p, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 relative">
                        {i > 0 && <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-2">Permuta #{i + 1}</p>}
                        {i > 0 && <button type="button" onClick={() => quitarPermuta(i)} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div><label className={labelClass}>{i === 0 ? "Valor de la permuta" : "Valor de la toma"}</label><div className="flex gap-1"><select value={p.moneda} onChange={(e) => actualizarPermuta(i, "moneda", e.target.value)} className={`${inputClass} !w-20 shrink-0`}><option value="USD">USD</option><option value="ARS">ARS</option></select><input type="number" value={p.valor} onChange={(e) => actualizarPermuta(i, "valor", e.target.value)} className={`${inputClass} flex-1 min-w-0`} /></div></div>
                          <div><label className={labelClass}>Precio de publicación</label><input type="number" value={p.precioPublicacion} onChange={(e) => actualizarPermuta(i, "precioPublicacion", e.target.value)} placeholder="A cuánto se va a publicar" className={inputClass} /></div>
                          <div><label className={labelClass}>Marca</label><input value={p.marca} onChange={(e) => actualizarPermuta(i, "marca", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Modelo</label><input value={p.modelo} onChange={(e) => actualizarPermuta(i, "modelo", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Año</label><input type="number" value={p.anio} onChange={(e) => actualizarPermuta(i, "anio", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Kilómetros</label><input type="number" value={p.km} onChange={(e) => actualizarPermuta(i, "km", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Patente</label><input value={p.patente} onChange={(e) => actualizarPermuta(i, "patente", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Color</label><input value={p.color} onChange={(e) => actualizarPermuta(i, "color", e.target.value)} className={inputClass} /></div>
                          <div><label className={labelClass}>Condición</label><select value={p.condicion} onChange={(e) => actualizarPermuta(i, "condicion", e.target.value)} className={inputClass}>{CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-3 mb-1.5">Cédula Verde del vehículo de permuta</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["Cédula Verde Frente", "Cédula Verde Dorso"].map((doc) => (
                            <button key={doc} type="button" disabled title="Todavía no construido" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed">📎 {doc}</button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2.5 mt-3 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                          <input type="checkbox" checked={p.cargarAlStock} onChange={(e) => actualizarPermuta(i, "cargarAlStock", e.target.checked)} className="w-4 h-4 accent-rose-600" />
                          <span className="flex-1">
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">🚗 Cargar este vehículo al Stock {i === 0 ? "automáticamente" : ""}</span>
                            {i === 0 && <span className="block text-[10px] text-slate-400">Al guardar la venta, el vehículo de permuta se crea en Stock con status Disponible y los datos cargados arriba.</span>}
                          </span>
                        </label>
                        {p.cargarAlStock && <input value={p.duenoNombre} onChange={(e) => actualizarPermuta(i, "duenoNombre", e.target.value)} placeholder={`Dueño: ${compradorNombre || "..."}`} className={`${inputClass} mt-2`} />}
                      </div>
                    ))}
                    <button type="button" onClick={agregarPermuta} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300"><Plus className="w-3.5 h-3.5" /> Agregar otra permuta</button>
                  </div>
                )}
              </div>
              )}

              <div>
                <p className={seccionClass}>🤝 Consignación</p>
                <p className="text-[10px] text-slate-400 mb-2">Elegí quién es el responsable. Él completará el precio y las observaciones directamente en el expediente.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Responsable de la consignación</label>
                    <select value={responsableConsignacion} onChange={(e) => setResponsableConsignacion(e.target.value)} className={inputClass}>
                      <option value="">— Seleccioná responsable —</option>
                      {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>🏛 Gestor asignado (quién va a llevar el trámite)</label>
                    <select value={gestorAsignado} onChange={(e) => setGestorAsignado(e.target.value)} className={inputClass}>
                      <option value="">— Sin asignar (lo define admin/gestoría) —</option>
                      {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className={seccionClass}>Comisión</p>
                <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 cursor-pointer mb-3">
                  <input type="checkbox" checked={comisionManual} onChange={(e) => setComisionManual(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
                  <span><span className="block text-xs font-bold text-amber-700 dark:text-amber-300">⚙ Carga manual de comisión</span><span className="block text-[10px] text-amber-700/70 dark:text-amber-300/60">Activá para editar libremente los % de comisión, salteando la regla fija.</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>% vendedor</label>
                    <input type="number" step="0.1" value={comisionVendedorEfectiva} onChange={(e) => setComisionVendedorPct(e.target.value)} disabled={!comisionEditable || vendedorCompartido} className={inputClass} />
                    {comisionEditable && !vendedorCompartido && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {comisionPresets.map((p) => (
                          <button key={p} type="button" onClick={() => setComisionVendedorPct(String(p))} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20">{p}%</button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{vendedorCompartido ? "Split — 0.5% por compartir" : comisionEditable ? "Manual — editable" : "Fijo — sin selección manual"}</p>
                  </div>
                  <div>
                    <label className={labelClass}>% consignación</label>
                    <input type="number" step="0.1" value={comisionConsignacionPct} onChange={(e) => setComisionConsignacionPct(e.target.value)} disabled={!comisionEditable} className={inputClass} />
                    <p className="text-[10px] text-slate-400 mt-1">{comisionEditable ? "Manual — editable" : "Fijo — se calcula automático en el panel verde"}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Extra cobrado al cliente (bruto)</label>
                    <div className="flex gap-1"><select value={extraMoneda} onChange={(e) => setExtraMoneda(e.target.value)} className={`${inputClass} !w-20 shrink-0`}><option value="USD">USD</option><option value="ARS">ARS</option></select><input type="number" value={extraMonto} onChange={(e) => setExtraMonto(e.target.value)} placeholder="Monto fijo" className={`${inputClass} flex-1 min-w-0`} /></div>
                    <p className="text-[10px] text-slate-400 mt-1">Recargo a favor de la agencia. De acá se liquida la parte del vendedor según el % de abajo.</p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                  <input type="checkbox" checked={vendedorCompartido} onChange={(e) => setVendedorCompartido(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
                  <span><span className="block text-xs font-bold text-slate-700 dark:text-slate-200">🤝 Vendedor compartido (split comisión 50/50)</span><span className="block text-[10px] text-slate-400">Activá esto si la comisión se reparte con otro vendedor — ambos pasan automáticamente a 0.5% cada uno{!comisionEditable ? " (no editable)" : ""}.</span></span>
                </label>
                {vendedorCompartido && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className={labelClass}>Comparte comisión con *</label>
                      <select value={companeroId} onChange={(e) => setCompaneroId(e.target.value)} className={inputClass}>
                        <option value="">— Seleccioná compañero —</option>
                        {perfiles.filter((p) => p.id !== vendedorId).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>% Comisión del compañero</label>
                      <input type="number" step="0.1" value={companeroPct} onChange={(e) => setCompaneroPct(e.target.value)} disabled={!comisionEditable} className={inputClass} />
                      <p className="text-[10px] text-slate-400 mt-1">{comisionEditable ? "Manual — editable" : "Fijo 0.5%"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className={seccionClass}>Items que se entregan con el vehículo</p>
                <p className="text-[10px] text-slate-400 mb-2">Marcá los que correspondan al cargar la operación. Sirve para el checklist de entrega y como conformidad para el comprador.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[["Tuerca de seguridad", entregaTuerca, setEntregaTuerca, "si corresponde"], ["Duplicado de llave", entregaLlave, setEntregaLlave, ""], ["Manuales", entregaManuales, setEntregaManuales, ""], ["Cédula", entregaCedula, setEntregaCedula, ""]].map(([label, val, setter, hint]: any) => (
                    <label key={label} className="flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="w-3.5 h-3.5 accent-rose-600" /> {label}</span>
                      {hint && <span className="text-[9px] text-slate-400 ml-5">{hint}</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className={seccionClass}>Documentos para el expediente</p>
                <p className="text-[10px] text-slate-400 mb-2">Podés adjuntar los archivos ahora o subirlos después desde el expediente. Máx. 15 MB por archivo.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["DNI Frente", "DNI Dorso", "Cédula Verde Frente", "Cédula Verde Dorso"].map((doc) => (
                    <div key={doc} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{doc}</span>
                      <button type="button" disabled title="Todavía no construido" className="text-[10px] font-bold text-amber-500 opacity-60 cursor-not-allowed">📎 Adjuntar</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Fecha de entrega</label>
                <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className={inputClass} />
              </div>
          </>

          <div>
            <label className={labelClass}>Notas generales</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas de la operación visibles para todos en el expediente. Quedan como primera entrada de la bitácora." className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Comentario para gestoría</label><textarea value={comentarioGestoria} onChange={(e) => setComentarioGestoria(e.target.value)} rows={2} placeholder="Transferencia, documentación, condiciones especiales..." className={`${inputClass} resize-none`} /></div>
            <div><label className={labelClass}>Comentario para finanzas</label><textarea value={comentarioFinanzas} onChange={(e) => setComentarioFinanzas(e.target.value)} rows={2} placeholder="Forma de pago al propietario, plazos, retenciones..." className={`${inputClass} resize-none`} /></div>
          </div>

          {esEdicion && (
            <>
              <div>
                <p className={seccionClass}><Bell className="w-3 h-3 inline -mt-0.5" /> Recordatorios post-venta</p>
                {recordatorios.length === 0 && recordatoriosNuevos.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                    <p className="text-2xl">🔔</p>
                    <p className="text-xs text-slate-400 mt-1">Sin recordatorios para esta venta.</p>
                    <button type="button" onClick={generarRecordatoriosAutomaticos} className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold">✨ Generar recordatorios automáticos</button>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-2">
                    {recordatorios.map((r) => (
                      <div key={r.id} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-700 dark:text-slate-200">{TIPOS_RECORDATORIO.find((t) => t.value === r.tipo)?.label || r.tipo}</span>
                        <span className="text-[10px] text-slate-400">{fmtFechaLocal(r.fecha_vencimiento)}</span>
                      </div>
                    ))}
                    {recordatoriosNuevos.map((r, i) => (
                      <div key={i} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2">
                        <span className="text-xs text-indigo-700 dark:text-indigo-300">{TIPOS_RECORDATORIO.find((t) => t.value === r.tipo)?.label || r.tipo} <span className="text-[10px] text-indigo-400">(sin guardar)</span></span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo-400">{fmtFechaLocal(r.fecha)}</span>
                          <button type="button" onClick={() => quitarRecordatorioNuevo(i)} className="text-indigo-300 hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Agregar recordatorio</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Tipo</label>
                      <select value={rTipo} onChange={(e) => setRTipo(e.target.value)} className={inputClass}>
                        {TIPOS_RECORDATORIO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Fecha</label>
                      <input type="date" value={rFecha} onChange={(e) => setRFecha(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Notas (opcional)</label>
                      <input value={rNotas} onChange={(e) => setRNotas(e.target.value)} placeholder="Aclaración..." className={inputClass} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button type="button" onClick={agregarRecordatorio} disabled={!rFecha} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">+ Agregar</button>
                    {(recordatorios.length > 0 || recordatoriosNuevos.length > 0) && <button type="button" onClick={generarRecordatoriosAutomaticos} className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Generar recordatorios automáticos</button>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Los cambios en recordatorios se guardan al apretar "Guardar cambios".</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={seccionClass}><Star className="w-3 h-3 inline -mt-0.5" /> Calificación del cliente</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${calificacionPedida ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-500"}`}>{calificacionPedida ? "Pedida" : "Sin pedir aún"}</span>
                </div>
                <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                  <input type="checkbox" checked={calificacionPedida} onChange={(e) => setCalificacionPedida(e.target.checked)} className="w-4 h-4 mt-0.5 accent-rose-600" />
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Se le pidió calificación al cliente (google review / encuesta NPS / formulario interno).</span>
                </label>
              </div>
            </>
          )}

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cancelar</button>
          {!esEdicion && <button type="button" onClick={() => guardar(true)} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl disabled:opacity-50"><Save className="w-4 h-4" /> Guardar borrador</button>}
          <button type="button" onClick={() => guardar(false)} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {esEdicion ? "Guardar cambios" : "Crear venta"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

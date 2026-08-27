"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { notificarEncargados, notificarGestoria } from "@/lib/notificaciones";
import { crearTramite } from "@/lib/tramites";
import { ArrowLeft, Receipt, Save, Upload, Loader2 } from "lucide-react";
import { mostrarToast } from "@/lib/toast";
import ClienteBuscador, { ClienteSeleccionado } from "../../ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "../../VehiculoSelector";
import ConfirmarPrecioModal from "../../ConfirmarPrecioModal";

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function BoletoVentaForm({
  clientes, vehiculos, vendedores, sucursales, senas, cuentas, vinculoLead, revertirEstado,
}: {
  clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; senas: any[]; cuentas: any[]; vinculoLead?: { campo: string; id: string } | null;
  revertirEstado?: { id: string; estadoAnterior: string } | null;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [senaId, setSenaId] = useState("");
  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [sucursalId, setSucursalId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [miId, setMiId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMiId(data.user?.id || null));
  }, []);
  const vendedoresSinYo = vendedores.filter((v) => v.id !== miId);

  const [ventaArs, setVentaArs] = useState("");
  const [ventaUsd, setVentaUsd] = useState("");
  const [senaArs, setSenaArs] = useState("");
  const [senaUsd, setSenaUsd] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [patentTransf, setPatentTransf] = useState("");
  const [porcentajeComision, setPorcentajeComision] = useState("");

  const [bancoPrenda, setBancoPrenda] = useState("");
  const [prendaMonto, setPrendaMonto] = useState("");
  const [cuotasPrenda, setCuotasPrenda] = useState("");
  const [cuotaPrendaArs, setCuotaPrendaArs] = useState("");
  const [seguroPrendaArs, setSeguroPrendaArs] = useState("");

  const [seguroCompania, setSeguroCompania] = useState("");
  const [seguroImporte, setSeguroImporte] = useState("");

  const [cuentaOrdenNombre, setCuentaOrdenNombre] = useState("");
  const [cuentaOrdenDni, setCuentaOrdenDni] = useState("");
  const [cuentaOrdenDireccion, setCuentaOrdenDireccion] = useState("");

  const [observaciones, setObservaciones] = useState("");
  const [mostrarModalPrecio, setMostrarModalPrecio] = useState(false);

  const [cuentaId, setCuentaId] = useState("");
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaId);

  const subirComprobante = async (file: File) => {
    setSubiendoComprobante(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el comprobante.");
      setComprobanteUrl(data.publicUrl);
    } catch {
      mostrarToast("No se pudo subir el comprobante.", "error");
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const [efectivoArs, setEfectivoArs] = useState("");
  const [efectivoUsd, setEfectivoUsd] = useState("");
  const [recibePermuta, setRecibePermuta] = useState(false);
  const [vehiculoPermuta, setVehiculoPermuta] = useState<VehiculoDatos | null>(null);
  const [permutaTasadoArs, setPermutaTasadoArs] = useState("");
  const [fechaPrimeraCuotaRemanente, setFechaPrimeraCuotaRemanente] = useState("");
  const [cantCuotasRemanente, setCantCuotasRemanente] = useState("");
  const [cuotaRemanenteArs, setCuotaRemanenteArs] = useState("");

  const saldoCalculado = useMemo(() => {
    const v = Number(ventaArs) || 0;
    const s = Number(senaArs) || 0;
    const p = Number(prendaMonto) || 0;
    const t = Number(patentTransf) || 0;
    return v + t - s - p;
  }, [ventaArs, senaArs, prendaMonto, patentTransf]);

  const remanenteCalculado = useMemo(() => {
    const e = Number(efectivoArs) || 0;
    const perm = Number(permutaTasadoArs) || 0;
    return saldoCalculado - e - perm;
  }, [saldoCalculado, efectivoArs, permutaTasadoArs]);

  const comisionCalculada = useMemo(() => {
    const v = Number(ventaArs) || 0;
    const pct = Number(porcentajeComision) || 0;
    return (v * pct) / 100;
  }, [ventaArs, porcentajeComision]);

  // Auto-completa Venta con el precio publicado del auto — solo en boletos directos
  // (sin seña previa, que ya trae su propio precio ya acordado con el cliente).
  useEffect(() => {
    if (senaId || !vehiculo?.vehiculo_id) return;
    if (vehiculo.precio_publicado_ars) setVentaArs(String(vehiculo.precio_publicado_ars));
    if (vehiculo.precio_publicado_usd) setVentaUsd(String(vehiculo.precio_publicado_usd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.vehiculo_id]);

  const aplicarSena = (id: string) => {
    setSenaId(id);
    if (!id) return;
    const s = senas.find((x) => x.id === id);
    if (!s) return;
    setSucursalId(s.sucursal_id || "");
    setVendedorId(s.vendedor_id || "");
    setVentaArs(s.venta_ars ? String(s.venta_ars) : "");
    setVentaUsd(s.venta_usd ? String(s.venta_usd) : "");
    setSenaArs(s.sena_ars ? String(s.sena_ars) : "");
    setSenaUsd(s.sena_usd ? String(s.sena_usd) : "");
    setTipoCambio(s.tipo_cambio ? String(s.tipo_cambio) : "");
    setVehiculo({
      vehiculo_id: s.vehiculo_id, dominio: s.dominio || "", segmento: s.segmento || "",
      marca: s.marca || "", modelo: s.modelo || "", tipo: s.tipo || "",
      marca_motor: s.marca_motor || "", numero_motor: s.numero_motor || "",
      marca_chasis: s.marca_chasis || "", numero_chasis: s.numero_chasis || "",
      modelo_anio: String(s.modelo_anio || ""), color: s.color || "", kilometros: "", combustible: "",
      transmision: "", traccion: "",
    });
    if (s.cliente_id) {
      const c = clientes.find((x) => x.id === s.cliente_id);
      if (c) setCliente(c);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return mostrarToast("Elegí o cargá un cliente.", "error");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return mostrarToast("Elegí o cargá el vehículo.", "error");
    if (!sucursalId) return mostrarToast("Elegí la sucursal.", "error");
    setMostrarModalPrecio(true);
  };

  const guardarVenta = async (precioConfirmado: boolean) => {
    if (!cliente || !vehiculo) return;
    setMostrarModalPrecio(false);
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ultimo } = await supabase.from("boletos_venta").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const senaSeleccionada = senas.find((s) => s.id === senaId);
      const generarCodigoSeguimiento = () =>
        Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
      const codigoSeguimiento = generarCodigoSeguimiento();

      const { data, error } = await supabase.from("boletos_venta").insert({
        numero: siguienteNumero,
        fecha: new Date().toISOString().split("T")[0],
        sucursal_id: sucursalId,
        vendedor_id: vendedorId || user?.id,
        sena_id: senaId || null,
        numero_sena: senaSeleccionada?.numero || null,
        ...(vinculoLead ? { [vinculoLead.campo]: vinculoLead.id } : {}),
        cliente_id: cliente.id,
        dni: cliente.dni,
        fecha_nacimiento: cliente.fecha_nacimiento || null,
        apellido: cliente.apellido,
        nombre: cliente.nombre,
        calle: cliente.calle,
        numero_calle: cliente.numero,
        depto: cliente.depto,
        localidad: cliente.localidad,
        codigo_postal: cliente.codigo_postal,
        provincia: cliente.provincia,
        telefono_linea: cliente.telefono_linea,
        telefono_celular: cliente.telefono_celular,
        correo_electronico: cliente.correo_electronico,
        cuit_cuil: cliente.cuit_cuil,
        estado_civil: cliente.estado_civil,
        profesion: cliente.profesion,
        vehiculo_id: vehiculo.vehiculo_id,
        dominio: vehiculo.dominio,
        segmento: vehiculo.segmento,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        tipo: vehiculo.tipo,
        marca_motor: vehiculo.marca_motor,
        numero_motor: vehiculo.numero_motor,
        marca_chasis: vehiculo.marca_chasis,
        numero_chasis: vehiculo.numero_chasis,
        modelo_anio: vehiculo.modelo_anio ? Number(vehiculo.modelo_anio) : null,
        color: vehiculo.color,
        cuenta_orden_apellido_nombre: cuentaOrdenNombre || null,
        cuenta_orden_dni: cuentaOrdenDni || null,
        cuenta_orden_direccion: cuentaOrdenDireccion || null,
        venta_ars: ventaArs ? Number(ventaArs) : null,
        venta_usd: ventaUsd ? Number(ventaUsd) : null,
        sena_ars: senaArs ? Number(senaArs) : null,
        sena_usd: senaUsd ? Number(senaUsd) : null,
        tipo_cambio: tipoCambio ? Number(tipoCambio) : null,
        patentamiento_transferencia_ars: patentTransf ? Number(patentTransf) : null,
        banco_prenda: bancoPrenda || null,
        prenda_monto: prendaMonto ? Number(prendaMonto) : null,
        cant_cuotas_prenda: cuotasPrenda ? Number(cuotasPrenda) : null,
        cuota_prenda_ars: cuotaPrendaArs ? Number(cuotaPrendaArs) : null,
        seguro_prenda_ars: seguroPrendaArs ? Number(seguroPrendaArs) : null,
        saldo_abonar_ars: saldoCalculado,
        seguro_compania: seguroCompania || null,
        seguro_importe_mensual: seguroImporte ? Number(seguroImporte) : null,
        comision_ars: comisionCalculada || null,
        porcentaje_comision: porcentajeComision ? Number(porcentajeComision) : null,
        codigo_seguimiento: codigoSeguimiento,
        etapa_seguimiento: "Seña",
        observaciones: observaciones || null,
        precio_confirmado: precioConfirmado,
        efectivo_ars: efectivoArs ? Number(efectivoArs) : null,
        efectivo_usd: efectivoUsd ? Number(efectivoUsd) : null,
        permuta_vehiculo_id: recibePermuta ? vehiculoPermuta?.vehiculo_id || null : null,
        permuta_tasado_ars: recibePermuta && permutaTasadoArs ? Number(permutaTasadoArs) : null,
        remanente_ars: remanenteCalculado,
        fecha_primera_cuota_remanente: fechaPrimeraCuotaRemanente || null,
        cant_cuotas_remanente: cantCuotasRemanente ? Number(cantCuotasRemanente) : null,
        cuota_remanente_ars: cuotaRemanenteArs ? Number(cuotaRemanenteArs) : null,
      }).select("id").single();

      if (error) throw error;

      if (!precioConfirmado) {
        await notificarEncargados(
          supabase,
          `${cliente.nombre} ${cliente.apellido} — Venta N° ${siguienteNumero}: el vendedor no confirmó el precio ($${(Number(ventaArs) || 0).toLocaleString("es-AR")}). Verificalo.`,
          `/panel/boletos/imprimir/${data.id}`,
          "boletos"
        );
      }

      if (vehiculo.vehiculo_id) {
        await fetch("/api/vehiculos/reservar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehiculoId: vehiculo.vehiculo_id, estado: "Vendido" }),
        }).catch(() => {});
      }
      if (senaId) {
        await supabase.from("senas").update({ estado: "Convertida" }).eq("id", senaId);
      }

      // Cobro real de la venta: si se eligió cuenta destino, el efectivo cobrado
      // hoy (no el saldo financiado a futuro) queda registrado en Tesorería,
      // pendiente de aprobación. Opcional — sin cuenta no se genera nada.
      if (cuentaId) {
        const montoMovimiento = cuentaSeleccionada?.moneda === "USD" ? Number(efectivoUsd) || 0 : Number(efectivoArs) || 0;
        if (montoMovimiento > 0) {
          const { error: errorMov } = await supabase.from("movimientos_caja").insert({
            tipo: "ingreso",
            monto: montoMovimiento,
            forma_pago: "Transferencia",
            fecha: new Date().toISOString().split("T")[0],
            vehiculo_id: vehiculo.vehiculo_id,
            sucursal_id: sucursalId,
            cuenta_id: cuentaId,
            cliente_id: cliente.id,
            cuit_dni: cliente.dni,
            telefono: cliente.telefono_celular,
            patente: vehiculo.dominio,
            vendedor_id: vendedorId || user?.id,
            venta_id: data.id,
            tipo_movimiento: "Pago Venta",
            comprobante_url: comprobanteUrl || null,
            observaciones: `Venta N° ${siguienteNumero} — ${vehiculo.marca} ${vehiculo.modelo}`,
          });
          if (errorMov) {
            mostrarToast("La venta se guardó, pero no se pudo registrar el cobro en Tesorería. Cargalo a mano en Gastos.", "error");
          } else {
            await notificarGestoria(
              supabase,
              `Nuevo cobro pendiente de aprobar — Venta N° ${siguienteNumero} (${cliente.nombre} ${cliente.apellido}, $${montoMovimiento.toLocaleString("es-AR")})`,
              "/panel/ventas/gestoria/aprobaciones"
            );
          }
        }
      }

      const documentosDocumentacion = [
        "Formulario 08 (Firmada)", "Formulario 02 (Informe de Dominio)", "Infracciones (SUAT)",
        "Título (CAT)", "Cédula Verde", "Cédula Azul", "Informe de Prenda (SUAT)",
        "Grabado de Autopartes", "VTV", "Copia de Llave", "Manuales",
      ];
      const documentosPatentamiento = ["Aranceles 6% Total", "Informes 51"];
      const documentosSena = ["Título del Auto", "DNI", "CUIT/CUIL"];

      await supabase.from("documentacion_ventas").insert([
        {
          venta_id: data.id,
          tipo_documento: `Seña Pagada ($${(Number(senaArs) || 0).toLocaleString("es-AR")})`,
          etapa: "Seña",
          estado: "Recibido",
          fecha_recibido: new Date().toISOString().split("T")[0],
        },
        ...documentosSena.map((tipo_documento) => ({ venta_id: data.id, tipo_documento, etapa: "Seña" })),
        ...documentosDocumentacion.map((tipo_documento) => ({ venta_id: data.id, tipo_documento, etapa: "Documentación" })),
        ...documentosPatentamiento.map((tipo_documento) => ({ venta_id: data.id, tipo_documento, etapa: "Patentamiento" })),
      ]);

      // Toda venta genera su trámite de gestoría (transferencia) — nace ya
      // conectado al vehículo y a esta venta, sin pedirle nada de nuevo a Gestoría.
      if (vehiculo?.vehiculo_id) {
        await crearTramite(supabase, { vehiculoId: vehiculo.vehiculo_id, ventaId: data.id, tipoTramite: "Transferencia" });
      }

      if (bancoPrenda && Number(prendaMonto) > 0) {
        const primerVencimiento = new Date();
        primerVencimiento.setMonth(primerVencimiento.getMonth() + 1);
        await supabase.from("financiaciones").insert({
          venta_id: data.id,
          tipo: "Prenda Bancaria",
          entidad: bancoPrenda,
          monto: Number(prendaMonto),
          cuotas: cuotasPrenda ? Number(cuotasPrenda) : null,
          fecha_vencimiento: primerVencimiento.toISOString().split("T")[0],
          estado: "Pendiente",
        });
      }

      fetch("/api/ventas/agradecimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boleto_id: data.id }),
      }).catch(() => {});

      router.push(`/panel/boletos/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      mostrarToast("Error al guardar la venta.", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-[#0a2a6b] pb-4">
          <div>
            <button
              type="button"
              onClick={async () => {
                if (revertirEstado) {
                  await supabase.from("cotizaciones").update({ estado: revertirEstado.estadoAnterior }).eq("id", revertirEstado.id);
                }
                router.push("/panel/boletos");
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors mb-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-300" /> Nueva Venta
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {senas.length > 0 && (
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">¿Convertir una seña?</h2>
              <select className={inputClass} value={senaId} onChange={(e) => aplicarSena(e.target.value)}>
                <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Empezar desde cero</option>
                {senas.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">N° {s.numero} — {s.apellido}, {s.nombre} — {s.marca} {s.modelo}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Sucursal y vendedor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Sucursal *</label>
                <select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} required>
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar...</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Vendedor</label>
                <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vos (usuario actual)</option>
                  {vendedoresSinYo.map((v) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Cliente</h2>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Vehículo</h2>
            <VehiculoSelector
              vehiculos={vehiculos}
              datos={vehiculo}
              onCambiar={setVehiculo}
              persistirManual
              sucursalId={sucursalId}
              origen="Comprado"
            />
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Por cuenta y orden de (opcional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className={inputClass} placeholder="Apellido y nombre" value={cuentaOrdenNombre} onChange={(e) => setCuentaOrdenNombre(e.target.value)} />
              <input className={inputClass} placeholder="DNI" value={cuentaOrdenDni} onChange={(e) => setCuentaOrdenDni(e.target.value)} />
              <input className={`${inputClass} col-span-2`} placeholder="Dirección" value={cuentaOrdenDireccion} onChange={(e) => setCuentaOrdenDireccion(e.target.value)} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Datos comerciales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Venta ($)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={ventaArs} onChange={(e) => setVentaArs(e.target.value)} disabled={!!ventaUsd} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Venta (US$)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={ventaUsd} onChange={(e) => setVentaUsd(e.target.value)} disabled={!!ventaArs} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Seña ($)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={senaArs} onChange={(e) => setSenaArs(e.target.value)} disabled={!!senaUsd} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Seña (US$)</label>
                <input type="number" step="0.01" className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`} value={senaUsd} onChange={(e) => setSenaUsd(e.target.value)} disabled={!!senaArs} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Tipo de cambio</label>
                <input type="number" step="0.01" className={inputClass} value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Patentamiento / Transferencia ($)</label>
                <input type="number" step="0.01" className={inputClass} value={patentTransf} onChange={(e) => setPatentTransf(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Comisión del vendedor (%)</label>
                <input type="number" step="0.01" className={inputClass} value={porcentajeComision} onChange={(e) => setPorcentajeComision(e.target.value)} placeholder="0" />
                {comisionCalculada > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-300 font-bold mt-1">$ {comisionCalculada.toLocaleString("es-AR")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Forma de Pago</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">En Efectivo ($)</label>
                <input type="number" step="0.01" className={inputClass} value={efectivoArs} onChange={(e) => setEfectivoArs(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">En Efectivo (US$)</label>
                <input type="number" step="0.01" className={inputClass} value={efectivoUsd} onChange={(e) => setEfectivoUsd(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Registrar cobro en Tesorería (opcional)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Si elegís una cuenta, lo cobrado en efectivo hoy queda cargado en Tesorería (pendiente de aprobación).</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Cuenta destino</label>
                  <select className={inputClass} value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">No registrar en Tesorería</option>
                    {cuentas.map((c) => (<option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre} ({c.moneda})</option>))}
                  </select>
                </div>
                {cuentaId && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Comprobante</label>
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-[#00246b] border border-dashed border-slate-300 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[#002a6e] transition-colors">
                      {subiendoComprobante ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Upload className="w-4 h-4 text-slate-400" />}
                      <span className="text-slate-500 dark:text-slate-400 truncate">{comprobanteUrl ? "Comprobante cargado ✓" : subiendoComprobante ? "Subiendo..." : "Subir comprobante"}</span>
                      <input type="file" accept="image/*,.pdf" className="hidden" disabled={subiendoComprobante} onChange={(e) => e.target.files?.[0] && subirComprobante(e.target.files[0])} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-4 rounded-xl hover:bg-white dark:hover:bg-[#002a6e] w-fit transition-colors font-medium">
              <input type="checkbox" checked={recibePermuta} onChange={(e) => setRecibePermuta(e.target.checked)} className="w-4 h-4 accent-indigo-600" /> ¿Recibe auto en permuta?
            </label>

            {recibePermuta && (
              <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-700 space-y-4">
                <VehiculoSelector
                  vehiculos={[]}
                  datos={vehiculoPermuta}
                  onCambiar={setVehiculoPermuta}
                  persistirManual
                  soloManual
                  sucursalId={sucursalId}
                  origen="Permuta"
                />
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Tasado en ($)</label>
                  <input type="number" step="0.01" className={inputClass} value={permutaTasadoArs} onChange={(e) => setPermutaTasadoArs(e.target.value)} placeholder="0" />
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Remanente</span>
              <strong className="text-lg font-black text-slate-900 dark:text-white">$ {remanenteCalculado.toLocaleString("es-AR")}</strong>
            </div>

            {remanenteCalculado > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Fecha 1ª Cuota</label>
                  <input type="date" className={inputClass} value={fechaPrimeraCuotaRemanente} onChange={(e) => setFechaPrimeraCuotaRemanente(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Cant. de Cuotas</label>
                  <input type="number" className={inputClass} value={cantCuotasRemanente} onChange={(e) => setCantCuotasRemanente(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Cuota ($)</label>
                  <input type="number" step="0.01" className={inputClass} value={cuotaRemanenteArs} onChange={(e) => setCuotaRemanenteArs(e.target.value)} placeholder="0" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">Prenda (opcional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className={inputClass} placeholder="Banco de la prenda" value={bancoPrenda} onChange={(e) => setBancoPrenda(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Monto de la prenda" value={prendaMonto} onChange={(e) => setPrendaMonto(e.target.value)} />
              <input type="number" className={inputClass} placeholder="Cantidad de cuotas" value={cuotasPrenda} onChange={(e) => setCuotasPrenda(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Cuota de prenda ($)" value={cuotaPrendaArs} onChange={(e) => setCuotaPrendaArs(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Seguro de prenda ($)" value={seguroPrendaArs} onChange={(e) => setSeguroPrendaArs(e.target.value)} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">¿Contrata seguro?</h2>
            <div className="grid grid-cols-2 gap-4">
              <input className={inputClass} placeholder="Compañía" value={seguroCompania} onChange={(e) => setSeguroCompania(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Importe mensual" value={seguroImporte} onChange={(e) => setSeguroImporte(e.target.value)} />
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-[#002a6e] border border-indigo-200 dark:border-[#0a2a6b] rounded-2xl p-6 flex items-center justify-between">
            <span className="text-[13px] font-bold uppercase tracking-widest text-indigo-700 dark:text-sky-300">Saldo a abonar (calculado)</span>
            <strong className="text-2xl font-black text-indigo-900 dark:text-white">$ {saldoCalculado.toLocaleString("es-AR")}</strong>
          </div>

          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">Observaciones</label>
            <textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <button type="submit" disabled={guardando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Venta"}
          </button>
        </form>

        {mostrarModalPrecio && (
          <ConfirmarPrecioModal
            precioTexto={`Venta $ ${(Number(ventaArs) || 0).toLocaleString("es-AR")}${senaArs ? ` · Seña $ ${Number(senaArs).toLocaleString("es-AR")}` : ""}`}
            onConfirmar={() => guardarVenta(true)}
            onNoSeguro={() => guardarVenta(false)}
            onCancelar={() => setMostrarModalPrecio(false)}
          />
        )}
      </div>
    </div>
  );
}

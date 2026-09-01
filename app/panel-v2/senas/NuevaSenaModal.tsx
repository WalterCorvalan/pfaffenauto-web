"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { notificarEncargados, notificarGestoria } from "@/lib/panelV2/notificaciones";
import { Wallet, Save, Upload, Loader2, X } from "lucide-react";
import ClienteBuscador, { ClienteSeleccionado } from "@/components/panelV2/ClienteBuscador";
import VehiculoSelector, { VehiculoDatos } from "@/components/panelV2/VehiculoSelector";
import ConfirmarPrecioModal from "@/components/panelV2/ConfirmarPrecioModal";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-white/10 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5";

export default function NuevaSenaModal({
  clientes, vehiculos, vendedores, sucursales, cuentas, onClose,
}: { clientes: any[]; vehiculos: any[]; vendedores: any[]; sucursales: any[]; cuentas: any[]; onClose: () => void }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoDatos | null>(null);
  const [sucursalId, setSucursalId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [ventaArs, setVentaArs] = useState("");
  const [ventaUsd, setVentaUsd] = useState("");
  const [senaArs, setSenaArs] = useState("");
  const [senaUsd, setSenaUsd] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [patentTransf, setPatentTransf] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarModalPrecio, setMostrarModalPrecio] = useState(false);
  const [miId, setMiId] = useState<string | null>(null);

  const [cuentaId, setCuentaId] = useState("");
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaId);

  const subirComprobante = async (file: File) => {
    setSubiendoComprobante(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("carpeta", "comprobantes");
      const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el comprobante.");
      setComprobanteUrl(data.publicUrl);
    } catch {
      alert("No se pudo subir el comprobante.");
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

  const [bancoPrenda, setBancoPrenda] = useState("");
  const [prendaMonto, setPrendaMonto] = useState("");
  const [cuotasPrenda, setCuotasPrenda] = useState("");
  const [cuotaPrendaArs, setCuotaPrendaArs] = useState("");
  const [seguroPrendaArs, setSeguroPrendaArs] = useState("");

  const [seguroCompania, setSeguroCompania] = useState("");
  const [seguroImporte, setSeguroImporte] = useState("");

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

  useEffect(() => {
    supabase2.auth.getUser().then(({ data }) => setMiId(data.user?.id || null));
  }, []);

  const vendedoresSinYo = vendedores.filter((v) => v.id !== miId);

  useEffect(() => {
    if (!vehiculo?.vehiculo_id) return;
    if (vehiculo.precio_publicado_ars) setVentaArs(String(vehiculo.precio_publicado_ars));
    if (vehiculo.precio_publicado_usd) setVentaUsd(String(vehiculo.precio_publicado_usd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.vehiculo_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return alert("Elegí o cargá un cliente.");
    if (!vehiculo || !vehiculo.marca || !vehiculo.modelo) return alert("Elegí o cargá el vehículo.");
    if (!sucursalId) return alert("Elegí la sucursal.");
    setMostrarModalPrecio(true);
  };

  const guardarSena = async (precioConfirmado: boolean) => {
    if (!cliente || !vehiculo) return;
    setMostrarModalPrecio(false);
    setGuardando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { data: ultimo } = await supabase2.from("senas").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
      const siguienteNumero = (ultimo?.numero || 0) + 1;
      const codigoSeguimiento = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

      const { data, error } = await supabase2.from("senas").insert({
        numero: siguienteNumero,
        codigo_seguimiento: codigoSeguimiento,
        etapa_seguimiento: "Activa",
        fecha: new Date().toISOString().split("T")[0],
        sucursal_id: sucursalId,
        vendedor_id: vendedorId || user?.id,
        estado: "Activa",
        cliente_id: cliente.id,
        cliente_nombre: `${cliente.apellido || ""} ${cliente.nombre}`.trim(),
        dni: cliente.dni_cuit,
        fecha_nacimiento: cliente.fecha_nacimiento || null,
        apellido: cliente.apellido,
        nombre: cliente.nombre,
        calle: cliente.calle,
        numero_calle: cliente.numero_calle,
        depto: cliente.depto,
        localidad: cliente.localidad,
        codigo_postal: cliente.codigo_postal,
        provincia: cliente.provincia,
        telefono_linea: cliente.telefono_linea,
        telefono_celular: cliente.telefono,
        correo_electronico: cliente.email,
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
        venta_ars: ventaArs ? Number(ventaArs) : null,
        venta_usd: ventaUsd ? Number(ventaUsd) : null,
        sena_ars: senaArs ? Number(senaArs) : null,
        sena_usd: senaUsd ? Number(senaUsd) : null,
        monto: senaArs ? Number(senaArs) : (senaUsd ? Number(senaUsd) : null),
        moneda: senaUsd && !senaArs ? "USD" : "ARS",
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
        notas: observaciones || null,
        precio_confirmado: precioConfirmado,
        efectivo_ars: efectivoArs ? Number(efectivoArs) : null,
        efectivo_usd: efectivoUsd ? Number(efectivoUsd) : null,
        permuta_vehiculo_id: recibePermuta ? vehiculoPermuta?.vehiculo_id || null : null,
        permuta_tasado_ars: recibePermuta && permutaTasadoArs ? Number(permutaTasadoArs) : null,
        remanente_ars: remanenteCalculado,
        fecha_primera_cuota_remanente: fechaPrimeraCuotaRemanente || null,
        cant_cuotas_remanente: cantCuotasRemanente ? Number(cantCuotasRemanente) : null,
        cuota_remanente_ars: cuotaRemanenteArs ? Number(cuotaRemanenteArs) : null,
        cuenta_id: cuentaId || null,
        comprobante_url: comprobanteUrl || null,
      }).select("id").single();

      if (error) throw error;

      if (vehiculo.vehiculo_id) {
        const { error: errRes } = await supabase2.from("vehiculos").update({ estado: "señado" }).eq("id", vehiculo.vehiculo_id);
        if (errRes) alert("La seña se guardó, pero no se pudo marcar el auto como Señado. Avisá a un encargado.");
      }

      if (!precioConfirmado) {
        await notificarEncargados(
          supabase2,
          `${cliente.nombre} ${cliente.apellido || ""} — Seña N° ${siguienteNumero}: el vendedor no confirmó el precio ($${(Number(ventaArs) || 0).toLocaleString("es-AR")}). Verificalo.`,
          `/panel-v2/senas/imprimir/${data.id}`
        );
      }

      if (cuentaId) {
        const montoMovimiento = cuentaSeleccionada?.moneda === "USD" ? Number(senaUsd) || 0 : Number(senaArs) || 0;
        const { error: errorMov } = await supabase2.from("movimientos_caja").insert({
          tipo: "ingreso", monto: montoMovimiento, forma_pago: "Transferencia", fecha: new Date().toISOString().split("T")[0],
          vehiculo_id: vehiculo.vehiculo_id, sucursal_id: sucursalId, cuenta_id: cuentaId, cliente_id: cliente.id,
          cuit_dni: cliente.dni_cuit, telefono: cliente.telefono, patente: vehiculo.dominio, vendedor_id: vendedorId || user?.id,
          sena_id: data.id, tipo_movimiento: "Seña", comprobante_url: comprobanteUrl || null,
          observaciones: `Seña N° ${siguienteNumero} — ${vehiculo.marca} ${vehiculo.modelo}`,
        });
        if (errorMov) {
          alert("La seña se guardó, pero no se pudo registrar el cobro en Tesorería. Cargalo a mano.");
        } else {
          await notificarGestoria(supabase2, `Nuevo cobro pendiente de aprobar — Seña N° ${siguienteNumero} (${cliente.nombre} ${cliente.apellido || ""}, $${montoMovimiento.toLocaleString("es-AR")})`, "/panel-v2/tesoreria");
        }
      }

      onClose();
      router.push(`/panel-v2/senas/imprimir/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la seña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Wallet className="w-5 h-5 text-rose-600" /> Nueva Seña</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-6">
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Sucursal y vendedor</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sucursal *</label>
                <select className={inputClass} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vendedor</label>
                <select className={inputClass} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  <option value="">Vos (usuario actual)</option>
                  {vendedoresSinYo.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Cliente</h3>
            <ClienteBuscador clientes={clientes} seleccionado={cliente} onSeleccionar={setCliente} />
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Vehículo</h3>
            <VehiculoSelector vehiculos={vehiculos} datos={vehiculo} onCambiar={setVehiculo} persistirManual sucursalId={sucursalId} />
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Datos comerciales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Venta ($)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={ventaArs} onChange={(e) => setVentaArs(e.target.value)} disabled={!!ventaUsd} placeholder="0" /></div>
              <div><label className={labelClass}>Venta (US$)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={ventaUsd} onChange={(e) => setVentaUsd(e.target.value)} disabled={!!ventaArs} placeholder="0" /></div>
              <div><label className={labelClass}>Seña ($)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={senaArs} onChange={(e) => setSenaArs(e.target.value)} disabled={!!senaUsd} placeholder="0" /></div>
              <div><label className={labelClass}>Seña (US$)</label><input type="number" step="0.01" className={`${inputClass} disabled:opacity-50`} value={senaUsd} onChange={(e) => setSenaUsd(e.target.value)} disabled={!!senaArs} placeholder="0" /></div>
              <div><label className={labelClass}>Tipo de cambio</label><input type="number" step="0.01" className={inputClass} value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} placeholder="0" /></div>
              <div><label className={labelClass}>Patentamiento / Transferencia ($)</label><input type="number" step="0.01" className={inputClass} value={patentTransf} onChange={(e) => setPatentTransf(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Registrar cobro en Tesorería (opcional)</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Si elegís una cuenta, el cobro queda cargado en Tesorería (pendiente de aprobación).</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cuenta destino</label>
                <select className={inputClass} value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                  <option value="">No registrar en Tesorería</option>
                  {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
                </select>
              </div>
              {cuentaId && (
                <div>
                  <label className={labelClass}>Comprobante</label>
                  <label className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    {subiendoComprobante ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Upload className="w-4 h-4 text-slate-400" />}
                    <span className="text-slate-500 dark:text-slate-400 truncate">{comprobanteUrl ? "Comprobante cargado ✓" : subiendoComprobante ? "Subiendo..." : "Subir comprobante"}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" disabled={subiendoComprobante} onChange={(e) => e.target.files?.[0] && subirComprobante(e.target.files[0])} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Forma de Pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>En Efectivo ($)</label><input type="number" step="0.01" className={inputClass} value={efectivoArs} onChange={(e) => setEfectivoArs(e.target.value)} placeholder="0" /></div>
              <div><label className={labelClass}>En Efectivo (US$)</label><input type="number" step="0.01" className={inputClass} value={efectivoUsd} onChange={(e) => setEfectivoUsd(e.target.value)} placeholder="0" /></div>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 w-fit transition-colors font-medium">
              <input type="checkbox" checked={recibePermuta} onChange={(e) => setRecibePermuta(e.target.checked)} className="w-4 h-4 accent-rose-600" /> ¿Recibe auto en permuta?
            </label>

            {recibePermuta && (
              <div className="pl-4 border-l-2 border-rose-200 dark:border-rose-500/30 space-y-4">
                <VehiculoSelector vehiculos={[]} datos={vehiculoPermuta} onCambiar={setVehiculoPermuta} persistirManual soloManual sucursalId={sucursalId} origen="Permuta" />
                <div><label className={labelClass}>Tasado en ($)</label><input type="number" step="0.01" className={inputClass} value={permutaTasadoArs} onChange={(e) => setPermutaTasadoArs(e.target.value)} placeholder="0" /></div>
              </div>
            )}

            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Remanente</span>
              <strong className="text-lg font-black text-slate-900 dark:text-white">$ {remanenteCalculado.toLocaleString("es-AR")}</strong>
            </div>

            {remanenteCalculado > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelClass}>Fecha 1ª Cuota</label><input type="date" className={inputClass} value={fechaPrimeraCuotaRemanente} onChange={(e) => setFechaPrimeraCuotaRemanente(e.target.value)} /></div>
                <div><label className={labelClass}>Cant. de Cuotas</label><input type="number" className={inputClass} value={cantCuotasRemanente} onChange={(e) => setCantCuotasRemanente(e.target.value)} placeholder="0" /></div>
                <div><label className={labelClass}>Cuota ($)</label><input type="number" step="0.01" className={inputClass} value={cuotaRemanenteArs} onChange={(e) => setCuotaRemanenteArs(e.target.value)} placeholder="0" /></div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">Prenda (opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className={inputClass} placeholder="Banco de la prenda" value={bancoPrenda} onChange={(e) => setBancoPrenda(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Monto de la prenda" value={prendaMonto} onChange={(e) => setPrendaMonto(e.target.value)} />
              <input type="number" className={inputClass} placeholder="Cantidad de cuotas" value={cuotasPrenda} onChange={(e) => setCuotasPrenda(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Cuota de prenda ($)" value={cuotaPrendaArs} onChange={(e) => setCuotaPrendaArs(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Seguro de prenda ($)" value={seguroPrendaArs} onChange={(e) => setSeguroPrendaArs(e.target.value)} />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/10 pb-3">¿Contrata seguro?</h3>
            <div className="grid grid-cols-2 gap-4">
              <input className={inputClass} placeholder="Compañía" value={seguroCompania} onChange={(e) => setSeguroCompania(e.target.value)} />
              <input type="number" step="0.01" className={inputClass} placeholder="Importe mensual" value={seguroImporte} onChange={(e) => setSeguroImporte(e.target.value)} />
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-5 flex items-center justify-between">
            <span className="text-[13px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-300">Saldo a abonar (calculado)</span>
            <strong className="text-2xl font-black text-rose-900 dark:text-white">$ {saldoCalculado.toLocaleString("es-AR")}</strong>
          </div>

          <div>
            <label className={labelClass}>Observaciones</label>
            <textarea className={inputClass} rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          <button type="button" onClick={onClose} disabled={guardando} className="ml-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={guardando} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar Seña"}
          </button>
        </div>
        </form>
      </div>

      {mostrarModalPrecio && (
        <ConfirmarPrecioModal
          precioTexto={`Venta $ ${(Number(ventaArs) || 0).toLocaleString("es-AR")}${senaArs ? ` · Seña $ ${Number(senaArs).toLocaleString("es-AR")}` : ""}`}
          onConfirmar={() => guardarSena(true)}
          onNoSeguro={() => guardarSena(false)}
          onCancelar={() => setMostrarModalPrecio(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { notificarFinanzas } from "@/lib/panelV2/notificaciones";
import { X, Save, Lock, Paperclip, CheckCircle2 } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

const hoy = () => new Date().toISOString().slice(0, 10);

export default function TransferenciaModal({
  editando, vendedores, config, soyAdmin, soyAdminOFinanzas, miId, onClose, onSaved,
}: { editando: any | null; vendedores: any[]; config: { comisionFija: number; pctGestora: number; pctAgencia: number }; soyAdmin: boolean; soyAdminOFinanzas: boolean; miId: string; onClose: () => void; onSaved: (row: any) => void }) {
  const [mes, setMes] = useState(editando ? editando.mes.slice(0, 7) : new Date().toISOString().slice(0, 7));
  const [dominio, setDominio] = useState(editando?.dominio || "");
  const [fechaOperacion, setFechaOperacion] = useState(editando?.fecha_operacion || hoy());
  const [expedienteId, setExpedienteId] = useState<string | null>(editando?.expediente_id || null);
  const [linkEstado, setLinkEstado] = useState<"idle" | "buscando" | "encontrado" | "sin_match">(editando?.expediente_id ? "encontrado" : "idle");
  const [diasInfo, setDiasInfo] = useState<{ dias: number; total: number | null } | null>(null);

  const [clienteVendedor, setClienteVendedor] = useState(editando?.cliente_vendedor || "");
  const [clienteComprador, setClienteComprador] = useState(editando?.cliente_comprador || "");
  const [marca, setMarca] = useState(editando?.marca || "");
  const [modelo, setModelo] = useState(editando?.modelo || "");
  const [anio, setAnio] = useState(editando?.anio || "");
  const [vendedorInternoId, setVendedorInternoId] = useState(editando?.vendedor_interno_id || "");
  const [radicacionActual, setRadicacionActual] = useState(editando?.radicacion_actual || "");
  const [radicacionFutura, setRadicacionFutura] = useState(editando?.radicacion_futura || "");

  const [transfCliente, setTransfCliente] = useState(String(editando?.transf_cliente ?? 0));
  const [transfRegistro, setTransfRegistro] = useState(String(editando?.transf_registro ?? 0));
  const [fechaPagoRegistro, setFechaPagoRegistro] = useState(editando?.fecha_pago_registro || "");
  const [fechaIngresoRegistro, setFechaIngresoRegistro] = useState(editando?.fecha_ingreso_registro || "");
  const [multasCliente, setMultasCliente] = useState(String(editando?.multas_cliente ?? 0));
  const [multasCostoReal, setMultasCostoReal] = useState(String(editando?.multas_costo_real ?? 0));
  const [deudaPatente, setDeudaPatente] = useState(String(editando?.deuda_patente ?? 0));

  const [gestora, setGestora] = useState(editando?.gestora || "");
  const [estado, setEstado] = useState(editando?.estado || "en_proceso");
  const [fechaFinalizado, setFechaFinalizado] = useState(editando?.fecha_finalizado || "");

  const [huboDevolucion, setHuboDevolucion] = useState<boolean | null>(editando?.hubo_devolucion_registro ?? null);
  const [sobranteRegistro, setSobranteRegistro] = useState(String(editando?.sobrante_registro ?? ""));
  const [sobranteComentario, setSobranteComentario] = useState(editando?.sobrante_comentario || "");
  const [devolucionDestino, setDevolucionDestino] = useState(editando?.devolucion_destino || "");

  const [arancelUrl, setArancelUrl] = useState<string | null>(editando?.arancel_comprobante_url || null);
  const [tituloUrl, setTituloUrl] = useState<string | null>(editando?.expediente?.titulo_transferido_url || null);
  const [motivoSinTitulo, setMotivoSinTitulo] = useState("");
  const [motivoSinArancel, setMotivoSinArancel] = useState("");

  const [observaciones, setObservaciones] = useState(editando?.observaciones || "");
  const [guardando, setGuardando] = useState(false);
  const [subiendoArancel, setSubiendoArancel] = useState(false);
  const [subiendoTitulo, setSubiendoTitulo] = useState(false);

  const bloqueado = !!editando?.importes_bloqueados;

  // Auto-link por patente: busca el expediente más reciente cuya venta tenga esa patente.
  useEffect(() => {
    if (editando) return; // no re-buscar en modo edición, ya viene vinculado
    if (!dominio.trim()) { setLinkEstado("idle"); return; }
    const t = setTimeout(async () => {
      setLinkEstado("buscando");
      const { data } = await supabase2
        .from("expedientes")
        .select("id, fecha_apertura, vencimiento, venta:ventas(propietario_nombre, comprador_nombre, vehiculo_marca, vehiculo_modelo, vehiculo_anio, vendedor_id, vehiculo_patente)")
        .eq("archivado", false)
        .order("fecha_apertura", { ascending: false })
        .limit(50);
      const match = (data || []).find((e: any) => (e.venta?.vehiculo_patente || "").toLowerCase() === dominio.trim().toLowerCase());
      if (match) {
        setExpedienteId(match.id);
        setLinkEstado("encontrado");
        const dias = Math.round((Date.now() - new Date(match.fecha_apertura + "T00:00:00").getTime()) / 86400000);
        const total = match.vencimiento ? Math.round((new Date(match.vencimiento + "T00:00:00").getTime() - new Date(match.fecha_apertura + "T00:00:00").getTime()) / 86400000) : null;
        setDiasInfo({ dias, total });
        const v: any = match.venta;
        if (v) {
          setClienteVendedor((p: string) => p || v.propietario_nombre || "");
          setClienteComprador((p: string) => p || v.comprador_nombre || "");
          setMarca((p: string) => p || v.vehiculo_marca || "");
          setModelo((p: string) => p || v.vehiculo_modelo || "");
          setAnio((p: string) => p || String(v.vehiculo_anio || ""));
          setVendedorInternoId((p: string) => p || v.vendedor_id || "");
        }
      } else {
        setExpedienteId(null);
        setLinkEstado("sin_match");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [dominio, editando]);

  const diferenciaTransf = (Number(transfCliente) || 0) - (Number(transfRegistro) || 0);
  const diferenciaMultas = (Number(multasCliente) || 0) - (Number(multasCostoReal) || 0);
  const comisionGestora = useMemo(() => {
    const fija = editando ? Number(editando.comision_fija_aplicada) : config.comisionFija;
    const pctG = editando ? Number(editando.pct_gestora_aplicado) : config.pctGestora;
    return fija + (pctG / 100) * diferenciaTransf + (pctG / 100) * diferenciaMultas;
  }, [diferenciaTransf, diferenciaMultas, editando, config]);
  const ingresoAgencia = useMemo(() => {
    const pctA = editando ? Number(editando.pct_agencia_aplicado) : config.pctAgencia;
    return (pctA / 100) * diferenciaTransf + (pctA / 100) * diferenciaMultas;
  }, [diferenciaTransf, diferenciaMultas, editando, config]);

  const subirArchivo = async (file: File, carpeta: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("carpeta", carpeta);
    const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo.");
    return data.publicUrl as string;
  };

  const adjuntarArancel = async (file: File) => {
    setSubiendoArancel(true);
    try { setArancelUrl(await subirArchivo(file, "liquidaciones-arancel")); }
    catch { alert("No se pudo subir el comprobante."); }
    finally { setSubiendoArancel(false); }
  };

  const adjuntarTitulo = async (file: File) => {
    setSubiendoTitulo(true);
    try {
      const url = await subirArchivo(file, "liquidaciones-titulo");
      setTituloUrl(url);
      if (expedienteId) await supabase2.from("expedientes").update({ titulo_transferido_url: url }).eq("id", expedienteId);
    } catch { alert("No se pudo subir el título."); }
    finally { setSubiendoTitulo(false); }
  };

  const confirmarImportes = async () => {
    if (!editando) return;
    const { error } = await supabase2.rpc("confirmar_importes_liquidacion", { p_id: editando.id });
    if (error) return alert(error.message);
    onSaved({ ...editando, importes_bloqueados: true });
    alert("Importes confirmados y bloqueados.");
  };

  const guardar = async () => {
    if (!dominio.trim() || !mes) return alert("Completá mes y dominio.");
    if (estado === "terminado" && huboDevolucion === null) return alert("Contestá si el registro devolvió plata antes de finalizar.");
    setGuardando(true);
    try {
      let id = editando?.id;

      if (!editando) {
        const { data: nuevoId, error } = await supabase2.rpc("crear_liquidacion_gestoria", {
          p_mes: `${mes}-01`, p_dominio: dominio.trim(), p_fecha_operacion: fechaOperacion, p_expediente_id: expedienteId,
          p_cliente_vendedor: clienteVendedor || null, p_cliente_comprador: clienteComprador || null,
          p_marca: marca || null, p_modelo: modelo || null, p_anio: anio || null,
          p_vendedor_interno_id: vendedorInternoId || null, p_radicacion_actual: radicacionActual || null, p_radicacion_futura: radicacionFutura || null,
          p_gestora: gestora || null, p_estado: estado === "terminado" ? "en_proceso" : estado,
          p_transf_cliente: Number(transfCliente) || 0, p_transf_registro: Number(transfRegistro) || 0,
          p_fecha_pago_registro: fechaPagoRegistro || null, p_fecha_ingreso_registro: fechaIngresoRegistro || null,
          p_multas_cliente: Number(multasCliente) || 0, p_multas_costo_real: Number(multasCostoReal) || 0, p_deuda_patente: Number(deudaPatente) || 0,
          p_observaciones: observaciones || null,
        });
        if (error) throw error;
        id = nuevoId;
      } else {
        // Importes: si están bloqueados y no soy admin/finanzas, esto puede quedar pendiente de autorización.
        const importesCambiaron = Number(transfCliente) !== Number(editando.transf_cliente) || Number(transfRegistro) !== Number(editando.transf_registro)
          || Number(multasCliente) !== Number(editando.multas_cliente) || Number(multasCostoReal) !== Number(editando.multas_costo_real);
        if (importesCambiaron) {
          const { data: aplicado, error: errImportes } = await supabase2.rpc("editar_importes_liquidacion", {
            p_id: id, p_transf_cliente: Number(transfCliente) || 0, p_transf_registro: Number(transfRegistro) || 0,
            p_multas_cliente: Number(multasCliente) || 0, p_multas_costo_real: Number(multasCostoReal) || 0,
            p_fecha_pago_registro: fechaPagoRegistro || null, p_fecha_ingreso_registro: fechaIngresoRegistro || null,
          });
          if (errImportes) throw errImportes;
          if (aplicado === false) alert("Los importes están bloqueados: se mandó el pedido de cambio a Autorizaciones.");
        }

        const patch: any = {
          dominio: dominio.trim(), fecha_operacion: fechaOperacion, expediente_id: expedienteId,
          cliente_vendedor: clienteVendedor || null, cliente_comprador: clienteComprador || null,
          marca: marca || null, modelo: modelo || null, anio: anio || null,
          vendedor_interno_id: vendedorInternoId || null, radicacion_actual: radicacionActual || null, radicacion_futura: radicacionFutura || null,
          deuda_patente: Number(deudaPatente) || 0, gestora: gestora || null,
          hubo_devolucion_registro: huboDevolucion, sobrante_registro: huboDevolucion ? Number(sobranteRegistro) || 0 : null,
          sobrante_comentario: huboDevolucion ? sobranteComentario || null : null, devolucion_destino: huboDevolucion ? devolucionDestino || null : null,
          arancel_comprobante_url: arancelUrl, observaciones: observaciones || null, updated_at: new Date().toISOString(),
        };
        if (estado !== "terminado") patch.estado = estado;
        await supabase2.from("liquidaciones_gestoria").update(patch).eq("id", id);

        if (huboDevolucion && devolucionDestino === "cuenta_agencia" && editando.devolucion_destino !== "cuenta_agencia") {
          await notificarFinanzas(supabase2, `Sobrante de registro a confirmar — ${dominio} ($${Number(sobranteRegistro).toLocaleString("es-AR")})`, "/panel-v2/liquidaciones");
        }

        if (estado === "terminado" && editando.estado !== "terminado") {
          const { error: errFin } = await supabase2.rpc("finalizar_liquidacion_gestoria", {
            p_id: id, p_fecha_finalizado: fechaFinalizado || fechaIngresoRegistro || fechaPagoRegistro || hoy(),
            p_motivo_sin_titulo: motivoSinTitulo || null, p_motivo_sin_arancel: motivoSinArancel || null,
          });
          if (errFin) throw errFin;
        }
      }

      const { data: fresh } = await supabase2.from("liquidaciones_gestoria").select("*, expediente:expedientes(titulo_transferido_url), vendedor:perfiles!liquidaciones_gestoria_vendedor_interno_id_fkey(nombre)").eq("id", id).single();
      onSaved(fresh);
      onClose();
    } catch (err: any) {
      alert(err.message || "No se pudo guardar la transferencia.");
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !guardando && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar transferencia" : "Nueva transferencia"}</h3><button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button></div>
        <p className="text-xs text-slate-400 mb-4">{editando ? "Actualizá los datos de la operación. La comisión gestora y el ingreso agencia se recalculan automáticamente." : "Cargá una operación de gestoría para incluirla en la liquidación del mes."}</p>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Identificación</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={labelClass}>Mes *</label><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Dominio (patente) *</label><input value={dominio} onChange={(e) => setDominio(e.target.value.toUpperCase())} className={inputClass} /></div>
          <div><label className={labelClass}>Fecha de operación</label><input type="date" value={fechaOperacion} onChange={(e) => setFechaOperacion(e.target.value)} className={inputClass} /></div>
        </div>
        {linkEstado === "encontrado" && (
          <div className="mt-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-2.5 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div><p className="text-xs font-bold text-emerald-700">Expediente vinculado automáticamente</p><p className="text-[11px] text-emerald-600/80">{diasInfo ? `Día ${diasInfo.dias} de ${diasInfo.total ?? "?"} desde la apertura. ` : ""}Auto-completamos los campos vacíos.</p></div>
          </div>
        )}
        {linkEstado === "sin_match" && (
          <div className="mt-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-2.5"><p className="text-xs text-amber-700">No encontramos un expediente con esta patente. Verificá el dominio o que el expediente esté creado.</p></div>
        )}

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Partes y vehículo</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelClass}>Cliente vendedor</label><input value={clienteVendedor} onChange={(e) => setClienteVendedor(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Cliente comprador</label><input value={clienteComprador} onChange={(e) => setClienteComprador(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Marca</label><input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Toyota, Volkswagen..." className={inputClass} /></div>
          <div><label className={labelClass}>Modelo</label><input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Corolla, Amarok..." className={inputClass} /></div>
          <div><label className={labelClass}>Año</label><input value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Vendedor interno</label><select value={vendedorInternoId} onChange={(e) => setVendedorInternoId(e.target.value)} className={inputClass}><option value="">— Sin asignar —</option>{vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select></div>
          <div><label className={labelClass}>Radicación actual</label><input value={radicacionActual} onChange={(e) => setRadicacionActual(e.target.value)} placeholder="Reg. actual" className={inputClass} /></div>
          <div><label className={labelClass}>Radicación futura</label><input value={radicacionFutura} onChange={(e) => setRadicacionFutura(e.target.value)} placeholder="Reg. donde se presenta" className={inputClass} /></div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Importes — transferencia</p>
        {editando && (
          <div className={`mb-2 flex items-center justify-between p-2.5 rounded-lg text-xs ${bloqueado ? "bg-slate-100 dark:bg-white/5" : "bg-amber-50 dark:bg-amber-500/10"}`}>
            <span>{bloqueado ? "🔒 Importes bloqueados — cambiarlos pide autorización de admin/finanzas." : "Al confirmar, los importes quedan bloqueados: cambiarlos va a pedir autorización de admin/finanzas."}</span>
            {!bloqueado && <button onClick={confirmarImportes} className="flex items-center gap-1 px-3 py-1.5 font-bold bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg shrink-0 ml-2"><Lock className="w-3.5 h-3.5" /> Confirmar importes</button>}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div><label className={labelClass}>Cobrado al cliente (ARS)</label><input type="number" value={transfCliente} onChange={(e) => setTransfCliente(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Costo real registro (ARS)</label><input type="number" value={transfRegistro} onChange={(e) => setTransfRegistro(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Diferencia (auto)</label><div className="bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600">{fmt(diferenciaTransf)}</div><p className="text-[10px] text-slate-400">transfCliente − transfRegistro</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div><label className={labelClass}>Fecha pago a registro</label><input type="date" value={fechaPagoRegistro} onChange={(e) => setFechaPagoRegistro(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Fecha ingreso a registro</label><input type="date" value={fechaIngresoRegistro} onChange={(e) => setFechaIngresoRegistro(e.target.value)} className={inputClass} /></div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Importes — multas</p>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={labelClass}>Multas cobradas al cliente</label><input type="number" value={multasCliente} onChange={(e) => setMultasCliente(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Costo real de multas</label><input type="number" value={multasCostoReal} onChange={(e) => setMultasCostoReal(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Diferencia multas (auto)</label><div className="bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600">{fmt(diferenciaMultas)}</div></div>
        </div>
        <label className={labelClass + " mt-2"}>Deuda de patente</label>
        <input type="number" value={deudaPatente} onChange={(e) => setDeudaPatente(e.target.value)} className={inputClass} />

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Resumen automático</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3"><p className="text-xs font-bold text-indigo-600">Comisión gestora</p><p className="text-xl font-black">{fmt(comisionGestora)}</p><p className="text-[10px] text-slate-400">{editando ? Number(editando.comision_fija_aplicada) : config.comisionFija} + {editando ? Number(editando.pct_gestora_aplicado) : config.pctGestora}% dif. transf. + {editando ? Number(editando.pct_gestora_aplicado) : config.pctGestora}% dif. multas</p></div>
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3"><p className="text-xs font-bold text-blue-600">Ingreso agencia</p><p className="text-xl font-black">{fmt(ingresoAgencia)}</p><p className="text-[10px] text-slate-400">{editando ? Number(editando.pct_agencia_aplicado) : config.pctAgencia}% dif. transf. + {editando ? Number(editando.pct_agencia_aplicado) : config.pctAgencia}% dif. multas</p></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div><label className={labelClass}>Gestora</label><input value={gestora} onChange={(e) => setGestora(e.target.value)} placeholder="Nombre de la gestora" className={inputClass} /></div>
          <div><label className={labelClass}>Estado</label><select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}><option value="en_proceso">En proceso</option><option value="terminado">Terminado</option><option value="pendiente_pago">Pendiente de pago</option><option value="observado">Observado</option></select></div>
        </div>
        {estado === "terminado" && (
          <div><label className={labelClass + " mt-2"}>Fecha de finalización (día del cierre)</label><input type="date" value={fechaFinalizado} onChange={(e) => setFechaFinalizado(e.target.value)} className={inputClass} /><p className="text-[10px] text-slate-400 mt-0.5">Define el mes en que liquida. Sugerido con fecha de registro; cambiala si hiciste el trámite en otra fecha.</p></div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="border border-dashed border-amber-300 dark:border-amber-500/30 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700">Arancel del registro</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cargá arriba, en Costo real registro, lo que se pagó. Sin comprobante no se puede finalizar (salvo admin con motivo).</p>
            {arancelUrl ? <a href={arancelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Comprobante cargado</a> : (
              <label className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 cursor-pointer"><Paperclip className="w-3.5 h-3.5" /> {subiendoArancel ? "Subiendo..." : "Adjuntar"}<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && adjuntarArancel(e.target.files[0])} /></label>
            )}
            {!arancelUrl && soyAdmin && estado === "terminado" && <><label className={labelClass + " mt-2"}>Motivo (sin comprobante)</label><input value={motivoSinArancel} onChange={(e) => setMotivoSinArancel(e.target.value)} className={inputClass} /></>}
          </div>
          <div className="border border-dashed border-amber-300 dark:border-amber-500/30 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-700">Título del automotor</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Obligatorio para finalizar. Se sincroniza con el expediente.</p>
            {tituloUrl ? <a href={tituloUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Título transferido</a> : (
              <label className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 cursor-pointer"><Paperclip className="w-3.5 h-3.5" /> {subiendoTitulo ? "Subiendo..." : "Adjuntar"}<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && adjuntarTitulo(e.target.files[0])} /></label>
            )}
            {!tituloUrl && soyAdmin && estado === "terminado" && <><label className={labelClass + " mt-2"}>Motivo (sin título)</label><input value={motivoSinTitulo} onChange={(e) => setMotivoSinTitulo(e.target.value)} className={inputClass} /></>}
          </div>
        </div>

        <p className="text-xs font-bold mt-4">¿El registro devolvió plata?</p>
        <p className="text-[10px] text-slate-400 mb-2">A veces el arancel se paga estimado y después reintegran la diferencia. Esto NO es el margen de gestoría — es plata que el registro devuelve.</p>
        <div className="flex gap-2">
          <button onClick={() => setHuboDevolucion(false)} className={`px-3 py-2 text-xs font-bold rounded-lg border ${huboDevolucion === false ? "bg-rose-600 text-white border-rose-600" : "border-slate-200 dark:border-white/10"}`}>No sobró nada</button>
          <button onClick={() => setHuboDevolucion(true)} className={`px-3 py-2 text-xs font-bold rounded-lg border ${huboDevolucion === true ? "bg-rose-600 text-white border-rose-600" : "border-slate-200 dark:border-white/10"}`}>Sí, sobró plata</button>
        </div>
        {huboDevolucion === true && (
          <div className="mt-2 space-y-2">
            <div><label className={labelClass}>Cuánto sobró (ARS)</label><input type="number" value={sobranteRegistro} onChange={(e) => setSobranteRegistro(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Qué pasó</label><textarea value={sobranteComentario} onChange={(e) => setSobranteComentario(e.target.value)} rows={2} placeholder="Ej: el arancel se pagó estimado y el registro reintegró la diferencia." className={inputClass} /></div>
            <div><label className={labelClass}>Se solicitó la devolución a</label><select value={devolucionDestino} onChange={(e) => setDevolucionDestino(e.target.value)} className={inputClass}><option value="">Elegí el destino...</option><option value="cuenta_agencia">Cuenta de la agencia</option><option value="cuenta_cliente">Cuenta del cliente</option></select></div>
          </div>
        )}

        <label className={labelClass + " mt-4"}>Observaciones</label>
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} placeholder="Notas adicionales..." className={inputClass} />

        <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white dark:bg-[#141414] pt-2">
          <button onClick={onClose} disabled={guardando} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar cambios" : "Crear transferencia"}</button>
        </div>
      </div>
    </div>
  );
}

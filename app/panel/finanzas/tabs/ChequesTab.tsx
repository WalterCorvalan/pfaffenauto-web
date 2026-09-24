"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, X, Save, Pencil } from "lucide-react";
import { inputClass, labelClass, fmt, diasHasta } from "./shared";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { hoyLocalISO } from "@/lib/panel/fechas";

const emptyForm = { tipo: "a_cobrar", formato: "fisico", librador: "", numero: "", banco: "", cuitCuil: "", monto: "", moneda: "ARS", estado: "pendiente", fechaEmision: "", fechaCobro: "", cajaBancoPropio: "", vehiculoId: "", notas: "" };

export default function ChequesTab({ cheques, setCheques, cuentas, vehiculos0km }: { cheques: any[]; setCheques: (fn: any) => void; cuentas: any[]; vehiculos0km: any[] }) {
  const [sub, setSub] = useState<"a_cobrar" | "emitido">("a_cobrar");
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [chequeParaCobrar, setChequeParaCobrar] = useState<any>(null);
  const [cuentaCobro, setCuentaCobro] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ mensaje: string; accion: () => void } | null>(null);

  const lista = cheques.filter((c) => c.tipo === sub);
  const hoy = hoyLocalISO();
  const mesActual = hoy.slice(0, 7);

  const stats = useMemo(() => {
    const esteMes = lista.filter((c) => c.estado === "pendiente" && c.fecha_cobro.slice(0, 7) === mesActual);
    const pendientes = lista.filter((c) => c.estado === "pendiente");
    const vencidos = pendientes.filter((c) => c.fecha_cobro < hoy);
    return { esteMes, pendientes, vencidos };
  }, [lista]);

  const abrir = () => { setEditando(null); setForm({ ...emptyForm, tipo: sub, fechaCobro: hoy }); setShowNuevo(true); };

  // Solo se puede editar mientras el cheque no generó todavía un movimiento
  // real de caja -- una vez "Cobrado" (c.movimiento_id seteado), la plata ya
  // entró/salió de una cuenta con el monto/moneda originales, y un UPDATE acá
  // no toca ese movimiento: dejaría el cheque y la caja desincronizados.
  const abrirEditar = (c: any) => {
    setEditando(c);
    setForm({
      tipo: c.tipo, formato: c.formato, librador: c.librador, numero: c.numero || "", banco: c.banco || "",
      cuitCuil: c.cuit_cuil || "", monto: String(c.monto), moneda: c.moneda, estado: c.estado,
      fechaEmision: c.fecha_emision || "", fechaCobro: c.fecha_cobro, cajaBancoPropio: c.caja_banco_propio || "",
      vehiculoId: c.vehiculo_id || "", notas: c.notas || "",
    });
    setShowNuevo(true);
  };

  const guardar = async () => {
    if (!form.librador.trim() || !form.monto || !form.fechaCobro) return alert("Completá librador, monto y fecha de cobro.");
    setGuardando(true);
    try {
      // "Cobrado" NUNCA se guarda desde este formulario -- ese estado solo
      // puede salir del flujo dedicado (cambiarEstado -> RPC
      // cambiar_estado_cheque, que además mueve la caja real). Guardarlo acá
      // directo dejaba un cheque marcado "cobrado" sin movimiento_id ni
      // plata movida, y encima quedaba sin forma de arreglarlo (el botón
      // Editar se oculta una vez "cobrado", y el select de estado de la
      // tabla no reacciona si ya estás parado en esa misma opción).
      const estadoSeguro = form.estado === "cobrado" ? "pendiente" : form.estado;
      const payload: Record<string, unknown> = {
        tipo: form.tipo, formato: form.formato, librador: form.librador.trim(), numero: form.numero || null, banco: form.banco || null,
        cuit_cuil: form.cuitCuil || null, monto: Number(form.monto), moneda: form.moneda, estado: estadoSeguro,
        fecha_emision: form.fechaEmision || null, fecha_cobro: form.fechaCobro, caja_banco_propio: form.cajaBancoPropio || null, notas: form.notas || null,
      };
      // Si se corrió la fecha de cobro y ya se había mandado el aviso de
      // vencimiento para la fecha vieja, hay que resetearlo -- sin esto un
      // cheque re-agendado más adelante nunca vuelve a avisar (queda con el
      // flag en true de la primera fecha).
      if (editando && form.fechaCobro !== editando.fecha_cobro) {
        payload.aviso_vencimiento_enviado = false;
        payload.aviso_vencido_enviado = false;
      }

      if (editando) {
        const { data, error } = await supabase2.from("cheques").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        if (form.tipo === "emitido" && form.vehiculoId !== (editando.vehiculo_id || "")) {
          await supabase2.from("cheques").update({ vehiculo_id: form.vehiculoId || null }).eq("id", editando.id);
        }
        setCheques((prev: any[]) => prev.map((x) => (x.id === editando.id ? { ...data, vehiculo_id: form.vehiculoId || null } : x)));
        setShowNuevo(false);
        return;
      }

      const { data, error } = await supabase2.from("cheques").insert(payload).select().single();
      if (error) throw error;

      // Vínculo a un 0km del stock en un update aparte, con su propio
      // try/catch: si migraciones/sql_cheques_vehiculo_id.sql todavía no
      // corrió en la base, el cheque se sigue guardando igual (solo sin el
      // vínculo, que se puede completar después).
      let vehiculoVinculado: any = null;
      if (form.tipo === "emitido" && form.vehiculoId) {
        const { error: errVehiculo } = await supabase2.from("cheques").update({ vehiculo_id: form.vehiculoId }).eq("id", data.id);
        if (!errVehiculo) vehiculoVinculado = form.vehiculoId;
        else console.error("No se pudo vincular el cheque al vehículo (¿corriste la migración?):", errVehiculo);
      }

      setCheques((prev: any[]) => [{ ...data, vehiculo_id: vehiculoVinculado }, ...prev]);
      setShowNuevo(false);
    } catch (err: any) { alert(err?.message ? `No se pudo guardar el cheque: ${err.message}` : "No se pudo guardar el cheque."); } finally { setGuardando(false); }
  };

  // "Cobrado" es el único estado que mueve plata real -- entra/sale de una
  // cuenta, así que antes de aplicarlo hay que elegir cuál. Los demás
  // estados (pendiente/depositado/rechazado/endosado) no tocan caja.
  const cambiarEstado = async (c: any, estado: string) => {
    if (estado === "cobrado" && c.estado !== "cobrado") {
      setChequeParaCobrar(c);
      setCuentaCobro(cuentas.find((x) => x.moneda === c.moneda)?.id || "");
      return;
    }
    const { error } = await supabase2.rpc("cambiar_estado_cheque", { p_cheque_id: c.id, p_estado: estado });
    if (error) return alert(error.message);
    setCheques((prev: any[]) => prev.map((x) => (x.id === c.id ? { ...x, estado, movimiento_id: estado === "cobrado" ? x.movimiento_id : null } : x)));
  };

  const confirmarCobro = async () => {
    if (!chequeParaCobrar || !cuentaCobro) return alert("Elegí una cuenta.");
    setCambiandoEstado(true);
    try {
      const { error } = await supabase2.rpc("cambiar_estado_cheque", { p_cheque_id: chequeParaCobrar.id, p_estado: "cobrado", p_cuenta_id: cuentaCobro });
      if (error) throw error;
      setCheques((prev: any[]) => prev.map((x) => (x.id === chequeParaCobrar.id ? { ...x, estado: "cobrado", cuenta_id: cuentaCobro } : x)));
      setChequeParaCobrar(null);
    } catch (err: any) {
      alert(err.message || "No se pudo cambiar el estado.");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const eliminar = (c: any) => {
    // Un cheque "cobrado" ya generó un movimiento real de caja (c.movimiento_id)
    // -- borrarlo sin revertir ese movimiento lo dejaba huérfano (plata que
    // quedó contabilizada sin el cheque de origen). Se revierte primero con el
    // mismo RPC que usa Movimientos para eliminar, y recién después se borra
    // el cheque.
    const esCobrado = c.estado === "cobrado" && c.movimiento_id;
    const mensaje = esCobrado
      ? `El cheque de ${c.librador} ya está cobrado y generó un movimiento real en Finanzas. Al eliminarlo también se revierte ese movimiento. ¿Confirmás?`
      : `¿Eliminar el cheque de ${c.librador}?`;
    setConfirmDialog({
      mensaje,
      accion: async () => {
        if (esCobrado) {
          const { error } = await supabase2.rpc("eliminar_movimiento_caja", { p_movimiento_id: c.movimiento_id, p_motivo: `Cheque de ${c.librador} eliminado` });
          if (error) return alert(`No se pudo revertir el movimiento de caja vinculado: ${error.message}`);
        }
        const { error: errorBorrar } = await supabase2.from("cheques").delete().eq("id", c.id);
        if (errorBorrar) {
          // La caja ya se revirtió arriba (si era cobrado) pero el cheque
          // sigue existiendo -- sin este chequeo quedaba "cobrado" apuntando
          // a un movimiento que ya no está, sin ningún aviso. No hay forma
          // segura de deshacer la reversión desde acá, así que se avisa
          // fuerte para que se resuelva a mano.
          alert(esCobrado
            ? `Se revirtió el movimiento de caja del cheque de ${c.librador}, pero el cheque no se pudo eliminar (${errorBorrar.message}). Quedó desincronizado -- revisalo a mano en Finanzas.`
            : `No se pudo eliminar el cheque: ${errorBorrar.message}`);
          return;
        }
        setCheques((prev: any[]) => prev.filter((x) => x.id !== c.id));
      },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button onClick={() => setSub("a_cobrar")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "a_cobrar" ? "bg-[#0145F2] text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>📥 A cobrar</button>
        <button onClick={() => setSub("emitido")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "emitido" ? "bg-[#0145F2] text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>📤 Emitidos</button>
        <button onClick={abrir} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo cheque</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">A cobrar/pagar este mes</p><p className="text-lg font-black">{stats.esteMes.length === 0 ? "—" : stats.esteMes.length}</p><p className="text-[10px] text-slate-400">cheques · {new Date().toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</p></div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total pendiente</p><p className="text-lg font-black">{stats.pendientes.length === 0 ? "—" : stats.pendientes.length}</p><p className="text-[10px] text-slate-400">todos los meses</p></div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500">Vencidos sin resolver</p><p className="text-lg font-black">{stats.vencidos.length === 0 ? "—" : stats.vencidos.length}</p></div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">No hay cheques {sub === "a_cobrar" ? "a cobrar" : "emitidos"}</p>
          <p className="text-xs text-slate-400 mt-1">Registrá el primero con "Nuevo cheque".</p>
        </div>
      ) : (
        <TablaResponsiva<any>
          filas={lista}
          keyExtractor={(c) => c.id}
          encabezadoMobile={(c) => <p className="font-bold">{c.librador}{c.banco ? <span className="text-slate-400 font-normal"> · {c.banco}</span> : ""}</p>}
          columnas={
            [
              { key: "fecha_cobro", header: "Fecha cobro", cell: (c) => <>{c.fecha_cobro}{c.estado === "pendiente" && c.fecha_cobro < hoy && <span className="ml-1 text-rose-500 font-bold">vencido</span>}</> },
              { key: "numero", header: "N°", cell: (c) => c.numero || "—", claseTd: "text-slate-400" },
              { key: "librador", header: "Librador", cell: (c) => <>{c.librador}{c.banco ? <span className="text-slate-400 font-normal"> · {c.banco}</span> : ""}</>, claseTd: "font-bold", ocultarEnMobile: true },
              { key: "monto", header: "Monto", cell: (c) => fmt(c.monto, c.moneda), claseTd: "font-mono font-bold" },
              { key: "formato", header: "Formato", cell: (c) => (c.formato === "echeque" ? "ECHEQ" : "Físico"), claseTd: "text-slate-400" },
              { key: "estado", header: "Estado", cell: (c) => (
                <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value)} className="text-[10px] font-bold uppercase bg-transparent border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">
                  <option value="pendiente">Pendiente</option><option value="depositado">Depositado</option><option value="cobrado">Cobrado</option><option value="rechazado">Rechazado</option><option value="endosado">Endosado</option>
                </select>
              ) },
            ] as ColumnaTabla<any>[]
          }
          acciones={(c) => (
            <div className="flex items-center gap-2">
              {c.estado !== "cobrado" && <button onClick={() => abrirEditar(c)} className="text-slate-400 hover:text-[#0145F2] flex items-center"><Pencil className="w-3.5 h-3.5" /></button>}
              <button onClick={() => eliminar(c)} className="text-rose-500 font-bold">Eliminar</button>
            </div>
          )}
        />
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar cheque" : "Nuevo cheque"}</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Registro de cheque. Al cargarlo todavía no mueve saldos — eso pasa cuando lo marqués "Cobrado" y elijas la cuenta.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Tipo de cheque *</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}><option value="a_cobrar">A cobrar (lo recibo)</option><option value="emitido">Emitido (lo pago)</option></select></div>
              <div><label className={labelClass}>Formato</label><select value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })} className={inputClass}><option value="fisico">Físico</option><option value="echeque">ECHEQ</option></select></div>
            </div>
            {/* "Librador" y "Banco" cambian de sentido según el tipo: en un
                cheque a cobrar, el librador y su banco son de un tercero
                (texto libre, no lo tenemos cargado). En uno emitido, el
                librador somos nosotros -- el campo pasa a ser "beneficiario",
                y "Banco" pasa a ser un select de nuestras propias cuentas
                (de dónde sale el cheque), no texto libre. */}
            <label className={labelClass + " mt-3"}>{form.tipo === "emitido" ? "Beneficiario (a quién se lo entregamos) *" : "Librador (quién lo firmó) *"}</label>
            <input value={form.librador} onChange={(e) => setForm({ ...form, librador: e.target.value })} placeholder={form.tipo === "emitido" ? "Nombre / razón social del beneficiario" : "Nombre / razón social del librador"} className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>N° de cheque</label><input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ej: 12345678" className={inputClass} /></div>
              <div>
                <label className={labelClass}>{form.tipo === "emitido" ? "Nuestra cuenta" : "Banco"}</label>
                {form.tipo === "emitido" ? (
                  <select value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} className={inputClass}>
                    <option value="">— Elegí —</option>
                    {cuentas.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                ) : (
                  <input value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} placeholder="Galicia, Nación..." className={inputClass} />
                )}
              </div>
              <div><label className={labelClass}>CUIT/CUIL</label><input value={form.cuitCuil} onChange={(e) => setForm({ ...form, cuitCuil: e.target.value })} placeholder="20-12345678-9" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="text" inputMode="numeric" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value.replace(/\D/g, "") })} placeholder="147000" className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div>
                <label className={labelClass}>Estado *</label>
                <select value={form.estado === "cobrado" ? "pendiente" : form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClass}>
                  <option value="pendiente">Pendiente</option><option value="depositado">Depositado</option><option value="rechazado">Rechazado</option><option value="endosado">Endosado</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">&quot;Cobrado&quot; no se elige acá — usá el estado de la tabla una vez guardado, así queda vinculado el movimiento real de caja.</p>
              </div>
            </div>
            {form.tipo === "emitido" && (
              <div className="mt-3">
                <label className={labelClass}>Vehículo 0km vinculado (opcional)</label>
                {/* Pedido de la reunión del 22/9: un cheque emitido para
                    pagar un 0km se puede vincular a esa unidad del stock,
                    para descontar del patrimonio en stock lo que todavía se
                    debe por cheques sin cobrar. */}
                <select value={form.vehiculoId} onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })} className={inputClass}>
                  <option value="">— Sin vincular —</option>
                  {vehiculos0km.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio} {v.patente ? `· ${v.patente}` : ""}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Fecha de emisión</label><input type="date" value={form.fechaEmision} onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Fecha de cobro *</label><input type="date" value={form.fechaCobro} onChange={(e) => setForm({ ...form, fechaCobro: e.target.value })} className={inputClass} /></div>
            </div>
            {form.tipo === "a_cobrar" && (
              <>
                <label className={labelClass + " mt-3"}>Caja / banco propio</label>
                {/* Mismo selector que "Cuenta (afecta saldo)" de RetirosTab.tsx,
                    pero acá es solo informativo (dónde pensás depositarlo)
                    -- caja_banco_propio es una columna de texto en "cheques", no
                    afecta ningún saldo hasta que el cheque se marca "Cobrado".
                    En un cheque emitido no aplica: ya se eligió "Nuestra
                    cuenta" arriba, que cumple el mismo rol. */}
                <select value={form.cajaBancoPropio} onChange={(e) => setForm({ ...form, cajaBancoPropio: e.target.value })} className={inputClass}>
                  <option value="">— Elegí —</option>
                  {cuentas.map((c) => <option key={c.id} value={c.nombre}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}
                </select>
              </>
            )}
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} placeholder="Detalle, operación vinculada, etc." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Registrar cheque"}</button></div>
          </div>
        </div>
      )}

      {chequeParaCobrar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setChequeParaCobrar(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Marcar cobrado</h3><button onClick={() => setChequeParaCobrar(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">{chequeParaCobrar.tipo === "a_cobrar" ? "Entra" : "Sale"} {fmt(chequeParaCobrar.monto, chequeParaCobrar.moneda)} de la cuenta que elijas — se registra como movimiento real en Finanzas.</p>
            <label className={labelClass}>Cuenta *</label>
            <select value={cuentaCobro} onChange={(e) => setCuentaCobro(e.target.value)} className={inputClass}>
              <option value="">— Elegí —</option>
              {cuentas.filter((c) => c.moneda === chequeParaCobrar.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setChequeParaCobrar(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={confirmarCobro} disabled={cambiandoEstado} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!confirmDialog}
        mensaje={confirmDialog?.mensaje || ""}
        onConfirmar={() => { confirmDialog?.accion(); setConfirmDialog(null); }}
        onCancelar={() => setConfirmDialog(null)}
      />
    </div>
  );
}

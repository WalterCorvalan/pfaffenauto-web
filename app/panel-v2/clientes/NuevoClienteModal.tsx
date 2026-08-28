"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, DoorOpen, Globe, ScanLine, Search } from "lucide-react";
import EscanearDniModal, { type DatosDni } from "./EscanearDniModal";
import { parseFechaLocal } from "@/lib/panelV2/fechas";
import { crearAlerta } from "@/lib/panelV2/alertas";

export const ORIGENES = ["Instagram", "Facebook", "Web", "Referido", "Showroom", "WhatsApp", "Otro"];
const ETAPAS = [
  { value: "sin_contactar", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "negociacion", label: "En Negociación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "perdido", label: "Sin interés" },
];

interface Perfil { id: string; nombre: string; roles: string[] }
interface Disponibilidad { vendedor_id: string; recibir_leads: boolean }

interface Props {
  perfiles: Perfil[];
  disponibilidad: Disponibilidad[];
  miId: string;
  editando?: any;
  onClose: () => void;
  onCreado: (cliente: any) => void;
}

// Elige vendedor por rotación: entre los que reciben leads, el que hace más
// tiempo no recibe uno de este mismo canal (walk-in y digital rotan aparte,
// así nadie se "saltea" cuando los dos canales están activos a la vez).
async function elegirPorRotacion(canal: string, disponibles: Perfil[]) {
  if (disponibles.length === 0) return null;
  const { data } = await supabase2
    .from("clientes")
    .select("vendedor_id, created_at")
    .eq("canal_ingreso", canal)
    .order("created_at", { ascending: false });

  const ultimaAsignacion: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    if (row.vendedor_id && !ultimaAsignacion[row.vendedor_id]) ultimaAsignacion[row.vendedor_id] = row.created_at;
  });

  let elegido = disponibles[0];
  let elegidoFecha = ultimaAsignacion[elegido.id];
  for (const p of disponibles) {
    const f = ultimaAsignacion[p.id];
    if (!f) { elegido = p; elegidoFecha = undefined; break; }
    if (elegidoFecha && f < elegidoFecha) { elegido = p; elegidoFecha = f; }
  }
  return elegido.id;
}

export default function NuevoClienteModal({ perfiles, disponibilidad, miId, editando, onClose, onCreado }: Props) {
  const esEdicion = !!editando;
  const [canalIngreso, setCanalIngreso] = useState<"walk_in" | "lead_digital">(editando?.canal_ingreso || "lead_digital");
  const [nombre, setNombre] = useState(editando?.nombre || "");
  const [tipo, setTipo] = useState(editando?.tipo || "Regular");
  const [sexo, setSexo] = useState(editando?.sexo || "");
  const [dniCuit, setDniCuit] = useState(editando?.dni_cuit || "");
  const [telefono, setTelefono] = useState(editando?.telefono || "");
  const [email, setEmail] = useState(editando?.email || "");
  const [origen, setOrigen] = useState(editando?.origen || "Showroom");
  const [etapa, setEtapa] = useState(editando?.pipeline_stage || "sin_contactar");
  const [vehiculoTexto, setVehiculoTexto] = useState(editando?.vehiculo_interes_texto || "");
  const [buscaMarca, setBuscaMarca] = useState(editando?.busca_marca || "");
  const [buscaModelo, setBuscaModelo] = useState(editando?.busca_modelo || "");
  const [buscaMoneda, setBuscaMoneda] = useState(editando?.busca_moneda || "USD");
  const [buscaAnioDesde, setBuscaAnioDesde] = useState(editando?.busca_anio_desde ? String(editando.busca_anio_desde) : "");
  const [buscaAnioHasta, setBuscaAnioHasta] = useState(editando?.busca_anio_hasta ? String(editando.busca_anio_hasta) : "");
  const [buscaPresupuesto, setBuscaPresupuesto] = useState(editando?.busca_presupuesto_max ? String(editando.busca_presupuesto_max) : "");
  const [fechaNacimiento, setFechaNacimiento] = useState(editando?.fecha_nacimiento || "");
  const [ultimoContacto, setUltimoContacto] = useState(editando?.ultimo_contacto ? String(editando.ultimo_contacto).slice(0, 10) : "");
  const [vendedorId, setVendedorId] = useState(editando?.vendedor_id || "");
  const [direccion, setDireccion] = useState(editando?.direccion || "");
  const [observaciones, setObservaciones] = useState(editando?.observaciones || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalEscaner, setModalEscaner] = useState(false);

  const aplicarDatosDni = (datos: DatosDni) => {
    if (datos.nombre) setNombre(datos.nombre);
    if (datos.sexo) setSexo(datos.sexo);
    if (datos.dniCuit) setDniCuit(datos.dniCuit);
    if (datos.fechaNacimiento) setFechaNacimiento(datos.fechaNacimiento);
    setModalEscaner(false);
  };

  const fechaAlta = new Date().toLocaleDateString("es-AR");

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Falta el nombre.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      let vendedorFinal = vendedorId || null;
      if (!vendedorFinal && !esEdicion) {
        const disponibles = perfiles.filter((p) => {
          const d = disponibilidad.find((x) => x.vendedor_id === p.id);
          return !d || d.recibir_leads !== false;
        });
        vendedorFinal = await elegirPorRotacion(canalIngreso, disponibles);
      }

      const payload = {
        nombre: nombre.trim(),
        tipo,
        sexo: sexo || null,
        dni_cuit: dniCuit || null,
        telefono: telefono || null,
        email: email || null,
        origen,
        canal_ingreso: canalIngreso,
        pipeline_stage: etapa,
        pipeline_stage_manual: esEdicion ? editando.pipeline_stage_manual : etapa !== "sin_contactar",
        vehiculo_interes_texto: vehiculoTexto || null,
        busca_marca: buscaMarca || null,
        busca_modelo: buscaModelo || null,
        busca_moneda: buscaMoneda,
        busca_anio_desde: buscaAnioDesde ? Number(buscaAnioDesde) : null,
        busca_anio_hasta: buscaAnioHasta ? Number(buscaAnioHasta) : null,
        busca_presupuesto_max: buscaPresupuesto ? Number(buscaPresupuesto) : null,
        fecha_nacimiento: fechaNacimiento || null,
        ultimo_contacto: ultimoContacto ? parseFechaLocal(ultimoContacto).toISOString() : null,
        vendedor_id: vendedorFinal,
        direccion: direccion || null,
        observaciones: observaciones || null,
      };

      const { data, error: dbError } = esEdicion
        ? await supabase2.from("clientes").update(payload).eq("id", editando.id).select().single()
        : await supabase2.from("clientes").insert({ ...payload, creado_por: miId || null }).select().single();
      if (dbError) throw dbError;
      if (!esEdicion && miId) {
        crearAlerta(supabase2, miId, `Nuevo cliente registrado — ${data.nombre}`, {
          mensaje: `Cargado hoy. Origen: ${data.origen}.${data.telefono ? ` Tel: ${data.telefono}.` : ""}`,
          link: "/panel-v2/clientes", tipo: "cliente", prioridad: "novedad",
        });
      }
      onCreado(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el cliente.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{esEdicion ? "Editar cliente" : "Nuevo cliente"}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Campos mínimos: nombre. El resto se puede completar más tarde.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-5 mt-5">
          <div className="bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3.5">
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">¿Por qué se contacta el cliente?</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setCanalIngreso("walk_in")} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${canalIngreso === "walk_in" ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
                <DoorOpen className="w-4 h-4" /> Entró por la puerta
              </button>
              <button type="button" onClick={() => setCanalIngreso("lead_digital")} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${canalIngreso === "lead_digital" ? "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-300" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
                <Globe className="w-4 h-4" /> Lead digital (WhatsApp / IG / ML / web)
              </button>
            </div>
            <p className="text-[10px] text-indigo-700/70 dark:text-indigo-300/60 mt-2 leading-snug">
              Cada botón usa una cola de rotación independiente: si dejás "Vendedor asignado" sin elegir, se asigna solo al que hace más tiempo no recibe un lead de este canal.
            </p>
          </div>

          <button type="button" onClick={() => setModalEscaner(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
            <ScanLine className="w-4 h-4" /> Escanear DNI (autocompletar)
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nombre completo *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan García" className={inputClass} autoFocus />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Empresa">Empresa</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Sexo</label>
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={inputClass}>
                <option value="">—</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>DNI / CUIT</label>
              <input value={dniCuit} onChange={(e) => setDniCuit(e.target.value)} placeholder="12.345.678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+54 9 11 1234-5678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@email.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Origen / Lead Source</label>
              <select value={origen} onChange={(e) => setOrigen(e.target.value)} className={inputClass}>
                {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Etapa del Pipeline</label>
              <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={inputClass}>
                {ETAPAS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Vehículo de interés (del stock)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select disabled title="El selector de Stock se conecta cuando construyamos ese módulo" className={`${inputClass} pl-9 opacity-60 cursor-not-allowed appearance-none`}>
                  <option>— Sin vehículo específico / Otro —</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Buscá por marca, modelo, patente o propietario</p>
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>...o describí lo que busca (texto libre)</label>
              <input value={vehiculoTexto} onChange={(e) => setVehiculoTexto(e.target.value)} placeholder="Ej: SUV mediana, sedan 2020+, etc." className={inputClass} />
            </div>

            <div className="sm:col-span-2 bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 border border-slate-100 dark:border-white/10">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Qué busca (para matchear con el stock)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Marca</label>
                  <input value={buscaMarca} onChange={(e) => setBuscaMarca(e.target.value)} placeholder="Toyota" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Modelo</label>
                  <input value={buscaModelo} onChange={(e) => setBuscaModelo(e.target.value)} placeholder="Hilux" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Moneda</label>
                  <select value={buscaMoneda} onChange={(e) => setBuscaMoneda(e.target.value)} className={inputClass}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Año desde</label>
                  <input type="number" value={buscaAnioDesde} onChange={(e) => setBuscaAnioDesde(e.target.value)} placeholder="2018" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Año hasta</label>
                  <input type="number" value={buscaAnioHasta} onChange={(e) => setBuscaAnioHasta(e.target.value)} placeholder="2024" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Presupuesto máx</label>
                  <input type="number" value={buscaPresupuesto} onChange={(e) => setBuscaPresupuesto(e.target.value)} placeholder="25000" className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Último contacto</label>
              <input type="date" value={ultimoContacto} onChange={(e) => setUltimoContacto(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha de alta</label>
              <input disabled value={fechaAlta} className={`${inputClass} opacity-60 cursor-not-allowed`} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Vendedor asignado</label>
              <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={inputClass}>
                <option value="">— Sin asignar —</option>
                {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Dirección</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Av. Corrientes 1234, CABA" className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Observaciones / Notas</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} placeholder="Preferencias, observaciones, historial de contactos..." className={`${inputClass} resize-none`} />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : esEdicion ? "Guardar cambios" : "Agregar cliente"}
            </button>
          </div>
        </form>
      </div>

      {modalEscaner && <EscanearDniModal onClose={() => setModalEscaner(false)} onEscaneado={aplicarDatosDni} />}
    </div>
  );
}

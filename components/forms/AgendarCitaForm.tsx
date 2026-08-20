"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  CalendarCheck, Clock, MapPin, User, Phone, CheckCircle2, 
  ChevronDown, Car, Coffee, ShieldCheck 
} from "lucide-react";

const HORA_INICIO = 9;
const HORA_FIN = 18;

function generarFranjas() {
  const franjas: string[] = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    franjas.push(`${String(h).padStart(2, "0")}:00`);
    franjas.push(`${String(h).padStart(2, "0")}:30`);
  }
  return franjas;
}

export default function AgendarCitaForm() {
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);
  const [vehiculos, setVehiculos] = useState<{ id: string; marca: string; modelo: string; patente: string | null; vendedor_asignado_id: string | null }[]>([]);
  const [ocupadas, setOcupadas] = useState<string[]>([]);

  const [sucursal, setSucursal] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    supabase.from("sucursales").select("id, nombre").then(({ data }) => {
      if (data) setSucursales(data);
    });
    supabase
      .from("vehiculos")
      .select("id, marca, modelo, patente, vendedor_asignado_id")
      .in("estado", ["Disponible", "Reservado"])
      .order("marca")
      .then(({ data }) => {
        if (data) setVehiculos(data);
      });
  }, []);

  useEffect(() => {
    if (!sucursal || !fecha) {
      setOcupadas([]);
      return;
    }
    supabase
      .from("visitas_agendadas")
      .select("horario_visita")
      .eq("sucursal", sucursal)
      .eq("fecha_visita", fecha)
      .neq("estado", "Cancelada")
      .then(({ data }) => {
        setOcupadas(data?.map((v) => v.horario_visita) || []);
      });
  }, [sucursal, fecha]);

  const franjas = generarFranjas();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sucursal || !fecha || !horario || !nombre || !telefono) {
      setError("Por favor, completá todos los campos obligatorios.");
      return;
    }

    setCargando(true);
    try {
      const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoId);

      const { error: errInsert } = await supabase.from("visitas_agendadas").insert({
        vehiculo_id: vehiculoId || null,
        nombre_cliente: nombre,
        telefono_cliente: telefono,
        fecha_visita: fecha,
        horario_visita: horario,
        sucursal,
        estado: "Pendiente",
        vendedor_id: vehiculoSeleccionado?.vendedor_asignado_id || null,
      });

      if (errInsert) throw errInsert;

      fetch("/api/visitas/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCliente: nombre,
          fecha,
          horario,
          sucursal,
          vendedorId: vehiculoSeleccionado?.vendedor_asignado_id || null,
        }),
      }).catch((err) => console.error("Error notificando visita:", err));

      setEnviado(true);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al agendar la cita. Por favor, intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <section className="w-full bg-white dark:bg-[#0a0a0f] py-20 px-4">
        <div className="max-w-xl mx-auto text-center bg-emerald-50/50 dark:bg-emerald-400/10 border border-emerald-100 dark:border-emerald-400/20 rounded-3xl p-12 shadow-sm">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">¡Te esperamos!</h3>
          <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-6">
            Tu visita quedó confirmada para el <strong className="text-slate-900 dark:text-white">{fecha.split("-").reverse().join("/")}</strong> a las{" "}
            <strong className="text-slate-900 dark:text-white">{horario} hs</strong> en nuestra sucursal de <strong className="text-slate-900 dark:text-white">{sucursal}</strong>.
          </p>
          <div className="inline-flex items-center gap-2 bg-white dark:bg-white/5 px-5 py-2.5 rounded-full border border-emerald-100 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold shadow-sm">
            <Coffee className="w-4 h-4" /> El café va por nuestra cuenta
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#f8fafc] dark:bg-[#0a0a0f] py-16 lg:py-24 px-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white to-transparent dark:hidden pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

          {/* COLUMNA IZQUIERDA: La invitación */}
          <div className="lg:col-span-5 flex flex-col justify-center pt-4 lg:sticky lg:top-32">
            <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-sky-400/10 text-indigo-700 dark:text-sky-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 w-max">
              <CalendarCheck className="w-4 h-4" /> Agenda abierta
            </span>
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-[1.1]">
              Vení a conocer tu próximo auto.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-10">
              Elegí el día y horario que mejor te quede. Queremos que te tomes el tiempo de ver la unidad en detalle, sacarte todas las dudas y recibir un asesoramiento honesto.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <Car className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">Atención exclusiva</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">El vehículo estará listo y a tu disposición para que lo revises con tranquilidad.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">Café de cortesía</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Relajate en nuestro showroom mientras charlamos sobre tus opciones.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">Sin compromiso</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">La visita es 100% gratuita y no genera ninguna obligación de compra.</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: El formulario */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
              
              {/* PASO 1 */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">¿Qué te interesa ver?</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Sucursal *
                    </label>
                    <div className="relative">
                      <select
                        value={sucursal}
                        onChange={(e) => setSucursal(e.target.value)}
                        required
                        className="w-full appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors cursor-pointer dark:[color-scheme:dark]"
                      >
                        <option value="" disabled>Seleccioná el local</option>
                        {sucursales.map((s) => (
                          <option key={s.id} value={s.nombre}>{s.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Vehículo (Opcional)
                    </label>
                    <div className="relative">
                      <select
                        value={vehiculoId}
                        onChange={(e) => setVehiculoId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors cursor-pointer dark:[color-scheme:dark]"
                      >
                        <option value="">Quiero ver varios / Indeciso</option>
                        {vehiculos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.marca} {v.modelo} {v.patente ? `(${v.patente})` : "(0KM)"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 2 */}
              <div className="mb-8 pt-8 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">¿Cuándo venís?</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Día *
                    </label>
                    <input
                      type="date"
                      min={hoy}
                      value={fecha}
                      onChange={(e) => {
                        setFecha(e.target.value);
                        setHorario("");
                      }}
                      required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Horario *
                    </label>
                    <div className="relative">
                      <select
                        value={horario}
                        onChange={(e) => setHorario(e.target.value)}
                        disabled={!sucursal || !fecha}
                        required
                        className="w-full appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:[color-scheme:dark]"
                      >
                        <option value="" disabled>
                          {!sucursal || !fecha ? "Elegí sucursal y fecha" : "Elegir horario..."}
                        </option>
                        {franjas.map((f) => (
                          <option key={f} value={f} disabled={ocupadas.includes(f)}>
                            {f} {ocupadas.includes(f) ? "(Ocupado)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 3 */}
              <div className="mb-8 pt-8 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-sky-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Tus datos de contacto</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Teléfono Celular *
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: 11 2345 6789"
                      required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[14px] text-slate-900 dark:text-white font-medium outline-none focus:border-indigo-600 dark:focus:border-sky-400 focus:bg-white dark:focus:bg-white/10 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20 text-rose-600 dark:text-rose-300 text-[13px] font-medium px-4 py-3 rounded-xl flex items-start gap-2">
                  <span className="font-bold shrink-0">!</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#0145F2] hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {cargando ? "Procesando..." : "Confirmar mi visita"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
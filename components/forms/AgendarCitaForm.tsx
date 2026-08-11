"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { CalendarCheck, Clock, MapPin, User, Phone, CheckCircle2, ChevronDown } from "lucide-react";

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

  // Cuando cambia sucursal + fecha, traemos las franjas ya ocupadas para bloquearlas
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
      setError("Completá todos los campos obligatorios.");
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
      setEnviado(true);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al agendar la cita. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <section className="w-full bg-[#F8FAFC] py-16 px-4">
        <div className="max-w-xl mx-auto text-center bg-white border border-slate-100 rounded-3xl p-10 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-navy mb-2">¡Cita agendada!</h3>
          <p className="text-slate-500 text-sm">
            Te esperamos el <strong className="text-navy">{fecha}</strong> a las{" "}
            <strong className="text-navy">{horario}</strong> en <strong className="text-navy">{sucursal}</strong>.
            Un asesor va a estar disponible para atenderte.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#F8FAFC] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-[#0145F2]/10 text-[#0145F2] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <CalendarCheck className="w-3.5 h-3.5" /> Sin vueltas
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-navy tracking-tight mb-2">
            Reservá tu visita a la sucursal
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Elegí día, horario y sucursal. Te vamos a estar esperando con el auto que te interesa (o simplemente para conocernos).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Sucursal *
              </label>
              <div className="relative">
                <select
                  value={sucursal}
                  onChange={(e) => setSucursal(e.target.value)}
                  required
                  className="w-full appearance-none bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                Auto de interés (opcional)
              </label>
              <div className="relative">
                <select
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="w-full appearance-none bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors"
                >
                  <option value="">Solo quiero conocer la sucursal</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.patente ? `(${v.patente})` : "(0KM)"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                Fecha *
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
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Horario *
              </label>
              <div className="relative">
                <select
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  disabled={!sucursal || !fecha}
                  required
                  className="w-full appearance-none bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!sucursal || !fecha ? "Elegí sucursal y fecha primero" : "Seleccionar horario..."}
                  </option>
                  {franjas.map((f) => (
                    <option key={f} value={f} disabled={ocupadas.includes(f)}>
                      {f} {ocupadas.includes(f) ? "(no disponible)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Tu nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                required
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Celular *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 1122334455"
                required
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy outline-none focus:border-[#0145F2] transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-[#0145F2] to-sky-500 hover:to-sky-400 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 active:scale-[0.99]"
          >
            {cargando ? "Agendando..." : "Confirmar mi visita"}
          </button>
        </form>
      </div>
    </section>
  );
}
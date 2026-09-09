"use client";

import { useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { ChevronLeft, ChevronRight, CalendarPlus, CalendarDays, Search, X, Info } from "lucide-react";
import NuevoEventoModal, { TIPOS_EVENTO } from "./NuevoEventoModal";

interface Perfil {
  id: string;
  nombre: string;
  roles: string[];
}

interface Evento {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  hora: string | null;
  color: string;
  nombre_cliente: string | null;
  telefono_cliente: string | null;
  descripcion_vehiculo: string | null;
  responsable_id: string | null;
  visibilidad: string;
  descripcion: string | null;
  creado_por: string | null;
}

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

export default function CalendarioClient({ eventosIniciales, perfiles, miId }: { eventosIniciales: Evento[]; perfiles: Perfil[]; miId: string }) {
  const [eventos, setEventos] = useState(eventosIniciales);
  const [vista, setVista] = useState<"mes" | "semana" | "dia">("mes");
  const [cursor, setCursor] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaParaModal, setFechaParaModal] = useState<string | undefined>(undefined);

  const [tabLista, setTabLista] = useState<"proximos" | "pasados" | "todos">("proximos");
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCreador, setFiltroCreador] = useState("");

  const perfilPorId = useMemo(() => new Map(perfiles.map((p) => [p.id, p])), [perfiles]);

  const anio = cursor.getFullYear();
  const mes = cursor.getMonth();

  const diasDelMes = useMemo(() => {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const dias: (Date | null)[] = [];
    for (let i = 0; i < primerDia.getDay(); i++) dias.push(null);
    for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(anio, mes, d));
    return dias;
  }, [anio, mes]);

  const diasDeLaSemana = useMemo(() => {
    const inicio = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
  }, [cursor]);

  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, Evento[]>();
    eventos.forEach((e) => {
      const lista = mapa.get(e.fecha) || [];
      lista.push(e);
      mapa.set(e.fecha, lista);
    });
    return mapa;
  }, [eventos]);

  const proximosEventos = useMemo(() => {
    const hoy = hoyISO();
    return eventos.filter((e) => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
  }, [eventos]);

  const eventosDelDiaSeleccionado = diaSeleccionado ? eventosPorFecha.get(diaSeleccionado) || [] : [];
  const eventosDelCursor = eventosPorFecha.get(cursor.toISOString().split("T")[0]) || [];

  const eventosFiltrados = useMemo(() => {
    const hoy = hoyISO();
    let lista = eventos;
    if (tabLista === "proximos") lista = lista.filter((e) => e.fecha >= hoy);
    else if (tabLista === "pasados") lista = lista.filter((e) => e.fecha < hoy);

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((e) => `${e.titulo} ${e.nombre_cliente || ""} ${e.descripcion_vehiculo || ""} ${e.tipo}`.toLowerCase().includes(q));
    }
    if (desde) lista = lista.filter((e) => e.fecha >= desde);
    if (hasta) lista = lista.filter((e) => e.fecha <= hasta);
    if (filtroTipo) lista = lista.filter((e) => e.tipo === filtroTipo);
    if (filtroCreador) lista = lista.filter((e) => e.creado_por === filtroCreador);

    return [...lista].sort((a, b) => (tabLista === "pasados" ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)));
  }, [eventos, tabLista, busqueda, desde, hasta, filtroTipo, filtroCreador]);

  const abrirNuevoEvento = (fecha?: string) => {
    setFechaParaModal(fecha);
    setModalAbierto(true);
  };

  const onEventoCreado = (evento: Evento) => {
    setEventos((prev) => [...prev, evento]);
  };

  const totalProximos = eventos.filter((e) => e.fecha >= hoyISO()).length;
  const totalPasados = eventos.filter((e) => e.fecha < hoyISO()).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{eventos.length} eventos · {totalProximos} próximos · {totalPasados} pasados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            title="Conectá tu cuenta de Google para ver tu agenda personal acá — falta configurar el OAuth de Google Calendar (requiere credenciales tuyas en Google Cloud)."
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
          >
            <Info className="w-4 h-4" /> Conectar Google Calendar
          </button>
          <button onClick={() => abrirNuevoEvento()} className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors">
            <CalendarPlus className="w-4 h-4" /> Nuevo evento
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["mes", "semana", "dia"] as const).map((v) => (
          <button key={v} onClick={() => setVista(v)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${vista === v ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
            {v === "mes" ? "Mes" : v === "semana" ? "Semana" : "Día"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mb-8">
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          {vista === "mes" && (
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCursor(new Date(anio, mes - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <h2 className="font-bold text-slate-900 dark:text-white">{MESES[mes]} de {anio}</h2>
              <button onClick={() => setCursor(new Date(anio, mes + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {vista === "semana" && (
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <h2 className="font-bold text-slate-900 dark:text-white">Semana del {diasDeLaSemana[0].getDate()} al {diasDeLaSemana[6].getDate()} de {MESES[diasDeLaSemana[6].getMonth()]}</h2>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {vista === "dia" && (
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <h2 className="font-bold text-slate-900 dark:text-white">{DIAS[cursor.getDay()]} {cursor.getDate()} de {MESES[cursor.getMonth()]}</h2>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {vista === "mes" && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                {DIAS.map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasDelMes.map((d, i) => {
                  if (!d) return <div key={`v${i}`} />;
                  const iso = d.toISOString().split("T")[0];
                  const esHoy = iso === hoyISO();
                  const esSeleccionado = iso === diaSeleccionado;
                  const eventosDelDia = eventosPorFecha.get(iso) || [];
                  return (
                    <button
                      key={iso}
                      onClick={() => setDiaSeleccionado(iso === diaSeleccionado ? null : iso)}
                      className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-start p-1 transition-colors ${
                        esSeleccionado ? "bg-rose-600 text-white font-bold" : esHoy ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{d.getDate()}</span>
                      {eventosDelDia.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                          {eventosDelDia.slice(0, 3).map((e) => (
                            <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: esSeleccionado ? "white" : e.color }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {vista === "semana" && (
            <div className="space-y-3">
              {diasDeLaSemana.map((d) => {
                const iso = d.toISOString().split("T")[0];
                const esHoy = iso === hoyISO();
                const eventosDelDia = eventosPorFecha.get(iso) || [];
                return (
                  <div key={iso} className={`rounded-lg border p-2.5 ${esHoy ? "border-rose-300 bg-rose-50/50 dark:bg-rose-500/5" : "border-slate-100 dark:border-white/10"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${esHoy ? "text-rose-600" : "text-slate-600 dark:text-slate-300"}`}>{DIAS[d.getDay()]} {d.getDate()}</span>
                      <button onClick={() => abrirNuevoEvento(iso)} className="text-[11px] font-bold text-rose-600 hover:underline">+ Agregar</button>
                    </div>
                    {eventosDelDia.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Sin eventos.</p>
                    ) : (
                      <div className="space-y-1">{eventosDelDia.map((e) => <EventoRow key={e.id} evento={e} perfilPorId={perfilPorId} compacto />)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {vista === "dia" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eventos del día</span>
                <button onClick={() => abrirNuevoEvento(cursor.toISOString().split("T")[0])} className="text-xs font-bold text-rose-600 hover:underline">+ Agregar acá</button>
              </div>
              {eventosDelCursor.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin eventos este día.</p>
              ) : (
                <div className="space-y-1.5">{eventosDelCursor.map((e) => <EventoRow key={e.id} evento={e} perfilPorId={perfilPorId} />)}</div>
              )}
            </div>
          )}

          {vista === "mes" && diaSeleccionado && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Eventos del {diaSeleccionado}</h3>
                <button onClick={() => abrirNuevoEvento(diaSeleccionado)} className="text-xs font-bold text-rose-600 hover:underline">+ Agregar acá</button>
              </div>
              {eventosDelDiaSeleccionado.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sin eventos este día.</p>
              ) : (
                <div className="space-y-1.5">
                  {eventosDelDiaSeleccionado.map((e) => <EventoRow key={e.id} evento={e} perfilPorId={perfilPorId} />)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4" /> Próximos eventos
          </h3>
          {proximosEventos.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Sin próximos eventos.</p>
          ) : (
            <div className="space-y-2">
              {proximosEventos.map((e) => <EventoRow key={e.id} evento={e} perfilPorId={perfilPorId} compacto />)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <div className="flex gap-2 mb-4 border-b border-slate-100 dark:border-white/10">
          {(["proximos", "pasados", "todos"] as const).map((t) => (
            <button key={t} onClick={() => setTabLista(t)} className={`px-3 py-2 text-sm font-bold border-b-2 transition-colors ${tabLista === t ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 dark:text-slate-400"}`}>
              {t === "proximos" ? "Próximos" : t === "pasados" ? "Pasados" : "Todos"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Título, cliente, vehículo, tipo..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
          </div>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs text-slate-900 dark:text-white" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs text-slate-900 dark:text-white" />
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs text-slate-900 dark:text-white">
            <option value="">Todos los tipos</option>
            {TIPOS_EVENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtroCreador} onChange={(e) => setFiltroCreador(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2 text-xs text-slate-900 dark:text-white">
            <option value="">Todos los creadores</option>
            {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-200">Sin resultados</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Todavía no hay eventos cargados. Podés crear uno con el botón de arriba.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {eventosFiltrados.map((e) => <EventoRow key={e.id} evento={e} perfilPorId={perfilPorId} />)}
          </div>
        )}
      </div>

      {modalAbierto && (
        <NuevoEventoModal
          fechaInicial={fechaParaModal}
          perfiles={perfiles}
          miId={miId}
          onClose={() => setModalAbierto(false)}
          onCreado={onEventoCreado}
        />
      )}
    </div>
  );
}

function EventoRow({ evento, perfilPorId, compacto }: { evento: Evento; perfilPorId: Map<string, Perfil>; compacto?: boolean }) {
  const responsable = evento.responsable_id ? perfilPorId.get(evento.responsable_id) : null;
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-slate-100 dark:border-white/10 ${compacto ? "p-2" : "p-3"}`}>
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evento.color }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{evento.titulo}</p>
        <p className="text-[11px] text-slate-400 truncate">
          {evento.fecha}{evento.hora ? ` · ${evento.hora}` : ""} · {evento.tipo}
          {responsable ? ` · ${responsable.nombre}` : ""}
          {evento.visibilidad === "privado" ? " · Privado" : ""}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquareText, Filter, AlertTriangle, CheckCircle2, Circle, CarFront, User, X, Ban, LifeBuoy, LayoutGrid, List } from "lucide-react";
import LeadsTable from "./LeadsTable";

const COLUMNAS = ["Nuevo", "Contactado", "Interesado", "Cliente", "Perdido"];

export default function KanbanBoard({ leadsIniciales, motivosCierre, miRol, miId, vendedores = [], sucursales = [] }: { leadsIniciales: any[]; motivosCierre: any[]; miRol?: string; miId?: string; vendedores?: { id: string; nombre: string }[]; sucursales?: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadsIniciales);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [pendienteCierre, setPendienteCierre] = useState<any | null>(null);
  const [motivoCierreId, setMotivoCierreId] = useState("");
  const [soloMisLeads, setSoloMisLeads] = useState(false);
  const [vista, setVista] = useState<"kanban" | "tabla">("kanban");
  const puedeAlternarVista = miRol === "admin" || miRol === "encargado";

  // Filtro activo: "todos" | "cotizacion" | "consignacion" | "dormidos"
  const [filtroActivo, setFiltroActivo] = useState<string>("todos");

  // ================= DRAG & DROP NATIVO =================
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    const leadActual = leads.find((l) => l.id === draggedLeadId);
    if (!leadActual || leadActual.estado === nuevoEstado) {
      setDraggedLeadId(null);
      return;
    }
    setDraggedLeadId(null);

    // Cerrar como "Perdido" un lead de cotización pide motivo antes de confirmar.
    if (nuevoEstado === "Perdido" && leadActual.origen === "cotizacion") {
      setPendienteCierre(leadActual);
      return;
    }

    await aplicarCambioEstado(leadActual, nuevoEstado);
  };

  // Mismo criterio que el drag & drop del kanban: cerrar como "Perdido" pide motivo antes.
  const cambiarEstadoDesdeTabla = async (leadActual: any, nuevoEstado: string) => {
    if (leadActual.estado === nuevoEstado) return;
    if (nuevoEstado === "Perdido" && leadActual.origen === "cotizacion") {
      setPendienteCierre(leadActual);
      return;
    }
    await aplicarCambioEstado(leadActual, nuevoEstado);
  };

  const aplicarCambioEstado = async (leadActual: any, nuevoEstado: string, motivoId?: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadActual.id ? { ...lead, estado: nuevoEstado } : lead
      )
    );

    try {
      const esWhatsapp = leadActual.origen === "whatsapp";
      const tabla = esWhatsapp ? "whatsapp_conversaciones" : "cotizaciones";
      const campo = esWhatsapp ? "estado_pipeline" : "estado";
      const payload: Record<string, any> = { [campo]: nuevoEstado };
      if (motivoId) payload.motivo_cierre_id = motivoId;
      const { error } = await supabase
        .from(tabla)
        .update(payload)
        .eq("id", leadActual.id);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error moviendo lead:", error);
      alert("Hubo un error al mover el cliente. Se revertirá el cambio.");
      setLeads(leadsIniciales);
    }
  };

  const confirmarCierreConMotivo = async () => {
    if (!motivoCierreId || !pendienteCierre) return alert("Elegí un motivo.");
    await aplicarCambioEstado(pendienteCierre, "Perdido", motivoCierreId);
    setPendienteCierre(null);
    setMotivoCierreId("");
  };

  // ================= LÓGICA DE FILTRADO =================
  const leadsFiltrados = leads.filter((lead) => {
    if (soloMisLeads && lead.vendedor_id !== miId) return false;

    const fechaLead = new Date(lead.created_at).getTime();
    const hoy = new Date().getTime();
    const diasInactivo = Math.floor((hoy - fechaLead) / (1000 * 60 * 60 * 24));

    if (filtroActivo === "dormidos") {
      return diasInactivo >= 7 && lead.estado !== "Perdido";
    }
    if (filtroActivo === "todos") return true;

    // Asumimos que los que no dicen "consignacion", son cotizaciones de venta
    if (filtroActivo === "cotizacion") {
      return lead.tipo_peritaje !== "consignacion";
    }
    return lead.tipo_peritaje === filtroActivo;
  });

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* ================= HEADER TIPO VOCERO ================= */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0">
        <div className="flex items-center gap-6">
          <h2 className="text-[17px] font-bold text-slate-900 leading-tight">Pipeline</h2>
          
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          
          {/* Botones de Filtro Minimalistas */}
          <div className="hidden md:flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <button
              onClick={() => setFiltroActivo("todos")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${filtroActivo === "todos" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroActivo("cotizacion")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${filtroActivo === "cotizacion" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              Cotizaciones
            </button>
            <button
              onClick={() => setFiltroActivo("consignacion")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${filtroActivo === "consignacion" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              Consignaciones
            </button>
            <button
              onClick={() => setFiltroActivo("dormidos")}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${filtroActivo === "dormidos" ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Dormidos (7d+)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setVista("kanban")}
              title="Vista Kanban"
              className={`p-1.5 rounded-md transition-colors ${vista === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVista("tabla")}
              title="Vista Tabla"
              className={`p-1.5 rounded-md transition-colors ${vista === "tabla" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          {puedeAlternarVista && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setSoloMisLeads(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${!soloMisLeads ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Todos
              </button>
              <button
                onClick={() => setSoloMisLeads(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${soloMisLeads ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Mis leads
              </button>
            </div>
          )}
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
            {leadsFiltrados.length} activos
          </span>
        </div>
      </header>

      {vista === "tabla" ? (
        <LeadsTable leads={leadsFiltrados} vendedores={vendedores} sucursales={sucursales} onCambiarEstado={cambiarEstadoDesdeTabla} />
      ) : (
      /* ================= ÁREA DEL BOARD ================= */
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-[#F9FAFB] flex gap-5 custom-scrollbar">

        {COLUMNAS.map((columna, index) => {
          const leadsEnColumna = leadsFiltrados.filter((l) => (l.estado || "Pendiente") === columna);

          return (
            <div
              key={columna}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna)}
              className="flex flex-col min-w-[300px] w-[300px] shrink-0 bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
            >
              {/* Cabecera de la Columna */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/80 bg-slate-100/50">
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 uppercase tracking-wider">
                  {/* Iconito según la etapa */}
                  {index === 0 && <Circle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />}
                  {index === 1 && <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  {index === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {index === 3 && <Circle className="w-3.5 h-3.5 text-slate-400 fill-slate-300" />}
                  {columna === "Pendiente" ? "Nuevos" : columna}
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                  {leadsEnColumna.length}
                </span>
              </div>

              {/* Contenedor de Tarjetas (Scrollable vertical) */}
              <div className="p-3 flex flex-col gap-3 min-h-[150px] flex-1 overflow-y-auto custom-scrollbar">
                {leadsEnColumna.map((lead) => {
                  
                  const esConsignacion = lead.tipo_peritaje === 'consignacion';
                  const esCotizacion = lead.origen === 'cotizacion';
                  const vendedorNombre = lead.perfiles?.nombre;
                  const vehiculoVinculado = lead.vehiculos ? `${lead.vehiculos.marca} ${lead.vehiculos.modelo}` : null;

                  // Inactividad
                  const diasInactivo = Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  const esDormido = diasInactivo >= 7 && lead.estado !== "Perdido";

                  const CardWrapper = esCotizacion ? Link : "div";
                  const wrapperProps = esCotizacion ? { href: `/panel/crm/${lead.id}` } : {};
                  const necesitaAyuda = lead.asistencia_solicitada && !lead.asistencia_atendida;

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, lead.id)}
                      className={`bg-white border-2 rounded-lg p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group ${
                        necesitaAyuda ? "border-orange-400 shadow-orange-100" : esDormido ? "border-rose-200" : "border-slate-200 hover:border-slate-300"
                      } ${draggedLeadId === lead.id ? "opacity-40 scale-[0.98] shadow-none" : "opacity-100"}`}
                    >
                      {necesitaAyuda && (
                        <div className="flex items-center gap-1.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2.5 -mt-0.5 w-fit">
                          <LifeBuoy className="w-3 h-3 animate-pulse" /> Necesita ayuda
                        </div>
                      )}
                      <CardWrapper {...(wrapperProps as any)} className="block">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${esConsignacion ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                          {lead.nombre.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Info Principal */}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="font-bold text-[14px] text-slate-900 truncate pr-2">
                              {lead.nombre}
                            </h4>
                          </div>

                          <p className="text-[12px] text-slate-500 truncate flex items-center gap-1">
                            <CarFront className="w-3 h-3 shrink-0"/> {vehiculoVinculado || `${lead.marca} ${lead.modelo}`}
                          </p>

                          {esCotizacion && (
                            <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> {vendedorNombre || "Sin asignar"}
                            </p>
                          )}

                          {/* Alerta si está dormido */}
                          {esDormido ? (
                            <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1 bg-rose-50 w-fit px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> Sin actividad ({diasInactivo}d)
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                              Ingreso: {new Date(lead.created_at).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </div>
                      </CardWrapper>

                      {/* Footer de la tarjeta */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3">
                        <span className="text-[11px] font-bold text-slate-700 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {lead.precio_sugerido ? `USD ${lead.precio_sugerido.toLocaleString("es-AR")}` : "A tasar"}
                        </span>
                        <a
                          href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${lead.nombre}! Somos de Pfaffen Autos. Te escribo por el ${lead.marca} ${lead.modelo}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#25D366] transition-colors p-1"
                          title="Contactar por WhatsApp"
                          onClick={(e) => e.stopPropagation()} // Evita que se dispare el drag al hacer clic
                        >
                          <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Dropzone visual si está vacía */}
                {leadsEnColumna.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg min-h-[80px]">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
                      Mover aquí
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal: motivo de cierre al soltar en "Perdido" */}
      {pendienteCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setPendienteCierre(null); setMotivoCierreId(""); }}></div>
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">¿Por qué se pierde este lead?</h3>
              <button onClick={() => { setPendienteCierre(null); setMotivoCierreId(""); }} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-slate-600 mb-3">{pendienteCierre.nombre}</p>
            <select
              value={motivoCierreId}
              onChange={(e) => setMotivoCierreId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white text-slate-900 mb-4"
            >
              <option value="">Seleccionar motivo...</option>
              {motivosCierre.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
            </select>
            <button
              onClick={confirmarCierreConMotivo}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest transition-colors"
            >
              <Ban className="w-4 h-4" /> Confirmar cierre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
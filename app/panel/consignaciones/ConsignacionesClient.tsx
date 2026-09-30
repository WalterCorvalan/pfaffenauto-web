"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase/client";
import { Plus, Search, KeyRound, X, ExternalLink, Trash2 } from "lucide-react";
import NuevoMandatoModal from "@/app/panel/stock/NuevoMandatoModal";
import { fmtFechaLocal, hoyLocalISO } from "@/lib/panel/fechas";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADOS_ACTIVOS = ["pendiente_contacto", "contactado", "agendado", "ingreso_local", "publicado"];

const TABS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendientes", label: "Pendientes" },
  { value: "consignado", label: "Consignadas" },
  { value: "cancelado", label: "Canceladas" },
];

type Prefill = { mandanteNombre?: string; mandanteTelefono?: string; mandanteEmail?: string; marca?: string; modelo?: string } | undefined;

export default function ConsignacionesClient({ consignacionesIniciales, perfiles, miId, miNombre, soyAdmin }: { consignacionesIniciales: any[]; perfiles: Perfil[]; miId: string; miNombre: string; soyAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consignaciones, setConsignaciones] = useState(consignacionesIniciales);
  const [tab, setTab] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [modalMandato, setModalMandato] = useState(false);
  const [prefillMandato, setPrefillMandato] = useState<Prefill>(undefined);
  const [consignacionOrigen, setConsignacionOrigen] = useState<any>(null);

  useEffect(() => { setConsignaciones(consignacionesIniciales); }, [consignacionesIniciales]);

  // Realtime: una consignación pedida desde /consignacion (sitio público)
  // antes solo aparecía al recargar el módulo a mano.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const refrescarConDebounce = () => { clearTimeout(timeoutId); timeoutId = setTimeout(() => router.refresh(), 400); };
    const canal = supabase2
      .channel(`consignaciones-realtime-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "consignaciones" }, refrescarConDebounce)
      .subscribe();
    return () => { clearTimeout(timeoutId); supabase2.removeChannel(canal); };
  }, [router]);

  const abrirParaCompletar = (c: any) => {
    setConsignacionOrigen(c);
    // Mismo split naive marca/modelo que ya usaba "Cargar a Stock" -- solo
    // punto de partida, se corrige a mano en el formulario.
    const partes = (c.vehiculo_descripcion || "").trim().split(/\s+/);
    setPrefillMandato({
      mandanteNombre: c.cliente_nombre || "", mandanteTelefono: c.cliente_telefono || "", mandanteEmail: c.cliente_email || "",
      marca: partes[0] || "", modelo: partes.slice(1).join(" ") || "",
    });
    setModalMandato(true);
  };

  // Deep link desde la alerta de "nueva consignación"/"sin contacto"
  // (?consignacion=<id>) -- antes abría el detalle liviano, ahora abre
  // directo el formulario de mandato para esa fila (o va a Stock si ya
  // tiene vehículo vinculado).
  useEffect(() => {
    const id = searchParams.get("consignacion");
    if (!id) return;
    const c = consignaciones.find((x) => x.id === id);
    if (!c) return;
    if (c.vehiculo_id) router.push(`/panel/stock?vehiculo=${c.vehiculo_id}`);
    else abrirParaCompletar(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, consignaciones]);

  const abrirFila = (c: any) => {
    if (c.vehiculo_id) { router.push(`/panel/stock?vehiculo=${c.vehiculo_id}`); return; }
    abrirParaCompletar(c);
  };

  const nuevaConsignacion = () => {
    setConsignacionOrigen(null);
    setPrefillMandato(undefined);
    setModalMandato(true);
  };

  const onMandatoCreado = async (mandato: any, vehiculo: any | null) => {
    setModalMandato(false);
    if (consignacionOrigen) {
      const { data, error } = await supabase2
        .from("consignaciones")
        .update({ mandato_id: mandato.id, vehiculo_id: vehiculo?.id || null, estado: "consignado", publicada: !!vehiculo })
        .eq("id", consignacionOrigen.id)
        .select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )")
        .maybeSingle();
      if (!error && data) setConsignaciones((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      setConsignacionOrigen(null);
    } else {
      const { data, error } = await supabase2
        .from("consignaciones")
        .insert({
          cliente_nombre: mandato.mandante_nombre, cliente_telefono: mandato.mandante_telefono || null, cliente_email: mandato.mandante_email || null,
          vehiculo_descripcion: [mandato.vehiculo_marca, mandato.vehiculo_modelo, mandato.vehiculo_anio].filter(Boolean).join(" "),
          vendedor_id: miId || null, estado: "consignado", fecha_alta: mandato.fecha || hoyLocalISO(),
          mandato_id: mandato.id, vehiculo_id: vehiculo?.id || null, publicada: !!vehiculo, creado_por: miId || null,
        })
        .select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )")
        .single();
      if (!error && data) setConsignaciones((prev) => [data, ...prev]);
    }
    setPrefillMandato(undefined);
  };

  const cancelar = async (c: any) => {
    if (!confirm(`¿Cancelar la consignación de ${c.cliente_nombre}?`)) return;
    const { data, error } = await supabase2
      .from("consignaciones")
      .update({ estado: "cancelado" })
      .eq("id", c.id)
      .select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )")
      .maybeSingle();
    if (!error && data) setConsignaciones((prev) => prev.map((x) => (x.id === data.id ? data : x)));
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar definitivamente la consignación de ${c.cliente_nombre}? No se puede deshacer.`)) return;
    const { error, count } = await supabase2.from("consignaciones").delete({ count: "exact" }).eq("id", c.id);
    if (error || !count) { alert("No se pudo eliminar."); return; }
    setConsignaciones((prev) => prev.filter((x) => x.id !== c.id));
  };

  const activas = consignaciones.filter((c) => ESTADOS_ACTIVOS.includes(c.estado));
  const porContactar = activas.filter((c) => !c.mandato_id).length;
  const publicadas = consignaciones.filter((c) => c.publicada).length;

  const filtradas = useMemo(() => {
    let l = consignaciones;
    if (tab === "pendientes") l = l.filter((c) => ESTADOS_ACTIVOS.includes(c.estado));
    else if (tab !== "todas") l = l.filter((c) => c.estado === tab);
    if (filtroVendedor) l = l.filter((c) => c.vendedor_id === filtroVendedor);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((c) => [c.cliente_nombre, c.cliente_telefono, c.vehiculo_descripcion].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [consignaciones, tab, filtroVendedor, busqueda]);

  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><img src="/icons/panel/consignaciones.png" alt="" className="w-5 h-5 object-contain shrink-0" /> Consignaciones</h1>
          <p className="text-sm text-slate-400">{consignaciones.length} consignación{consignaciones.length === 1 ? "" : "es"} · {porContactar} por completar · {publicadas} publicadas</p>
        </div>
        <button onClick={nuevaConsignacion} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white shadow-sm">
          <Plus className="w-4 h-4" /> Nueva consignación
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 my-4 overflow-x-auto">
        {TABS.map((t) => {
          const n = t.value === "todas" ? consignaciones.length : t.value === "pendientes" ? activas.length : consignaciones.filter((c) => c.estado === t.value).length;
          return (
            <button key={t.value} onClick={() => setTab(t.value)} className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px flex items-center gap-1.5 ${tab === t.value ? "border-[#0145F2] text-[#0145F2]" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {t.label} {n > 0 && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por cliente o vehículo..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
        </div>
        <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="">Todos los vendedores</option>
          {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin consignaciones</p>
          <p className="text-xs text-slate-400 mt-1">No hay ninguna consignación que coincida con esta pestaña/filtro.</p>
        </div>
      ) : (
        <TablaResponsiva<any>
          filas={filtradas}
          keyExtractor={(c) => c.id}
          onRowClick={abrirFila}
          encabezadoMobile={(c) => (
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{c.cliente_nombre}</p>
              {c.cliente_telefono && <p className="text-[11px] text-slate-400">{c.cliente_telefono}</p>}
            </div>
          )}
          columnas={
            [
              { key: "fecha", header: "Fecha", cell: (c) => fmtFechaLocal(c.fecha_alta), claseTd: "text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" },
              { key: "cliente", header: "Cliente", cell: (c) => <><p className="text-sm font-bold text-slate-900 dark:text-white">{c.cliente_nombre}</p>{c.cliente_telefono && <p className="text-[11px] text-slate-400">{c.cliente_telefono}</p>}</>, ocultarEnMobile: true },
              { key: "vehiculo", header: "Vehículo", cell: (c) => c.vehiculo_descripcion, claseTd: "text-xs text-slate-600 dark:text-slate-300" },
              { key: "vendedor", header: "Vendedor", cell: (c) => c.vendedor?.nombre || perfilMap[c.vendedor_id] || "—", claseTd: "text-xs text-slate-500 dark:text-slate-400" },
              {
                key: "estado", header: "Estado",
                cell: (c) => c.vehiculo_id
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><ExternalLink className="w-3 h-3" /> En Stock</span>
                  : c.estado === "cancelado"
                    ? <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Cancelada</span>
                    : <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Por completar</span>,
              },
            ] as ColumnaTabla<any>[]
          }
          acciones={(c) => (
            <div className="flex items-center gap-1">
              {!c.mandato_id && c.estado !== "cancelado" && (
                <button onClick={() => cancelar(c)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-rose-600" title="Cancelar consignación">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {soyAdmin && (
                <button onClick={() => eliminar(c)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-rose-600" title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        />
      )}

      {modalMandato && (
        <NuevoMandatoModal
          miId={miId}
          miNombre={miNombre}
          prefill={prefillMandato}
          onClose={() => { setModalMandato(false); setConsignacionOrigen(null); setPrefillMandato(undefined); }}
          onCreado={onMandatoCreado}
        />
      )}
    </div>
  );
}

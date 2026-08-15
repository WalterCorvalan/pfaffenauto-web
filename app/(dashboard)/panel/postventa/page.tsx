import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Wrench, Phone, CarFront, Calendar, BellRing } from "lucide-react";
import NuevoCasoPostventaModal from "./NuevoCasoPostventaModal";
import EstadoCasoSelector from "./EstadoCasoSelector";
import CrearRecordatorioButton from "./CrearRecordatorioButton";

const DIAS_RECORDATORIO_SERVICE_DEFAULT = 180;

const TIPO_COLOR: Record<string, string> = {
  Service: "bg-blue-500 text-white",
  Reclamo: "bg-rose-500 text-white",
  Garantia: "bg-purple-500 text-white",
};

const ESTADO_BORDE: Record<string, string> = {
  Pendiente: "border-l-amber-400", "En proceso": "border-l-sky-400", Resuelto: "border-l-emerald-400",
};

export default async function PostventaPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: casos }, { data: vehiculos }, { data: config }, { data: ventasConCliente }] = await Promise.all([
    supabase
      .from("postventa_casos")
      .select("*, vehiculos ( marca, modelo, patente )")
      .order("created_at", { ascending: false }),
    supabase.from("vehiculos").select("id, marca, modelo, patente").order("marca"),
    supabase.from("configuracion").select("valor").eq("clave", "dias_recordatorio_servicio").maybeSingle(),
    supabase
      .from("boletos_venta")
      .select("id, fecha, vehiculo_id, apellido, nombre, telefono_celular, marca, modelo")
      .order("fecha", { ascending: false }),
  ]);

  const pendientes = casos?.filter((c) => c.estado === "Pendiente").length || 0;
  const enProceso = casos?.filter((c) => c.estado === "En proceso").length || 0;
  const resueltos = casos?.filter((c) => c.estado === "Resuelto").length || 0;

  // ================= RECORDATORIOS DE SERVICE =================
  // Ventas que ya pasaron los N días configurados y todavía no tienen un caso de Service creado.
  const diasRecordatorio = Number(config?.valor) || DIAS_RECORDATORIO_SERVICE_DEFAULT;
  const hoy = new Date();
  const vehiculosConServiceCreado = new Set(
    (casos || []).filter((c) => c.tipo === "Service" && c.vehiculo_id).map((c) => c.vehiculo_id)
  );

  const recordatoriosPendientes = (ventasConCliente || [])
    .filter((v) => {
      if (!v.vehiculo_id || vehiculosConServiceCreado.has(v.vehiculo_id)) return false;
      const fechaVenta = new Date(`${v.fecha}T12:00:00Z`);
      const diasTranscurridos = Math.floor((hoy.getTime() - fechaVenta.getTime()) / 86400000);
      return diasTranscurridos >= diasRecordatorio;
    })
    .map((v) => ({
      ventaId: v.id,
      vehiculoId: v.vehiculo_id as string,
      cliente: { nombre: `${v.apellido || ""} ${v.nombre || ""}`.trim(), telefono_celular: v.telefono_celular },
      vehiculo: { marca: v.marca, modelo: v.modelo },
      fechaVenta: v.fecha,
    }));

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Postventa</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {pendientes} pendientes · {enProceso} en proceso · {resueltos} resueltos
            </p>
          </div>
        </div>
        <NuevoCasoPostventaModal vehiculos={vehiculos || []} />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1400px] mx-auto">

          {recordatoriosPendientes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <BellRing className="w-3.5 h-3.5 text-amber-500" /> Recordatorios de service ({recordatoriosPendientes.length}) — ventas de hace {diasRecordatorio}+ días
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {recordatoriosPendientes.map((r) => (
                  <div key={r.ventaId} className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-[14px] text-slate-900 mb-1">{r.cliente?.nombre || "Sin nombre"}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                      <Phone className="w-3 h-3" /> {r.cliente?.telefono_celular || "Sin teléfono"}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mb-3">
                      <CarFront className="w-3 h-3 text-slate-400" /> {r.vehiculo?.marca} {r.vehiculo?.modelo}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CrearRecordatorioButton
                        vehiculoId={r.vehiculoId}
                        nombreContacto={r.cliente?.nombre || ""}
                        telefonoContacto={r.cliente?.telefono_celular || ""}
                      />
                      {r.cliente?.telefono_celular && (
                        <a
                          href={`https://wa.me/549${String(r.cliente.telefono_celular).replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${r.cliente?.nombre || ""}! Te escribimos de Pfaffen Autos: ya pasó un tiempo desde tu ${r.vehiculo?.marca} ${r.vehiculo?.modelo}, ¿querés que te coordinemos un turno de service?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {casos?.map((c) => (
            <div key={c.id} className={`bg-white border border-slate-200 border-l-4 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${ESTADO_BORDE[c.estado] || "border-l-slate-200"}`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${TIPO_COLOR[c.tipo] || TIPO_COLOR.Service}`}>
                  {c.tipo}
                </span>
                <EstadoCasoSelector id={c.id} estado={c.estado} />
              </div>

              <h3 className="font-bold text-[14px] text-slate-900 mb-1">{c.nombre_contacto}</h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                <Phone className="w-3 h-3" /> {c.telefono_contacto}
              </p>

              {c.vehiculos && (
                <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mb-2">
                  <CarFront className="w-3 h-3 text-slate-400" /> {c.vehiculos.marca} {c.vehiculos.modelo} {c.vehiculos.patente ? `(${c.vehiculos.patente})` : ""}
                </p>
              )}

              {c.descripcion && (
                <p className="text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-2 line-clamp-3">
                  {c.descripcion}
                </p>
              )}

              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                <Calendar className="w-3 h-3" /> {new Date(`${c.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" })}
              </p>
            </div>
          ))}

          {(!casos || casos.length === 0) && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <Wrench className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700">Sin casos de postventa</h3>
              <p className="text-slate-500 text-xs mt-1">Los turnos de service, reclamos y garantías aparecerán acá.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

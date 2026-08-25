import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { CheckCircle2, Circle, CarFront, Search, Clock, XCircle } from "lucide-react";

const ETAPAS = ["Seña", "Documentación", "Patentamiento", "Transferencia", "Entrega", "Completado"];

const ESTADO_SENA_INFO: Record<string, { label: string; color: string; icono: typeof Clock }> = {
  Activa: { label: "Recibimos tu seña — en proceso", color: "text-amber-500 bg-amber-50", icono: Clock },
  Convertida: { label: "¡Se convirtió en venta! Seguí el resto del proceso con tu asesor.", color: "text-emerald-500 bg-emerald-50", icono: CheckCircle2 },
  Perdida: { label: "Esta seña ya no está activa.", color: "text-rose-500 bg-rose-50", icono: XCircle },
};

// Server-only: usamos service role porque "boletos_venta"/"senas" no tienen policy pública de SELECT.
// La query solo expone etapa + auto, nunca precios ni datos del cliente.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SeguimientoPublicoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const { data: venta } = await supabase
    .from("boletos_venta")
    .select("id, numero, etapa_seguimiento, marca, modelo, vendedor_id")
    .eq("codigo_seguimiento", codigo.toUpperCase())
    .maybeSingle();

  const { data: sena } = venta
    ? { data: null }
    : await supabase
        .from("senas")
        .select("id, numero, estado, marca, modelo, vendedor_id")
        .eq("codigo_seguimiento", codigo.toUpperCase())
        .maybeSingle();

  if (venta?.vendedor_id) {
    await supabase.from("notificaciones").insert({
      perfil_id: venta.vendedor_id,
      tipo: "vista_seguimiento",
      mensaje: `El cliente abrió el seguimiento de la Venta N° ${venta.numero} (${venta.marca} ${venta.modelo}).`,
      link: `/panel/ventas/seguimiento/${venta.id}`,
      seccion: "boletos",
    });
  } else if (sena?.vendedor_id) {
    await supabase.from("notificaciones").insert({
      perfil_id: sena.vendedor_id,
      tipo: "vista_seguimiento",
      mensaje: `El cliente abrió el seguimiento de la Seña N° ${sena.numero} (${sena.marca} ${sena.modelo}).`,
      link: `/panel/senas/imprimir/${sena.id}`,
      seccion: "senas",
    });
  }

  const indexActual = venta ? ETAPAS.indexOf(venta.etapa_seguimiento || "Seña") : -1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {sena ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-[#0145F2]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguimiento de tu seña</p>
                <h1 className="text-lg font-black text-navy">{sena.marca} {sena.modelo}</h1>
              </div>
            </div>
            {(() => {
              const info = ESTADO_SENA_INFO[sena.estado] || ESTADO_SENA_INFO.Activa;
              const Icono = info.icono;
              return (
                <div className={`flex items-center gap-3 rounded-2xl p-4 ${info.color}`}>
                  <Icono className="w-6 h-6 shrink-0" />
                  <p className="text-sm font-bold">{info.label}</p>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-400 text-center mt-8">
              ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
            </p>
          </div>
        ) : !venta ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h1 className="text-xl font-black text-navy mb-2">Código no encontrado</h1>
            <p className="text-sm text-slate-500 mb-6">Revisá el código que te compartió tu asesor e intentá de nuevo.</p>
            <Link href="/seguimiento" className="inline-block bg-[#0145F2] text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl">
              Probar de nuevo
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-[#0145F2]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguimiento de tu operación</p>
                <h1 className="text-lg font-black text-navy">
                  {venta.marca} {venta.modelo}
                </h1>
              </div>
            </div>

            <div className="space-y-1">
              {ETAPAS.map((etapa, i) => {
                const completada = i < indexActual;
                const actual = i === indexActual;
                return (
                  <div key={etapa} className="flex items-center gap-3 py-2">
                    {completada ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : actual ? (
                      <div className="w-5 h-5 rounded-full bg-[#0145F2] flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-200 shrink-0" />
                    )}
                    <span className={`text-sm font-bold ${actual ? "text-[#0145F2]" : completada ? "text-slate-700" : "text-slate-300"}`}>
                      {etapa}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-8">
              ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

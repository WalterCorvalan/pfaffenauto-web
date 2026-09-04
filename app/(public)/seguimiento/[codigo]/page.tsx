import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { CheckCircle2, Circle, CarFront, Search, Wallet } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

const ESTADO_SENA_INFO: Record<string, { label: string; color: string; icono: typeof Wallet }> = {
  Activa: { label: "Recibimos tu seña — en proceso", color: "text-amber-500 bg-amber-50", icono: Wallet },
  Convertida: { label: "¡Se convirtió en venta! Seguí el resto del proceso con tu asesor.", color: "text-emerald-500 bg-emerald-50", icono: CheckCircle2 },
  Perdida: { label: "Esta seña ya no está activa.", color: "text-rose-500 bg-rose-50", icono: Search },
};

// Server-only: usamos service role porque senas/ventas/expedientes no tienen
// policy pública de SELECT. La query solo expone marca/modelo + progreso,
// nunca precios internos ni datos del cliente.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export default async function SeguimientoPublicoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const codigoUpper = codigo.toUpperCase();

  const { data: venta } = await supabase
    .from("ventas")
    .select("id, marca:vehiculo_marca, modelo:vehiculo_modelo, vendedor_id, precio_venta, moneda_venta")
    .eq("codigo_seguimiento", codigoUpper)
    .maybeSingle();

  const { data: sena } = venta
    ? { data: null }
    : await supabase
        .from("senas")
        .select("id, numero, estado, marca, modelo, vendedor_id")
        .eq("codigo_seguimiento", codigoUpper)
        .maybeSingle();

  let hitos: { nombre: string; completado: boolean }[] = [];
  let montoPendiente = 0;
  if (venta) {
    const { data: expediente } = await supabase
      .from("expedientes")
      .select("id")
      .eq("venta_id", venta.id)
      .maybeSingle();

    if (expediente) {
      const { data: h } = await supabase
        .from("expediente_hitos")
        .select("nombre, completado")
        .eq("expediente_id", expediente.id)
        .order("orden");
      hitos = h || [];
    }

    // movimientos_caja no tiene columna de moneda propia — la moneda depende
    // de la cuenta destino, así que hay que joinearla para no mezclar ARS/USD.
    const { data: movimientos } = await supabase
      .from("movimientos_caja")
      .select("monto, cuenta:cuenta_id ( moneda )")
      .eq("venta_id", venta.id)
      .eq("tipo", "ingreso")
      .eq("estado", "aprobado");
    const cobrado = (movimientos || [])
      .filter((m: any) => m.cuenta?.moneda === venta.moneda_venta)
      .reduce((acc: number, m: any) => acc + Number(m.monto), 0);
    montoPendiente = Math.max(0, Number(venta.precio_venta) - cobrado);
  }

  if (venta?.vendedor_id) {
    await crearAlerta(supabase, venta.vendedor_id, `El cliente abrió el seguimiento de su venta (${venta.marca || ""} ${venta.modelo || ""})`, {
      tipo: "vista_seguimiento",
      link: `/panel-v2/ventas`,
    });
  } else if (sena?.vendedor_id) {
    await crearAlerta(supabase, sena.vendedor_id, `El cliente abrió el seguimiento de la Seña N° ${sena.numero} (${sena.marca} ${sena.modelo})`, {
      tipo: "vista_seguimiento",
      link: `/panel-v2/senas`,
    });
  }

  const totalHitos = hitos.length;
  const completados = hitos.filter((h) => h.completado).length;

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

            {totalHitos === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl p-4 text-amber-700 bg-amber-50">
                <Wallet className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">Tu venta está confirmada. En breve tu asesor va a iniciar la gestión de la documentación.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {hitos.map((hito, i) => {
                  const actual = !hito.completado && hitos.slice(0, i).every((h) => h.completado);
                  return (
                    <div key={hito.nombre} className="flex items-center gap-3 py-2">
                      {hito.completado ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : actual ? (
                        <div className="w-5 h-5 rounded-full bg-[#0145F2] flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-200 shrink-0" />
                      )}
                      <span className={`text-sm font-bold ${actual ? "text-[#0145F2]" : hito.completado ? "text-slate-700" : "text-slate-300"}`}>
                        {hito.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {(completados === totalHitos && totalHitos > 0) || montoPendiente > 0 ? (
              <div className="mt-6 space-y-2">
                {completados === totalHitos && totalHitos > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl p-4 text-emerald-600 bg-emerald-50">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">Tu trámite está finalizado. Pronto vas a poder retirar la documentación.</p>
                  </div>
                )}
                {montoPendiente > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl p-4 text-amber-700 bg-amber-50">
                    <Wallet className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">Monto pendiente a abonar al retirar: {venta.moneda_venta === "ARS" ? "$" : "US$"} {montoPendiente.toLocaleString("es-AR")}</p>
                  </div>
                )}
              </div>
            ) : null}

            <p className="text-[11px] text-slate-400 text-center mt-8">
              ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

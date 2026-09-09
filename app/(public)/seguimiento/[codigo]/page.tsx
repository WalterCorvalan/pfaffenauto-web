import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { CheckCircle2, Circle, CarFront, Search, Wallet, MessageCircle } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";
import { rateLimit } from "@/lib/rateLimit";
import { resolverContacto } from "@/lib/panelV2/contactoVehiculo";

// Fuerza render dinámico: necesitamos leer headers() por request para el
// rate limit por IP (si no, Next podría servir esta página cacheada).
export const dynamic = "force-dynamic";

// Códigos de 8 caracteres al azar por cliente: no tiene sentido indexarlos
// (contenido privado por código, y son URLs "infinitas" que solo desperdician
// crawl budget).
export const metadata: Metadata = {
  title: "Seguí tu operación | Pfaffen Autos",
  robots: { index: false, follow: false },
};

const ESTADO_SENA_INFO: Record<string, { label: string; color: string; icono: typeof Wallet }> = {
  Activa: { label: "Recibimos tu seña — en proceso", color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10", icono: Wallet },
  Convertida: { label: "¡Se convirtió en venta! Seguí el resto del proceso con tu asesor.", color: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10", icono: CheckCircle2 },
  Perdida: { label: "Esta seña ya no está activa.", color: "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10", icono: Search },
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
  const codigoUpper = codigo.trim().toUpperCase();

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limite = await rateLimit(ip, { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-sm">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-navy dark:text-white mb-2">Demasiados intentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Esperá un momento y volvé a intentarlo.</p>
        </div>
      </div>
    );
  }

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

  // Antes esto era solo texto ("Escribinos por WhatsApp") sin link -- el
  // número real es el del vendedor asignado a esta venta/seña, o si no
  // cargó uno propio, el de la sucursal.
  const contacto = await resolverContacto(supabase, { vendedorId: venta?.vendedor_id || sena?.vendedor_id || null });
  const nombreAuto = venta ? `${venta.marca || ""} ${venta.modelo || ""}`.trim() : sena ? `${sena.marca} ${sena.modelo}`.trim() : "";
  const whatsappHref = contacto.numero
    ? `https://wa.me/${contacto.numero.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Te escribo por el seguimiento de mi ${nombreAuto || "operación"} (código ${codigoUpper}).`)}`
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {sena ? (
          <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-[#0145F2] dark:text-sky-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Seguimiento de tu seña</p>
                <h1 className="text-lg font-black text-navy dark:text-white">{sena.marca} {sena.modelo}</h1>
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
            {whatsappHref ? (
              <div className="mt-8 space-y-2">
                {contacto.nombreVendedor && (
                  <div className="flex items-center gap-2.5 justify-center">
                    {contacto.fotoVendedor ? (
                      <img src={contacto.fotoVendedor} alt={contacto.nombreVendedor} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-sky-500/10 flex items-center justify-center text-[#0145F2] dark:text-sky-400 font-bold text-xs">{contacto.nombreVendedor.charAt(0).toUpperCase()}</div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tu asesor: <strong className="text-slate-700 dark:text-slate-200">{contacto.nombreVendedor}</strong></p>
                  </div>
                )}
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors">
                  <MessageCircle className="w-4 h-4" /> {contacto.nombreVendedor ? `Escribile a ${contacto.nombreVendedor.split(" ")[0]}` : "Escribinos por WhatsApp"}
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-8">
                ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
              </p>
            )}
          </div>
        ) : !venta ? (
          <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-sm">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-navy dark:text-white mb-2">Código no encontrado</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Revisá el código que te compartió tu asesor e intentá de nuevo.</p>
            <Link href="/seguimiento" className="inline-block bg-[#0145F2] text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl">
              Probar de nuevo
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-[#0145F2] dark:text-sky-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Seguimiento de tu operación</p>
                <h1 className="text-lg font-black text-navy dark:text-white">
                  {venta.marca} {venta.modelo}
                </h1>
              </div>
            </div>

            {totalHitos === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl p-4 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
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
                        <Circle className="w-5 h-5 text-slate-200 dark:text-white/10 shrink-0" />
                      )}
                      <span className={`text-sm font-bold ${actual ? "text-[#0145F2] dark:text-sky-400" : hito.completado ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}`}>
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
                  <div className="flex items-center gap-3 rounded-2xl p-4 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">Tu trámite está finalizado. Pronto vas a poder retirar la documentación.</p>
                  </div>
                )}
                {montoPendiente > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl p-4 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10">
                    <Wallet className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">Monto pendiente a abonar al retirar: {venta.moneda_venta === "ARS" ? "$" : "US$"} {montoPendiente.toLocaleString("es-AR")}</p>
                  </div>
                )}
              </div>
            ) : null}

            {whatsappHref ? (
              <div className="mt-8 space-y-2">
                {contacto.nombreVendedor && (
                  <div className="flex items-center gap-2.5 justify-center">
                    {contacto.fotoVendedor ? (
                      <img src={contacto.fotoVendedor} alt={contacto.nombreVendedor} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-sky-500/10 flex items-center justify-center text-[#0145F2] dark:text-sky-400 font-bold text-xs">{contacto.nombreVendedor.charAt(0).toUpperCase()}</div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tu asesor: <strong className="text-slate-700 dark:text-slate-200">{contacto.nombreVendedor}</strong></p>
                  </div>
                )}
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors">
                  <MessageCircle className="w-4 h-4" /> {contacto.nombreVendedor ? `Escribile a ${contacto.nombreVendedor.split(" ")[0]}` : "Escribinos por WhatsApp"}
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-8">
                ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

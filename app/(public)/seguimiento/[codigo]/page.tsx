import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { CheckCircle2, Circle, CarFront, Search, Wallet, MessageCircle, PartyPopper, Clock3 } from "lucide-react";
import { crearAlerta } from "@/lib/panel/alertas";
import { rateLimit } from "@/lib/rateLimit";
import { resolverContacto } from "@/lib/panel/contactoVehiculo";

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

const ESTADO_SENA_INFO: Record<string, { label: string; sub: string; color: string; icono: typeof Wallet }> = {
  Activa: { label: "Recibimos tu seña", sub: "Tu operación está en proceso", color: "amber", icono: Wallet },
  Convertida: { label: "¡Se convirtió en venta!", sub: "Seguí el resto del proceso con tu asesor", color: "emerald", icono: PartyPopper },
  Perdida: { label: "Seña no activa", sub: "Esta seña ya no está vigente", color: "slate", icono: Search },
};

const TONOS: Record<string, { bg: string; text: string; ring: string }> = {
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-500/20" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-500/20" },
  slate: { bg: "bg-slate-100 dark:bg-white/5", text: "text-slate-500 dark:text-slate-400", ring: "ring-slate-200 dark:ring-white/10" },
};

// Server-only: usamos service role porque senas/ventas/expedientes no tienen
// policy pública de SELECT. La query solo expone marca/modelo + progreso,
// nunca precios internos ni datos del cliente.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function TarjetaVendedor({ nombreVendedor, fotoVendedor, whatsappHref }: { nombreVendedor: string | null; fotoVendedor: string | null; whatsappHref: string | null }) {
  if (!whatsappHref) {
    return (
      <p className="text-[12px] text-slate-400 dark:text-slate-500 text-center mt-8">
        ¿Dudas? Escribinos por WhatsApp y te contamos el detalle.
      </p>
    );
  }
  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 space-y-3">
      {nombreVendedor && (
        <div className="flex items-center gap-3 justify-center">
          {fotoVendedor ? (
            <img src={fotoVendedor} alt={nombreVendedor} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0145F2] to-[#26bae0] flex items-center justify-center text-white font-black text-xs shadow-sm">{nombreVendedor.charAt(0).toUpperCase()}</div>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400">Tu asesor: <strong className="text-slate-800 dark:text-slate-100">{nombreVendedor}</strong></p>
        </div>
      )}
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
        <MessageCircle className="w-4 h-4" /> {nombreVendedor ? `Escribile a ${nombreVendedor.split(" ")[0]}` : "Escribinos por WhatsApp"}
      </a>
    </div>
  );
}

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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
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
      link: `/panel/ventas`,
    });
  } else if (sena?.vendedor_id) {
    await crearAlerta(supabase, sena.vendedor_id, `El cliente abrió el seguimiento de la Seña N° ${sena.numero} (${sena.marca} ${sena.modelo})`, {
      tipo: "vista_seguimiento",
      link: `/panel/senas`,
    });
  }

  const totalHitos = hitos.length;
  const completados = hitos.filter((h) => h.completado).length;
  const pctProgreso = totalHitos > 0 ? Math.round((completados / totalHitos) * 100) : venta ? 5 : 0;

  // Antes esto era solo texto ("Escribinos por WhatsApp") sin link -- el
  // número real es el del vendedor asignado a esta venta/seña, o si no
  // cargó uno propio, el de la sucursal.
  const contacto = await resolverContacto(supabase, { vendedorId: venta?.vendedor_id || sena?.vendedor_id || null });
  const nombreAuto = venta ? `${venta.marca || ""} ${venta.modelo || ""}`.trim() : sena ? `${sena.marca} ${sena.modelo}`.trim() : "";
  const whatsappHref = contacto.numero
    ? `https://wa.me/${contacto.numero.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Te escribo por el seguimiento de mi ${nombreAuto || "operación"} (código ${codigoUpper}).`)}`
    : null;

  // ============= NO ENCONTRADO =============
  if (!venta && !sena) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
          </div>
          <h1 className="text-xl font-black text-navy dark:text-white mb-2">Código no encontrado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Revisá el código que te compartió tu asesor e intentá de nuevo.</p>
          <Link href="/seguimiento" className="inline-block bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-500/25">
            Probar de nuevo
          </Link>
        </div>
      </div>
    );
  }

  // ============= SEÑA (sin expediente todavía) =============
  if (sena) {
    const info = ESTADO_SENA_INFO[sena.estado] || ESTADO_SENA_INFO.Activa;
    const Icono = info.icono;
    const tono = TONOS[info.color];
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f]">
        <div className="relative bg-gradient-to-br from-[#0f293e] via-[#0145F2] to-[#26bae0] pt-28 pb-24 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
          <div className="relative max-w-lg mx-auto text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">Seguimiento de tu seña</p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{sena.marca} {sena.modelo}</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-14 pb-16">
          <div className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/10 rounded-3xl p-7 md:p-8 shadow-2xl shadow-slate-300/40 dark:shadow-none">
            <div className={`flex items-center gap-4 rounded-2xl p-5 ring-1 ${tono.bg} ${tono.ring}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white dark:bg-white/10 shadow-sm`}>
                <Icono className={`w-6 h-6 ${tono.text}`} />
              </div>
              <div>
                <p className={`text-base font-black ${tono.text}`}>{info.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{info.sub}</p>
              </div>
            </div>

            <TarjetaVendedor nombreVendedor={contacto.nombreVendedor} fotoVendedor={contacto.fotoVendedor} whatsappHref={whatsappHref} />
          </div>
        </div>
      </div>
    );
  }

  // ============= VENTA (con timeline de hitos) =============
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f]">
      <div className="relative bg-gradient-to-br from-[#0f293e] via-[#0145F2] to-[#26bae0] pt-28 pb-28 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
        <div className="relative max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4">
            <CarFront className="w-7 h-7 text-white" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Seguimiento de tu operación</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-6">{venta!.marca} {venta!.modelo}</h1>

          {totalHitos > 0 && (
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70 mb-1.5">
                <span>Progreso del trámite</span>
                <span>{pctProgreso}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pctProgreso}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-16 pb-16">
        <div className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/10 rounded-3xl p-7 md:p-8 shadow-2xl shadow-slate-300/40 dark:shadow-none">
          {totalHitos === 0 ? (
            <div className="flex items-center gap-4 rounded-2xl p-5 ring-1 bg-amber-50 dark:bg-amber-500/10 ring-amber-200 dark:ring-amber-500/20">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white dark:bg-white/10 shadow-sm">
                <Clock3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Tu venta está confirmada. En breve tu asesor va a iniciar la gestión de la documentación.</p>
            </div>
          ) : (
            <div className="relative pl-1">
              {hitos.map((hito, i) => {
                const actual = !hito.completado && hitos.slice(0, i).every((h) => h.completado);
                const esUltimo = i === hitos.length - 1;
                return (
                  <div key={hito.nombre} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    {!esUltimo && (
                      <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${hito.completado ? "bg-emerald-400" : "bg-slate-100 dark:bg-white/10"}`} />
                    )}
                    <div className="relative z-10 shrink-0">
                      {hito.completado ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      ) : actual ? (
                        <div className="w-8 h-8 rounded-full bg-[#0145F2] flex items-center justify-center shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-500/10">
                          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center">
                          <Circle className="w-3 h-3 text-slate-200 dark:text-white/10" />
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className={`text-sm font-black ${actual ? "text-[#0145F2] dark:text-sky-400" : hito.completado ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}`}>
                        {hito.nombre}
                      </p>
                      {actual && <p className="text-[11px] text-slate-400 mt-0.5">En proceso ahora</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(completados === totalHitos && totalHitos > 0) || montoPendiente > 0 ? (
            <div className="mt-2 space-y-2.5">
              {completados === totalHitos && totalHitos > 0 && (
                <div className="flex items-center gap-3 rounded-2xl p-4 ring-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200 dark:ring-emerald-500/20">
                  <PartyPopper className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">Tu trámite está finalizado. Pronto vas a poder retirar la documentación.</p>
                </div>
              )}
              {montoPendiente > 0 && (
                <div className="flex items-center gap-3 rounded-2xl p-4 ring-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-amber-200 dark:ring-amber-500/20">
                  <Wallet className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">Monto pendiente a abonar al retirar: {venta!.moneda_venta === "ARS" ? "$" : "US$"} {montoPendiente.toLocaleString("es-AR")}</p>
                </div>
              )}
            </div>
          ) : null}

          <TarjetaVendedor nombreVendedor={contacto.nombreVendedor} fotoVendedor={contacto.fotoVendedor} whatsappHref={whatsappHref} />
        </div>
      </div>
    </div>
  );
}

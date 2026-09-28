import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { Search, MessageCircle, MapPin, Phone, ShieldCheck, Gauge, CalendarDays, Palette, Fingerprint, ArrowRight, CarFront } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { rateLimit } from "@/lib/rateLimit";

// Sin cookies/headers para que no se cachee estáticamente y deje de
// registrar aperturas/notificar en visitas repetidas.
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function Dato({ icon: Icon, label, valor }: { icon: any; label: string; valor: string }) {
  return (
    <div className="flex items-center gap-4 bg-slate-50/70 rounded-2xl px-5 py-4 border border-slate-100 transition-colors hover:bg-slate-50">
      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 text-[#0145F2]">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-slate-800 truncate mt-0.5">{valor}</p>
      </div>
    </div>
  );
}

export default async function PresupuestoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limite = await rateLimit(ip, { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  
  if (!limite.ok) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 max-w-md w-full">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#0f293e] mb-2">Demasiados intentos</h1>
          <p className="text-sm text-slate-500">Esperá un momento y volvé a intentarlo.</p>
        </div>
      </div>
    );
  }

  const { data: p } = await supabase
    .from("presupuestos")
    .select("id, numero, fecha, cliente_nombre, marca, modelo, tipo, modelo_anio, color, kilometros, combustible, dominio, precio_ars, precio_usd, observaciones, vendedor_id")
    .eq("token_publico", token)
    .maybeSingle();

  if (p) {
    await supabase.from("presupuesto_aperturas").insert({ presupuesto_id: p.id });
    if (p.vendedor_id) {
      // WhatsApp (y otros previews de link) hacen su propio fetch de la URL
      // pública antes de que el cliente la abra de verdad -- eso duplica la
      // visita real. Si ya hay una alerta de esta apertura en los últimos
      // 30s, no duplicar.
      const haceTreintaSeg = new Date(Date.now() - 30_000).toISOString();
      const { data: reciente } = await supabase
        .from("alertas")
        .select("id")
        .eq("destinatario_id", p.vendedor_id)
        .eq("tipo", "presupuesto_abierto")
        .eq("link", `/panel/presupuestos/imprimir/${p.id}`)
        .gte("created_at", haceTreintaSeg)
        .maybeSingle();

      if (!reciente) {
        await supabase.from("alertas").insert({
          destinatario_id: p.vendedor_id,
          tipo: "presupuesto_abierto",
          prioridad: "media",
          titulo: `${p.cliente_nombre || "El cliente"} abrió el presupuesto N° ${p.numero} (${p.marca} ${p.modelo})`,
          link: `/panel/presupuestos/imprimir/${p.id}`,
        });
      }
    }
  }

  let nombreVendedor: string | null = null;
  let fotoVendedor: string | null = null;
  let numeroContacto: string | null = null;
  let sucursal: { nombre: string; direccion: string | null; telefono_encargado: string | null; google_maps_url: string | null } | null = null;
  
  if (p?.vendedor_id) {
    const { data: vendedor } = await supabase.from("perfiles").select("nombre, whatsapp, foto_url, sucursal_id").eq("id", p.vendedor_id).maybeSingle();
    nombreVendedor = vendedor?.nombre ?? null;
    fotoVendedor = vendedor?.foto_url ?? null;
    numeroContacto = vendedor?.whatsapp || null;
    if (vendedor?.sucursal_id) {
      const { data: s } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url").eq("id", vendedor.sucursal_id).maybeSingle();
      sucursal = s ?? null;
    }
  }
  
  if (!sucursal) {
    const { data: fallback } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url").order("nombre").limit(1);
    sucursal = fallback?.[0] ?? null;
  }
  
  if (!numeroContacto) numeroContacto = sucursal?.telefono_encargado || null;
  const sucursalNombre = sucursal?.nombre || "Casa Central";

  const mapaHref = sucursal?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sucursal?.direccion || sucursalNombre)}`;
  const whatsappHref = numeroContacto
    ? `https://wa.me/${numeroContacto.replace(/\D/g, "")}${p ? `?text=${encodeURIComponent(`Hola! Consulto por el presupuesto N° ${p.numero} de ${p.marca} ${p.modelo}`)}` : ""}`
    : null;

  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = p?.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const precioTexto = p ? (p.precio_ars ? formatMoney(p.precio_ars) : p.precio_usd ? `US$ ${Number(p.precio_usd).toLocaleString("es-AR")}` : "A convenir") : "";

  if (!p) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center px-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h1 className="text-xl font-black text-[#0f293e] mb-2">Presupuesto no encontrado</h1>
          <p className="text-sm text-slate-500 mb-6">Por favor, revisá el link que te compartió tu asesor.</p>
          <Link href="/catalogo" className="inline-block bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-500/25">
            Ver catálogo online
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* ================= HERO ================= */}
      <div className="relative bg-gradient-to-br from-[#0f293e] via-[#0145F2] to-[#26bae0] pt-10 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_15%_25%,white,transparent_35%),radial-gradient(circle_at_85%_65%,white,transparent_30%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <Image src="/logo.png" alt="Pfaffen Cars" width={40} height={40} className="rounded-full ring-2 ring-white/20" />
            <span className="font-black text-white tracking-tight text-sm">PFAFFEN CARS</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Propuesta comercial N° {p.numero}</p>
              <h2 className="text-lg text-white/90 font-medium">Estimado/a <strong className="text-white font-black">{p.cliente_nombre || "Cliente"}</strong></h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
              <p className="text-xs font-bold text-white/90">{fecha}</p>
            </div>
          </div>

          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">{p.marca} {p.modelo} {p.modelo_anio || ""}</p>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{precioTexto}</h1>
        </div>
      </div>

      {/* ================= CONTENIDO ================= */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start relative z-10">
        
        {/* COLUMNA IZQUIERDA: Vehículo */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0145F2] flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f293e] uppercase tracking-tight">{p.marca} {p.modelo} {p.modelo_anio ? `${p.modelo_anio}` : ""}</h3>
                {p.tipo && <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{p.tipo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Dato icon={Fingerprint} label="Dominio" valor={p.dominio || "0KM"} />
              <Dato icon={CalendarDays} label="Año" valor={String(p.modelo_anio || "-")} />
              <Dato icon={Palette} label="Color" valor={p.color || "-"} />
              <Dato icon={Gauge} label="Kilometraje" valor={p.kilometros ? `${p.kilometros.toLocaleString("es-AR")} km` : "-"} />
            </div>

            {p.observaciones && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Observaciones de la cotización</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{p.observaciones}</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-6">
              <Link href="/catalogo" className="inline-flex items-center justify-center gap-2 w-full py-4 bg-slate-100 hover:bg-slate-200 text-[#0f293e] font-black rounded-2xl text-xs uppercase tracking-widest transition-colors">
                Ver todo el catálogo online <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-slate-400 text-center mt-4 px-4 leading-relaxed">
                Este documento es de carácter informativo y no oficia como reserva de la unidad. El precio se encuentra sujeto a modificaciones hasta el momento de la seña.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Vendedor & CTA */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="bg-gradient-to-br from-[#0145F2] to-[#0f293e] p-6 text-white">
            <div className="flex items-center gap-4">
              {fotoVendedor ? (
                <img src={fotoVendedor} alt={nombreVendedor || ""} className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black">{(nombreVendedor || "PA").substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-black text-sm">{nombreVendedor || "Equipo Pfaffen Cars"}</p>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3 h-3" /> Asesor comercial</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5">
                <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
              </a>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sucursal asignada</p>
              <p className="font-black text-[#0f293e] text-sm">{sucursalNombre}</p>
              
              {sucursal?.direccion && (
                <p className="text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> {sucursal.direccion}
                </p>
              )}
              {sucursal?.telefono_encargado && (
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {sucursal.telefono_encargado}
                </p>
              )}
            </div>

            <a href={mapaHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors">
              <MapPin className="w-3.5 h-3.5" /> Cómo llegar
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
}
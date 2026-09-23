import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { CheckCircle2, CarFront, Search, Wallet, MessageCircle, PartyPopper, MapPin, ShieldCheck, FileText, Check, Clock } from "lucide-react";
import Image from "next/image";
import { crearAlerta } from "@/lib/panel/alertas";
import { rateLimit } from "@/lib/rateLimit";
import { resolverContacto } from "@/lib/panel/contactoVehiculo";
import DocumentosCliente from "./DocumentosCliente";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal del Cliente | Pfaffen Autos",
  robots: { index: false, follow: false },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export default async function SeguimientoPublicoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const codigoUpper = codigo.trim().toUpperCase();

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limite = await rateLimit(ip, { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  
  if (!limite.ok) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-none max-w-md w-full">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-black text-[#0f293e] dark:text-white mb-2">Demasiados intentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Esperá un momento y volvé a intentarlo.</p>
        </div>
      </div>
    );
  }

  // Fetch Core Data
  const { data: venta } = await supabase.from("ventas").select("id, marca:vehiculo_marca, modelo:vehiculo_modelo, vendedor_id, precio_venta, moneda_venta, estado").eq("codigo_seguimiento", codigoUpper).maybeSingle();
  const { data: sena } = venta ? { data: null } : await supabase.from("senas").select("id, numero, estado, marca, modelo, vendedor_id, vehiculo_id, vehiculo:vehiculo_id ( fotos )").eq("codigo_seguimiento", codigoUpper).maybeSingle();
  const fotoSena = (sena as any)?.vehiculo?.fotos?.[0] || null;

  let hitos: { nombre: string; completado: boolean }[] = [];
  let montoPendiente = 0;
  
  if (venta) {
    const { data: expediente } = await supabase.from("expedientes").select("id").eq("venta_id", venta.id).maybeSingle();
    if (expediente) {
      const { data: h } = await supabase.from("expediente_hitos").select("nombre, completado").eq("expediente_id", expediente.id).order("orden");
      hitos = h || [];
    }

    const { data: movimientos } = await supabase.from("movimientos_caja").select("monto, cuenta:cuenta_id(moneda)").eq("venta_id", venta.id).eq("tipo", "ingreso").eq("estado", "aprobado");
    const cobrado = (movimientos || [])
      .filter((m: any) => m.cuenta?.moneda === venta.moneda_venta)
      .reduce((acc: number, m: any) => acc + Number(m.monto), 0);
    montoPendiente = Math.max(0, Number(venta.precio_venta) - cobrado);
  }

  // Fetch Sucursal y Vendedor para armar el mapa y contacto
  const vendedorId = venta?.vendedor_id || sena?.vendedor_id;
  let sucursal = null;
  if (vendedorId) {
    const { data: perfil } = await supabase.from("perfiles").select("sucursal_id").eq("id", vendedorId).maybeSingle();
    if (perfil?.sucursal_id) {
      const { data: suc } = await supabase.from("sucursales").select("nombre, direccion, telefono_encargado, google_maps_url").eq("id", perfil.sucursal_id).maybeSingle();
      sucursal = suc;
    }
  }
  if (!sucursal) {
    const { data: fallbacks } = await supabase.from("sucursales").select("*").limit(1);
    sucursal = fallbacks?.[0];
  }

  const sucursalNombre = sucursal?.nombre || "Casa Central";
  const mapaHref = sucursal?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sucursal?.direccion || sucursalNombre)}`;

  // Notificar
  if (venta?.vendedor_id) {
    await crearAlerta(supabase, venta.vendedor_id, `El cliente abrió el seguimiento de su venta (${venta.marca || ""} ${venta.modelo || ""})`, { tipo: "vista_seguimiento", link: `/panel/ventas` });
  } else if (sena?.vendedor_id) {
    await crearAlerta(supabase, sena.vendedor_id, `El cliente abrió el seguimiento de la Seña N° ${sena.numero} (${sena.marca} ${sena.modelo})`, { tipo: "vista_seguimiento", link: `/panel/senas` });
  }

  // Lógicas de progreso
  const totalHitos = hitos.length;
  const completados = hitos.filter((h) => h.completado).length;
  const pctProgreso = totalHitos > 0 ? Math.round((completados / totalHitos) * 100) : (sena ? 25 : 5);
  const circuloRadius = 38;
  const circuloCircumference = 2 * Math.PI * circuloRadius;
  const circuloOffset = circuloCircumference - (pctProgreso / 100) * circuloCircumference;
  
  const hitoActual = hitos.find((h, i) => !h.completado && hitos.slice(0, i).every(prev => prev.completado));
  const operacionFinalizada = totalHitos > 0 && completados === totalHitos;

  const contacto = await resolverContacto(supabase, { vendedorId });
  const nombreAuto = venta ? `${venta.marca || ""} ${venta.modelo || ""}`.trim() : sena ? `${sena.marca} ${sena.modelo}`.trim() : "";
  const whatsappHref = contacto.numero ? `https://wa.me/${contacto.numero.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola! Te escribo por el seguimiento de mi ${nombreAuto || "operación"} (código ${codigoUpper}).`)}` : null;

  if (!venta && !sena) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="bg-white dark:bg-[#111] border border-slate-100 dark:border-white/10 rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 dark:shadow-none max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h1 className="text-xl font-black text-[#0f293e] dark:text-white mb-2">Operación no encontrada</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Por favor, revisá el código que te compartió tu asesor e intentá de nuevo.</p>
          <Link href="/seguimiento" className="inline-block bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-500/25">
            Probar de nuevo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0a0a0f] pb-16 transition-colors">
      
      {/* HEADER FLOTANTE */}
      <div className="pt-6 px-4 mb-4 max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white/70 dark:bg-[#111]/70 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-white dark:border-white/10">
          <Image src="/logo.png" alt="Pfaffen Autos" width={28} height={28} className="rounded-full" />
          <span className="font-black text-[#0f293e] dark:text-white tracking-tight text-xs">PFAFFEN AUTOS</span>
        </div>
        <div className="bg-white/70 dark:bg-[#111]/70 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-white dark:border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cód: {codigoUpper}</span>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* 1. HERO Y VEHICULO (Izquierda Arriba) */}
        <div className="md:col-span-8 bg-gradient-to-br from-[#0f293e] via-[#0145F2] to-[#26bae0] rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-lg shadow-blue-900/20 dark:shadow-none">
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_15%_25%,white,transparent_35%),radial-gradient(circle_at_85%_65%,white,transparent_30%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Portal del Cliente</p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {nombreAuto}
              </h1>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Estado actual:</p>
                <p className="text-white font-black text-lg">{operacionFinalizada ? "Lista para retirar" : sena ? "Seña ingresada" : "Documentación en proceso"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PROGRESO CIRCULAR (Derecha Arriba) */}
        <div className="md:col-span-4 bg-white dark:bg-[#111] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={circuloRadius} className="stroke-slate-100 dark:stroke-white/10" strokeWidth="8" fill="transparent" />
              <circle 
                cx="50" cy="50" r={circuloRadius} 
                className={`${operacionFinalizada ? "stroke-emerald-500" : "stroke-[#0145F2] dark:stroke-sky-400"} transition-all duration-1000 ease-out`} 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={circuloCircumference} 
                strokeDashoffset={circuloOffset} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {operacionFinalizada ? (
                <PartyPopper className="w-8 h-8 text-emerald-500" />
              ) : (
                <>
                  <span className="text-3xl font-black text-[#0f293e] dark:text-white leading-none">{pctProgreso}</span>
                  <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">%</span>
                </>
              )}
            </div>
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{operacionFinalizada ? "¡Completado!" : "Avance general"}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {operacionFinalizada ? "Tu operación está cerrada con éxito." : "Estamos trabajando en los trámites de tu vehículo."}
          </p>
        </div>

        {/* 3. LÍNEA DE TIEMPO (Izquierda Abajo) */}
        {venta && (
          <div className="md:col-span-7 bg-white dark:bg-[#111] rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/10">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Detalle del Trámite
            </h3>
            
            {totalHitos === 0 ? (
              <div className="relative pl-2">
                <div className="relative flex items-start gap-5 pb-0">
                  <div className="relative z-10 shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#111] flex items-center justify-center shadow-lg ring-4 ring-blue-50 dark:ring-blue-500/10 border-2 border-slate-100 dark:border-white/10">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#0145F2] dark:bg-sky-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-base font-black text-[#0f293e] dark:text-white">Compra confirmada</p>
                    <p className="text-[11px] text-[#0145F2] dark:text-sky-400 font-bold uppercase tracking-widest mt-1.5">En proceso ahora</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm">El equipo de gestoría está preparando la documentación de tu vehículo. Los pasos del trámite van a aparecer acá apenas arranquen.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative pl-2">
                {hitos.map((hito, i) => {
                  const actual = hito.nombre === hitoActual?.nombre;
                  const esUltimo = i === hitos.length - 1;
                  return (
                    <div key={hito.nombre} className="relative flex items-start gap-5 pb-8 last:pb-0">
                      {!esUltimo && (
                        <div className={`absolute left-[19px] top-10 bottom-[-10px] w-[3px] rounded-full ${hito.completado ? "bg-[#0145F2]" : "bg-slate-100 dark:bg-white/10"}`} />
                      )}
                      <div className="relative z-10 shrink-0 mt-1">
                        {hito.completado ? (
                          <div className="w-10 h-10 rounded-full bg-[#0145F2] flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-none">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        ) : actual ? (
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#111] flex items-center justify-center shadow-lg ring-4 ring-blue-50 dark:ring-blue-500/10 border-2 border-slate-100 dark:border-white/10">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#0145F2] dark:bg-sky-400 animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <p className={`text-base font-black ${actual ? "text-[#0f293e] dark:text-white" : hito.completado ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>
                          {hito.nombre}
                        </p>
                        {actual && <p className="text-[11px] text-[#0145F2] dark:text-sky-400 font-bold uppercase tracking-widest mt-1.5">En proceso ahora</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {sena && (
          <div
            className="md:col-span-7 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-white/10 flex flex-col justify-center relative overflow-hidden bg-slate-900 bg-cover bg-center"
            style={fotoSena ? { backgroundImage: `linear-gradient(to top, rgba(15,41,62,0.92), rgba(15,41,62,0.55)), url(${fotoSena})` } : undefined}
          >
             <div className="relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-500/20">
                  <Wallet className="w-7 h-7" />
               </div>
               <h3 className={`text-xl font-black mb-2 ${fotoSena ? "text-white" : "text-slate-800 dark:text-white"}`}>Seña Acreditada</h3>
               <p className={`leading-relaxed ${fotoSena ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                 Recibimos tu reserva correctamente. Tu asesor se comunicará a la brevedad para avanzar con la documentación y convertir esta seña en una venta formal.
               </p>
             </div>
          </div>
        )}

        {/* 4. COLUMNA DERECHA (Acciones y Asesor) */}
        <div className="md:col-span-5 flex flex-col gap-5">
          
          {/* Tarjeta Financiera (Solo si hay saldo) */}
          {montoPendiente > 0 && (
            <div className="bg-[#0f293e] rounded-3xl p-6 shadow-sm border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <Wallet className="w-6 h-6 text-white/50 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Saldo pendiente al retiro</p>
              <p className="text-3xl font-black">{venta!.moneda_venta === "ARS" ? "$" : "US$"} {montoPendiente.toLocaleString("es-AR")}</p>
            </div>
          )}

          {/* Tarjeta Checklist */}
          {venta && !operacionFinalizada && (
            <div className="bg-slate-50 dark:bg-[#111] rounded-3xl p-6 border border-slate-100 dark:border-white/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Para el día de entrega
              </h4>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Recordá traer tu <strong className="dark:text-white">DNI físico</strong> vigente.</span>
                </li>
                {montoPendiente > 0 && (
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Comprobante de cancelación de saldo.</span>
                  </li>
                )}
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Licencia de conducir para retirar el vehículo.</span>
                </li>
              </ul>
            </div>
          )}

          {/* Documentación del vehículo que el cliente entrega */}
          <DocumentosCliente codigo={codigoUpper} />

          {/* Tarjeta del Asesor */}
          <div className="bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-white/10 flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Tu Asesor Comercial</h4>
            
            <div className="flex items-center gap-4 mb-6">
              {contacto.fotoVendedor ? (
                <img src={contacto.fotoVendedor} alt={contacto.nombreVendedor || ""} className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-white/10" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  <span className="text-lg font-black text-slate-400">{(contacto.nombreVendedor || "PA").substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-black text-slate-800 dark:text-white text-base">{contacto.nombreVendedor || "Equipo Pfaffen"}</p>
                <p className="text-[11px] font-bold text-[#0145F2] dark:text-sky-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Verificado
                </p>
              </div>
            </div>

            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 dark:shadow-none">
                <MessageCircle className="w-4 h-4" /> Hablar por WhatsApp
              </a>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Contactate con nuestra sucursal para más información.</p>
            )}
          </div>

          {/* Tarjeta Ubicación (Mapa) */}
          {sucursal && (
            <div className="bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-[0.02] w-32 h-32 transform translate-x-4 translate-y-4 pointer-events-none">
                <MapPin className="w-full h-full text-slate-900 dark:text-white" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Punto de entrega</h4>
              <p className="font-black text-slate-800 dark:text-white text-lg mb-1">{sucursalNombre}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-[200px]">{sucursal.direccion || "Dirección no cargada"}</p>
              
              <a href={mapaHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-black rounded-xl text-[11px] uppercase tracking-widest transition-colors relative z-10">
                <MapPin className="w-3.5 h-3.5" /> Cómo llegar
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
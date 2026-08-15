import { createClient } from "@supabase/supabase-js";
import { CarFront, Search } from "lucide-react";
import Link from "next/link";

// Server-only: usamos service role porque "presupuestos" no tiene policy pública de SELECT.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PresupuestoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: p } = await supabase
    .from("presupuestos")
    .select("id, numero, fecha, cliente, marca, modelo, tipo, modelo_anio, color, kilometros, combustible, dominio, precio_venta_ars, precio_venta_usd, observaciones, vendedor_id")
    .eq("token_publico", token)
    .maybeSingle();

  if (p) {
    // Cada apertura queda registrada (no se deduplica a propósito) y notifica solo al vendedor asignado.
    await supabase.from("presupuesto_aperturas").insert({ presupuesto_id: p.id });
    if (p.vendedor_id) {
      await supabase.from("notificaciones").insert({
        perfil_id: p.vendedor_id,
        tipo: "presupuesto_abierto",
        mensaje: `${p.cliente || "El cliente"} abrió el presupuesto N° ${p.numero} (${p.marca} ${p.modelo})`,
        link: `/panel/presupuestos/imprimir/${p.id}`,
      });
    }
  }

  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = p?.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {!p ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h1 className="text-xl font-black text-navy mb-2">Presupuesto no encontrado</h1>
            <p className="text-sm text-slate-500">Revisá el link que te compartió tu asesor.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <CarFront className="w-6 h-6 text-[#0145F2]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presupuesto N° {p.numero} · {fecha}</p>
                <h1 className="text-lg font-black text-navy">{p.marca} {p.modelo}</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <div><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Dominio</span><strong className="text-slate-900">{p.dominio || "0KM"}</strong></div>
              <div><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Año</span><strong className="text-slate-900">{p.modelo_anio || "-"}</strong></div>
              <div><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Color</span><strong className="text-slate-900 capitalize">{p.color || "-"}</strong></div>
              <div><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] block">Km</span><strong className="text-slate-900">{p.kilometros?.toLocaleString("es-AR") || "-"}</strong></div>
            </div>

            <div className="bg-[#0145F2] rounded-2xl p-5 mb-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-1">Precio</span>
              <strong className="text-2xl font-black text-white">
                {p.precio_venta_ars ? formatMoney(p.precio_venta_ars) : p.precio_venta_usd ? `US$ ${Number(p.precio_venta_usd).toLocaleString("es-AR")}` : "A convenir"}
              </strong>
            </div>

            {p.observaciones && (
              <p className="text-[12px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 whitespace-pre-wrap">{p.observaciones}</p>
            )}

            <p className="text-[11px] text-slate-400 text-center">
              Este documento es informativo y no reserva la unidad. Precio sujeto a cambios hasta la seña.
            </p>
            <Link href="/" className="block text-center mt-6 text-[11px] font-black uppercase tracking-widest text-[#0145F2]">
              Ver más autos en Pfaffen Autos →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

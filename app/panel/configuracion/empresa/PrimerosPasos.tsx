"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";

// "Primeros pasos" de una empresa nueva: lista lo mínimo que hay que cargar para empezar a usar el panel,
// con un link directo a cada pantalla. Todo se calcula con lo que ya está en la base -- nada se guarda acá.
// Si todo está completo, la tarjeta desaparece.

interface Paso { clave: string; titulo: string; detalle: string; href: string; hecho: boolean }

export default function PrimerosPasos() {
  const [pasos, setPasos] = useState<Paso[] | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [cfg, sucursales, vendedores, cuentas, wa] = await Promise.all([
        supabase2.from("configuracion_empresa").select("branding_nombre, branding_logo_url, objetivo_ventas_mensual").eq("id", true).maybeSingle(),
        supabase2.from("sucursales").select("id", { count: "exact", head: true }),
        supabase2.from("perfiles").select("id", { count: "exact", head: true }).eq("activo", true).contains("roles", ["ventas"]),
        supabase2.from("cuentas").select("id", { count: "exact", head: true }).eq("activa", true),
        supabase2.from("whatsapp_configuracion").select("listo").eq("id", true).maybeSingle(),
      ]);
      if (!vivo) return;
      const c = cfg.data;
      setPasos([
        { clave: "identidad", titulo: "Nombre, logo y color de la empresa", detalle: "Pestaña Empresa > Branding. Aparecen en el menú, el login y los documentos impresos.", href: "/panel/configuracion/empresa", hecho: !!(c?.branding_nombre && c?.branding_logo_url) },
        { clave: "sucursales", titulo: "Al menos una sucursal", detalle: "Dirección, teléfono y horarios. Se usa en el sitio público y para repartir leads.", href: "/panel/configuracion/sucursales", hecho: (sucursales.count ?? 0) > 0 },
        { clave: "equipo", titulo: "Al menos un vendedor activo", detalle: "Crear los usuarios del equipo con su rol y sucursal.", href: "/panel/configuracion", hecho: (vendedores.count ?? 0) > 0 },
        { clave: "cuentas", titulo: "Al menos una caja o cuenta", detalle: "En Tesorería: caja en pesos, en dólares y banco, para registrar cobros y pagos.", href: "/panel/tesoreria", hecho: (cuentas.count ?? 0) > 0 },
        { clave: "whatsapp", titulo: "Conectar WhatsApp", detalle: "Necesario para recibir y contestar mensajes de clientes desde el panel.", href: "/panel/configuracion/whatsapp", hecho: !!wa.data?.listo },
        { clave: "objetivo", titulo: "Objetivo de ventas del mes", detalle: "Empresa > Comisiones. Alimenta el avance del mes en el Dashboard.", href: "/panel/configuracion/empresa", hecho: c?.objetivo_ventas_mensual != null },
      ]);
    })();
    return () => { vivo = false; };
  }, []);

  if (!pasos) return null;
  const pendientes = pasos.filter((p) => !p.hecho);
  if (pendientes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Rocket className="w-4 h-4 text-[#0145F2]" /> Primeros pasos para dejar el panel listo</p>
        <span className="text-xs font-bold text-slate-400">{pasos.length - pendientes.length} de {pasos.length} completos</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden"><div className="h-full bg-[#0145F2] rounded-full" style={{ width: `${((pasos.length - pendientes.length) / pasos.length) * 100}%` }} /></div>
      <ul className="space-y-1.5">
        {pasos.map((p) => (
          <li key={p.clave}>
            <Link href={p.href} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
              {p.hecho ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />}
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${p.hecho ? "text-slate-400 line-through" : "text-slate-800 dark:text-white"}`}>{p.titulo}</span>
                {!p.hecho && <span className="block text-xs text-slate-400">{p.detalle}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

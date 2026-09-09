"use client";

import Link from "next/link";
import { X, Wallet, Printer, MessageSquareText } from "lucide-react";

const LABEL_ESTADO: Record<string, string> = { Activa: "Pendiente", Convertida: "Realizada", Perdida: "Perdida" };

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2 whitespace-pre-wrap">{valor ?? "—"}</p>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{titulo}</p>
      <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
        {children}
      </div>
    </div>
  );
}

function moneda(ars?: number | null, usd?: number | null) {
  if (ars) return `$ ${Number(ars).toLocaleString("es-AR")}`;
  if (usd) return `US$ ${Number(usd).toLocaleString("es-AR")}`;
  return null;
}

export default function SenaDetalleModal({ sena: s, onClose }: { sena: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 pt-4 pb-2 sticky top-0 bg-white dark:bg-[#111] z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Wallet className="w-5 h-5 text-rose-600" /> Seña {s.numero ? `N° ${s.numero}` : ""}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <Seccion titulo="Cliente">
            <Fila label="Nombre" valor={`${s.apellido || s.cliente_nombre || ""}${s.nombre ? `, ${s.nombre}` : ""}`} />
            <Fila label="DNI" valor={s.dni} />
            <Fila label="Teléfono" valor={s.telefono_celular} />
            <Fila label="Email" valor={s.correo_electronico} />
            <Fila label="Domicilio" valor={[s.calle && `${s.calle} ${s.numero_calle || ""}`, s.localidad, s.provincia].filter(Boolean).join(", ") || null} />
          </Seccion>

          <Seccion titulo="Vehículo">
            <Fila label="Descripción" valor={[s.marca, s.modelo, s.modelo_anio].filter(Boolean).join(" ") || null} />
            <Fila label="Dominio" valor={s.dominio} />
            <Fila label="Color" valor={s.color} />
          </Seccion>

          <Seccion titulo="Comercial">
            <Fila label="Venta" valor={moneda(s.venta_ars, s.venta_usd)} />
            <Fila label="Seña" valor={moneda(s.sena_ars, s.sena_usd)} />
            <Fila label="Saldo a abonar" valor={s.saldo_abonar_ars != null ? `$ ${Number(s.saldo_abonar_ars).toLocaleString("es-AR")}` : null} />
            <Fila label="Remanente" valor={s.remanente_ars != null ? `$ ${Number(s.remanente_ars).toLocaleString("es-AR")}` : null} />
          </Seccion>

          <Seccion titulo="Estado">
            <Fila label="Sucursal" valor={s.sucursales?.nombre} />
            <Fila label="Vendedor" valor={s.perfiles?.nombre} />
            <Fila label="Fecha" valor={s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : null} />
            <Fila label="Estado" valor={LABEL_ESTADO[s.estado] || s.estado} />
            <Fila label="Precio confirmado" valor={s.precio_confirmado === false ? "⚠️ A confirmar" : s.precio_confirmado === true ? "Sí" : null} />
          </Seccion>

          {s.notas && (
            <Seccion titulo="Observaciones">
              <p className="text-sm text-slate-800 dark:text-white whitespace-pre-wrap py-2">{s.notas}</p>
            </Seccion>
          )}

          <div className="flex gap-2 pt-1">
            <Link href={`/panel/senas/imprimir/${s.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm py-2.5 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> Ver / Imprimir
            </Link>
            {s.telefono_celular && (
              <a
                href={`https://wa.me/${s.telefono_celular.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                <MessageSquareText className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

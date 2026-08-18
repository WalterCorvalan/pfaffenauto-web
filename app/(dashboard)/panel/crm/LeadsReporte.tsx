"use client";

const ESTADOS_ORDEN = ["Nuevo", "Contactado", "Interesado", "Cliente", "Perdido"];

const CALIFICACION_LABEL: Record<string, string> = {
  caliente: "Caliente",
  tibio: "Tibio",
  frio: "Frío",
};

const BADGE_ESTADO: Record<string, string> = {
  Nuevo: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  Contactado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  Interesado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  Cliente: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Perdido: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
};

const BADGE_ANTIGUEDAD: Record<string, string> = {
  "1 a 7 días": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  "8 a 30 días": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  "Más de 30 días": "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
};

const BADGE_CALIFICACION: Record<string, string> = {
  Caliente: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  Tibio: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  Frío: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  "Sin calificar": "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
};

const BADGE_DEFAULT = "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300";

function agrupar(leads: any[], claveFn: (l: any) => string) {
  const conteo = new Map<string, number>();
  for (const lead of leads) {
    const clave = claveFn(lead);
    conteo.set(clave, (conteo.get(clave) || 0) + 1);
  }
  return conteo;
}

function TablaReporte({
  titulo,
  filas,
  total,
  badges,
}: {
  titulo: string;
  filas: [string, number][];
  total: number;
  badges?: Record<string, string>;
}) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 dark:bg-[#00246b] text-white text-[10px] uppercase tracking-widest font-bold">
              <th className="p-3 pl-4">{titulo}</th>
              <th className="p-3 text-right">Leads</th>
              <th className="p-3 pr-4 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
            <tr className="bg-slate-50/80 dark:bg-[#00246b]/40 font-bold">
              <td className="p-3 pl-4 text-slate-900 dark:text-white">Total</td>
              <td className="p-3 text-right text-slate-900 dark:text-white">{total}</td>
              <td className="p-3 pr-4 text-right text-slate-500 dark:text-slate-400">100%</td>
            </tr>
            {filas.map(([nombre, cantidad]) => (
              <tr key={nombre} className="hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors">
                <td className="p-3 pl-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${badges?.[nombre] || BADGE_DEFAULT}`}>
                    {nombre}
                  </span>
                </td>
                <td className="p-3 text-right text-[13px] font-semibold text-slate-700 dark:text-slate-200">{cantidad}</td>
                <td className="p-3 pr-4 text-right text-[13px] text-slate-500 dark:text-slate-400">
                  {total > 0 ? ((cantidad / total) * 100).toFixed(2) : "0.00"}%
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400 dark:text-slate-500 text-[13px]">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LeadsReporte({ leads }: { leads: any[] }) {
  const total = leads.length;

  const porEstado = agrupar(leads, (l) => l.estado || "Nuevo");
  const filasEstado = ESTADOS_ORDEN.filter((e) => porEstado.has(e)).map(
    (e) => [e, porEstado.get(e)!] as [string, number]
  );

  const porAntiguedad = agrupar(leads, (l) => {
    const dias = Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 7) return "1 a 7 días";
    if (dias <= 30) return "8 a 30 días";
    return "Más de 30 días";
  });
  const filasAntiguedad = ["1 a 7 días", "8 a 30 días", "Más de 30 días"]
    .filter((k) => porAntiguedad.has(k))
    .map((k) => [k, porAntiguedad.get(k)!] as [string, number]);

  const porCalificacion = agrupar(leads, (l) => CALIFICACION_LABEL[l.calificacion] || "Sin calificar");
  const filasCalificacion = Array.from(porCalificacion.entries()).sort((a, b) => b[1] - a[1]);

  const porDueno = agrupar(leads, (l) => l.perfiles?.nombre || "Sin asignar");
  const filasDueno = Array.from(porDueno.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
        <TablaReporte titulo="Estado" filas={filasEstado} total={total} badges={BADGE_ESTADO} />
        <TablaReporte titulo="Antigüedad" filas={filasAntiguedad} total={total} badges={BADGE_ANTIGUEDAD} />
        <TablaReporte titulo="Calificación" filas={filasCalificacion} total={total} badges={BADGE_CALIFICACION} />
        <TablaReporte titulo="Dueño del Lead" filas={filasDueno} total={total} />
      </div>
    </div>
  );
}

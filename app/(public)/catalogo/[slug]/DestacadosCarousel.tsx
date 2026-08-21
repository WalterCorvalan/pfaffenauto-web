import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface Destacado {
  id: string;
  marca: string;
  modelo: string;
  slug: string;
  precio_publicado_ars: number | null;
  precio_publicado_usd: number | null;
  multimedia_vehiculos?: { url_archivo: string }[];
}

export default function DestacadosCarousel({ vehiculos }: { vehiculos: Destacado[] }) {
  if (!vehiculos || vehiculos.length === 0) return null;

  return (
    <div className="print:hidden">
      <h2 className="text-xl md:text-2xl font-black text-navy dark:text-white tracking-tight mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#0145F2] dark:text-sky-400" /> Autos Destacados
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
        {vehiculos.map((auto) => {
          const precio =
            auto.precio_publicado_ars
              ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}`
              : auto.precio_publicado_usd
                ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
                : "Consultar";

          return (
            <Link
              key={auto.id}
              href={`/catalogo/${auto.slug}`}
              className="min-w-[220px] max-w-[220px] shrink-0 snap-start bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white dark:border-white/10 hover:border-[#0145F2]/40 dark:hover:border-sky-400/40 hover:bg-white dark:hover:bg-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all group"
            >
              <div className="relative h-32 bg-white/40 dark:bg-white/5 overflow-hidden mix-blend-multiply dark:mix-blend-normal">
                {auto.multimedia_vehiculos?.[0]?.url_archivo ? (
                  <Image
                    src={auto.multimedia_vehiculos[0].url_archivo}
                    alt={`${auto.marca} ${auto.modelo}`}
                    fill
                    sizes="220px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-[10px] font-bold">Sin foto</div>
                )}
              </div>
              <div className="p-3.5">
                <span className="text-[9px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">{auto.marca}</span>
                <h3 className="text-navy dark:text-white text-sm font-black leading-tight truncate uppercase">{auto.modelo}</h3>
                <span className="text-[#0145F2] dark:text-sky-400 text-xs font-black mt-1 block">{precio}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

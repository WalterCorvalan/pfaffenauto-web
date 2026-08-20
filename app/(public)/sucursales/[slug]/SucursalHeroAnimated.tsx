import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, ArrowLeft } from "lucide-react";

interface HeroProps {
  slug: string;
  nombre: string;
  imagen: string;
  direccion: string;
  telefono: string;
  horario: string;
}

const UBICACIONES: Record<string, { mapUrl: string; navLink: string }> = {
  "casa-central": {
    mapUrl: "https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es",
    navLink: "https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9",
  },
  "don-torcuato": {
    // Acá colocamos la URL embed exacta de Google Maps
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3288.084180424599!2d-58.62231392426363!3d-34.48414427334185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bca5007f7d6a25%3A0x103f7a961b168d5!2sPfaffen%20Autos%20Panamericana!5e0!3m2!1ses!2sar!4v1716300000000!5m2!1ses!2sar",
    navLink: "https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9",
  },
};

export default function SucursalHeroAnimated({ slug, nombre, imagen, direccion, telefono, horario }: HeroProps) {
  const ubicacion = UBICACIONES[slug];
  const mapaSrc = ubicacion?.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;

  return (
    <>
      {/* ================= BANNER ================= */}
      <section className="relative h-64 md:h-80 lg:h-[420px] w-full overflow-hidden">
        <Image src={imagen} alt={`Sucursal ${nombre}`} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>

        <div className="relative z-10 max-w-7xl mx-auto w-full h-full px-4 md:px-6 flex flex-col justify-between py-6">
          <Link
            href="/#sucursales"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors w-fit bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a Sucursales
          </Link>

          <div>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest block mb-1">Sucursal</span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">{nombre}</h1>
          </div>
        </div>
      </section>

      {/* ================= DATOS DE CONTACTO Y UBICACIÓN ================= */}
      <section className="bg-white dark:bg-[#0a0a0f] border-b border-gray-200 dark:border-white/10">
        {/* Agregamos items-stretch para que ambas columnas midan lo mismo */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* Info formal: Le damos flex-col y justify-center para que se centre verticalmente */}
          <div className="lg:col-span-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl divide-y divide-gray-100 dark:divide-white/10 flex flex-col justify-center">
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={direccion} />
            <InfoRow
              icon={<Phone className="w-4 h-4" />}
              label="Teléfono"
              value={telefono}
              href={`https://wa.me/549${telefono.replace(/\D/g, "")}`}
            />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Horario de atención" value={horario} />
          </div>

          {/* Mapa de ubicación: relative y h-full con el iframe en absolute */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 min-h-[300px]">
            <iframe
              title={`Ubicación de ${nombre}`}
              src={mapaSrc}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>
      </section>
    </>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const contenido = (
    <>
      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-400/10 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">{label}</span>
        <span className={`text-sm font-bold block truncate ${href ? "text-blue-700 dark:text-sky-300" : "text-gray-900 dark:text-white"}`}>{value}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 hover:bg-blue-50/50 dark:hover:bg-sky-400/5 transition-colors">
        {contenido}
      </a>
    );
  }

  return <div className="flex items-center gap-4 p-5">{contenido}</div>;
}
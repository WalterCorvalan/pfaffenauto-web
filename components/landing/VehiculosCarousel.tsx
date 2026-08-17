"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Hero de carrusel full-viewport (referencia: carrusel de personajes tipo
// "figurine carousel") adaptado para mostrar los autos de una marca en vez
// de personajes. Roles (centro/izq/der/atrás) se calculan de forma genérica
// según la cantidad de items — con 2 (Karry) o 3 (Rely) igual funciona,
// simplemente no se usan todos los roles.

export interface ItemCarrusel {
  src: string;
  bg: string;
  panel: string;
  name: string;
  subtitle: string;
  href: string;
}

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>`
  );

type Rol = "center" | "left" | "right" | "back";

const ESTILO_ROL: Record<Rol, (isMobile: boolean) => React.CSSProperties> = {
  center: (isMobile) => ({
    transform: `translateX(-50%) scale(${isMobile ? 1.05 : 1.68})`,
    filter: "blur(0px)",
    opacity: 1,
    zIndex: 20,
    left: "50%",
    height: isMobile ? "56%" : "92%",
    bottom: isMobile ? "20%" : 0,
  }),
  left: (isMobile) => ({
    transform: "translateX(-50%) scale(1)",
    filter: "blur(1px)",
    opacity: 0.9,
    zIndex: 10,
    left: isMobile ? "6%" : "30%",
    height: isMobile ? "22%" : "28%",
    bottom: isMobile ? "26%" : "12%",
  }),
  right: (isMobile) => ({
    transform: "translateX(-50%) scale(1)",
    filter: "blur(1px)",
    opacity: 0.9,
    zIndex: 10,
    left: isMobile ? "94%" : "70%",
    height: isMobile ? "22%" : "28%",
    bottom: isMobile ? "26%" : "12%",
  }),
  back: (isMobile) => ({
    transform: "translateX(-50%) scale(1)",
    filter: "blur(4px)",
    opacity: 1,
    zIndex: 5,
    left: "50%",
    height: isMobile ? "13%" : "22%",
    bottom: isMobile ? "32%" : "12%",
  }),
};

export default function VehiculosCarousel({
  items,
  logoSrc,
  logoAlt,
  invertLogo = false,
}: {
  items: ItemCarrusel[];
  logoSrc: string;
  logoAlt: string;
  invertLogo?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    items.forEach((item) => {
      const img = new window.Image();
      img.src = item.src;
    });
  }, [items]);

  const n = items.length;

  const navigate = (dir: "next" | "prev") => {
    if (isAnimating || n <= 1) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (dir === "next" ? (prev + 1) % n : (prev + n - 1) % n));
    setTimeout(() => setIsAnimating(false), 650);
  };

  // Roles genéricos: se saltea cualquier rol cuyo índice ya se usó (pasa con
  // pocos items — con 2 o 3 autos no hay "back" distinto, y listo).
  const usados = new Set<number>();
  const roles: { rol: Rol; index: number }[] = [];
  (
    [
      ["center", activeIndex],
      ["left", (activeIndex + n - 1) % n],
      ["right", (activeIndex + 1) % n],
      ["back", (activeIndex + 2) % n],
    ] as [Rol, number][]
  ).forEach(([rol, index]) => {
    if (usados.has(index)) return;
    usados.add(index);
    roles.push({ rol, index });
  });

  const activo = items[activeIndex];

  return (
    <div
      style={{
        backgroundColor: activo.bg,
        transition: "background-color 650ms cubic-bezier(0.4,0,0.2,1)",
        fontFamily: "Inter, sans-serif",
      }}
      className="relative w-full overflow-hidden"
    >
      <div className="relative w-full overflow-hidden" style={{ height: "100vh" }}>
        {/* Grano */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundImage: `url("${GRAIN_SVG}")`,
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Logo fantasma gigante — debajo del header fijo, no lo pisa */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: "26%" }}
        >
          <img
            src={logoSrc}
            alt={logoAlt}
            style={{
              width: "clamp(220px, 42vw, 560px)",
              height: "auto",
              objectFit: "contain",
              filter: invertLogo ? "brightness(0) invert(1)" : "none",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Carrusel de autos */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {roles.map(({ rol, index }) => {
            const item = items[index];
            return (
              <div
                key={index}
                className="absolute"
                style={{
                  aspectRatio: "0.6 / 1",
                  transition:
                    "transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)",
                  willChange: "transform, filter, opacity",
                  ...ESTILO_ROL[rol](isMobile),
                }}
              >
                <img
                  src={item.src}
                  alt={item.name}
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }}
                />
              </div>
            );
          })}
        </div>

        {/* Texto + flechas abajo a la izquierda */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: 320 }}
        >
          <p
            className="uppercase font-bold tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px] text-white"
            style={{ opacity: 0.95, letterSpacing: "0.02em" }}
          >
            {activo.name}
          </p>
          <p
            className="hidden sm:block text-xs sm:text-sm text-white mb-4 sm:mb-5"
            style={{ opacity: 0.85, lineHeight: 1.6 }}
          >
            {activo.subtitle}
          </p>

          {n > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("prev")}
                aria-label="Anterior"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white border-2 border-white bg-transparent hover:bg-white/12 hover:scale-[1.08] transition-[transform,background-color] duration-150"
              >
                <ArrowLeft size={26} strokeWidth={2.25} />
              </button>
              <button
                onClick={() => navigate("next")}
                aria-label="Siguiente"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white border-2 border-white bg-transparent hover:bg-white/12 hover:scale-[1.08] transition-[transform,background-color] duration-150"
              >
                <ArrowRight size={26} strokeWidth={2.25} />
              </button>
            </div>
          )}
        </div>

        {/* Link abajo a la derecha — corrido arriba en mobile para no pisar el botón de chat flotante */}
        <Link
          href={activo.href}
          className="absolute bottom-24 right-4 sm:bottom-20 sm:right-10 flex items-center text-white uppercase hover:opacity-100 transition-opacity duration-200"
          style={{ zIndex: 60, fontSize: "clamp(20px, 4vw, 56px)", fontWeight: 400, opacity: 0.95, letterSpacing: "-0.02em", lineHeight: 1 }}
        >
          Ver ficha
          <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 ml-2" strokeWidth={2.25} />
        </Link>
      </div>
    </div>
  );
}

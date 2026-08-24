"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

// Hero "Drive-In": en vez de un carrusel de figuras chicas rotando, cada auto
// ENTRA manejando a toda velocidad (estelas de movimiento incluidas) y frena
// en seco con un rebote de suspensión al llegar al centro. Al cambiar de
// versión, el auto actual arranca y se va rápido para el lado que elegiste,
// y el siguiente entra manejando desde el lado opuesto. Un solo auto en
// pantalla siempre — nada se esconde detrás de nada.

export interface ItemCarrusel {
  src: string;
  bg: string;
  panel: string;
  name: string;
  subtitle: string;
  href: string;
  load?: string;
}

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>`
  );

type Fase = "entrando" | "idle" | "saliendo";

const DURACION_SALIDA = 380;
const DURACION_ENTRADA = 650;

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
  const [saliente, setSaliente] = useState<{ index: number; direccion: "izquierda" | "derecha" } | null>(null);
  const [fase, setFase] = useState<Fase>("entrando");
  const [direccionEntrada, setDireccionEntrada] = useState<"izquierda" | "derecha">("derecha");
  const [isMobile, setIsMobile] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  // Entrada inicial al cargar la página
  useEffect(() => {
    const t = setTimeout(() => setFase("idle"), DURACION_ENTRADA);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const n = items.length;

  const navigate = (dir: "next" | "prev") => {
    if (fase !== "idle" || n <= 1) return;
    // "next" = el auto actual arranca hacia la izquierda, el próximo entra desde la derecha.
    const salidaHacia = dir === "next" ? "izquierda" : "derecha";
    const entradaDesde = dir === "next" ? "derecha" : "izquierda";

    setSaliente({ index: activeIndex, direccion: salidaHacia });
    setFase("saliendo");

    const t1 = setTimeout(() => {
      setActiveIndex((prev) => (dir === "next" ? (prev + 1) % n : (prev + n - 1) % n));
      setDireccionEntrada(entradaDesde);
      setSaliente(null);
      setFase("entrando");

      const t2 = setTimeout(() => setFase("idle"), DURACION_ENTRADA);
      timeouts.current.push(t2);
    }, DURACION_SALIDA);
    timeouts.current.push(t1);
  };

  const activo = items[activeIndex];
  const enMovimiento = fase !== "idle";

  // En mobile el tamaño se fija por ANCHO (no alto): fijar el alto con este
  // aspect-ratio angosto (0.6:1) daba un ancho mayor al viewport y recortaba
  // el auto por los costados contra el overflow-hidden del contenedor.
  const tamanoAuto = isMobile ? { width: "60vw" as const } : { height: "140%" as const };
  const bottomAuto = isMobile ? "26%" : "8%";

  return (
    <div
      style={{
        backgroundImage: `url("https://pub-e8051b52508949878d450ac52092f601.r2.dev/bg/fondo.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "Inter, sans-serif",
      }}
      className={`relative w-full overflow-hidden ${barlow.variable} ${mono.variable}`}
    >
      {/* Inline a propósito: los @keyframes en globals.css no los estaba
          tomando el dev server (caché de Turbopack) — esto no depende de eso. */}
      <style>{`
        @keyframes drive-in-der {
          0%   { transform: translateX(calc(-50% + 140%)) scale(0.88); filter: blur(10px); opacity: 0; }
          55%  { transform: translateX(calc(-50% - 3%)) scale(1.02); filter: blur(1px); opacity: 1; }
          75%  { transform: translateX(calc(-50% + 1.5%)) scale(0.99); filter: blur(0px); }
          100% { transform: translateX(-50%) scale(1); filter: blur(0px); opacity: 1; }
        }
        @keyframes drive-in-izq {
          0%   { transform: translateX(calc(-50% - 140%)) scale(0.88); filter: blur(10px); opacity: 0; }
          55%  { transform: translateX(calc(-50% + 3%)) scale(1.02); filter: blur(1px); opacity: 1; }
          75%  { transform: translateX(calc(-50% - 1.5%)) scale(0.99); filter: blur(0px); }
          100% { transform: translateX(-50%) scale(1); filter: blur(0px); opacity: 1; }
        }
        @keyframes drive-out-izq {
          0%   { transform: translateX(-50%) scale(1); filter: blur(0px); opacity: 1; }
          100% { transform: translateX(calc(-50% - 140%)) scale(0.9); filter: blur(10px); opacity: 0; }
        }
        @keyframes drive-out-der {
          0%   { transform: translateX(-50%) scale(1); filter: blur(0px); opacity: 1; }
          100% { transform: translateX(calc(-50% + 140%)) scale(0.9); filter: blur(10px); opacity: 0; }
        }
        @keyframes logo-respira {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes estela-mover {
          0% { transform: translateX(-30%); }
          100% { transform: translateX(130%); }
        }
        .vc-drive-in-der { animation: drive-in-der ${DURACION_ENTRADA}ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .vc-drive-in-izq { animation: drive-in-izq ${DURACION_ENTRADA}ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .vc-drive-out-izq { animation: drive-out-izq ${DURACION_SALIDA}ms cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
        .vc-drive-out-der { animation: drive-out-der ${DURACION_SALIDA}ms cubic-bezier(0.5, 0, 0.9, 0.4) forwards; }
        .vc-logo-respira { animation: logo-respira 4s ease-in-out infinite; }
        .vc-estela { animation: estela-mover 550ms linear infinite; }
      `}</style>

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

        {/* Logo marca de agua — chico, arriba, no compite con el auto */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: "16%" }}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={220}
            height={80}
            className={!enMovimiento ? "vc-logo-respira" : ""}
            style={{
              width: "clamp(120px, 16vw, 220px)",
              height: "auto",
              objectFit: "contain",
              filter: invertLogo ? "brightness(0) invert(1)" : "none",
              opacity: 0.35,
            }}
          />
        </div>

        {/* Estelas de velocidad — solo mientras el auto entra o sale */}
        {enMovimiento && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4, bottom: isMobile ? "22%" : "8%", top: "auto", height: isMobile ? "18%" : "22%" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="vc-estela absolute h-[2px] bg-white/40 rounded-full"
                style={{
                  top: `${18 + i * 22}%`,
                  width: isMobile ? "40%" : "26%",
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Auto saliente (si hay una transición en curso) */}
        {saliente && (
          <div
            key={`out-${saliente.index}`}
            className={`absolute ${saliente.direccion === "izquierda" ? "vc-drive-out-izq" : "vc-drive-out-der"}`}
            style={{
              left: "50%",
              bottom: bottomAuto,
              ...tamanoAuto,
              aspectRatio: "0.6 / 1",
              zIndex: 15,
              transformOrigin: "bottom center",
              transform: "translateX(-50%)",
            }}
          >
            <Image
              src={items[saliente.index].src}
              alt={items[saliente.index].name}
              fill
              draggable={false}
              sizes="60vh"
              style={{ objectFit: "contain", objectPosition: "bottom center" }}
            />
          </div>
        )}

        {/* Auto activo */}
        {fase !== "saliendo" && (
          <div
            key={`in-${activeIndex}`}
            className={fase === "entrando" ? (direccionEntrada === "derecha" ? "vc-drive-in-der" : "vc-drive-in-izq") : ""}
            style={{
              position: "absolute",
              left: "50%",
              bottom: bottomAuto,
              ...tamanoAuto,
              aspectRatio: "0.6 / 1",
              zIndex: 20,
              transformOrigin: "bottom center",
              transform: fase === "idle" ? "translateX(-50%) scale(1)" : undefined,
            }}
          >
            <Image
              src={activo.src}
              alt={activo.name}
              fill
              draggable={false}
              sizes="60vh"
              priority
              style={{ objectFit: "contain", objectPosition: "bottom center" }}
            />
          </div>
        )}

        {/* Texto + flechas abajo a la izquierda */}
        <div className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24" style={{ zIndex: 60, maxWidth: 340 }}>
          {activo.load && (
            <div
              className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-2.5 py-1 border border-white/40 transition-opacity duration-200"
              style={{ opacity: enMovimiento ? 0.25 : 0.9 }}
            >
              <span
                className="uppercase text-[9px] sm:text-[10px] tracking-[0.15em] text-white/70"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Carga útil
              </span>
              <span className="w-px h-3 bg-white/30" />
              <span
                className="text-[11px] sm:text-xs font-medium text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {activo.load}
              </span>
            </div>
          )}
          <p
            className="uppercase mb-2 sm:mb-3 text-2xl sm:text-4xl text-white transition-opacity duration-200"
            style={{ opacity: enMovimiento ? 0.4 : 0.95, letterSpacing: "0.01em", fontFamily: "var(--font-barlow)", fontWeight: 700, lineHeight: 0.95 }}
          >
            {activo.name}
          </p>
          <p
            className="hidden sm:block text-xs sm:text-sm text-white mb-4 sm:mb-5 transition-opacity duration-200"
            style={{ opacity: enMovimiento ? 0.3 : 0.85, lineHeight: 1.6 }}
          >
            {activo.subtitle}
          </p>

          {n > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("prev")}
                aria-label="Anterior"
                disabled={enMovimiento}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white border-2 border-white bg-transparent hover:bg-white/12 hover:scale-[1.08] disabled:opacity-40 transition-[transform,background-color,opacity] duration-150"
              >
                <ArrowLeft size={26} strokeWidth={2.25} />
              </button>
              <button
                onClick={() => navigate("next")}
                aria-label="Siguiente"
                disabled={enMovimiento}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white border-2 border-white bg-transparent hover:bg-white/12 hover:scale-[1.08] disabled:opacity-40 transition-[transform,background-color,opacity] duration-150"
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

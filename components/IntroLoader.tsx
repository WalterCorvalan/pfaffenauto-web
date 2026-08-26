"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "pfaffen_intro_visto";

export default function IntroLoader() {
  // Solo una vez por sesión de navegador — un visitante que vuelve a entrar
  // varias veces no debería ver la misma animación de 2s cada vez. Se decide
  // acá (no dentro del useEffect) porque en dev React Strict Mode monta el
  // efecto dos veces: si el chequeo de sessionStorage vive en el efecto, la
  // segunda pasada lo encuentra ya marcado y corta antes de armar el timer,
  // dejando el loader visible para siempre sin nada que lo apague.
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(STORAGE_KEY)) return false;
    sessionStorage.setItem(STORAGE_KEY, "1");
    return true;
  });

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden">
          {/* Panel superior */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-[#0a1526] flex items-end justify-center overflow-hidden"
          >
            <Haz direccion="down" />
          </motion.div>

          {/* Panel inferior */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#0a1526] flex items-start justify-center overflow-hidden"
          >
            <Haz direccion="up" />
          </motion.div>

          {/* Línea de luz que cruza la pantalla */}
          <motion.div
            initial={{ x: "-30vw", opacity: 0 }}
            animate={{ x: "130vw", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, ease: "easeIn", times: [0, 0.15, 0.7, 1] }}
            className="absolute top-0 bottom-0 w-[3px] -skew-x-12"
            style={{
              background: "linear-gradient(to bottom, transparent, #4da6ff, #ffffff, #4da6ff, transparent)",
              boxShadow: "0 0 40px 8px rgba(77,166,255,0.8)",
            }}
          />

          {/* Marca */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(6px)" }}
            transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <div className="relative">
              <Image src="/logo.png" alt="Pfaffen Autos" width={668} height={173} priority className="h-8 md:h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_0_25px_rgba(77,166,255,0.6)]" />
              <Image src="/r.png" alt="" width={66} height={66} className="absolute -top-1 -right-3 w-2.5 h-2.5 object-contain brightness-0 invert" />
            </div>
            <motion.span
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
              className="h-[2px] w-16 bg-gradient-to-r from-transparent via-[#4da6ff] to-transparent origin-center"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Haz({ direccion }: { direccion: "up" | "down" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: "-40vw" }}
      animate={{ opacity: [0, 0.5, 0], x: "140vw" }}
      transition={{ duration: 0.9, ease: "easeIn" }}
      className={`absolute ${direccion === "down" ? "-bottom-10" : "-top-10"} w-40 h-40 rounded-full blur-[60px]`}
      style={{ background: "radial-gradient(circle, rgba(77,166,255,0.9), transparent 70%)" }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";

// Mismo foco que sigue el mouse del Hero (components/Hero.tsx), pero para
// el resto del sitio público -- pedido del 23/9: "esa luz que se mueve
// cuando el mouse la sigue" en toda la web, solo en escritorio (el Hero ya
// la tenía, ahí no cambia nada). Se salta en mobile/touch (no hay mouse
// que seguir) y si el usuario pide menos movimiento.
export default function CursorSpotlight() {
  const prefiereMenosMovimiento = useReducedMotion();
  const [esDesktop, setEsDesktop] = useState(false);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const background = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(1, 69, 242, 0.10), transparent 80%)`;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEsDesktop(mq.matches);
    const onChange = () => setEsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!esDesktop || prefiereMenosMovimiento) return;
    function handleMouseMove(e: MouseEvent) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [esDesktop, prefiereMenosMovimiento, mouseX, mouseY]);

  if (!esDesktop || prefiereMenosMovimiento) return null;

  return <motion.div aria-hidden className="fixed inset-0 z-[1] pointer-events-none" style={{ background }} />;
}

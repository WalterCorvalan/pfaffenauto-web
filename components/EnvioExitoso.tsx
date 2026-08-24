"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

const COLORES = {
  blue: { bg: "bg-blue-50 dark:bg-sky-400/10", text: "text-[#0145F2] dark:text-sky-300", particula: "#0145F2" },
  orange: { bg: "bg-orange-100 dark:bg-orange-400/10", text: "text-orange-600 dark:text-orange-300", particula: "#f97316" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-400/10", text: "text-emerald-600 dark:text-emerald-300", particula: "#10b981" },
} as const;

const PARTICULAS = Array.from({ length: 14 }, (_, i) => i);

export default function EnvioExitoso({
  color,
  titulo,
  mensaje,
  children,
}: {
  color: keyof typeof COLORES;
  titulo: string;
  mensaje: string;
  children: ReactNode;
}) {
  const c = COLORES[color];

  return (
    <div className="text-center py-12 space-y-4">
      <div className="relative w-16 h-16 mx-auto mb-2">
        {PARTICULAS.map((i) => {
          const angulo = (i / PARTICULAS.length) * Math.PI * 2;
          const distancia = 50 + (i % 3) * 12;
          return (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(angulo) * distancia, y: Math.sin(angulo) * distancia, opacity: 0, scale: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              style={{ background: c.particula }}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
            />
          );
        })}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center mx-auto ${c.bg} ${c.text}`}
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-black text-navy dark:text-white uppercase tracking-tighter"
      >
        {titulo}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-xs mx-auto"
      >
        {mensaje}
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
        {children}
      </motion.div>
    </div>
  );
}

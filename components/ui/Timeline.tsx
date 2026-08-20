"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-transparent font-sans" ref={containerRef}>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-24 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              {/* Círculo indicador de la línea de tiempo */}
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10">
                <div className="h-4 w-4 rounded-full bg-[#0145F2] dark:bg-sky-400 border border-blue-200 dark:border-sky-300/30 p-2" />
              </div>
              {/* Título lateral (Desktop) */}
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-black text-[#0145F2]/20 dark:text-sky-300/20 drop-shadow-sm">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              {/* Título superior (Móvil) */}
              <h3 className="md:hidden block text-3xl mb-4 text-left font-black text-[#0145F2]/30 dark:text-sky-300/30 drop-shadow-sm">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Línea vertical base */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-slate-200 dark:via-white/10 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          {/* Línea animada que se llena al scrollear */}
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#0145F2] via-sky-400 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
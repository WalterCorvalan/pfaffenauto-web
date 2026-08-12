"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  );
}

function RouteProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUrlRef = useRef("");

  // Detecta clicks en links internos y arranca la barra antes de que cambie la ruta
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let destino: URL;
      try {
        destino = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (destino.origin !== window.location.origin) return;
      if (destino.href === window.location.href) return;

      iniciar();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const iniciar = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setVisible(true);
    setProgress(15);

    intervalRef.current = setInterval(() => {
      setProgress((p) => (p >= 88 ? p : p + (88 - p) * 0.12));
    }, 180);
  };

  // Cuando la ruta efectivamente cambió, completa la barra y la esconde
  useEffect(() => {
    const url = `${pathname}?${searchParams?.toString() || ""}`;
    if (currentUrlRef.current === "") {
      currentUrlRef.current = url;
      return;
    }
    if (currentUrlRef.current === url) return;
    currentUrlRef.current = url;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[#0145F2] to-sky-400 shadow-[0_0_10px_rgba(1,69,242,0.6)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import PanelLayoutClient from "./PanelLayoutClient";

// El layout con toda la UI (sidebar, nav, notificaciones) tiene que ser
// "use client" -- un client component no puede exportar `metadata` (regla
// de Next.js), así que ese export vive acá, en un server component chico
// que solo envuelve al de verdad. Sin esto, /panel/* heredaba el
// `robots: { index: true, follow: true }` del layout raíz -- el
// `disallow: /panel/` de app/robots.ts ya evita que Google lo rastree, pero
// una URL de panel linkeada desde afuera igual podía listarse sin contenido
// (caso documentado de Google Search); esto lo cierra a nivel de metadata.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelLayoutClient>{children}</PanelLayoutClient>;
}

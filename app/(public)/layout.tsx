import Link from "next/link";
import { Suspense } from "react";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import CursorSpotlight from "@/components/CursorSpotlight";
import UtmTracker from "@/components/UtmTracker";
import FloatingChatbot from "@/components/FloatingChatbot";
import CookieBanner from "@/components/CookieBanner";
import RouteProgress from "@/components/ui/RouteProgress";
import PageTransition from "@/components/ui/PageTransition";
import { TemaPublicoProvider } from "@/components/TemaPublicoContext";
import TemaPublicoRoot from "@/components/TemaPublicoRoot";
import ToggleTemaPublico from "@/components/ToggleTemaPublico";

// Lectura server-side con service role (no RLS pública sobre
// configuracion_empresa todavía) -- se hace acá y no en Footer.tsx porque
// Footer es "use client" y este layout envuelve TODA la web pública, así
// que un solo fetch por request alcanza para todas las páginas.
async function obtenerRedesFooter() {
  try {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    const { data } = await admin
      .from("configuracion_empresa")
      .select("redes_whatsapp, redes_instagram, redes_facebook, redes_tiktok")
      .eq("id", true)
      .maybeSingle();
    if (!data) return undefined;
    return { whatsapp: data.redes_whatsapp, instagram: data.redes_instagram, facebook: data.redes_facebook, tiktok: data.redes_tiktok };
  } catch {
    return undefined;
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const redes = await obtenerRedesFooter();
  return (
    <TemaPublicoProvider>
      <TemaPublicoRoot>
        <div className="public-root relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
          <CursorSpotlight />
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <Suspense fallback={null}>
            <PublicHeader />
          </Suspense>
          <ToggleTemaPublico />
          <Suspense fallback={null}>
            <UtmTracker />
          </Suspense>
          <main className="flex-grow w-full">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer redes={redes} />
          <FloatingChatbot />
          <CookieBanner />
        </div>
      </TemaPublicoRoot>
    </TemaPublicoProvider>
  );
}

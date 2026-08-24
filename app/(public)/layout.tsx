import Link from "next/link";
import { Suspense } from "react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import UtmTracker from "@/components/UtmTracker";
import FloatingChatbot from "@/components/FloatingChatbot";
import CookieBanner from "@/components/CookieBanner";
import RouteProgress from "@/components/ui/RouteProgress";
import { TemaPublicoProvider } from "@/components/TemaPublicoContext";
import TemaPublicoRoot from "@/components/TemaPublicoRoot";
import ToggleTemaPublico from "@/components/ToggleTemaPublico";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TemaPublicoProvider>
      <TemaPublicoRoot>
        <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
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
            {children}
          </main>
          <Footer />
          <FloatingChatbot />
          <CookieBanner />
        </div>
      </TemaPublicoRoot>
    </TemaPublicoProvider>
  );
}

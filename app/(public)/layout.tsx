import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import UtmTracker from "@/components/UtmTracker";
import FloatingChatbot from "@/components/FloatingChatbot";
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
          <RouteProgress />
          <PublicHeader />
          <ToggleTemaPublico />
          <UtmTracker />
          <main className="flex-grow w-full">
            {children}
          </main>
          <Footer />
          <FloatingChatbot />
        </div>
      </TemaPublicoRoot>
    </TemaPublicoProvider>
  );
}

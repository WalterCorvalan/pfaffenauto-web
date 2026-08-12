import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import UtmTracker from "@/components/UtmTracker";
import FloatingChatbot from "@/components/FloatingChatbot";
import RouteProgress from "@/components/ui/RouteProgress";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <RouteProgress />
      {/* Importamos la cabecera interactiva que creamos */}
      <PublicHeader />
      <UtmTracker />
      {/* Renderizamos el contenido de la página */}
      <main className="flex-grow w-full">
        {children}
      </main>
      <FloatingChatbot />
    </div>
  );
}
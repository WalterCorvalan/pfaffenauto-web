import Link from "next/link";
import { Montserrat } from "next/font/google";
import PublicHeader from "@/components/PublicHeader";

// 1. Cargamos Montserrat: ideal para diseño premium, limpio y muy espaciado
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500"] });
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Importamos la cabecera interactiva que creamos */}
      <PublicHeader />
      
      <main className="flex-grow w-full">
        {children}
      </main>
    </div>
  );
}
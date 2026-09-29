import { ReactNode } from "react";
import ContenidoSitioHeader from "./ContenidoSitioHeader";

export const metadata = { title: "Contenido del Sitio | Pfaffen Cars" };

export default function ContenidoSitioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ContenidoSitioHeader />
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        {children}
      </div>
    </div>
  );
}

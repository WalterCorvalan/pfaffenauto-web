import { ReactNode } from "react";
import MarketingHeader from "./MarketingHeader";

export const metadata = { title: "Marketing | Pfaffen Autos" };

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MarketingHeader />
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        {children}
      </div>
    </div>
  );
}
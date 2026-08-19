"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

function Spinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <div className="absolute inset-0 bg-white/70 dark:bg-[#001c55]/70 flex items-center justify-center rounded-2xl">
      <Loader2 className="w-5 h-5 text-rose-600 animate-spin" />
    </div>
  );
}

export default function LinkConCarga({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className}>
      {children}
      <Spinner />
    </Link>
  );
}

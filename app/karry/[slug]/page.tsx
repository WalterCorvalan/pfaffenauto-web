import { notFound } from "next/navigation";
import Link from "next/link";
import { KARRY_VERSIONS } from "@/lib/karry-versions";
import VersionDetailClient from "./VersionDetailClient";

export function generateStaticParams() {
  return KARRY_VERSIONS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const version = KARRY_VERSIONS.find((v) => v.slug === slug);
  if (!version) return {};
  return {
    title: `${version.name} | Pfaffen Autos`,
    description: version.text,
  };
}

export default async function KarryVersionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const version = KARRY_VERSIONS.find((v) => v.slug === slug);
  if (!version) notFound();

  return (
    <main className="font-sans bg-white text-slate-800 min-h-screen">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/karry" className="text-sm font-bold text-[#1273b9] hover:underline">
          ← Volver a Karry Pick Up
        </Link>
      </header>

      <VersionDetailClient version={version} />
    </main>
  );
}

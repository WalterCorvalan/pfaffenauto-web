import { notFound } from "next/navigation";
import Link from "next/link";
import { RELY_VERSIONS } from "@/lib/rely-versions";
import VersionDetailClient from "./VersionDetailClient";

export function generateStaticParams() {
  return RELY_VERSIONS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const version = RELY_VERSIONS.find((v) => v.slug === slug);
  if (!version) return {};
  return {
    title: `${version.name} | Pfaffen Autos`,
    description: version.text,
  };
}

export default async function RelyVersionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const version = RELY_VERSIONS.find((v) => v.slug === slug);
  if (!version) notFound();

  return (
    <main className="font-sans bg-white text-slate-800 min-h-screen">
      <header className="border-b border-gray-100 px-6 py-4">
        <Link href="/rely" className="text-sm font-bold text-[#1273b9] hover:underline">
          ← Volver a Rely R8
        </Link>
      </header>

      <VersionDetailClient version={version} />
    </main>
  );
}

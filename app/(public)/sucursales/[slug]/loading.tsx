import Skeleton from "@/components/ui/Skeleton";
import CatalogoGridSkeleton from "@/components/ui/CatalogoGridSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] pb-20">
      <Skeleton className="w-full h-72 md:h-96 rounded-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <CatalogoGridSkeleton items={4} />
    </div>
  );
}

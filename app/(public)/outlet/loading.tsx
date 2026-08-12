import Skeleton from "@/components/ui/Skeleton";
import CatalogoGridSkeleton from "@/components/ui/CatalogoGridSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>
      <CatalogoGridSkeleton />
    </div>
  );
}

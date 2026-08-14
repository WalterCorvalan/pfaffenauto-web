import Skeleton from "@/components/ui/Skeleton";
import CatalogoGridSkeleton from "@/components/ui/CatalogoGridSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col items-center space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full max-w-3xl rounded-full" />
        </div>
        <CatalogoGridSkeleton />
      </div>
    </div>
  );
}

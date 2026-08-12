import Skeleton from "@/components/ui/Skeleton";
import CatalogoGridSkeleton from "@/components/ui/CatalogoGridSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#E9ECEF] pb-20">
      <div className="max-w-4xl mx-auto pt-12 pb-16 px-4 md:px-6 flex flex-col items-center space-y-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="pt-4">
        <CatalogoGridSkeleton />
      </div>
    </div>
  );
}

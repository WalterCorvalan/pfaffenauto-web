import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-3 w-64 mb-6" />

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Galería */}
          <div className="lg:col-span-3 space-y-3">
            <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* Panel de info */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-10 w-1/2" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-xl mt-6" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

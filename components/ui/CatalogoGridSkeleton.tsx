import Skeleton from "./Skeleton";

export default function CatalogoGridSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 md:px-6">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
          <Skeleton className="w-full aspect-[4/3] rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 w-2/5 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

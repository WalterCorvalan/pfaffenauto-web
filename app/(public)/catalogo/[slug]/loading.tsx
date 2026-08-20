import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] pt-6 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="hidden lg:block h-3 w-72 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start mt-2 lg:mt-6">
          {/* Columna galería + specs (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <Skeleton className="w-full h-[300px] sm:h-[420px] md:h-[520px] rounded-[20px] md:rounded-[32px]" />
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1 min-w-[140px] rounded-[24px]" />
              ))}
            </div>
          </div>

          {/* Columna tarjeta de precio (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="rounded-[32px] p-6 lg:p-8 space-y-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </div>
              <Skeleton className="h-10 w-2/3 mt-6" />
              <Skeleton className="h-14 w-full rounded-2xl mt-4" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

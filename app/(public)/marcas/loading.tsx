import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-12 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto mb-10 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-80 max-w-full" />
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}

import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen flex flex-col gap-10 pb-20">
      <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-4 px-4">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-14 w-full max-w-xl" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

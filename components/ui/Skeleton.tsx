export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/80 dark:bg-white/10 rounded-lg ${className}`} />;
}

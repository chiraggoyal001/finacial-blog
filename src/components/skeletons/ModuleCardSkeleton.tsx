import { Skeleton } from "@/components/ui/skeleton";

export function ModuleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="grid md:grid-cols-[320px_1fr] gap-0">
        <Skeleton className="aspect-video md:aspect-auto w-full h-full min-h-[180px]" />
        <div className="p-6 flex flex-col justify-center space-y-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-full max-w-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

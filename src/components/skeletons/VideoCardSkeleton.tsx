import { Skeleton } from "@/components/ui/skeleton";

export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="grid md:grid-cols-[320px_1fr] gap-0">
        <div className="aspect-video md:aspect-auto overflow-hidden relative">
          <Skeleton className="w-full h-full min-h-[180px]" />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
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

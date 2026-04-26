import { Skeleton } from "@/components/ui/skeleton";

interface ArticleCardSkeletonProps {
  variant?: "default" | "compact" | "hero";
}

export function ArticleCardSkeleton({ variant = "default" }: ArticleCardSkeletonProps) {
  if (variant === "hero") {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        <div className="grid md:grid-cols-2 gap-0">
          <Skeleton className="aspect-video md:aspect-auto w-full h-full min-h-[250px]" />
          <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        {variant === "default" && (
          <>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

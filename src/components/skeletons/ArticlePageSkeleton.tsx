import { Skeleton } from "@/components/ui/skeleton";

export const ArticlePageSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-16 border-b border-border" />
      
      <article className="py-8">
        <div className="container max-w-3xl">
          {/* Header skeleton */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Hero image skeleton */}
          <Skeleton className="w-full aspect-video rounded-xl mb-8" />

          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="py-4" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </article>
    </div>
  );
};

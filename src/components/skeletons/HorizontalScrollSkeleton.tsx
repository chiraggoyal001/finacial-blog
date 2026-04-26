import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollSkeletonProps {
  title?: string;
  count?: number;
}

export function HorizontalScrollSkeleton({ 
  title = "Loading...", 
  count = 4 
}: HorizontalScrollSkeletonProps) {
  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="relative group/carousel">
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 -mx-4 snap-x">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 snap-start"
              >
                <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-4 w-12 rounded-full" />
                      <Skeleton className="h-4 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2 text-xs pt-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

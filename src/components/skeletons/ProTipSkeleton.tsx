import { Skeleton } from "@/components/ui/skeleton";

export function ProTipSkeleton() {
  return (
    <div className="relative my-6 rounded-xl border border-secondary/30 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 p-4 pl-14 overflow-hidden">
      <div className="absolute left-3 top-3.5 w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-lg">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="absolute top-0 left-0 w-1 h-full bg-secondary/30 rounded-l-xl" />
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
        Dhaani says — Pro Tip!
      </p>
      <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
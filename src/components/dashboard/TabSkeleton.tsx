import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const TabSkeleton = () => {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-1 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg bg-muted/60" />
          <Skeleton className="h-4 w-96 rounded-md bg-muted/40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-lg bg-muted/60" />
          <Skeleton className="h-10 w-28 rounded-lg bg-muted/60" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 border border-border/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded bg-muted/50" />
              <Skeleton className="h-9 w-9 rounded-xl bg-muted/60" />
            </div>
            <Skeleton className="h-9 w-24 rounded bg-muted/70" />
            <Skeleton className="h-3 w-36 rounded bg-muted/40" />
          </Card>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <Card className="p-8 border border-border/40 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Skeleton className="h-6 w-48 rounded bg-muted/60" />
          <Skeleton className="h-8 w-32 rounded-lg bg-muted/50" />
        </div>

        {/* List / Table Item Skeletons */}
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/20">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-full bg-muted/60 shrink-0" />
                <div className="space-y-2 flex-1 max-w-md">
                  <Skeleton className="h-4 w-3/4 rounded bg-muted/60" />
                  <Skeleton className="h-3 w-1/2 rounded bg-muted/40" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-muted/50" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

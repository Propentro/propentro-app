import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-40" />

      {/* Entity header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-80" />

      {/* Content area */}
      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

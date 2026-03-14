import { Skeleton } from '@/components/ui/skeleton';

export default function PreferencesLoading() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-16" />
        <div className="flex gap-3">
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
        </div>
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-20" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-xl space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-72" />
      <div className="rounded-lg border p-6">
        <div className="flex gap-4">
          <Skeleton className="size-[72px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

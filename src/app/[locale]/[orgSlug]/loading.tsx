import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrgLoading() {
  return (
    <div className="mb-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
    </div>
  );
}

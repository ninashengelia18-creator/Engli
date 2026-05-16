import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export default function MarketingLoading() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="pt-2">
        <SkeletonText lines={6} />
      </div>
      <span className="sr-only">იტვირთება…</span>
    </div>
  );
}

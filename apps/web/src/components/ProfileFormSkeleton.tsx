import { Skeleton } from '@/components/ui/skeleton';

export const ProfileFormSkeleton = () => {
  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm">
      <Skeleton className="h-8 w-32 mb-4" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>

      <Skeleton className="h-10 w-32" />
    </div>
  );
};

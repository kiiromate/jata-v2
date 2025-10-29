import { Skeleton } from '@/components/ui/skeleton';

export const AvatarSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="w-24 h-24 rounded-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
};

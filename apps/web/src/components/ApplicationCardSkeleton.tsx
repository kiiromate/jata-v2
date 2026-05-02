import { Skeleton } from './ui/skeleton';

/* Renders a themed placeholder while an application card is loading. */
export const ApplicationCardSkeleton = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
};

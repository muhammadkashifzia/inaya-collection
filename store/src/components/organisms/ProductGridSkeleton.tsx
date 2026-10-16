interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 4 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-cream" />
          <div className="mt-2.5 space-y-2 px-0.5">
            <div className="h-4 w-24 bg-cream" />
            <div className="h-3 w-full bg-cream" />
            <div className="h-3 w-2/3 bg-cream" />
          </div>
        </div>
      ))}
    </div>
  );
}

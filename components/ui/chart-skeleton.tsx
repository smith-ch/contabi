import { Skeleton } from "@/components/ui/skeleton"

interface ChartSkeletonProps {
  height?: number
}

export function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div className="space-y-3" style={{ height: `${height}px` }}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-[calc(100%-40px)] w-full rounded-md" />

      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-16 rounded-md" />
        ))}
      </div>
    </div>
  )
}

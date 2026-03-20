import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostLoading() {
  return (
    <article className="min-w-0 flex-1">
      {/* 히어로 이미지 */}
      <Skeleton className="h-64 w-full rounded-none" />

      <div className="px-4 py-8 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 border-b border-border pb-8 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        {/* 본문 */}
        <div className="space-y-3">
          {[100, 90, 95, 70, 85, 100, 60, 80, 90, 75].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
          ))}
          <div className="py-2" />
          {[80, 95, 65, 90, 100, 75].map((w, i) => (
            <Skeleton key={i + 10} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </article>
  );
}

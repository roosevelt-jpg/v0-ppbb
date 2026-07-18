export function CommunityListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[#e4e1da] overflow-hidden animate-pulse"
        >
          <div className="h-20 sm:h-24 bg-neutral-200" />
          <div className="pt-5 px-3 pb-3 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4" />
            <div className="h-3 bg-neutral-100 rounded w-1/2" />
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-1.5 pt-1">
              <div className="h-9 bg-neutral-200 rounded-lg" />
              <div className="h-9 bg-neutral-100 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

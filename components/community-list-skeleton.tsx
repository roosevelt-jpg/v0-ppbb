export function CommunityListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-[#e4e1da] overflow-hidden animate-pulse"
        >
          <div className="h-36 sm:h-40 bg-neutral-200" />
          <div className="pt-7 px-4 pb-4 space-y-3">
            <div className="h-5 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-100 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-11 bg-neutral-200 rounded-xl" />
              <div className="h-11 bg-neutral-100 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

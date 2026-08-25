export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="h-64 rounded-2xl bg-slate-100 lg:col-span-1" />
        <div className="h-64 rounded-2xl bg-slate-100 lg:col-span-2" />
      </div>
    </div>
  )
}

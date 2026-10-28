export default function PortalLoading() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6 max-w-7xl mx-auto">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="space-y-3">
          <div className="h-8 w-48 rounded-lg bg-slate-100" />
          <div className="h-4 w-64 max-w-full rounded bg-slate-100" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 sm:p-6 space-y-5">
          <div className="h-5 w-36 rounded bg-slate-100" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-16 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}

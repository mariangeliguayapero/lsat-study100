export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:block">
        <div className="flex h-14 items-center px-5">
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2 px-3 py-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded animate-pulse" />
        </div>
      </aside>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Hero skeleton */}
          <div className="h-40 bg-muted rounded-none animate-pulse" />

          {/* Rank card */}
          <div className="h-56 bg-muted rounded-none animate-pulse" />

          {/* Next battle skeleton */}
          <div className="h-24 bg-muted rounded-none animate-pulse" />

          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-48 bg-muted rounded-none animate-pulse" />
            <div className="h-48 bg-muted rounded-none animate-pulse" />
          </div>

          {/* Explore territories */}
          <div className="h-44 bg-muted rounded-none animate-pulse" />
        </div>
      </main>
    </div>
  );
}

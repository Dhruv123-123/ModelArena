export function LoadingSkeleton({ label = 'Loading…' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 p-8">
      <div className="size-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-text-muted">{label}</p>
      <div className="flex w-full max-w-md gap-2">
        <div className="h-3 flex-1 animate-pulse rounded bg-bg-elevated" />
        <div className="h-3 flex-1 animate-pulse rounded bg-bg-elevated delay-75" />
        <div className="h-3 flex-1 animate-pulse rounded bg-bg-elevated delay-150" />
      </div>
    </div>
  );
}

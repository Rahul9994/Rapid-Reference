import { Component, Suspense, type ReactNode } from 'react'
import { vizRegistry } from '../../viz/registry'
import { cn } from '../../lib/utils'

class VizBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-[220px] place-items-center rounded-[26px] border border-line p-6 text-center text-sm text-muted">
          This visualization couldn't load. Refresh the page to try again.
        </div>
      )
    }
    return this.props.children
  }
}

export function VizSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[26px] border border-line-strong sm:rounded-[30px]', className)} aria-busy="true" aria-label="Loading visualization">
      <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <div className="skeleton h-2 w-2 rounded-full" />
        <div className="skeleton h-3 w-56" />
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1.32fr_1fr] sm:p-5">
        <div className="skeleton h-[300px] rounded-2xl sm:h-[420px]" />
        <div className="hidden space-y-2.5 pt-2 lg:block">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-3" style={{ width: `${40 + ((i * 37) % 55)}%` }} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-t border-line px-5 py-3.5">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="skeleton h-10 w-40 rounded-full" />
      </div>
    </div>
  )
}

/** Render a registered visualization by id (lazy, with skeleton + error fallback). */
export function VizMount({ id, className }: { id: string; className?: string }) {
  const Viz = vizRegistry[id]
  if (!Viz) {
    return (
      <div className={cn('grid min-h-[200px] place-items-center rounded-[26px] border border-dashed border-line-strong p-6 text-center text-sm text-subtle', className)}>
        Interactive visualization coming soon.
      </div>
    )
  }
  return (
    <VizBoundary>
      <Suspense fallback={<VizSkeleton className={className} />}>
        <div className={className}>
          <Viz />
        </div>
      </Suspense>
    </VizBoundary>
  )
}

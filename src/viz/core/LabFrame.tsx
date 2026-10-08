import type { ReactNode, RefObject } from 'react'
import { cn } from '../../lib/utils'
import { CodePanel, type WatchVar } from './CodePanel'
import { Caption, Legend, PlayerControls, type LegendItem } from './controls'
import type { Player, StepFrame } from './player'

export interface LabFrameProps<F extends StepFrame> {
  title: string
  /** Right side of the header, e.g. "epoch 12". */
  status?: ReactNode
  player?: Player<F>
  stage: ReactNode
  /** Content under the stage (mini charts, stats). */
  below?: ReactNode
  legend?: LegendItem[]
  /** Narration; defaults to the current frame's `note`. */
  note?: string
  code?: { source: string; file: string; vars?: WatchVar[] }
  /** Custom right column when there is no code. */
  side?: ReactNode
  /** Parameter controls (sliders, pills, toggles). */
  params?: ReactNode
  stepLabel?: string
  className?: string
  viewRef?: RefObject<HTMLDivElement | null>
}

/**
 * The shared chrome around every interactive visualization:
 * header · stage + narration | code panel · transport controls + parameters.
 */
export function LabFrame<F extends StepFrame>({
  title,
  status,
  player,
  stage,
  below,
  legend,
  note,
  code,
  side,
  params,
  stepLabel,
  className,
  viewRef,
}: LabFrameProps<F>) {
  const frame = player?.frame
  const caption = note ?? frame?.note
  const hasSide = !!code || !!side
  return (
    <div
      ref={viewRef ?? player?.viewRef}
      className={cn('lab-frame relative isolate overflow-hidden rounded-[26px] border border-line-strong sm:rounded-[30px]', className)}
    >
      <div className="lab-frame-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          {player?.playing && <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />}
          <span className={cn('relative h-2 w-2 rounded-full transition-colors', player?.playing ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--fg)_30%,transparent)]')} />
        </span>
        <h3 className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.16em] text-muted sm:text-[11.5px]">{title}</h3>
        {status && <div className="ml-auto shrink-0 font-mono text-[11px] text-subtle tabular">{status}</div>}
      </div>

      <div className={cn('grid', hasSide && 'lg:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)]')}>
        {/* Stage column */}
        <div className="min-w-0 p-3 sm:p-5">
          <div className="lab-stage relative overflow-hidden rounded-2xl border border-line">{stage}</div>
          {legend && <Legend items={legend} className="mt-3 px-1" />}
          {caption !== undefined && (
            <div className="mt-3 px-1">
              <Caption text={caption} />
            </div>
          )}
          {below && <div className="mt-3">{below}</div>}
          {(player || params) && (
            <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 lg:hidden">
              {player && <PlayerControls player={player} label={stepLabel} />}
              {params && <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-3">{params}</div>}
            </div>
          )}
        </div>

        {/* Code / side column */}
        {hasSide && (
          <div className="min-w-0 border-t border-line lg:border-l lg:border-t-0">
            {code ? (
              <CodePanel
                code={code.source}
                file={code.file}
                active={frame?.line}
                vars={code.vars}
                className="lab-code h-full"
              />
            ) : (
              side
            )}
          </div>
        )}
      </div>

      {(player || params) && (
        <div className="hidden gap-8 border-t border-line px-6 py-3.5 lg:flex lg:flex-row lg:items-end">
          {player && (
            <div className="shrink-0 lg:min-w-[340px]">
              <PlayerControls player={player} label={stepLabel} />
            </div>
          )}
          {params && <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-6 gap-y-3">{params}</div>}
        </div>
      )}
    </div>
  )
}

/** Panel wrapper used for small secondary charts under the stage. */
export function MiniPanel({ title, children, right, className }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 rounded-2xl border border-line bg-[color-mix(in_oklab,var(--bg)_40%,transparent)] p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">{title}</span>
        {right && <span className="font-mono text-[10.5px] text-muted tabular">{right}</span>}
      </div>
      {children}
    </div>
  )
}

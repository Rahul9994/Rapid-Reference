import { useId, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SPEEDS, type Player, type StepFrame } from './player'

const iconBtn =
  'grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-[color,border-color,background-color,transform] duration-200 hover:border-line-strong hover:text-fg active:scale-95'

export function PlayerControls<F extends StepFrame>({ player, label = 'step' }: { player: Player<F>; label?: string }) {
  const { playing, toggle, next, reset, speed, setSpeed, step, done } = player
  const uid = useIdSafe()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : done ? 'Replay' : 'Play'}
        className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-accent text-on-accent shadow-[0_8px_24px_-10px_var(--accent)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={playing ? 'pause' : done ? 'replay' : 'play'}
            initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.18 }}
          >
            {playing ? <Pause size={16} fill="currentColor" /> : done ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" className="translate-x-px" />}
          </motion.span>
        </AnimatePresence>
      </button>
      <button type="button" onClick={next} aria-label="Step forward" title="Step" className={iconBtn}>
        <SkipForward size={15} />
      </button>
      <button type="button" onClick={reset} aria-label="Reset" title="Reset" className={iconBtn}>
        <RotateCcw size={15} />
      </button>
      <div className="ml-1 flex h-9 items-center rounded-full border border-line p-1" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            className={cn(
              'relative h-7 rounded-full px-2.5 font-mono text-[11px] transition-colors',
              speed === s ? 'text-fg' : 'text-subtle hover:text-muted',
            )}
          >
            {speed === s && (
              <motion.span
                layoutId={`speed-${uid}`}
                className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_oklab,var(--fg)_10%,transparent)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {s}×
          </button>
        ))}
      </div>
      <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.14em] text-subtle tabular sm:inline">
        {label} {String(step).padStart(3, '0')}
      </span>
    </div>
  )
}

// layoutId must be unique per player instance on the page.
function useIdSafe() {
  return useId().replace(/:/g, '')
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  className?: string
}) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={cn('min-w-[150px] flex-1', className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] text-muted">
          {label}
        </label>
        <span className="font-mono text-[12px] font-medium text-fg tabular">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="viz-range w-full"
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  )
}

export function Pills<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  className?: string
}) {
  const uid = useIdSafe()
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 text-[12px] text-muted">{label}</div>
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line p-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              'relative h-7 rounded-xl px-3 text-[12px] font-medium transition-colors',
              value === o.value ? 'text-fg' : 'text-subtle hover:text-muted',
            )}
          >
            {value === o.value && (
              <motion.span
                layoutId={`pill-${uid}`}
                className="absolute inset-0 -z-10 rounded-xl border border-line-strong bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 self-end rounded-full py-1 text-[12px] text-muted transition-colors hover:text-fg"
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full border transition-colors duration-300',
          checked ? 'border-accent/60 bg-accent/30' : 'border-line-strong bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]',
        )}
      >
        <motion.span
          className={cn('absolute top-[2px] h-3.5 w-3.5 rounded-full', checked ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--fg)_45%,transparent)]')}
          animate={{ left: checked ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      </span>
      {label}
    </button>
  )
}

export interface LegendItem {
  label: string
  color: string
  shape?: 'dot' | 'line' | 'ring' | 'square' | 'dash'
}

export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted', className)}>
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <Swatch color={it.color} shape={it.shape} />
          {it.label}
        </li>
      ))}
    </ul>
  )
}

function Swatch({ color, shape = 'dot' }: { color: string; shape?: LegendItem['shape'] }) {
  if (shape === 'line') return <span className="h-[2.5px] w-4 rounded-full" style={{ background: color }} />
  if (shape === 'dash')
    return <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
  if (shape === 'ring') return <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />
  if (shape === 'square') return <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
}

/** Animated narration line under the stage. */
export function Caption({ text, index }: { text?: string; index?: number }) {
  return (
    <div className="relative min-h-[44px] overflow-hidden" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        {text && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted"
          >
            {index !== undefined && (
              <span className="mt-[3px] shrink-0 rounded-md border border-line px-1.5 font-mono text-[10px] leading-[16px] text-subtle tabular">
                {String(index).padStart(2, '0')}
              </span>
            )}
            <span className="text-pretty">{text}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Small labelled statistic used in lab side panels. */
export function Stat({ label, value, color, className }: { label: string; value: ReactNode; color?: string; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)] px-3 py-2', className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-semibold text-fg tabular" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  )
}

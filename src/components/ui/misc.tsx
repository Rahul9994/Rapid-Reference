import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn, isMac } from '../../lib/utils'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong border-b-2 bg-soft px-1.5 font-mono text-[10.5px] font-medium text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

export function ModKey() {
  return <>{isMac() ? '⌘' : 'Ctrl'}</>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center px-6 py-16 text-center', className)}
    >
      <div className="relative mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-elev text-muted shadow-[var(--shadow-soft)]">
        <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" aria-hidden="true" />
        <span className="relative">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  children,
  trackClassName,
}: {
  value: number // 0..1
  size?: number
  stroke?: number
  className?: string
  trackClassName?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const id = `ring-${useId().replace(/:/g, '')}`
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={cn('stroke-[color-mix(in_oklab,var(--fg)_9%,transparent)]', trackClassName)}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/** Default to inline-flex unless the caller controls visibility (e.g. "hidden sm:inline-flex"). */
const display = (className?: string) => (className && /(^|\s)hidden(\s|$)/.test(className) ? '' : 'inline-flex')

export function DifficultyPill({ difficulty, className }: { difficulty: string | null | undefined; className?: string }) {
  if (!difficulty) {
    return (
      <span className={cn(display(className), 'h-6 items-center rounded-full border border-line px-2.5 text-[11px] font-medium text-subtle', className)}>
        Lesson
      </span>
    )
  }
  const tone =
    difficulty === 'Easy'
      ? 'text-easy bg-easy/10 border-easy/25'
      : difficulty === 'Medium'
        ? 'text-medium bg-medium/10 border-medium/25'
        : 'text-hard bg-hard/10 border-hard/25'
  return (
    <span className={cn(display(className), 'h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold', tone, className)}>
      {difficulty}
    </span>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line bg-elev/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted backdrop-blur',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" aria-hidden="true" />
      {children}
    </div>
  )
}

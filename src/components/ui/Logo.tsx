import { useId } from 'react'
import { cn } from '../../lib/utils'

export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 40 40" className={cn('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
        </linearGradient>
        <radialGradient id={`rg-${id}`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.28 }} />
          <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" style={{ fill: 'var(--bg-elev)' }} />
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#rg-${id})`} />
      <rect x="1.5" y="1.5" width="37" height="37" rx="10.5" fill="none" stroke={`url(#lg-${id})`} strokeOpacity="0.65" />
      <path
        d="M13 28V12h7.5a4.75 4.75 0 0 1 0 9.5H13m7.5 0L26 28"
        fill="none"
        stroke={`url(#lg-${id})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animated ? { strokeDasharray: 80, strokeDashoffset: 80, animation: 'dash 1.1s var(--ease-out-expo) forwards' } : undefined}
      />
      <rect
        x="25.5"
        y="29.5"
        width="6"
        height="2.6"
        rx="1.3"
        style={{ fill: 'var(--accent-2)' }}
        className={animated ? 'animate-blink' : undefined}
      />
    </svg>
  )
}

export function Wordmark({ className, blink = false }: { className?: string; blink?: boolean }) {
  return (
    <span className={cn('font-semibold tracking-[-0.03em] text-fg', className)}>
      Rapid
      <span className={cn('text-accent', blink && 'animate-cursor')}>_</span>
      Reference
    </span>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-8 w-8" />
      <Wordmark className={cn('text-[15px]', compact && 'max-sm:hidden')} />
    </span>
  )
}

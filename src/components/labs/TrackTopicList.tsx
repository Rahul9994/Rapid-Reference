import { Link } from 'react-router'
import { motion } from 'motion/react'
import type { LabTrack } from '../../data/labs'
import { cn } from '../../lib/utils'

/** Topic list grouped by module — used in the lab "Curriculum" drawer. */
export function TrackTopicList({ track, active, onNavigate }: { track: LabTrack; active?: string; onNavigate?: () => void }) {
  let n = 0
  return (
    <nav aria-label={`${track.title} topics`} className="h-full overflow-y-auto overscroll-contain pb-6 pr-1 no-scrollbar">
      {track.modules.map((m) => {
        const topics = track.topics.filter((t) => t.module === m.id)
        if (!topics.length) return null
        return (
          <div key={m.id} className="mb-5">
            <div className="mb-1.5 px-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-subtle">{m.title}</div>
            <ul className="space-y-0.5">
              {topics.map((t) => {
                n++
                const on = t.slug === active
                return (
                  <li key={t.slug} className="relative">
                    {on && (
                      <motion.span
                        layoutId={`lab-nav-${track.id}`}
                        className="absolute inset-0 rounded-xl border border-line-strong bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Link
                      to={`${track.path}/${t.slug}`}
                      onClick={onNavigate}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'relative flex items-baseline gap-3 rounded-xl px-2 py-2 text-[13.5px] transition-colors',
                        on ? 'font-medium text-fg' : 'text-muted hover:text-fg',
                      )}
                    >
                      <span className="w-5 shrink-0 font-mono text-[10.5px] text-subtle tabular">{String(n).padStart(2, '0')}</span>
                      <span className="min-w-0">{t.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

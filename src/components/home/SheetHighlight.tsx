import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'motion/react'
import { ArrowRight, Check, ExternalLink, Shuffle } from 'lucide-react'
import sheetMeta from '../../data/a2z-meta.json'
import { flattenSheet, loadSheet, type FlatSheetItem } from '../../lib/sheet'
import { sheetProgressStore } from '../../lib/storage'
import { useRandomActions } from '../../lib/random'
import { cn } from '../../lib/utils'
import { Reveal } from '../ui/Reveal'
import { ButtonLink, Button } from '../ui/Button'
import { DifficultyPill, ProgressRing, SectionLabel, Skeleton } from '../ui/misc'
import { Accent } from './SectionHeader'

const points = [
  `${sheetMeta.total} items in the original order across ${sheetMeta.sections} sections`,
  'Filter by section, difficulty and status — or search',
  'One-tap completion, saved privately on your device',
  'Every row links to the original article, video or LeetCode',
]

export function SheetHighlight() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '200px 0px' })
  const [items, setItems] = useState<FlatSheetItem[] | null>(null)
  const done = sheetProgressStore.use()
  const { randomProblem } = useRandomActions()

  useEffect(() => {
    if (!inView) return
    loadSheet()
      .then((d) => setItems(flattenSheet(d)))
      .catch(() => setItems([]))
  }, [inView])

  const stats = useMemo(() => {
    if (!items) return null
    const by = (d: string) => items.filter((i) => i.difficulty === d)
    return (['Easy', 'Medium', 'Hard'] as const).map((d) => {
      const all = by(d)
      return { d, total: all.length, done: all.filter((i) => done[i.id]).length }
    })
  }, [items, done])

  const upNext = useMemo(() => (items ? items.filter((i) => i.kind === 'practice' && !done[i.id]).slice(0, 4) : []), [items, done])
  const completed = Object.keys(done).length

  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="sheet-title">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionLabel>DSA SHEET</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="sheet-title" className="mt-5 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-fg sm:text-5xl">
              Striver&apos;s A2Z. <Accent>Line by line.</Accent>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              The complete A2Z DSA sheet from takeUforward, synced from its official page and turned into a fast tracker you can
              actually finish.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <Reveal key={p} delay={0.12 + i * 0.05}>
                <li className="flex items-start gap-3 text-[15px] text-fg">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3}>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/dsa-sheet" variant="primary" size="lg">
                Open DSA Sheet <ArrowRight size={17} className="transition-transform group-hover/btn:translate-x-1" />
              </ButtonLink>
              <Button size="lg" variant="secondary" onClick={randomProblem}>
                <Shuffle size={16} /> Random problem
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className="card-surface border-gradient relative overflow-hidden rounded-[28px] p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <ProgressRing value={completed / sheetMeta.total} size={150} stroke={12}>
                <div className="text-center">
                  <div className="text-3xl font-semibold tracking-tight text-fg tabular">
                    {Math.round((completed / sheetMeta.total) * 100)}%
                  </div>
                  <div className="text-xs text-subtle tabular">
                    {completed} / {sheetMeta.total}
                  </div>
                </div>
              </ProgressRing>
              <div className="w-full flex-1 space-y-3">
                <div className="text-sm font-medium text-fg">Your progress</div>
                {stats
                  ? stats.map((s, i) => (
                      <div key={s.d}>
                        <div className="mb-1.5 flex justify-between text-[12.5px]">
                          <span className={cn(s.d === 'Easy' ? 'text-easy' : s.d === 'Medium' ? 'text-medium' : 'text-hard')}>{s.d}</span>
                          <span className="text-subtle tabular">
                            {s.done} / {s.total}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]">
                          <motion.div
                            className={cn('h-full rounded-full', s.d === 'Easy' ? 'bg-easy' : s.d === 'Medium' ? 'bg-medium' : 'bg-hard')}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.total ? Math.max(2, (s.done / s.total) * 100) : 0}%` }}
                            transition={{ duration: 1.1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    ))
                  : Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-7" />)}
              </div>
            </div>

            <div className="relative mt-7 border-t border-line pt-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Up next for you</span>
                <Link to="/dsa-sheet" className="text-[12.5px] text-accent hover:underline">
                  View all
                </Link>
              </div>
              <ul className="space-y-1.5">
                {items === null
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-xl" />)
                  : upNext.map((p, i) => (
                      <motion.li
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 px-3 py-2.5"
                      >
                        <span className="w-8 font-mono text-[11px] text-subtle tabular">{String(p.n).padStart(3, '0')}</span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-fg">{p.title}</span>
                        <DifficultyPill difficulty={p.difficulty} className="hidden xs:inline-flex" />
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${p.title} on takeUforward`}
                          className="grid h-7 w-7 place-items-center rounded-md text-subtle transition-colors hover:bg-soft hover:text-fg"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </motion.li>
                    ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { Command, Database, FileText, Palette, Search, ShieldCheck } from 'lucide-react'
import { allTopics } from '../../data/notes'
import { allLabTopics, totalLabTopics } from '../../data/labs'
import { totalAllTopics } from '../../data/catalog'
import { themes } from '../../data/themes'
import sheetMeta from '../../data/a2z-meta.json'
import { setTheme, themeStore } from '../../lib/theme'
import { sheetProgressStore } from '../../lib/storage'
import { cn } from '../../lib/utils'
import { trackSpotlight } from '../../hooks'
import { Reveal } from '../ui/Reveal'
import { ProgressRing } from '../ui/misc'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Accent, CountUp, SectionHeader } from './SectionHeader'
import { FAQ_COUNT } from './constants'

function BentoCard({
  className,
  title,
  description,
  icon,
  children,
  delay = 0,
}: {
  className?: string
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div
        onPointerMove={trackSpotlight}
        className="spotlight card-surface group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-[border-color,transform] duration-500 hover:border-line-strong sm:p-6"
      >
        <div className="relative min-h-[172px] flex-1">{children}</div>
        <div className="mt-5 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-soft text-accent">{icon}</span>
          <div>
            <h3 className="font-semibold tracking-[-0.01em] text-fg">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

function DocMock() {
  return (
    <div className="absolute inset-0 flex gap-3 rounded-2xl border border-line bg-bg/60 p-3" aria-hidden="true">
      <div className="hidden w-24 shrink-0 space-y-2 border-r border-line pr-3 sm:block">
        {[70, 55, 80, 60, 45, 75, 50].map((w, i) => (
          <div key={i} className={cn('h-1.5 rounded-full', i === 2 ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]')} style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-2.5 w-2/5 rounded-full bg-fg/80" />
        <div className="h-1.5 w-11/12 rounded-full bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]" />
        <div className="h-1.5 w-4/5 rounded-full bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]" />
        <div className="mt-3 space-y-1.5 rounded-lg border border-line bg-[var(--code-bg)] p-2.5 font-mono text-[9.5px] leading-tight">
          <div><span style={{ color: 'var(--tk-keyword)' }}>from</span> collections <span style={{ color: 'var(--tk-keyword)' }}>import</span> deque</div>
          <div><span style={{ color: 'var(--tk-keyword)' }}>def</span> <span style={{ color: 'var(--tk-function)' }}>bfs</span>(graph, src):</div>
          <div className="pl-3">q, seen = deque([src]), {'{'}src{'}'}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-5 flex-1 rounded-md border border-easy/30 bg-easy/10" />
          <div className="h-5 flex-1 rounded-md border border-accent-2/30 bg-accent-2/10" />
        </div>
      </div>
      <div className="hidden w-20 shrink-0 space-y-2 border-l border-line pl-3 md:block">
        {[80, 60, 70, 50, 65].map((w, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]"
            style={{ width: `${w}%` }}
            animate={{ backgroundColor: ['color-mix(in oklab, var(--fg) 12%, transparent)', 'var(--accent)', 'color-mix(in oklab, var(--fg) 12%, transparent)'] }}
            transition={{ duration: 5, repeat: Infinity, delay: i, times: [0, 0.1, 0.2], repeatDelay: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

function PaletteMock() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-bg/60 p-3" aria-hidden="true">
      <div className="flex items-center gap-2 border-b border-line pb-2 text-[12px] text-fg">
        <Search size={13} className="text-accent" />
        <span className="font-mono">dijk</span>
        <span className="animate-blink h-3.5 w-px bg-accent" />
      </div>
      <div className="mt-2 space-y-1">
        {[
          ['Dijkstra’s algorithm', 'DSA Notes › Shortest Paths'],
          ["Dijkstra's algorithm · #401", 'DSA Sheet › Graphs'],
          ['Why does Dijkstra fail with negative edges?', 'FAQ › DSA'],
        ].map(([t, s], i) => (
          <div key={t} className={cn('rounded-lg px-2 py-1', i === 0 && 'bg-accent/12')}>
            <div className="truncate text-[11.5px] font-medium text-fg">{t}</div>
            <div className="truncate text-[10px] text-subtle">{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressMock() {
  const done = Object.keys(sheetProgressStore.use()).length
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5" aria-hidden="true">
      <ProgressRing value={done / sheetMeta.total} size={118} stroke={10}>
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-fg tabular">{Math.round((done / sheetMeta.total) * 100)}%</div>
          <div className="text-[10px] text-subtle">
            {done}/{sheetMeta.total}
          </div>
        </div>
      </ProgressRing>
      <div className="space-y-2 text-[11px]">
        {(['easy', 'medium', 'hard'] as const).map((d, i) => (
          <div key={d} className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', d === 'easy' ? 'bg-easy' : d === 'medium' ? 'bg-medium' : 'bg-hard')} />
            <span className="w-12 capitalize text-muted">{d}</span>
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_9%,transparent)]">
              <motion.div
                className={cn('h-full rounded-full', d === 'easy' ? 'bg-easy' : d === 'medium' ? 'bg-medium' : 'bg-hard')}
                initial={{ width: 0 }}
                whileInView={{ width: `${[72, 46, 24][i]}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PythonMock() {
  const lines: [string, string][][] = [
    [['import ', 'var(--tk-keyword)'], ['heapq', 'var(--code-fg)']],
    [['def ', 'var(--tk-keyword)'], ['top_k', 'var(--tk-function)'], ['(nums, k):', 'var(--code-fg)']],
    [['    return ', 'var(--tk-keyword)'], ['heapq', 'var(--code-fg)'], ['.nlargest', 'var(--tk-function)'], ['(k, nums)', 'var(--code-fg)']],
    [['', ''], ['# O(n log k) ✓', 'var(--tk-comment)']],
  ]
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-line bg-[var(--code-bg)] p-3.5 font-mono text-[11px] leading-[1.75]" aria-hidden="true">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + i * 0.12 }}
          className="whitespace-pre"
        >
          {l.map(([t, c], j) => (
            <span key={j} style={{ color: c }}>
              {t}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

function ThemesMock() {
  const choice = themeStore.use()
  const pick = (id: (typeof themes)[number]['id'], e: ReactMouseEvent) => setTheme(id, { x: e.clientX, y: e.clientY })
  return (
    <div className="absolute inset-0 grid grid-cols-5 place-content-center gap-2 px-1">
      {themes.map((t) => (
        <button
          key={t.id}
          data-theme={t.id}
          onClick={(e) => pick(t.id, e)}
          aria-label={`Switch to ${t.name} theme`}
          title={t.name}
          className={cn(
            'mx-auto h-9 w-9 rounded-full border-2 transition-transform duration-300 hover:scale-110 sm:h-10 sm:w-10',
            choice === t.id ? 'border-[var(--accent)] scale-110' : 'border-[var(--border-strong)]',
          )}
          style={{ background: 'conic-gradient(from 210deg, var(--bg) 0 50%, var(--accent) 50% 75%, var(--accent-2) 75% 100%)' } as CSSProperties}
        />
      ))}
    </div>
  )
}

const marqueeItems = [
  ...allTopics.map((t) => ({ key: t.key, title: t.title, hue: t.category.hue, icon: t.category.id })),
  ...allLabTopics.map((t) => ({ key: t.key, title: t.title, hue: t.track.hue, icon: t.track.id })),
]
  // interleave so both rows mix subjects
  .map((t, i) => ({ t, k: (i * 37) % 149 }))
  .sort((a, b) => a.k - b.k)
  .map((x) => x.t)

function Marquee() {
  const half = Math.ceil(marqueeItems.length / 2)
  const rows = [marqueeItems.slice(0, half), marqueeItems.slice(half)]
  return (
    <div className="mask-x relative mt-16 space-y-3 overflow-hidden" aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className="group flex w-max">
          <div
            className="animate-marquee flex gap-3 pr-3 group-hover:[animation-play-state:paused]"
            style={{ '--dur': `${r === 0 ? 110 : 130}s`, animationDirection: r === 1 ? 'reverse' : 'normal' } as CSSProperties}
          >
            {[...row, ...row].map((t, i) => (
              <span
                key={`${t.key}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-elev/70 px-3.5 py-1.5 text-[13px] text-muted"
              >
                <span style={{ color: t.hue }}>
                  <CategoryIcon id={t.icon} size={13} />
                </span>
                {t.title}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Inside() {
  const stats = [
    { value: totalAllTopics, suffix: '', label: 'Topics across 7 subjects' },
    { value: sheetMeta.total, suffix: '', label: "Striver's A2Z sheet items" },
    { value: FAQ_COUNT, suffix: '+', label: 'Interview Q&As' },
    { value: totalLabTopics, suffix: '', label: 'Interactive AI & ML labs' },
  ]
  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="inside-title">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeader
          label="What's inside"
          title={
            <span id="inside-title">
              Everything you revise, <Accent>in one place.</Accent>
            </span>
          }
          description="Concise notes written for quick recall, a progress-tracked DSA sheet and interview answers you can test yourself on — wrapped in a fast, keyboard-first interface."
        />

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="bg-bg">
              <div className="h-full bg-elev/40 px-5 py-7 sm:px-7 sm:py-9">
                <div className="text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-[13px] text-muted sm:text-sm">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <BentoCard
            className="md:col-span-4"
            title="Docs-grade notes"
            description="Sidebar, table of contents, breadcrumbs, callouts and copy-ready code — like your favourite documentation site."
            icon={<FileText size={17} />}
          >
            <DocMock />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            delay={0.05}
            title="Search everything"
            description="Notes, FAQ and all A2Z problems — instantly, from anywhere."
            icon={<Command size={17} />}
          >
            <PaletteMock />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            title="Progress that persists"
            description="Tick problems off; your progress is saved privately on this device."
            icon={<ShieldCheck size={17} />}
          >
            <ProgressMock />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            delay={0.05}
            title="Python-first DSA"
            description="Every algorithm implemented in clean, idiomatic Python."
            icon={<Database size={17} />}
          >
            <PythonMock />
          </BentoCard>
          <BentoCard
            className="md:col-span-2"
            delay={0.1}
            title={`${themes.length} themes, one tap`}
            description="Try one — tap a swatch above. Your pick is remembered."
            icon={<Palette size={17} />}
          >
            <ThemesMock />
          </BentoCard>
        </div>
      </div>
      <Marquee />
    </section>
  )
}

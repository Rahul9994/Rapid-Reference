import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  ListFilter,
  MoreHorizontal,
  RotateCcw,
  Search,
  SearchX,
  Shuffle,
  SlidersHorizontal,
  SortAsc,
  Trophy,
  Upload,
  X,
} from 'lucide-react'
import { difficultyRank, flattenSheet, loadSheet, type FlatSheetItem, type SheetData } from '../lib/sheet'
import { sheetOpenStore, sheetProgressStore } from '../lib/storage'
import { confettiBurst } from '../lib/confetti'
import { toast } from '../lib/toast'
import { cn, pickRandom, prefersReducedMotion } from '../lib/utils'
import { useDismiss } from '../hooks'
import { PageShell } from '../components/layout/PageShell'
import { ProblemRow } from '../components/sheet/ProblemRow'
import { Select, Segmented } from '../components/ui/Select'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState, ProgressRing, SectionLabel, Skeleton } from '../components/ui/misc'
import { Reveal } from '../components/ui/Reveal'

const EASE = [0.22, 1, 0.36, 1] as const
type DiffFilter = 'all' | 'Easy' | 'Medium' | 'Hard' | 'Lesson'
type StatusFilter = 'all' | 'todo' | 'done'
type SortKey = 'default' | 'diff-asc' | 'diff-desc' | 'title'

function timeAgo(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function DsaSheet() {
  const [data, setData] = useState<SheetData | null>(null)
  const [failed, setFailed] = useState(false)
  const done = sheetProgressStore.use()
  const openSections = sheetOpenStore.use()
  const [query, setQuery] = useState('')
  const dq = useDeferredValue(query.trim().toLowerCase())
  const [section, setSection] = useState('all')
  const [difficulty, setDifficulty] = useState<DiffFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('default')
  const [flash, setFlash] = useState<number | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [params, setParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = "DSA SHEET · Striver's A2Z — Rapid_Reference"
    loadSheet()
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  const flat = useMemo(() => (data ? flattenSheet(data) : []), [data])
  const firstSection = data?.sections[0]?.id ?? ''
  const filtersActive = !!dq || difficulty !== 'all' || status !== 'all' || section !== 'all'
  const activeFilterCount = [section !== 'all', difficulty !== 'all', status !== 'all', sort !== 'default'].filter(Boolean).length

  const matches = useCallback(
    (it: FlatSheetItem) =>
      (section === 'all' || it.sectionId === section) &&
      (difficulty === 'all' || (difficulty === 'Lesson' ? it.kind === 'lesson' : it.difficulty === difficulty)) &&
      (status === 'all' || (status === 'done' ? !!done[it.id] : !done[it.id])) &&
      (!dq || `${it.title} ${it.sectionTitle} ${it.groupTitle} ${(it.tags ?? []).join(' ')} ${it.n}`.toLowerCase().includes(dq)),
    [section, difficulty, status, done, dq],
  )

  const visible = useMemo(() => flat.filter(matches), [flat, matches])

  const sorted = useMemo(() => {
    if (sort === 'default') return visible
    const arr = [...visible]
    if (sort === 'title') arr.sort((a, b) => a.title.localeCompare(b.title))
    else {
      const dir = sort === 'diff-asc' ? 1 : -1
      arr.sort((a, b) => dir * ((difficultyRank[a.difficulty ?? ''] ?? 0) - (difficultyRank[b.difficulty ?? ''] ?? 0)) || a.n - b.n)
    }
    return arr
  }, [visible, sort])

  // ---- Stats ----
  const stats = useMemo(() => {
    const completed = flat.filter((i) => done[i.id])
    const bySection = (data?.sections ?? []).map((s) => {
      const items = flat.filter((i) => i.sectionId === s.id)
      return { id: s.id, title: s.title, total: items.length, done: items.filter((i) => done[i.id]).length }
    })
    const byDiff = (['Easy', 'Medium', 'Hard'] as const).map((d) => {
      const items = flat.filter((i) => i.difficulty === d)
      return { d, total: items.length, done: items.filter((i) => done[i.id]).length }
    })
    const practice = flat.filter((i) => i.kind === 'practice')
    const lessons = flat.filter((i) => i.kind === 'lesson')
    const recent = completed
      .map((i) => ({ item: i, at: done[i.id] }))
      .sort((a, b) => b.at - a.at)
      .slice(0, 3)
    return {
      total: flat.length,
      completed: completed.length,
      practice: { total: practice.length, done: practice.filter((i) => done[i.id]).length },
      lessons: { total: lessons.length, done: lessons.filter((i) => done[i.id]).length },
      bySection,
      byDiff,
      recent,
    }
  }, [flat, done, data])

  // ---- Actions ----
  const isOpen = (id: string) => filtersActive || (openSections ?? [firstSection]).includes(id)

  const toggleSection = (id: string) =>
    sheetOpenStore.set((prev) => {
      const cur = prev ?? [firstSection]
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    })

  const allOpen = !!data && data.sections.every((s) => (openSections ?? [firstSection]).includes(s.id))

  const onToggle = useCallback(
    (item: FlatSheetItem, e: ReactMouseEvent<HTMLButtonElement>) => {
      const wasDone = !!sheetProgressStore.get()[item.id]
      sheetProgressStore.set((prev) => {
        const next = { ...prev }
        if (wasDone) delete next[item.id]
        else next[item.id] = Date.now()
        return next
      })
      if (wasDone) return
      const after = sheetProgressStore.get()
      const rect = e.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      if (flat.length && flat.every((i) => after[i.id])) {
        confettiBurst(window.innerWidth / 2, window.innerHeight * 0.6, 220)
        toast('A2Z sheet complete!', { description: `All ${flat.length} items done. Absolutely legendary.`, tone: 'success', duration: 5000 })
      } else if (flat.filter((i) => i.sectionId === item.sectionId).every((i) => after[i.id])) {
        confettiBurst(x, y, 110)
        toast(`Section complete: ${item.sectionTitle}`, { description: 'Keep the momentum going.', tone: 'success', duration: 3500 })
      }
    },
    [flat],
  )

  const focusItem = useCallback(
    (id: number) => {
      const it = flat.find((i) => i.id === id)
      if (!it) return
      setQuery('')
      setSection('all')
      setDifficulty('all')
      setStatus('all')
      setSort('default')
      sheetOpenStore.set((prev) => {
        const cur = prev ?? [firstSection]
        return cur.includes(it.sectionId) ? cur : [...cur, it.sectionId]
      })
      setFlash(id)
      window.setTimeout(() => {
        document.getElementById(`p-${id}`)?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      }, 420)
      window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 3200)
    },
    [flat, firstSection],
  )

  useEffect(() => {
    const f = Number(params.get('focus'))
    if (!data || !f) return
    focusItem(f)
    const next = new URLSearchParams(params)
    next.delete('focus')
    setParams(next, { replace: true })
  }, [data, params, setParams, focusItem])

  const randomProblem = () => {
    const pool = visible.filter((i) => i.kind === 'practice' && !done[i.id])
    const p = pickRandom(pool.length ? pool : flat.filter((i) => i.kind === 'practice' && !done[i.id]))
    if (!p) {
      toast('Nothing left to pick — everything is done!', { tone: 'success' })
      return
    }
    focusItem(p.id)
    toast(`#${p.n} · ${p.title}`, {
      description: `${p.sectionTitle} · ${p.difficulty ?? 'Lesson'}`,
      tone: 'info',
      action: { label: 'Open', onClick: () => window.open(p.url, '_blank', 'noopener,noreferrer') },
      duration: 5000,
    })
  }

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify({ app: 'Rapid_Reference', version: 1, exportedAt: new Date().toISOString(), done }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapid-reference-a2z-progress.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('Progress exported', { tone: 'success' })
  }

  const importProgress = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as { done?: Record<string, number> }
        const incoming = parsed.done ?? (parsed as Record<string, number>)
        const valid = new Set(flat.map((i) => String(i.id)))
        const entries = Object.entries(incoming).filter(([k, v]) => valid.has(k) && typeof v === 'number')
        if (!entries.length) throw new Error('empty')
        sheetProgressStore.set((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
        toast(`Imported ${entries.length} completed items`, { tone: 'success' })
      })
      .catch(() => toast('That file is not a valid progress export', { tone: 'error' }))
  }

  const clearFilters = () => {
    setQuery('')
    setSection('all')
    setDifficulty('all')
    setStatus('all')
    setSort('default')
  }

  const pct = stats.total ? stats.completed / stats.total : 0

  return (
    <PageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
        <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div
          className="absolute right-[10%] top-6 -z-10 h-72 w-72 rounded-full opacity-[0.16] blur-3xl"
          style={{ background: 'var(--accent)' }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionLabel>Striver&apos;s A2Z · line by line</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-gradient-fg mt-5 text-[3.2rem] font-semibold leading-none tracking-[-0.055em] sm:text-7xl lg:text-8xl">DSA SHEET</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              The complete Striver&apos;s A2Z DSA Sheet in its original order —{' '}
              {data ? `${data.meta.total} items across ${data.sections.length} sections` : 'loading…'}. Titles and links only: every row
              opens the problem, article or video on takeUforward.
            </p>
          </Reveal>
          {data && (
            <Reveal delay={0.15}>
              <a
                href={data.meta.source}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-subtle transition-colors hover:text-fg"
              >
                Source: takeuforward.org · synced {data.meta.fetchedAt} <ArrowUpRight size={13} />
              </a>
            </Reveal>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {failed && (
          <EmptyState icon={<X size={22} />} title="Couldn't load the sheet" description="Check your connection and refresh the page." />
        )}

        {/* Progress dashboard */}
        {!failed && (
          <section aria-label="DSA progress" className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="card-surface border-gradient relative overflow-hidden rounded-[28px] p-6 sm:p-8">
              <div className="pointer-events-none absolute -left-16 -top-20 h-60 w-60 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
              <div className="relative flex flex-col items-center gap-7 sm:flex-row">
                <ProgressRing value={pct} size={168} stroke={13}>
                  <div className="text-center">
                    <div className="text-4xl font-semibold tracking-[-0.04em] text-fg tabular">{Math.round(pct * 100)}%</div>
                    <div className="mt-0.5 text-xs text-subtle">complete</div>
                  </div>
                </ProgressRing>
                <div className="w-full flex-1">
                  <h2 className="text-sm font-medium text-muted">DSA Progress</h2>
                  <div className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-fg tabular">
                    {data ? (
                      <>
                        {stats.completed} <span className="text-subtle">/ {stats.total}</span>
                      </>
                    ) : (
                      <Skeleton className="h-9 w-40" />
                    )}
                  </div>
                  <div className="mt-1 text-[13px] text-subtle">
                    {stats.practice.done}/{stats.practice.total} problems · {stats.lessons.done}/{stats.lessons.total} lessons
                  </div>
                  <div className="mt-5 space-y-3">
                    {stats.byDiff.map((s, i) => (
                      <div key={s.d}>
                        <div className="mb-1 flex justify-between text-[12.5px]">
                          <span className={s.d === 'Easy' ? 'text-easy' : s.d === 'Medium' ? 'text-medium' : 'text-hard'}>{s.d}</span>
                          <span className="text-subtle tabular">
                            {s.done} / {s.total}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]">
                          <motion.div
                            className={cn('h-full rounded-full', s.d === 'Easy' ? 'bg-easy' : s.d === 'Medium' ? 'bg-medium' : 'bg-hard')}
                            initial={{ width: 0 }}
                            animate={{ width: s.total ? `${(s.done / s.total) * 100}%` : 0 }}
                            transition={{ duration: 1, delay: i * 0.08, ease: EASE }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {stats.recent.length > 0 && (
                <div className="relative mt-7 border-t border-line pt-4">
                  <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">Recently completed</div>
                  <ul className="space-y-1.5">
                    {stats.recent.map(({ item, at }) => (
                      <li key={item.id} className="flex items-center gap-2 text-[13px]">
                        <Check size={13} className="shrink-0 text-easy" />
                        <button onClick={() => focusItem(item.id)} className="min-w-0 flex-1 truncate text-left text-muted hover:text-fg">
                          {item.title}
                        </button>
                        <span className="shrink-0 text-[11.5px] text-subtle">{timeAgo(at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card-surface rounded-[28px] p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-fg">Topic-wise progress</h2>
                <span className="text-[12px] text-subtle">{stats.bySection.filter((s) => s.total && s.done === s.total).length} sections done</span>
              </div>
              <div className="grid max-h-[420px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {data
                  ? stats.bySection.map((s, i) => {
                      const complete = s.total > 0 && s.done === s.total
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            clearFilters()
                            sheetOpenStore.set((prev) => {
                              const cur = prev ?? [firstSection]
                              return cur.includes(s.id) ? cur : [...cur, s.id]
                            })
                            window.setTimeout(
                              () =>
                                document
                                  .getElementById(`sec-${s.id}`)
                                  ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
                              60,
                            )
                          }}
                          className={cn(
                            'group rounded-xl border px-3 py-2 text-left transition-colors',
                            complete ? 'border-easy/30 bg-easy/8' : 'border-line hover:border-line-strong hover:bg-soft/50',
                          )}
                        >
                          <div className="flex items-center gap-2 text-[12.5px]">
                            <span className="font-mono text-[10.5px] text-subtle">{String(i + 1).padStart(2, '0')}</span>
                            <span className="min-w-0 flex-1 truncate text-fg">{s.title}</span>
                            {complete ? <Trophy size={12} className="text-easy" /> : null}
                            <span className="font-mono text-[11px] text-subtle tabular">
                              {s.done}/{s.total}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: complete ? 'var(--easy)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
                              initial={{ width: 0 }}
                              animate={{ width: s.total ? `${(s.done / s.total) * 100}%` : 0 }}
                              transition={{ duration: 0.9, delay: Math.min(i * 0.03, 0.4), ease: EASE }}
                            />
                          </div>
                        </button>
                      )
                    })
                  : Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            </div>
          </section>
        )}

        {/* Toolbar */}
        {!failed && (
          <div className="sticky top-[4.35rem] z-30 -mx-5 mt-10 px-5 py-3 sm:top-[4.6rem] sm:-mx-8 sm:px-8">
            <div className="glass-strong rounded-2xl border border-line-strong p-2.5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search problems, tags or #number…"
                      aria-label="Search problems"
                      className="h-10 w-full rounded-xl border border-line bg-elev/70 pl-9 pr-9 text-[13.5px] text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent/50"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-subtle hover:text-fg"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    aria-expanded={showFilters}
                    aria-controls="sheet-filters"
                    aria-label="Toggle filters"
                    className={cn(
                      'relative inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors sm:hidden',
                      showFilters ? 'border-accent/50 bg-accent/10 text-fg' : 'border-line bg-elev/70 text-muted',
                    )}
                  >
                    <SlidersHorizontal size={14} /> <span className="hidden xs:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <ToolbarMenu
                    allOpen={allOpen}
                    onToggleAll={() => sheetOpenStore.set(allOpen ? [] : (data?.sections ?? []).map((s) => s.id))}
                    onRandom={randomProblem}
                    onExport={exportProgress}
                    onImport={importProgress}
                    onReset={() => setConfirmReset(true)}
                  />
                </div>
                <div
                  id="sheet-filters"
                  className={cn('grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:flex-nowrap', !showFilters && 'max-sm:hidden')}
                >
                  <Select
                    label="Section"
                    icon={<ListFilter size={14} />}
                    value={section}
                    onChange={setSection}
                    className="col-span-2 sm:w-[230px] lg:flex-1"
                    options={[
                      { value: 'all', label: 'All sections', hint: String(flat.length) },
                      ...(data?.sections ?? []).map((s) => ({
                        value: s.id,
                        label: s.title,
                        hint: String(s.groups.reduce((n, g) => n + g.items.length, 0)),
                      })),
                    ]}
                  />
                  <Segmented
                    label="Difficulty"
                    layoutId="seg-diff"
                    value={difficulty}
                    onChange={setDifficulty}
                    className="col-span-2 sm:w-auto"
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'Easy', label: <span className="text-easy">Easy</span> },
                      { value: 'Medium', label: <span className="text-medium">Med</span> },
                      { value: 'Hard', label: <span className="text-hard">Hard</span> },
                      { value: 'Lesson', label: 'Lessons' },
                    ]}
                  />
                  <Segmented
                    label="Status"
                    layoutId="seg-status"
                    value={status}
                    onChange={setStatus}
                    className="col-span-2 sm:w-auto"
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'todo', label: 'Remaining' },
                      { value: 'done', label: 'Completed' },
                    ]}
                  />
                  <Select
                    label="Sort"
                    icon={<SortAsc size={14} />}
                    value={sort}
                    onChange={setSort}
                    align="right"
                    className="col-span-2 sm:w-[190px]"
                    options={[
                      { value: 'default', label: 'Sheet order' },
                      { value: 'diff-asc', label: 'Easy → Hard' },
                      { value: 'diff-desc', label: 'Hard → Easy' },
                      { value: 'title', label: 'Title A → Z' },
                    ]}
                  />
                </div>
              </div>
              <AnimatePresence initial={false}>
                {filtersActive && data && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-1 pt-2.5 text-[12.5px] text-subtle">
                      <span>
                        Showing <span className="text-fg tabular">{visible.length}</span> of {flat.length}
                      </span>
                      <button onClick={clearFilters} className="font-medium text-accent hover:underline">
                        Clear filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* List */}
        <div className="mt-4 space-y-3 pb-10">
          {!data && !failed &&
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-2xl" />)}

          {data && visible.length === 0 && (
            <EmptyState
              icon={<SearchX size={22} />}
              title="No problems match these filters"
              description="Try a different search term or clear the filters."
              action={
                <button onClick={clearFilters} className="text-sm font-medium text-accent hover:underline">
                  Clear filters
                </button>
              }
            />
          )}

          {data && sort !== 'default' && sorted.length > 0 && (
            <ul className="card-surface space-y-0.5 rounded-2xl p-2">
              {sorted.map((it) => (
                <ProblemRow key={it.id} item={it} done={!!done[it.id]} flash={flash === it.id} onToggle={onToggle} showSection />
              ))}
            </ul>
          )}

          {data &&
            sort === 'default' &&
            data.sections.map((s, si) => {
              const items = visible.filter((i) => i.sectionId === s.id)
              if (items.length === 0) return null
              const sec = stats.bySection[si]
              const open = isOpen(s.id)
              const complete = sec.total > 0 && sec.done === sec.total
              return (
                <section
                  key={s.id}
                  id={`sec-${s.id}`}
                  aria-labelledby={`sech-${s.id}`}
                  className={cn('card-surface scroll-mt-48 overflow-hidden rounded-2xl', complete && 'border-easy/30')}
                >
                  <button
                    onClick={() => !filtersActive && toggleSection(s.id)}
                    aria-expanded={open}
                    aria-controls={`secb-${s.id}`}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-soft/40 sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <ProgressRing value={sec.total ? sec.done / sec.total : 0} size={40} stroke={4}>
                      {complete ? (
                        <Check size={15} className="text-easy" strokeWidth={3} />
                      ) : (
                        <span className="font-mono text-[10.5px] text-muted">{String(si + 1).padStart(2, '0')}</span>
                      )}
                    </ProgressRing>
                    <span className="min-w-0 flex-1">
                      <span id={`sech-${s.id}`} className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-fg sm:text-base">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-subtle">
                        Step {si + 1} · {s.groups.length} parts{filtersActive ? ` · ${items.length} matching` : ''}
                      </span>
                    </span>
                    <span className="font-mono text-[12px] text-muted tabular">
                      {sec.done}/{sec.total}
                    </span>
                    {!filtersActive && (
                      <ChevronDown size={17} className={cn('shrink-0 text-subtle transition-transform duration-300', !open && '-rotate-90')} />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`secb-${s.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-line px-2 pb-3 pt-1 sm:px-3">
                          {s.groups.map((g) => {
                            const gItems = items.filter((i) => i.groupTitle === g.title)
                            if (gItems.length === 0) return null
                            const gDone = g.items.filter((i) => done[i.id]).length
                            return (
                              <div key={g.id} className="mt-2">
                                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                                  <h3 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">{g.title}</h3>
                                  <span className="font-mono text-[10.5px] text-subtle tabular">
                                    {gDone}/{g.items.length}
                                  </span>
                                </div>
                                <ul className="space-y-0.5">
                                  {gItems.map((it) => (
                                    <ProblemRow key={it.id} item={it} done={!!done[it.id]} flash={flash === it.id} onToggle={onToggle} />
                                  ))}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )
            })}
        </div>

        {data && (
          <p className="pb-6 text-center text-[12.5px] leading-relaxed text-subtle">
            Problem list, order and links © {data.meta.author}. Rapid_Reference only stores your checkmarks — locally, in this browser.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          const backup = sheetProgressStore.get()
          sheetProgressStore.set({})
          toast('Progress reset', {
            description: 'All checkmarks were cleared.',
            action: { label: 'Undo', onClick: () => sheetProgressStore.set(backup) },
            duration: 6000,
          })
        }}
        title="Reset all progress?"
        description={`This clears all ${stats.completed} completed items on this device. You can undo right after.`}
        confirmLabel="Reset progress"
        icon={<RotateCcw size={20} />}
      />
    </PageShell>
  )
}

function ToolbarMenu({
  allOpen,
  onToggleAll,
  onRandom,
  onExport,
  onImport,
  onReset,
}: {
  allOpen: boolean
  onToggleAll: () => void
  onRandom: () => void
  onExport: () => void
  onImport: (f: File) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useDismiss(ref, open, () => setOpen(false))
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] hover:text-fg'
  return (
    <div className="flex gap-2">
      <button
        onClick={onRandom}
        title="Random unsolved problem"
        aria-label="Random unsolved problem"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-elev/70 px-3 text-[13px] font-medium text-fg transition-colors hover:border-line-strong"
      >
        <Shuffle size={14} /> <span className="hidden sm:inline">Random</span>
      </button>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="More actions"
          aria-expanded={open}
          aria-haspopup="menu"
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-elev/70 text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <MoreHorizontal size={16} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              style={{ transformOrigin: 'top right' }}
              className="glass-strong absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-2xl border border-line-strong p-1.5 shadow-[var(--shadow-lift)]"
            >
              <button role="menuitem" className={item} onClick={() => { onToggleAll(); setOpen(false) }}>
                {allOpen ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
                {allOpen ? 'Collapse all sections' : 'Expand all sections'}
              </button>
              <button role="menuitem" className={item} onClick={() => { onExport(); setOpen(false) }}>
                <Download size={15} /> Export progress
              </button>
              <button role="menuitem" className={item} onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Import progress
              </button>
              <div className="my-1 h-px bg-line" />
              <button role="menuitem" className={cn(item, 'text-hard hover:text-hard')} onClick={() => { onReset(); setOpen(false) }}>
                <RotateCcw size={15} /> Reset progress
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
            setOpen(false)
          }}
        />
      </div>
    </div>
  )
}

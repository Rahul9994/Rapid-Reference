import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  BookOpen,
  CornerDownLeft,
  FileText,
  Hash,
  History,
  Home,
  Info,
  ListChecks,
  MessageSquareQuote,
  Palette,
  Search,
  Shuffle,
  Target,
} from 'lucide-react'
import { paletteOpen } from '../../lib/atom'
import { buildSearchIndex, excerpt, searchIndex, type SearchDoc } from '../../lib/search'
import { recentStore } from '../../lib/storage'
import { setTheme } from '../../lib/theme'
import { themes } from '../../data/themes'
import { topicByKey } from '../../data/notes'
import { useRandomActions } from '../../lib/random'
import { cn, formatNumber } from '../../lib/utils'
import { useBodyScrollLock, useFocusTrap } from '../../hooks'
import { DifficultyPill, Kbd, Skeleton } from '../ui/misc'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Highlight } from './Highlight'

interface Item {
  id: string
  title: string
  subtitle?: string
  icon: ReactNode
  url?: string
  external?: string
  difficulty?: string | null
  run?: () => void
}

interface Group {
  label: string
  items: Item[]
}

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'notes', label: 'Notes' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sheet', label: 'DSA Sheet' },
] as const
type Scope = (typeof SCOPES)[number]['id']

function iconFor(d: SearchDoc): ReactNode {
  if (d.kind === 'problem') return <Target size={16} />
  if (d.kind === 'faq') return <MessageSquareQuote size={16} />
  if (d.kind === 'section') return <Hash size={16} />
  const cat = d.id.slice(2).split('/')[0]
  return <CategoryIcon id={cat} size={16} />
}

export default function CommandPalette() {
  const open = paletteOpen.use()
  const navigate = useNavigate()
  const { randomTopic, randomProblem } = useRandomActions()
  const recent = recentStore.use()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [active, setActive] = useState(0)
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const deferred = useDeferredValue(query)

  useBodyScrollLock(open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    setActive(0)
    requestAnimationFrame(() => inputRef.current?.focus())
    if (!docs) {
      buildSearchIndex()
        .then(setDocs)
        .catch(() => setError(true))
    }
  }, [open, docs])

  const close = () => paletteOpen.set(false)

  const groups: Group[] = useMemo(() => {
    const q = deferred.trim()
    if (!q) {
      const out: Group[] = []
      const recentItems = recent
        .map((r) => topicByKey.get(r.key))
        .filter((t) => t !== undefined)
        .slice(0, 4)
        .map<Item>((t) => ({
          id: `recent:${t.key}`,
          title: t.title,
          subtitle: t.category.title,
          icon: <History size={16} />,
          url: `/notes/${t.category.id}/${t.slug}`,
        }))
      if (recentItems.length) out.push({ label: 'Recently viewed', items: recentItems })
      out.push({
        label: 'Jump to',
        items: [
          { id: 'go:home', title: 'Home', icon: <Home size={16} />, url: '/' },
          { id: 'go:notes', title: 'Notes', subtitle: 'Python · DSA · OS · DBMS · CN', icon: <BookOpen size={16} />, url: '/notes' },
          { id: 'go:sheet', title: 'DSA SHEET', subtitle: "Striver's A2Z — track your progress", icon: <ListChecks size={16} />, url: '/dsa-sheet' },
          { id: 'go:faq', title: 'Interview FAQ', subtitle: 'Reveal-style Q&A', icon: <MessageSquareQuote size={16} />, url: '/faq' },
          { id: 'go:about', title: 'About & sources', icon: <Info size={16} />, url: '/about' },
        ],
      })
      out.push({
        label: 'Actions',
        items: [
          { id: 'act:random-topic', title: 'Random topic', subtitle: 'Open a surprise note', icon: <Shuffle size={16} />, run: randomTopic },
          { id: 'act:random-problem', title: 'Random DSA problem', subtitle: 'Pick an unsolved A2Z problem', icon: <Target size={16} />, run: randomProblem },
        ],
      })
      return out
    }

    const out: Group[] = []
    const lower = q.toLowerCase()
    if ('theme'.startsWith(lower) || lower.startsWith('theme') || themes.some((t) => t.name.toLowerCase().includes(lower))) {
      const themeQuery = lower.replace(/^theme\s*/, '')
      const matches = themes.filter((t) => !themeQuery || t.name.toLowerCase().includes(themeQuery))
      if (matches.length && scope === 'all') {
        out.push({
          label: 'Themes',
          items: matches.slice(0, 6).map((t) => ({
            id: `theme:${t.id}`,
            title: `Theme: ${t.name}`,
            subtitle: t.blurb,
            icon: <Palette size={16} />,
            run: () => setTheme(t.id, { x: window.innerWidth / 2, y: 80 }),
          })),
        })
      }
    }

    if (!docs) return out
    const filtered =
      scope === 'all'
        ? docs
        : docs.filter((d) =>
            scope === 'notes' ? d.kind === 'topic' || d.kind === 'section' : scope === 'faq' ? d.kind === 'faq' : d.kind === 'problem',
          )
    for (const g of searchIndex(filtered, q, scope === 'all' ? 5 : 30)) {
      out.push({
        label: g.group,
        items: g.results.map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.kind === 'problem' ? d.subtitle : `${d.subtitle} — ${excerpt(d.text, q)}`,
          icon: iconFor(d),
          url: d.url,
          external: d.external,
          difficulty: d.kind === 'problem' ? d.difficulty : undefined,
        })),
      })
    }
    return out
  }, [deferred, docs, recent, scope, randomTopic, randomProblem])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => setActive(0), [deferred, scope])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const runItem = (item: Item | undefined, external = false) => {
    if (!item) return
    close()
    if (external && item.external) {
      window.open(item.external, '_blank', 'noopener,noreferrer')
      return
    }
    if (item.run) item.run()
    else if (item.url) navigate(item.url)
  }

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runItem(flat[active], e.metaKey || e.ctrlKey)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab' && !e.shiftKey && document.activeElement === inputRef.current) {
      e.preventDefault()
      const i = SCOPES.findIndex((s) => s.id === scope)
      setScope(SCOPES[(i + 1) % SCOPES.length].id)
    }
  }

  let index = -1
  const searching = deferred.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150]" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--bg)_55%,transparent)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search Rapid_Reference"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 36 }}
            className="glass-strong relative mx-auto mt-[max(4.5rem,10vh)] flex max-h-[min(640px,calc(100dvh-7rem))] w-[calc(100%-1.5rem)] max-w-[660px] flex-col overflow-hidden rounded-3xl border border-line-strong shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 sm:px-5">
              <Search size={18} className="shrink-0 text-accent" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, FAQ, A2Z problems…"
                className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle sm:h-16 sm:text-base"
                aria-label="Search query"
                aria-controls="palette-results"
                aria-activedescendant={flat[active] ? `pi-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              <button onClick={close} className="shrink-0" aria-label="Close search">
                <Kbd>Esc</Kbd>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line px-3 py-2 no-scrollbar sm:px-4">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScope(s.id)
                    inputRef.current?.focus()
                  }}
                  className={cn(
                    'relative shrink-0 rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors',
                    scope === s.id ? 'text-fg' : 'text-subtle hover:text-muted',
                  )}
                >
                  {scope === s.id && (
                    <motion.span
                      layoutId="palette-scope"
                      className="absolute inset-0 -z-10 rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                    />
                  )}
                  {s.label}
                </button>
              ))}
              <span className="ml-auto hidden shrink-0 pl-2 text-[11.5px] text-subtle sm:block">
                {docs ? `${formatNumber(docs.length)} entries indexed` : 'Indexing…'}
              </span>
            </div>

            <div ref={listRef} id="palette-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {groups.map((g) => (
                <div key={g.label} className="mb-1.5" role="group" aria-label={g.label}>
                  <div className="sticky top-0 z-10 px-3 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle backdrop-blur-sm">
                    {g.label}
                  </div>
                  {g.items.map((item) => {
                    index++
                    const i = index
                    const isActive = i === active
                    return (
                      <div
                        key={item.id}
                        id={`pi-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={isActive}
                        onMouseMove={() => active !== i && setActive(i)}
                        onClick={() => runItem(item)}
                        className={cn(
                          'group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150',
                          isActive ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]' : 'hover:bg-soft/60',
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="palette-active"
                            className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent"
                            transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                          />
                        )}
                        <span
                          className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors',
                            isActive ? 'border-accent/40 bg-accent/15 text-accent' : 'border-line bg-elev text-muted',
                          )}
                        >
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-medium text-fg">
                            <Highlight text={item.title} query={searching ? deferred : ''} />
                          </div>
                          {item.subtitle && (
                            <div className="truncate text-[12.5px] text-subtle">
                              <Highlight text={item.subtitle} query={searching ? deferred : ''} />
                            </div>
                          )}
                        </div>
                        {item.difficulty !== undefined && <DifficultyPill difficulty={item.difficulty} className="hidden sm:inline-flex" />}
                        {item.external && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              runItem(item, true)
                            }}
                            aria-label={`Open ${item.title} on takeUforward`}
                            title="Open on takeUforward"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-soft hover:text-fg"
                          >
                            <ArrowUpRight size={15} />
                          </button>
                        )}
                        <CornerDownLeft size={14} className={cn('shrink-0 text-subtle transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                      </div>
                    )
                  })}
                </div>
              ))}

              {searching && !docs && !error && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-2.5 w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="px-4 py-8 text-center text-sm text-hard">Couldn't build the search index. Check your connection and retry.</p>}

              {searching && docs && flat.length === 0 && (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <FileText size={22} className="text-subtle" />
                  <p className="mt-3 text-sm font-medium text-fg">No results for “{deferred}”</p>
                  <p className="mt-1 text-[13px] text-subtle">Try a broader term like “heap”, “deadlock” or “join”.</p>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-4 border-t border-line px-5 py-2.5 text-[11.5px] text-subtle sm:flex">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> open
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Tab</Kbd> scope
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Kbd>Ctrl</Kbd>
                <Kbd>↵</Kbd> open on TUF
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

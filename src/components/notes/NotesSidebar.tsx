import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bookmark, ChevronDown, ChevronsDownUp, ChevronsUpDown, Search, Shuffle, X } from 'lucide-react'
import { noteCategories, type CategoryId } from '../../data/notes'
import { bookmarksStore } from '../../lib/storage'
import { prefetchNotes } from '../../lib/content'
import { useRandomActions } from '../../lib/random'
import { cn } from '../../lib/utils'
import { CategoryIcon } from '../ui/CategoryIcon'

const EASE = [0.22, 1, 0.36, 1] as const

export function NotesSidebar({
  activeCategory,
  activeTopic,
  onNavigate,
  idPrefix = 'sb',
}: {
  activeCategory: CategoryId
  activeTopic?: string
  onNavigate?: () => void
  idPrefix?: string
}) {
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({ [activeCategory]: true })
  const bookmarks = bookmarksStore.use()
  const { randomTopic } = useRandomActions()
  const q = filter.trim().toLowerCase()

  const groups = useMemo(
    () =>
      noteCategories.map((c) => ({
        ...c,
        visible: q ? c.topics.filter((t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)) : c.topics,
      })),
    [q],
  )
  const anyOpen = Object.values(open).some(Boolean)
  const totalMatches = groups.reduce((n, g) => n + g.visible.length, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter topics…"
          aria-label="Filter topics"
          className="h-9 w-full rounded-xl border border-line bg-elev/70 pl-9 pr-8 text-[13px] text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent/50"
        />
        {filter && (
          <button
            onClick={() => setFilter('')}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-subtle hover:text-fg"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-subtle">
        <span className="font-mono uppercase tracking-[0.14em]">{q ? `${totalMatches} matches` : 'Topics'}</span>
        {!q && (
          <button
            onClick={() =>
              setOpen(anyOpen ? {} : Object.fromEntries(noteCategories.map((c) => [c.id, true])))
            }
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-soft hover:text-fg"
          >
            {anyOpen ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
            {anyOpen ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      <nav aria-label="Notes topics" className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4">
        {groups.map((g) => {
          if (q && g.visible.length === 0) return null
          const isOpen = q ? true : !!open[g.id]
          const listId = `${idPrefix}-${g.id}`
          return (
            <div key={g.id} className="mb-1">
              <button
                onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                onPointerEnter={() => prefetchNotes(g.id)}
                aria-expanded={isOpen}
                aria-controls={listId}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-[13.5px] font-medium transition-colors hover:bg-soft/70',
                  g.id === activeCategory ? 'text-fg' : 'text-muted',
                )}
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-lg"
                  style={{ color: g.hue, background: `color-mix(in oklab, ${g.hue} 14%, transparent)` }}
                >
                  <CategoryIcon id={g.id} size={13} />
                </span>
                <span className="flex-1 truncate">{g.short === 'DSA' ? 'DSA (Python)' : g.title}</span>
                <span className="font-mono text-[10.5px] text-subtle">{g.visible.length}</span>
                <ChevronDown size={14} className={cn('text-subtle transition-transform duration-300', !isOpen && '-rotate-90')} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    id={listId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="relative ml-[1.15rem] overflow-hidden border-l border-line pl-2"
                  >
                    {g.visible.map((t) => {
                      const active = g.id === activeCategory && t.slug === activeTopic
                      const saved = bookmarks.includes(`${g.id}/${t.slug}`)
                      return (
                        <li key={t.slug} className="relative py-px">
                          {active && (
                            <motion.span
                              layoutId={`${idPrefix}-active`}
                              className="absolute inset-0 rounded-lg border border-accent/25 bg-accent/10"
                              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                            />
                          )}
                          <Link
                            to={`/notes/${g.id}/${t.slug}`}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition-colors',
                              active ? 'font-medium text-fg' : 'text-muted hover:text-fg',
                            )}
                          >
                            <span className="flex-1">{t.title}</span>
                            {saved && <Bookmark size={11} className="shrink-0 fill-current text-accent" aria-label="Bookmarked" />}
                          </Link>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {q && totalMatches === 0 && <p className="px-2 py-6 text-center text-[13px] text-subtle">No topics match “{filter}”.</p>}
      </nav>

      <button
        onClick={() => {
          onNavigate?.()
          randomTopic()
        }}
        className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        <Shuffle size={14} /> Random topic
      </button>
    </div>
  )
}

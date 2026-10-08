import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Bookmark, History, Search, SearchX, Shuffle, X } from 'lucide-react'
import { noteCategories, totalTopics } from '../data/notes'
import { lookupTopic, type AnyTopic } from '../data/catalog'
import { bookmarksStore, recentStore } from '../lib/storage'
import { prefetchNotes } from '../lib/content'
import { useRandomActions } from '../lib/random'
import { PageShell } from '../components/layout/PageShell'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { EmptyState, SectionLabel } from '../components/ui/misc'
import { Reveal } from '../components/ui/Reveal'
import { Accent } from '../components/home/SectionHeader'

const EASE = [0.22, 1, 0.36, 1] as const

export default function NotesHome() {
  const [filter, setFilter] = useState('')
  const recent = recentStore.use()
  const bookmarks = bookmarksStore.use()
  const { randomTopic } = useRandomActions()
  const q = filter.trim().toLowerCase()

  useEffect(() => {
    document.title = 'Notes — Rapid_Reference'
  }, [])

  const groups = useMemo(
    () =>
      noteCategories
        .map((c) => ({
          ...c,
          visible: q
            ? c.topics.filter((t) => `${t.title} ${t.summary} ${c.title}`.toLowerCase().includes(q))
            : c.topics,
        }))
        .filter((c) => c.visible.length > 0),
    [q],
  )

  const recentTopics = recent.map((r) => lookupTopic(r.key)).filter((t) => t !== undefined).slice(0, 5)
  const saved = bookmarks.map((k) => lookupTopic(k)).filter((t) => t !== undefined)

  return (
    <PageShell>
      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
        <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div
          className="absolute left-1/2 top-10 -z-10 h-80 w-[70%] -translate-x-1/2 rounded-full opacity-[0.14] blur-3xl"
          style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <Reveal>
            <SectionLabel>Notes</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.045em] text-fg sm:text-6xl">
              The reference library, <Accent>organised.</Accent>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {totalTopics} topics across Python, DSA, Operating Systems, DBMS and Computer Networks — each with explanations, Python
              code, common mistakes and interview notes.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative max-w-xl flex-1">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter topics — try “heap”, “paging”, “joins”…"
                  aria-label="Filter topics"
                  className="glass h-12 w-full rounded-2xl border border-line-strong pl-11 pr-10 text-[15px] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-accent/60 focus:shadow-[var(--shadow-glow)]"
                />
                {filter && (
                  <button
                    onClick={() => setFilter('')}
                    aria-label="Clear filter"
                    className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-subtle hover:text-fg"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <button
                onClick={randomTopic}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-line-strong px-5 text-sm font-medium text-fg transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-soft"
              >
                <Shuffle size={16} /> Random topic
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {!q && (recentTopics.length > 0 || saved.length > 0) && (
          <div className="mb-12 grid gap-4 md:grid-cols-2">
            {recentTopics.length > 0 && (
              <ShelfCard icon={<History size={15} />} title="Recently viewed" items={recentTopics} />
            )}
            {saved.length > 0 && <ShelfCard icon={<Bookmark size={15} />} title="Bookmarks" items={saved} />}
          </div>
        )}

        {groups.length === 0 ? (
          <EmptyState
            icon={<SearchX size={22} />}
            title={`No topics match “${filter}”`}
            description="Try a different keyword, or press Ctrl K to search inside every note."
            action={
              <button onClick={() => setFilter('')} className="text-sm font-medium text-accent hover:underline">
                Clear filter
              </button>
            }
          />
        ) : (
          <div className="space-y-16">
            {groups.map((c) => (
              <section key={c.id} aria-labelledby={`cat-${c.id}`} onPointerEnter={() => prefetchNotes(c.id)}>
                <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                      style={{
                        color: c.hue,
                        background: `color-mix(in oklab, ${c.hue} 13%, var(--bg-elev))`,
                        borderColor: `color-mix(in oklab, ${c.hue} 30%, var(--border))`,
                      }}
                    >
                      <CategoryIcon id={c.id} size={20} />
                    </span>
                    <div>
                      <h2 id={`cat-${c.id}`} className="text-xl font-semibold tracking-[-0.02em] text-fg sm:text-2xl">
                        {c.title}
                      </h2>
                      <p className="mt-0.5 hidden text-sm text-muted sm:block">{c.description}</p>
                    </div>
                  </div>
                  <Link
                    to={`/notes/${c.id}`}
                    className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
                  >
                    {q ? `${c.visible.length} found` : `All ${c.topics.length}`}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {c.visible.map((t, i) => {
                    const index = c.topics.indexOf(t)
                    return (
                      <motion.li
                        key={t.slug}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px 0px -5% 0px' }}
                        transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.5, ease: EASE }}
                      >
                        <Link
                          to={`/notes/${c.id}/${t.slug}`}
                          className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-elev/50 p-4 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:bg-elev"
                        >
                          <span className="mt-0.5 font-mono text-[11px] text-subtle tabular">{String(index + 1).padStart(2, '0')}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[14.5px] font-medium text-fg transition-colors group-hover:text-accent">
                              {t.title}
                              {bookmarks.includes(`${c.id}/${t.slug}`) && (
                                <Bookmark size={11} className="shrink-0 fill-current text-accent" aria-label="Bookmarked" />
                              )}
                            </span>
                            <span className="mt-1 block text-[13px] leading-relaxed text-muted">{t.summary}</span>
                          </span>
                        </Link>
                      </motion.li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function ShelfCard({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: AnyTopic[]
}) {
  return (
    <div className="card-surface rounded-3xl p-5">
      <div className="flex items-center gap-2 text-[12.5px] font-medium text-subtle">
        <span className="text-accent">{icon}</span> {title}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 8).map((t) => (
          <li key={t.key}>
            <Link
              to={t.path}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/40 px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <span style={{ color: t.hue }}>
                <CategoryIcon id={t.group} size={12} />
              </span>
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

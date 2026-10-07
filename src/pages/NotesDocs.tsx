import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Layers,
  Link2,
  ListTree,
  PanelLeft,
  TextQuote,
} from 'lucide-react'
import { categoryById, getAdjacentTopics, getTopic, type CategoryId, type NoteCategory } from '../data/notes'
import { loadNote, loadNoteBundle } from '../lib/content'
import { renderMarkdown } from '../lib/markdown'
import { bookmarksStore, pushRecent, toggleBookmark } from '../lib/storage'
import { toast } from '../lib/toast'
import { appUrl, cn, copyText, readingTime, scrollToHeading } from '../lib/utils'
import { useHotkey } from '../hooks'
import { PageShell } from '../components/layout/PageShell'
import { NotesSidebar } from '../components/notes/NotesSidebar'
import { MarkdownView } from '../components/notes/MarkdownView'
import { Toc, TocList, useActiveHeading } from '../components/notes/Toc'
import { ArticleSkeleton, Breadcrumbs, Drawer, ReadingProgress, Sheet, TopicPager } from '../components/notes/DocsChrome'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Kbd } from '../components/ui/misc'
import NotFound from './NotFound'

const EASE = [0.22, 1, 0.36, 1] as const

export default function NotesDocs() {
  const params = useParams()
  const category = categoryById[params.category as CategoryId] as NoteCategory | undefined
  const topic = category && params.topic ? getTopic(category.id, params.topic) : undefined
  const [drawer, setDrawer] = useState(false)

  if (!category || (params.topic && !topic)) {
    return (
      <PageShell>
        <NotFound />
      </PageShell>
    )
  }

  return (
    <PageShell>
      {topic && <ReadingProgress />}
      <div className="mx-auto max-w-[1440px] px-4 pt-[5.5rem] sm:px-6 lg:px-8 lg:pt-28">
        {/* Mobile / tablet bar */}
        <div className="glass sticky top-[4.35rem] z-30 -mx-4 mb-6 flex items-center gap-2 border-y border-line px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-line px-3 text-[13px] font-medium text-fg"
            aria-label="Open topics"
          >
            <PanelLeft size={15} /> Topics
          </button>
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
            {category.short} {topic ? `› ${topic.title}` : ''}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[256px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_224px] xl:gap-12">
          <aside className="sticky top-28 hidden h-[calc(100dvh-8.5rem)] lg:block" aria-label="Notes navigation">
            <NotesSidebar activeCategory={category.id} activeTopic={topic?.slug} />
          </aside>

          {topic ? <TopicArticle key={category.id} category={category} slug={topic.slug} /> : <CategoryOverview category={category} />}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Notes">
        <NotesSidebar activeCategory={category.id} activeTopic={topic?.slug} onNavigate={() => setDrawer(false)} idPrefix="dr" />
      </Drawer>
    </PageShell>
  )
}

function TopicArticle({ category, slug }: { category: NoteCategory; slug: string }) {
  const topic = getTopic(category.id, slug)!
  const key = topic.key
  const location = useLocation()
  const navigate = useNavigate()
  const articleRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<{ key: string; md: string | null } | null>(null)
  const [failed, setFailed] = useState(false)
  const [slow, setSlow] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [allCollapsed, setAllCollapsed] = useState(false)
  const bookmarks = bookmarksStore.use()
  const saved = bookmarks.includes(key)
  const { prev, next } = getAdjacentTopics(key)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setSlow(false)
    setAllCollapsed(false)
    const timer = window.setTimeout(() => setSlow(true), 160)
    loadNote(category.id, slug)
      .then((md) => !cancelled && setState({ key, md: md ?? null }))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [category.id, slug, key])

  const ready = state?.key === key
  const doc = useMemo(() => (ready && state?.md ? renderMarkdown(state.md) : null), [ready, state])
  const minutes = useMemo(() => (ready && state?.md ? readingTime(state.md) : undefined), [ready, state])
  const active = useActiveHeading(doc?.toc ?? [])

  useEffect(() => {
    document.title = `${topic.title} · ${category.short} Notes — Rapid_Reference`
  }, [topic.title, category.short])

  // Scroll: top on topic change, or to the heading in the URL hash.
  const lastKey = useRef<string | null>(null)
  useEffect(() => {
    if (!doc) return
    const hash = decodeURIComponent(location.hash.slice(1))
    const topicChanged = lastKey.current !== key
    lastKey.current = key
    if (topicChanged) pushRecent(key)
    if (hash) {
      requestAnimationFrame(() => scrollToHeading(hash, !topicChanged))
    } else if (topicChanged) {
      window.scrollTo(0, 0)
    }
  }, [doc, key, location.hash])

  useHotkey('[', () => prev && navigate(`/notes/${prev.category.id}/${prev.slug}`))
  useHotkey(']', () => next && navigate(`/notes/${next.category.id}/${next.slug}`))

  const onBookmark = () => {
    const added = toggleBookmark(key)
    toast(added ? 'Bookmarked' : 'Removed from bookmarks', { description: topic.title, tone: added ? 'success' : 'default', duration: 1800 })
  }

  const onCopyLink = () => {
    copyText(appUrl(`/notes/${category.id}/${slug}`)).then((ok) =>
      toast(ok ? 'Link copied' : 'Copy failed', { tone: ok ? 'success' : 'error', duration: 1600 }),
    )
  }

  const toggleAll = () => {
    const collapse = !allCollapsed
    articleRef.current?.querySelectorAll('.doc-section').forEach((s) => {
      s.classList.toggle('collapsed', collapse)
      s.querySelector('[data-toggle]')?.setAttribute('aria-expanded', String(!collapse))
    })
    setAllCollapsed(collapse)
  }

  const sections = doc?.toc.filter((t) => t.depth === 2).length ?? 0

  return (
    <>
      <article className="min-w-0 pb-8" aria-labelledby="topic-title">
        <header>
          <Breadcrumbs
            items={[
              { label: 'Notes', to: '/notes' },
              { label: category.short === 'DSA' ? 'DSA' : category.title, to: `/notes/${category.id}` },
              { label: topic.title },
            ]}
          />
          <motion.h1
            key={key}
            id="topic-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mt-4 text-balance text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.035em] text-fg sm:text-[2.75rem]"
          >
            {topic.title}
          </motion.h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-muted sm:text-lg">{topic.summary}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-6">
            <span
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium"
              style={{ color: category.hue, background: `color-mix(in oklab, ${category.hue} 12%, transparent)` }}
            >
              <CategoryIcon id={category.id} size={13} /> {category.short}
            </span>
            {minutes && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted">
                <Clock size={13} /> {minutes} min read
              </span>
            )}
            {sections > 0 && (
              <span className="hidden h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted sm:inline-flex">
                <Layers size={13} /> {sections} sections
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setTocOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:text-fg xl:hidden"
                aria-label="On this page"
              >
                <TextQuote size={13} /> <span className="hidden xs:inline">Contents</span>
              </button>
              <button
                onClick={toggleAll}
                title={allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
                aria-label={allCollapsed ? 'Expand all sections' : 'Collapse all sections'}
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors hover:text-fg"
              >
                {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
              </button>
              <button
                onClick={onCopyLink}
                title="Copy link"
                aria-label="Copy link to this topic"
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-colors hover:text-fg"
              >
                <Link2 size={14} />
              </button>
              <motion.button
                onClick={onBookmark}
                whileTap={{ scale: 0.85 }}
                aria-pressed={saved}
                aria-label={saved ? 'Remove bookmark' : 'Bookmark this topic'}
                title={saved ? 'Remove bookmark' : 'Bookmark'}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full border transition-colors',
                  saved ? 'border-accent/50 bg-accent/12 text-accent' : 'border-line text-muted hover:text-fg',
                )}
              >
                <motion.span key={String(saved)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                  <Bookmark size={14} className={saved ? 'fill-current' : undefined} />
                </motion.span>
              </motion.button>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            {doc ? (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                <MarkdownView ref={articleRef} html={doc.html} />
              </motion.div>
            ) : failed ? (
              <p key="err" className="rounded-2xl border border-hard/30 bg-hard/10 p-5 text-sm text-hard">
                This note couldn't be loaded. Check your connection and refresh.
              </p>
            ) : ready && !state?.md ? (
              <p key="missing" className="text-muted">This topic is coming soon.</p>
            ) : slow ? (
              <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ArticleSkeleton />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {doc && (
          <>
            <TopicPager prev={prev} next={next} />
            <p className="mt-6 hidden items-center justify-center gap-2 text-[12px] text-subtle sm:flex">
              Tip: press <Kbd>[</Kbd> or <Kbd>]</Kbd> for previous / next topic
            </p>
          </>
        )}
      </article>

      <aside className="sticky top-28 hidden h-fit xl:block" aria-label="Table of contents">
        {doc && <Toc items={doc.toc} readingTime={minutes} />}
      </aside>

      <Sheet open={tocOpen} onClose={() => setTocOpen(false)} title="On this page">
        {doc && <TocList items={doc.toc} active={active} onNavigate={() => setTocOpen(false)} />}
      </Sheet>
    </>
  )
}

function CategoryOverview({ category }: { category: NoteCategory }) {
  const [bundle, setBundle] = useState<Record<string, string> | null>(null)
  const bookmarks = bookmarksStore.use()

  useEffect(() => {
    document.title = `${category.title} Notes — Rapid_Reference`
    window.scrollTo(0, 0)
    loadNoteBundle(category.id).then(setBundle).catch(() => setBundle({}))
  }, [category])

  const totalMinutes = bundle ? category.topics.reduce((n, t) => n + readingTime(bundle[`./${t.slug}.md`] ?? ''), 0) : null
  const first = category.topics[0]

  return (
    <div className="min-w-0 pb-8 xl:col-span-2">
      <Breadcrumbs items={[{ label: 'Notes', to: '/notes' }, { label: category.title }]} />
      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-line p-6 sm:p-10">
        <div className="bg-grid mask-radial absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: category.hue }}
          aria-hidden="true"
        />
        <div className="relative">
          <span
            className="grid h-14 w-14 place-items-center rounded-2xl border"
            style={{
              color: category.hue,
              background: `color-mix(in oklab, ${category.hue} 13%, var(--bg-elev))`,
              borderColor: `color-mix(in oklab, ${category.hue} 30%, var(--border))`,
            }}
          >
            <CategoryIcon id={category.id} size={26} />
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl">{category.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{category.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/notes/${category.id}/${first.slug}`}
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-on-accent shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
            >
              <BookOpen size={16} /> Start reading
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <ListTree size={15} /> {category.topics.length} topics
            </span>
            {totalMinutes !== null && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Clock size={15} /> ~{Math.round(totalMinutes / 6) / 10} h of reading
              </span>
            )}
          </div>
        </div>
      </div>

      <ol className="mt-8 grid gap-3 md:grid-cols-2">
        {category.topics.map((t, i) => {
          const md = bundle?.[`./${t.slug}.md`]
          const saved = bookmarks.includes(`${category.id}/${t.slug}`)
          return (
            <motion.li
              key={t.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.5, ease: EASE }}
            >
              <Link
                to={`/notes/${category.id}/${t.slug}`}
                className="card-surface group flex h-full gap-4 rounded-2xl p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-5"
              >
                <span className="font-mono text-[12px] text-subtle tabular">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium text-fg transition-colors group-hover:text-accent">
                    {t.title}
                    {saved && <Bookmark size={12} className="fill-current text-accent" aria-label="Bookmarked" />}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">{t.summary}</span>
                  {md && <span className="mt-2 block font-mono text-[11px] text-subtle">{readingTime(md)} min read</span>}
                </span>
                <ArrowRight size={16} className="mt-0.5 shrink-0 text-subtle transition-all group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}

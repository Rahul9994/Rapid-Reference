import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Bookmark, Clock, Link2, ListTree, MousePointerClick, TextQuote } from 'lucide-react'
import { getAdjacentLabTopics, getLabTopic, labTopicPath, moduleTitle, type FlatLabTopic, type TrackId } from '../data/labs'
import { loadKatex, loadLabNote } from '../lib/content'
import { renderMarkdown } from '../lib/markdown'
import { bookmarksStore, pushRecent, toggleBookmark } from '../lib/storage'
import { toast } from '../lib/toast'
import { appUrl, cn, copyText, readingTime, scrollToHeading } from '../lib/utils'
import { useHotkey } from '../hooks'
import { PageShell } from '../components/layout/PageShell'
import { ArticleSkeleton, Breadcrumbs, Drawer, ReadingProgress, Sheet } from '../components/notes/DocsChrome'
import { Toc, TocList, useActiveHeading } from '../components/notes/Toc'
import { VizMount } from '../components/labs/VizMount'
import { LabNotes } from '../components/labs/LabNotes'
import { TrackTopicList } from '../components/labs/TrackTopicList'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { Kbd } from '../components/ui/misc'
import NotFound from './NotFound'

const EASE = [0.22, 1, 0.36, 1] as const
type Katex = Awaited<ReturnType<typeof loadKatex>>

export default function LabTopic({ trackId }: { trackId: TrackId }) {
  const { topic: slug = '' } = useParams()
  const topic = getLabTopic(trackId, slug)
  if (!topic) {
    return (
      <PageShell>
        <NotFound />
      </PageShell>
    )
  }
  return <TopicView key={topic.key} topic={topic} />
}

function TopicView({ topic }: { topic: FlatLabTopic }) {
  const track = topic.track
  const location = useLocation()
  const navigate = useNavigate()
  const articleRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<{ md: string | null; katex: Katex } | null>(null)
  const [failed, setFailed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const bookmarks = bookmarksStore.use()
  const saved = bookmarks.includes(topic.key)
  const { prev, next } = getAdjacentLabTopics(topic.key)
  const number = topic.index + 1

  useEffect(() => {
    let cancelled = false
    document.title = `${topic.title} · ${track.label} — Rapid_Reference`
    window.scrollTo(0, 0)
    pushRecent(topic.key)
    Promise.all([loadLabNote(track.id, topic.slug), loadKatex()])
      .then(([md, katex]) => !cancelled && setState({ md: md ?? null, katex }))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [topic, track])

  const doc = useMemo(() => (state?.md ? renderMarkdown(state.md, { katex: state.katex }) : null), [state])
  const minutes = state?.md ? readingTime(state.md) : undefined
  const active = useActiveHeading(doc?.toc ?? [])

  useEffect(() => {
    if (!doc) return
    const hash = decodeURIComponent(location.hash.slice(1))
    if (hash) requestAnimationFrame(() => scrollToHeading(hash, false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  useHotkey('[', () => prev && navigate(labTopicPath(prev)))
  useHotkey(']', () => next && navigate(labTopicPath(next)))

  const onBookmark = () => {
    const added = toggleBookmark(topic.key)
    toast(added ? 'Bookmarked' : 'Removed from bookmarks', { description: topic.title, tone: added ? 'success' : 'default', duration: 1800 })
  }
  const onCopyLink = () => {
    copyText(appUrl(labTopicPath(topic))).then((ok) => toast(ok ? 'Link copied' : 'Copy failed', { tone: ok ? 'success' : 'error', duration: 1600 }))
  }

  return (
    <PageShell>
      <ReadingProgress />
      <div className="relative" style={{ '--lab-hue': track.hue } as CSSProperties}>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] opacity-70"
          style={{ background: `radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, ${track.hue} 14%, transparent), transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-40" aria-hidden="true" />

        <div className="mx-auto max-w-[1240px] px-5 pt-[6.25rem] sm:px-8 lg:pt-32">
          {/* Header */}
          <header className="max-w-4xl">
            <Breadcrumbs
              items={[
                { label: track.label, to: track.path },
                { label: moduleTitle(track, topic.module), to: `${track.path}#${topic.module}` },
                { label: topic.title },
              ]}
            />
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              <div className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
                <span style={{ color: track.hue }}>{track.short}</span>
                <span className="h-px w-8 bg-line-strong" />
                <span>Lesson {String(number).padStart(2, '0')} / {String(track.topics.length).padStart(2, '0')}</span>
              </div>
              <h1 className="mt-4 text-balance text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.045em] text-fg sm:text-[3.4rem] lg:text-[4rem]">
                {topic.title}
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{topic.summary}</p>
            </motion.div>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium"
                style={{ color: track.hue, background: `color-mix(in oklab, ${track.hue} 12%, transparent)` }}
              >
                <CategoryIcon id={track.id} size={13} /> {moduleTitle(track, topic.module)}
              </span>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted">
                <MousePointerClick size={13} /> Interactive lab
              </span>
              {minutes && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted">
                  <Clock size={13} /> {minutes} min read
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setDrawer(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  <ListTree size={13} /> <span className="hidden xs:inline">Curriculum</span>
                </button>
                <button
                  onClick={() => setTocOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] text-muted transition-colors hover:text-fg xl:hidden"
                  aria-label="On this page"
                >
                  <TextQuote size={13} />
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
                  <Bookmark size={14} className={saved ? 'fill-current' : undefined} />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Primary lab */}
          <motion.section
            aria-label="Interactive visualization"
            className="mt-9 sm:mt-11"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          >
            <VizMount id={topic.viz} />
          </motion.section>

          {/* Notes */}
          <div className="mt-16 grid gap-12 sm:mt-20 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-16">
            <article className="min-w-0 max-w-[860px]" aria-label="Notes">
              <div className="mb-8 flex items-center gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">The notes</span>
                <span className="h-px flex-1 bg-gradient-to-r from-line-strong to-transparent" />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {doc ? (
                  <motion.div key="doc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                    <LabNotes ref={articleRef} html={doc.html} />
                  </motion.div>
                ) : failed ? (
                  <p key="err" className="rounded-2xl border border-hard/30 bg-hard/10 p-5 text-sm text-hard">
                    These notes couldn't be loaded. Check your connection and refresh.
                  </p>
                ) : state && !state.md ? (
                  <p key="missing" className="text-muted">
                    Notes for this topic are coming soon.
                  </p>
                ) : (
                  <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ArticleSkeleton />
                  </motion.div>
                )}
              </AnimatePresence>

              <LabPager prev={prev} next={next} />
              <p className="mt-6 hidden items-center justify-center gap-2 text-[12px] text-subtle sm:flex">
                Tip: press <Kbd>[</Kbd> or <Kbd>]</Kbd> for the previous / next lesson
              </p>
            </article>

            <aside className="sticky top-28 hidden h-fit xl:block" aria-label="Table of contents">
              {doc && <Toc items={doc.toc} readingTime={minutes} />}
            </aside>
          </div>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={`${track.title} · Curriculum`} desktop>
        <TrackTopicList track={track} active={topic.slug} onNavigate={() => setDrawer(false)} />
      </Drawer>
      <Sheet open={tocOpen} onClose={() => setTocOpen(false)} title="On this page">
        {doc && <TocList items={doc.toc} active={active} onNavigate={() => setTocOpen(false)} />}
      </Sheet>
    </PageShell>
  )
}

function LabPager({ prev, next }: { prev?: FlatLabTopic; next?: FlatLabTopic }) {
  const Card = ({ t, dir }: { t: FlatLabTopic; dir: 'prev' | 'next' }) => (
    <Link
      to={labTopicPath(t)}
      className={cn(
        'card-surface group flex flex-col rounded-2xl p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-5',
        dir === 'next' && 'items-end text-right',
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] text-subtle">
        {dir === 'prev' && <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />}
        {dir === 'prev' ? 'Previous lesson' : 'Next lesson'}
        {dir === 'next' && <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />}
      </span>
      <span className="mt-1.5 font-medium text-fg transition-colors group-hover:text-accent">{t.title}</span>
    </Link>
  )
  return (
    <nav aria-label="Previous and next lessons" className="mt-16 grid gap-3 sm:grid-cols-2">
      {prev ? <Card t={prev} dir="prev" /> : <span className="hidden sm:block" />}
      {next && <Card t={next} dir="next" />}
    </nav>
  )
}


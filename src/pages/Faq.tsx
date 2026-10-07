import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { Dices, Eye, EyeOff, Search, SearchX, X } from 'lucide-react'
import { faqCategories, type FaqCategoryId, type FaqItem } from '../data/faq'
import { loadFaq } from '../lib/content'
import { renderSnippet } from '../lib/markdown'
import { toast } from '../lib/toast'
import { appUrl, cn, copyText, pickRandom, prefersReducedMotion } from '../lib/utils'
import { PageShell } from '../components/layout/PageShell'
import { RevealCard } from '../components/faq/RevealCard'
import { MarkdownView } from '../components/notes/MarkdownView'
import { Highlight } from '../components/search/Highlight'
import { EmptyState, SectionLabel, Skeleton } from '../components/ui/misc'
import { Reveal } from '../components/ui/Reveal'
import { Accent } from '../components/home/SectionHeader'

const EASE = [0.22, 1, 0.36, 1] as const
type Cat = FaqCategoryId | 'all'

export default function Faq() {
  const [items, setItems] = useState<FaqItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [cat, setCat] = useState<Cat>('all')
  const [query, setQuery] = useState('')
  const dq = useDeferredValue(query.trim().toLowerCase())
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    document.title = 'Interview FAQ — Rapid_Reference'
    loadFaq()
      .then(setItems)
      .catch(() => setFailed(true))
  }, [])

  const html = useMemo(() => {
    const map = new Map<string, string>()
    items?.forEach((f) => map.set(f.id, renderSnippet(f.answer)))
    return map
  }, [items])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items?.length ?? 0 }
    items?.forEach((f) => (c[f.category] = (c[f.category] ?? 0) + 1))
    return c
  }, [items])

  const visible = useMemo(() => {
    if (!items) return []
    return items.filter(
      (f) => (cat === 'all' || f.category === cat) && (!dq || `${f.question} ${f.answer}`.toLowerCase().includes(dq)),
    )
  }, [items, cat, dq])

  const grouped = useMemo(
    () =>
      faqCategories
        .map((c) => ({ ...c, items: visible.filter((f) => f.category === c.id) }))
        .filter((g) => g.items.length > 0),
    [visible],
  )

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allRevealed = visible.length > 0 && visible.every((f) => open.has(f.id))
  const revealAll = () => setOpen(allRevealed ? new Set() : new Set(visible.map((f) => f.id)))

  const focusQuestion = useCallback((id: string, reveal = true) => {
    if (reveal) setOpen((prev) => new Set(prev).add(id))
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }, 120)
  }, [])

  // Deep link: /faq?q=<id>
  useEffect(() => {
    const q = params.get('q')
    if (!items || !q) return
    const target = items.find((f) => f.id === q)
    if (target) {
      setCat('all')
      setQuery('')
      focusQuestion(target.id)
    }
    const next = new URLSearchParams(params)
    next.delete('q')
    setParams(next, { replace: true })
  }, [items, params, setParams, focusQuestion])

  const quizMe = () => {
    const pool = visible.filter((f) => !open.has(f.id))
    const pick = pickRandom(pool.length ? pool : visible)
    if (!pick) return
    setOpen((prev) => {
      const next = new Set(prev)
      next.delete(pick.id)
      return next
    })
    focusQuestion(pick.id, false)
    toast('Quiz time', { description: 'Answer it in your head, then hit Reveal.', tone: 'info', duration: 2400 })
  }

  const copyLink = (id: string) => {
    copyText(appUrl(`/faq?q=${encodeURIComponent(id)}`)).then((ok) =>
      toast(ok ? 'Link copied' : 'Copy failed', { tone: ok ? 'success' : 'error', duration: 1600 }),
    )
  }

  const catMeta = Object.fromEntries(faqCategories.map((c) => [c.id, c]))

  return (
    <PageShell>
      <section className="relative overflow-hidden pb-8 pt-32 sm:pt-40">
        <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div
          className="absolute left-[15%] top-8 -z-10 h-72 w-72 rounded-full opacity-[0.15] blur-3xl"
          style={{ background: 'var(--accent-2)' }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-[920px] px-5 text-center sm:px-8">
          <Reveal>
            <SectionLabel>Interview FAQ</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-balance text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.045em] text-fg sm:text-6xl">
              Questions asked. <Accent>Answers revealed.</Accent>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {items ? `${items.length} commonly asked` : 'Commonly asked'} technical and HR interview questions. Say your answer out loud
              first — then reveal and compare.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[920px] px-5 sm:px-8">
        <div className="sticky top-[4.35rem] z-30 -mx-5 px-5 py-3 sm:top-[4.6rem] sm:-mx-8 sm:px-8">
          <div className="glass-strong rounded-2xl border border-line-strong p-2.5 shadow-[var(--shadow-soft)]">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions and answers…"
                  aria-label="Search FAQ"
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
                onClick={quizMe}
                title="Quiz me — jump to a random question"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-elev/70 px-3 text-[13px] font-medium text-fg transition-colors hover:border-line-strong"
              >
                <Dices size={15} /> <span className="hidden sm:inline">Quiz me</span>
              </button>
              <button
                onClick={revealAll}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-elev/70 px-3 text-[13px] font-medium text-fg transition-colors hover:border-line-strong"
              >
                {allRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                <span className="hidden sm:inline">{allRevealed ? 'Hide all' : 'Reveal all'}</span>
              </button>
            </div>
            <div className="-mx-2.5 mt-2.5 flex gap-1.5 overflow-x-auto px-2.5 pb-0.5 no-scrollbar sm:flex-wrap sm:overflow-visible" role="group" aria-label="FAQ categories">
              {[{ id: 'all' as const, title: 'All', hue: 'var(--accent)' }, ...faqCategories].map((c) => {
                const active = cat === c.id
                return (
                  <button
                    key={c.id}
                    aria-pressed={active}
                    onClick={() => setCat(c.id)}
                    className={cn(
                      'relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors',
                      active ? 'text-fg' : 'text-subtle hover:text-muted',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="faq-cat"
                        className="absolute inset-0 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--fg)_8%,var(--bg-elev))]"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: c.hue }} />
                    <span className="relative">{c.title}</span>
                    <span className="relative font-mono text-[10.5px] text-subtle">{counts[c.id] ?? 0}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 pb-10">
          {failed && <EmptyState icon={<X size={22} />} title="Couldn't load the FAQ" description="Check your connection and refresh." />}
          {!items && !failed && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          )}
          {items && visible.length === 0 && (
            <EmptyState
              icon={<SearchX size={22} />}
              title={`Nothing matches “${query}”`}
              description="Try another keyword or switch category."
              action={
                <button
                  onClick={() => {
                    setQuery('')
                    setCat('all')
                  }}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Reset filters
                </button>
              }
            />
          )}
          <div className="space-y-12">
            {grouped.map((g) => (
              <section key={g.id} aria-labelledby={`faq-${g.id}`}>
                {(cat === 'all' || dq) && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: g.hue }} />
                    <h2 id={`faq-${g.id}`} className="text-lg font-semibold tracking-[-0.02em] text-fg">
                      {g.title}
                    </h2>
                    <span className="h-px flex-1 bg-line" />
                    <span className="font-mono text-[11px] text-subtle">{g.items.length}</span>
                  </div>
                )}
                <div className="space-y-3">
                  {g.items.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '0px 0px -5% 0px' }}
                      transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.2), ease: EASE }}
                    >
                      <RevealCard
                        id={f.id}
                        number={`Q.${String(f.index + 1).padStart(2, '0')}`}
                        category={cat === 'all' || dq ? undefined : catMeta[f.category].title}
                        hue={catMeta[f.category].hue}
                        question={f.question}
                        highlightQuestion={dq ? <Highlight text={f.question.replace(/`/g, '')} query={dq} /> : undefined}
                        answer={<MarkdownView html={html.get(f.id) ?? ''} className="prose-faq" />}
                        open={open.has(f.id)}
                        onToggle={() => toggle(f.id)}
                        onCopyLink={() => copyLink(f.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

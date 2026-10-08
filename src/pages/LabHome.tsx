import { lazy, Suspense, useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Code2, MousePointerClick, Play, SlidersHorizontal, Sigma } from 'lucide-react'
import { trackById, type TrackId } from '../data/labs'
import { prefetchLab } from '../lib/content'
import { trackSpotlight } from '../hooks'
import { PageShell } from '../components/layout/PageShell'
import { ButtonLink } from '../components/ui/Button'
import { SectionLabel } from '../components/ui/misc'
import { Reveal } from '../components/ui/Reveal'
import { Accent } from '../components/home/SectionHeader'
import { TopicGlyph } from '../components/labs/TopicGlyph'

const HeroArt = {
  ai: lazy(() => import('../components/labs/AiHeroArt')),
  ml: lazy(() => import('../components/labs/MlHeroArt')),
}

const EASE = [0.22, 1, 0.36, 1] as const

const COPY: Record<TrackId, { lead: string; accent: string; label: string }> = {
  ai: { lead: 'Machines that', accent: 'reason.', label: 'Artificial Intelligence' },
  ml: { lead: 'Watch machines', accent: 'learn.', label: 'Machine Learning' },
}

const FEATURES = [
  { icon: Play, title: 'Play, pause, step', text: 'Every algorithm runs live. Slow it down, or step through it one line at a time.' },
  { icon: Code2, title: 'Code in sync', text: 'The Python line that is executing glows as the graph moves, with live variable values.' },
  { icon: SlidersHorizontal, title: 'Tweak and break it', text: 'Change the learning rate, k, noise or depth and watch the behaviour change instantly.' },
  { icon: Sigma, title: 'Notes with the math', text: 'Intuition first, then formulas, from-scratch code, scikit-learn and interview questions.' },
]

export default function LabHome({ trackId }: { trackId: TrackId }) {
  const track = trackById[trackId]
  const copy = COPY[trackId]
  const Art = HeroArt[trackId]
  const first = track.topics[0]

  useEffect(() => {
    document.title = `${track.title} (${track.label}) — Rapid_Reference`
    prefetchLab(trackId)
  }, [track, trackId])

  let n = 0
  return (
    <PageShell>
      <div style={{ '--lab-hue': track.hue } as CSSProperties}>
        {/* Hero */}
        <section className="relative isolate overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-40 lg:min-h-[min(92svh,880px)]" aria-labelledby="lab-title">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="bg-grid mask-radial absolute inset-0 opacity-60" />
            <div
              className="absolute -top-40 right-[-10%] h-[70vmax] w-[70vmax] rounded-full opacity-[0.13] blur-[110px]"
              style={{ background: `radial-gradient(circle, ${track.hue}, transparent 65%)` }}
            />
            <div
              className="absolute bottom-[-30%] left-[-10%] h-[50vmax] w-[50vmax] rounded-full opacity-[0.09] blur-[110px]"
              style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
            />
            <div className="absolute inset-0 lg:left-[38%]">
              <Suspense fallback={null}>
                <Art />
              </Suspense>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent lg:via-bg/40" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
          </div>

          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
                <SectionLabel>{copy.label}</SectionLabel>
              </motion.div>
              <motion.h1
                id="lab-title"
                initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
                className="mt-6 text-balance text-[3rem] font-semibold leading-[0.98] tracking-[-0.055em] text-fg sm:text-7xl lg:text-[5.6rem]"
              >
                {copy.lead} <Accent>{copy.accent}</Accent>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg"
              >
                {track.description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                className="mt-9 flex flex-col gap-3 sm:flex-row"
              >
                <ButtonLink to={`${track.path}/${first.slug}`} variant="primary" size="lg">
                  Start with lesson 01
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </ButtonLink>
                <a href="#curriculum" className="group/btn relative inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-6 text-[15px] font-medium text-fg transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border-strong))] sm:h-[52px] sm:px-7">
                  Browse curriculum
                </a>
              </motion.div>

              <motion.dl
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line"
              >
                {[
                  [String(track.topics.length), 'Lessons'],
                  [String(track.topics.length), 'Live labs'],
                  [String(track.modules.length), 'Modules'],
                ].map(([v, l]) => (
                  <div key={l} className="px-4 py-4 first:pl-0">
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-subtle">{l}</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-fg tabular">{v}</dd>
                  </div>
                ))}
              </motion.dl>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section id="curriculum" className="scroll-mt-24 py-16 sm:py-24" aria-labelledby="curriculum-title">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <Reveal>
              <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
                <div>
                  <SectionLabel>Curriculum</SectionLabel>
                  <h2 id="curriculum-title" className="mt-5 text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.04em] text-fg sm:text-5xl">
                    {track.topics.length} lessons, <Accent>each one alive.</Accent>
                  </h2>
                </div>
                <p className="max-w-sm text-pretty text-[15px] leading-relaxed text-muted">{track.tagline} Every lesson opens with an interactive lab, followed by concise notes.</p>
              </div>
            </Reveal>

            <div className="mt-4">
              {track.modules.map((m, mi) => {
                const topics = track.topics.filter((t) => t.module === m.id)
                return (
                  <div key={m.id} id={m.id} className="grid scroll-mt-28 gap-6 border-b border-line py-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
                    <Reveal>
                      <div className="lg:sticky lg:top-28">
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: track.hue }}>
                          Module {String(mi + 1).padStart(2, '0')}
                        </div>
                        <h3 className="mt-3 font-serif text-[2rem] italic leading-tight tracking-[-0.01em] text-fg">{m.title}</h3>
                        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{m.blurb}</p>
                      </div>
                    </Reveal>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {topics.map((t, i) => {
                        n++
                        const num = n
                        return (
                          <motion.li
                            key={t.slug}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                            transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                          >
                            <Link
                              to={`${track.path}/${t.slug}`}
                              onPointerMove={trackSpotlight}
                              className="spotlight card-surface group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)] sm:p-6"
                            >
                              <div
                                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-25"
                                style={{ background: track.hue }}
                                aria-hidden="true"
                              />
                              <div className="flex items-start justify-between gap-4">
                                <span
                                  className="grid h-11 w-11 place-items-center rounded-2xl border transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110"
                                  style={{
                                    color: track.hue,
                                    background: `color-mix(in oklab, ${track.hue} 12%, var(--bg-elev))`,
                                    borderColor: `color-mix(in oklab, ${track.hue} 28%, var(--border))`,
                                  }}
                                >
                                  <TopicGlyph topicKey={`${track.id}/${t.slug}`} size={19} />
                                </span>
                                <span className="font-mono text-[12px] text-subtle tabular">{String(num).padStart(2, '0')}</span>
                              </div>
                              <h4 className="mt-5 text-[1.05rem] font-semibold tracking-[-0.015em] text-fg transition-colors group-hover:text-accent">{t.title}</h4>
                              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{t.summary}</p>
                              <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5 text-[12px] text-subtle">
                                <span className="inline-flex items-center gap-1.5">
                                  <MousePointerClick size={13} /> Interactive lab
                                </span>
                                <ArrowUpRight size={15} className="transition-all duration-500 group-hover:rotate-45 group-hover:text-fg" />
                              </div>
                            </Link>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How labs work */}
        <section className="pb-8 pt-8 sm:pt-12" aria-label="How the labs work">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((ft, i) => (
                <Reveal key={ft.title} delay={i * 0.06} className="bg-bg">
                  <div className="h-full bg-elev/40 p-6 sm:p-7">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-soft text-accent">
                      <ft.icon size={18} />
                    </span>
                    <h3 className="mt-5 font-semibold tracking-[-0.01em] text-fg">{ft.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{ft.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}

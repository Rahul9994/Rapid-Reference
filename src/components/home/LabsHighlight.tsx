import { lazy, Suspense, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, MousePointerClick } from 'lucide-react'
import { labTracks } from '../../data/labs'
import { prefetchLab } from '../../lib/content'
import { trackSpotlight } from '../../hooks'
import { Reveal } from '../ui/Reveal'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Accent, SectionHeader } from './SectionHeader'

const ART = {
  ai: lazy(() => import('../labs/AiHeroArt')),
  ml: lazy(() => import('../labs/MlHeroArt')),
}

const PICKS: Record<string, string[]> = {
  ai: ['A* search', 'Minimax', 'Q-learning', 'Attention'],
  ml: ['Linear regression', 'K-means', 'Neural networks', 'CNNs'],
}

export function LabsHighlight() {
  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="labs-title">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeader
          label="Interactive labs"
          title={
            <span id="labs-title">
              Don&apos;t just read it. <Accent>Watch it run.</Accent>
            </span>
          }
          description="Two new tracks — A.I and M.L — where every lesson opens with a live visualization: real Python on one side, a moving graph on the other, the running line glowing as the algorithm learns."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {labTracks.map((t, i) => {
            const Art = ART[t.id]
            return (
              <Reveal key={t.id} delay={i * 0.08}>
                <Link
                  to={t.path}
                  onPointerMove={trackSpotlight}
                  onPointerEnter={() => prefetchLab(t.id)}
                  className="spotlight group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-line-strong bg-elev/60 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                  style={{ '--lab-hue': t.hue } as CSSProperties}
                >
                  <div className="relative h-[260px] overflow-hidden border-b border-line sm:h-[320px]" aria-hidden="true">
                    <div className="bg-grid absolute inset-0 opacity-50" />
                    <div className="absolute inset-0 opacity-90 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.03]">
                      <Suspense fallback={null}>
                        <Art />
                      </Suspense>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[color-mix(in_oklab,var(--bg-elev)_96%,transparent)]" />
                    <div
                      className="absolute -left-20 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
                      style={{ background: t.hue }}
                    />
                  </div>
                  <div className="relative flex flex-1 flex-col p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-12 w-12 place-items-center rounded-2xl border"
                          style={{ color: t.hue, background: `color-mix(in oklab, ${t.hue} 13%, var(--bg-elev))`, borderColor: `color-mix(in oklab, ${t.hue} 30%, var(--border))` }}
                        >
                          <CategoryIcon id={t.id} size={22} />
                        </span>
                        <div>
                          <div className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: t.hue }}>
                            {t.label}
                          </div>
                          <h3 className="text-2xl font-semibold tracking-[-0.03em] text-fg">{t.title}</h3>
                        </div>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-subtle transition-all duration-500 group-hover:rotate-45 group-hover:border-line-strong group-hover:text-fg">
                        <ArrowUpRight size={17} />
                      </span>
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">{t.description}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {PICKS[t.id].map((c) => (
                        <span key={c} className="rounded-full border border-line bg-soft/60 px-2.5 py-1 text-[12px] text-muted">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-line pt-4 font-mono text-[12px] text-subtle">
                      <span className="inline-flex items-center gap-1.5">
                        <MousePointerClick size={13} /> {t.topics.length} lessons · {t.topics.length} live labs
                      </span>
                      <span className="translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" style={{ color: t.hue }}>
                        Enter →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

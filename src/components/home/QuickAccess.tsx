import { Link } from 'react-router'
import { ArrowRight, Bookmark, History, Keyboard, Shuffle, Target } from 'lucide-react'
import { lookupTopic } from '../../data/catalog'
import { bookmarksStore, recentStore } from '../../lib/storage'
import { paletteOpen } from '../../lib/atom'
import { useRandomActions } from '../../lib/random'
import { trackSpotlight } from '../../hooks'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'
import { Kbd, ModKey } from '../ui/misc'
import { Accent, SectionHeader } from './SectionHeader'
import type { ReactNode } from 'react'

function Tile({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={className}>
      <div
        onPointerMove={trackSpotlight}
        className="spotlight card-surface relative flex h-full flex-col rounded-3xl p-6 transition-[border-color] duration-500 hover:border-line-strong"
      >
        {children}
      </div>
    </Reveal>
  )
}

export function QuickAccess() {
  const recent = recentStore.use()
  const bookmarks = bookmarksStore.use()
  const { randomTopic, randomProblem } = useRandomActions()
  const last = recent.map((r) => lookupTopic(r.key)).find(Boolean)
  const recentList = recent.map((r) => lookupTopic(r.key)).filter((t) => t !== undefined).slice(1, 4)
  const saved = bookmarks.map((k) => lookupTopic(k)).filter((t) => t !== undefined)
  const start = lookupTopic('python/basics')!

  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="quick-title">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeader
          label="Quick access"
          title={
            <span id="quick-title">
              Pick up <Accent>right where</Accent> you left off.
            </span>
          }
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Tile className="md:col-span-2">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-subtle">
              <History size={15} className="text-accent" /> {last ? 'Continue reading' : 'Start here'}
            </div>
            {(() => {
              const t = last ?? start
              return (
                <Link to={t.path} className="group mt-4 block">
                  <div className="text-[13px] text-muted">{t.groupTitle}</div>
                  <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-fg transition-colors group-hover:text-accent">
                    {t.title}
                  </div>
                  <p className="mt-2 text-sm text-muted">{t.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {last ? 'Resume' : 'Begin'} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })()}
            {recentList.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                {recentList.map((t) => (
                  <Link
                    key={t.key}
                    to={t.path}
                    className="rounded-full border border-line px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
          </Tile>

          <Tile delay={0.05}>
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-subtle">
              <Bookmark size={15} className="text-accent" /> Bookmarks
            </div>
            {saved.length ? (
              <ul className="mt-4 space-y-2">
                {saved.slice(0, 4).map((t) => (
                  <li key={t.key}>
                    <Link to={t.path} className="block truncate text-sm text-fg hover:text-accent">
                      {t.title}
                    </Link>
                  </li>
                ))}
                {saved.length > 4 && (
                  <li>
                    <Link to="/notes" className="text-[13px] text-subtle hover:text-fg">
                      +{saved.length - 4} more
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Tap the bookmark icon on any note to pin it here for fast revision.
              </p>
            )}
          </Tile>

          <Tile delay={0.1}>
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-subtle">
              <Keyboard size={15} className="text-accent" /> Shortcuts
            </div>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li className="flex items-center justify-between">
                Search
                <span className="flex gap-1">
                  <Kbd>
                    <ModKey />
                  </Kbd>
                  <Kbd>K</Kbd>
                </span>
              </li>
              <li className="flex items-center justify-between">
                Quick search <Kbd>/</Kbd>
              </li>
              <li className="flex items-center justify-between">
                Prev / next note
                <span className="flex gap-1">
                  <Kbd>[</Kbd>
                  <Kbd>]</Kbd>
                </span>
              </li>
              <li className="flex items-center justify-between">
                Close dialogs <Kbd>Esc</Kbd>
              </li>
            </ul>
            <button onClick={() => paletteOpen.set(true)} className="mt-auto pt-4 text-left text-[13px] font-medium text-accent hover:underline">
              Open command palette →
            </button>
          </Tile>

          <Tile className="lg:col-span-2" delay={0.05}>
            <div className="flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-[12.5px] font-medium text-subtle">
                  <Shuffle size={15} className="text-accent" /> Feeling lucky?
                </div>
                <p className="mt-2 max-w-sm text-sm text-muted">Revise a random note or attempt a random unsolved A2Z problem.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={randomTopic}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-soft"
                >
                  <Shuffle size={15} /> Random topic
                </button>
                <button
                  onClick={randomProblem}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-soft"
                >
                  <Target size={15} /> Random problem
                </button>
              </div>
            </div>
          </Tile>

          <Tile className="md:col-span-2" delay={0.1}>
            <div className="relative flex h-full flex-col justify-between gap-5 overflow-hidden sm:flex-row sm:items-center">
              <div>
                <p className="font-serif text-3xl italic leading-tight text-fg">Revise smarter,</p>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-gradient">starting now.</p>
              </div>
              <ButtonLink to="/notes" variant="primary" size="md" className="shrink-0">
                Explore Notes <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
              </ButtonLink>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  )
}

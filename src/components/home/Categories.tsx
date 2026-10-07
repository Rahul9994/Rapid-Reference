import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { noteCategories } from '../../data/notes'
import { prefetchNotes } from '../../lib/content'
import { trackSpotlight } from '../../hooks'
import { Reveal } from '../ui/Reveal'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Accent, SectionHeader } from './SectionHeader'
import type { CSSProperties } from 'react'

interface CardData {
  id: string
  title: string
  description: string
  hue: string
  to: string
  count: string
  chips: string[]
  onIntent?: () => void
}

const cards: CardData[] = [
  ...noteCategories.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    hue: c.hue,
    to: `/notes/${c.id}`,
    count: `${c.topics.length} topics`,
    chips: c.topics.slice(0, 4).map((t) => t.title.replace(/^OOP: /, '')),
    onIntent: () => prefetchNotes(c.id),
  })),
  {
    id: 'interview',
    title: 'Interview Preparation',
    description: 'Commonly asked technical and HR questions with crisp, revisable answers.',
    hue: '#f472b6',
    to: '/faq',
    count: '8 categories',
    chips: ['Python', 'OOP', 'DBMS', 'HR basics'],
  },
]

export function Categories() {
  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="cat-title">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <SectionHeader
          label="Knowledge categories"
          title={
            <span id="cat-title">
              Six tracks. <Accent>Zero fluff.</Accent>
            </span>
          }
          description="Pick a track and go deep — or jump straight to the topic you need with search."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 0.07}>
              <Link
                to={c.to}
                onPointerMove={trackSpotlight}
                onPointerEnter={c.onIntent}
                onFocus={c.onIntent}
                className="spotlight card-surface group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition-[transform,border-color,box-shadow] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-lift)]"
                style={{ '--hue': c.hue } as CSSProperties}
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30"
                  style={{ background: 'var(--hue)' }}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl border transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110"
                    style={{
                      color: 'var(--hue)',
                      background: 'color-mix(in oklab, var(--hue) 13%, var(--bg-elev))',
                      borderColor: 'color-mix(in oklab, var(--hue) 30%, var(--border))',
                    }}
                  >
                    <CategoryIcon id={c.id} size={22} />
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-subtle transition-all duration-500 group-hover:rotate-45 group-hover:border-line-strong group-hover:text-fg">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-fg">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.description}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.chips.map((chip) => (
                    <span key={chip} className="rounded-full border border-line bg-soft/60 px-2.5 py-1 text-[11.5px] text-muted">
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-[11.5px] text-subtle">
                  <span>{c.count}</span>
                  <span className="translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" style={{ color: 'var(--hue)' }}>
                    Open →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

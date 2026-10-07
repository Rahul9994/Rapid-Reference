import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { faqCategories } from '../../data/faq'
import { Reveal } from '../ui/Reveal'
import { ButtonLink } from '../ui/Button'
import { SectionLabel } from '../ui/misc'
import { RevealCard } from '../faq/RevealCard'
import { Accent } from './SectionHeader'
import { FAQ_COUNT } from './constants'

const samples = [
  {
    category: 'Python',
    hue: '#5b9dff',
    q: 'What is the difference between a list and a tuple in Python?',
    a: 'Lists are mutable (you can add, remove or change items); tuples are immutable. Because tuples cannot change they are hashable when their items are hashable, so they can be dict keys or set members, and they are slightly lighter in memory. Use a list for a changing collection and a tuple for a fixed record such as (x, y).',
  },
  {
    category: 'Operating Systems',
    hue: '#34d399',
    q: 'What is the difference between a process and a thread?',
    a: 'A process is an independent program in execution with its own address space and resources. A thread is a unit of execution inside a process; threads of the same process share code, data and open files but each has its own stack, registers and program counter. Threads are cheaper to create and switch, but a bug in one thread can corrupt shared state for all of them.',
  },
  {
    category: 'DBMS',
    hue: '#fbbf24',
    q: 'What is the difference between DELETE, TRUNCATE and DROP?',
    a: 'DELETE is DML: it removes selected rows (WHERE allowed), is logged row by row and can be rolled back. TRUNCATE removes all rows quickly by deallocating pages and keeps the table structure. DROP removes the table itself — data, structure, indexes and constraints. Whether TRUNCATE can be rolled back depends on the database.',
  },
]

export function FaqHighlight() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="relative py-24 sm:py-32" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="order-2 space-y-3 lg:order-1">
          {samples.map((s, i) => (
            <Reveal key={s.q} delay={i * 0.08}>
              <RevealCard
                number={`Q.${String(i + 1).padStart(2, '0')}`}
                category={s.category}
                hue={s.hue}
                question={s.q}
                answer={<p className="text-[15px] leading-relaxed text-muted">{s.a}</p>}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
        <div className="order-1 lg:order-2">
          <Reveal>
            <SectionLabel>Interview FAQ</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="faq-title" className="mt-5 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-fg sm:text-5xl">
              Think first. <Accent>Then reveal.</Accent>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {FAQ_COUNT}+ frequently asked interview questions with answers hidden until you&apos;re ready — active recall, the way
              revision should work.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-7 flex flex-wrap gap-2">
              {faqCategories.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elev/60 px-3 py-1.5 text-[12.5px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.hue }} />
                  {c.title}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <ButtonLink to="/faq" variant="primary" size="lg" className="mt-9">
              Practice FAQ <ArrowRight size={17} className="transition-transform group-hover/btn:translate-x-1" />
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

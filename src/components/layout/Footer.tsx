import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { site } from '../../data/site'
import { noteCategories } from '../../data/notes'
import { paletteOpen } from '../../lib/atom'
import { GithubIcon } from '../ui/Icons'
import { Logo } from '../ui/Logo'
import { Kbd, ModKey } from '../ui/misc'

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Notes', to: '/notes' },
      { label: 'A.I', to: '/ai' },
      { label: 'M.L', to: '/ml' },
      { label: 'DSA Sheet', to: '/dsa-sheet' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Notes',
    links: noteCategories.map((c) => ({ label: c.short === 'DSA' ? 'DSA (Python)' : c.title.replace('Database Management Systems', 'DBMS'), to: `/notes/${c.id}` })),
  },
  {
    title: 'Project',
    links: [
      { label: 'About', to: '/about' },
      { label: 'GitHub', href: site.github },
      { label: "Striver's A2Z Sheet", href: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-72 w-[60%] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: 'var(--accent)' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 font-serif text-3xl italic leading-tight text-fg sm:text-4xl">
              Learn faster.
              <br />
              <span className="text-gradient">Revise smarter.</span>
            </p>
            <button
              onClick={() => paletteOpen.set(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Press
              <Kbd>
                <ModKey />
              </Kbd>
              <Kbd>K</Kbd>
              to search everything
            </button>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {'to' in l ? (
                        <Link to={l.to} className="text-sm text-muted transition-colors hover:text-fg">
                          {l.label}
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
                        >
                          {l.label === 'GitHub' && <GithubIcon size={14} />}
                          {l.label}
                          <ArrowUpRight size={13} className="opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none mt-16 select-none text-center font-semibold leading-none tracking-[-0.06em] text-transparent"
          style={{
            fontSize: 'clamp(3rem, 13.5vw, 13rem)',
            WebkitTextStroke: '1px color-mix(in oklab, var(--fg) 14%, transparent)',
            maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
          }}
          aria-hidden="true"
        >
          Rapid_Reference
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[13px] text-subtle sm:flex-row">
          <p>© {site.year} Rapid_Reference</p>
          <p>
            DSA sheet data ©{' '}
            <a href="https://takeuforward.org" target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-fg">
              takeUforward
            </a>{' '}
            · Notes &amp; FAQ are original content.
          </p>
        </div>
      </div>
    </footer>
  )
}

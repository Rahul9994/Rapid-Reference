import { useEffect, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, BrainCircuit, Database, Keyboard, ListChecks, Lock, Sparkles } from 'lucide-react'
import { site } from '../data/site'
import { totalAllTopics } from '../data/catalog'
import { totalLabTopics } from '../data/labs'
import sheetMeta from '../data/a2z-meta.json'
import { PageShell } from '../components/layout/PageShell'
import { Kbd, ModKey, SectionLabel } from '../components/ui/misc'
import { Reveal } from '../components/ui/Reveal'
import { Accent } from '../components/home/SectionHeader'
import { GithubIcon } from '../components/ui/Icons'

function Block({ icon, title, children, delay = 0 }: { icon: ReactNode; title: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <section className="card-surface rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-soft text-accent">{icon}</span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-fg">{title}</h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
      </section>
    </Reveal>
  )
}

const ext = 'text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-4 hover:decoration-accent'

export default function About() {
  useEffect(() => {
    document.title = 'About — Rapid_Reference'
  }, [])

  return (
    <PageShell>
      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
        <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="mx-auto max-w-[860px] px-5 sm:px-8">
          <Reveal>
            <SectionLabel>About</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.045em] text-fg sm:text-6xl">
              Built for the night <Accent>before the interview.</Accent>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {site.name} is a fast, keyboard-first revision companion: {totalAllTopics} topics of concise notes (including {totalLabTopics}{' '}
              interactive A.I and M.L lessons), the complete Striver&apos;s A2Z DSA sheet with progress tracking, and a bank of interview
              questions you can quiz yourself on.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto grid max-w-[860px] gap-4 px-5 pb-10 sm:px-8">
        <Block icon={<BookOpen size={18} />} title="Notes & FAQ — original content">
          <p>
            All notes and FAQ answers were written for this site as concise revision material. Python syntax and behaviour follow the
            official{' '}
            <a className={ext} href="https://docs.python.org/3/" target="_blank" rel="noopener noreferrer">
              Python documentation
            </a>
            ; OS, DBMS and networking explanations follow standard textbook definitions. When in doubt, the official docs and
            standards are the source of truth.
          </p>
        </Block>

        <Block icon={<BrainCircuit size={18} />} title="A.I & M.L labs — original simulations" delay={0.03}>
          <p>
            Every A.I and M.L lesson opens with a visualization that actually runs the algorithm in your browser — gradient descent,
            k-means, A*, minimax, Q-learning and more — while the matching Python is highlighted line by line. The Python shown is real,
            runnable code; the browser simulation mirrors it step for step.
          </p>
          <p>
            Datasets are small and generated for clarity (the iris example uses Fisher&apos;s public-domain Iris data). The word-embedding
            and attention labs use hand-made toy vectors to illustrate the idea — they are labelled as such and are not outputs of a
            trained model. Formulas follow standard references such as Russell &amp; Norvig&apos;s <em>Artificial Intelligence: A Modern
            Approach</em> and the scikit-learn documentation.
          </p>
        </Block>

        <Block icon={<ListChecks size={18} />} title="DSA Sheet — externally sourced" delay={0.05}>
          <p>
            The DSA SHEET page lists{' '}
            <a className={ext} href={sheetMeta.source} target="_blank" rel="noopener noreferrer">
              {sheetMeta.name}
            </a>{' '}
            by {sheetMeta.author}. Only problem <strong className="text-fg">titles, order, section structure, difficulty and links</strong>{' '}
            are used — no problem statements or solutions are copied. Every row links back to takeUforward.
          </p>
          <p>
            Snapshot: {sheetMeta.total} items ({sheetMeta.practice} practice problems, {sheetMeta.lessons} lessons) in {sheetMeta.sections}{' '}
            sections, synced on {sheetMeta.fetchedAt}. Difficulty labels use takeUforward&apos;s own mapping (basic → Easy, core → Medium,
            pro → Hard). Platform contests are not included. Developers can refresh the snapshot with{' '}
            <code className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-[13px] text-fg">npm run sheet:update</code>.
          </p>
        </Block>

        <Block icon={<Lock size={18} />} title="Privacy" delay={0.05}>
          <p>
            No accounts, no analytics, no server. Your theme, DSA progress, bookmarks and recently viewed topics are stored only in this
            browser&apos;s localStorage. Use Export / Import on the DSA SHEET page to move progress between devices.
          </p>
        </Block>

        <Block icon={<Keyboard size={18} />} title="Keyboard shortcuts" delay={0.05}>
          <ul className="divide-y divide-line">
            {[
              [<><Kbd><ModKey /></Kbd> <Kbd>K</Kbd></>, 'Open search / command palette'],
              [<Kbd>/</Kbd>, 'Quick search'],
              [<><Kbd>↑</Kbd> <Kbd>↓</Kbd> <Kbd>↵</Kbd></>, 'Navigate and open search results'],
              [<Kbd>Tab</Kbd>, 'Switch search scope (inside the palette)'],
              [<><Kbd>[</Kbd> <Kbd>]</Kbd></>, 'Previous / next note'],
              [<Kbd>Esc</Kbd>, 'Close dialogs, menus and drawers'],
            ].map(([keys, label], i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2.5">
                <span>{label}</span>
                <span className="flex shrink-0 items-center gap-1">{keys}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block icon={<Sparkles size={18} />} title="Under the hood" delay={0.05}>
          <p>
            React + TypeScript on Vite, Tailwind CSS v4 with theme tokens, Motion for animation, Lucide icons, marked + highlight.js for
            notes. Routes and content are code-split and lazy-loaded; animations use GPU-friendly transforms and respect your
            reduced-motion setting.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-soft"
            >
              <GithubIcon size={16} /> GitHub <ArrowUpRight size={14} />
            </a>
            <a
              href="https://takeuforward.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:bg-soft"
            >
              <Database size={16} /> takeUforward <ArrowUpRight size={14} />
            </a>
          </div>
        </Block>
      </div>
    </PageShell>
  )
}

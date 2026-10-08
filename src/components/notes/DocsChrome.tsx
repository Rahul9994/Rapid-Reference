import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { ArrowLeft, ArrowRight, ChevronRight, X } from 'lucide-react'
import type { FlatTopic } from '../../data/notes'
import { useBodyScrollLock, useFocusTrap } from '../../hooks'
import { cn } from '../../lib/utils'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 })
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[2.5px] origin-left"
      style={{ scaleX, background: 'linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3))' }}
      aria-hidden="true"
    />
  )
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[13px] text-subtle">
        {items.map((it, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight size={13} className="shrink-0 opacity-60" aria-hidden="true" />}
            {it.to ? (
              <Link to={it.to} className="truncate transition-colors hover:text-fg">
                {it.label}
              </Link>
            ) : (
              <span className="truncate text-muted" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  desktop = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Also usable on large screens (notes hide it there because the sidebar is visible). */
  desktop?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(ref, open)
  return (
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[70]', !desktop && 'lg:hidden')} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) onClose()
            }}
            className="glass-strong absolute inset-y-0 left-0 flex w-[86vw] max-w-[360px] flex-col border-r border-line-strong px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-lift)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">{title}</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-fg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(ref, open)
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose()
            }}
            className="glass-strong absolute inset-x-0 bottom-0 mx-auto flex max-h-[75dvh] max-w-2xl flex-col rounded-t-[28px] border border-b-0 border-line-strong px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[color-mix(in_oklab,var(--fg)_20%,transparent)]" aria-hidden="true" />
            <div className="mb-3 text-sm font-semibold text-fg">{title}</div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function TopicPager({ prev, next }: { prev?: FlatTopic; next?: FlatTopic }) {
  const Card = ({ t, dir }: { t: FlatTopic; dir: 'prev' | 'next' }) => (
    <Link
      to={`/notes/${t.category.id}/${t.slug}`}
      className={cn(
        'card-surface group flex flex-col rounded-2xl p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong sm:p-5',
        dir === 'next' && 'items-end text-right',
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] text-subtle">
        {dir === 'prev' && <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />}
        {dir === 'prev' ? 'Previous' : 'Next'} · {t.category.short}
        {dir === 'next' && <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />}
      </span>
      <span className="mt-1.5 font-medium text-fg transition-colors group-hover:text-accent">{t.title}</span>
    </Link>
  )
  return (
    <nav aria-label="Previous and next topics" className="mt-16 grid gap-3 sm:grid-cols-2">
      {prev ? <Card t={prev} dir="prev" /> : <span className="hidden sm:block" />}
      {next && <Card t={next} dir="next" />}
    </nav>
  )
}

export function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading note" className="space-y-4">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-10 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="pt-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 pt-4">
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-11/12" />
          <div className="skeleton h-3.5 w-4/5" />
          <div className="skeleton h-32 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

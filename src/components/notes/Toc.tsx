import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUp, TextQuote } from 'lucide-react'
import type { TocItem } from '../../lib/markdown'
import { cn, prefersReducedMotion, scrollToHeading } from '../../lib/utils'

/** Track which heading is currently at the top of the viewport. */
export function useActiveHeading(items: TocItem[]): string | null {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null)
  useEffect(() => {
    if (items.length === 0) return
    let frame = 0
    const compute = () => {
      frame = 0
      let current: string | null = items[0].id
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (!el || el.offsetParent === null) continue
        if (el.getBoundingClientRect().top < 150) current = it.id
        else break
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = items[items.length - 1].id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [items])
  return active
}

export function TocList({ items, active, onNavigate }: { items: TocItem[]; active: string | null; onNavigate?: () => void }) {
  return (
    <ul className="relative space-y-0.5 border-l border-line">
      {items.map((it) => {
        const isActive = it.id === active
        return (
          <li key={it.id} className="relative">
            {isActive && (
              <motion.span
                layoutId="toc-indicator"
                className="absolute -left-px top-1 bottom-1 w-[2px] rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault()
                if (scrollToHeading(it.id)) history.replaceState(history.state, '', `#${it.id}`)
                onNavigate?.()
              }}
              className={cn(
                'block py-1 pr-2 text-[13px] leading-snug transition-colors duration-200',
                it.depth === 3 ? 'pl-7 text-[12.5px]' : 'pl-4',
                isActive ? 'font-medium text-fg' : 'text-subtle hover:text-muted',
              )}
            >
              {it.text}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function Toc({ items, readingTime }: { items: TocItem[]; readingTime?: number }) {
  const active = useActiveHeading(items)
  if (items.length === 0) return null
  return (
    <nav aria-label="On this page" className="text-sm">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
        <TextQuote size={13} /> On this page
      </div>
      <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto overscroll-contain pr-1 no-scrollbar">
        <TocList items={items} active={active} />
      </div>
      <div className="mt-5 space-y-2 border-t border-line pt-4 text-[12.5px] text-subtle">
        {readingTime && <div>{readingTime} min read</div>}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
        >
          <ArrowUp size={13} /> Back to top
        </button>
      </div>
    </nav>
  )
}

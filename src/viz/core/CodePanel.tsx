import { memo, useEffect, useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { hljs } from '../../lib/highlight'
import { cn } from '../../lib/utils'

export interface WatchVar {
  name: string
  value: string
  /** Optional colour token for the value, e.g. 'var(--accent-2)'. */
  color?: string
}

const LINE_H = 22
const PAD_Y = 12

const highlightLines = (code: string) =>
  code.split('\n').map((line) => (line ? hljs.highlight(line, { language: 'python', ignoreIllegals: true }).value : '&nbsp;'))

/**
 * Python source with a gliding "program counter" over the running line(s)
 * and a watch panel of live variables underneath.
 */
export const CodePanel = memo(function CodePanel({
  code,
  file,
  active,
  vars,
  className,
}: {
  code: string
  file: string
  active?: number | number[]
  vars?: WatchVar[]
  className?: string
}) {
  const lines = useMemo(() => highlightLines(code), [code])
  const scrollRef = useRef<HTMLDivElement>(null)
  const list = active === undefined ? [] : Array.isArray(active) ? active : [active]
  const lo = list.length ? Math.min(...list) : 0
  const hi = list.length ? Math.max(...list) : 0
  const top = PAD_Y + (lo - 1) * LINE_H
  const height = (hi - lo + 1) * LINE_H

  // Keep the running line visible without scrolling the page itself.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !lo) return
    if (el.scrollHeight <= el.clientHeight + 1) return
    const viewTop = el.scrollTop
    const viewBottom = viewTop + el.clientHeight
    if (top < viewTop + 24 || top + height > viewBottom - 24) {
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 3), behavior: 'smooth' })
    }
  }, [top, height, lo])

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--fg)_14%,transparent)]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--fg)_14%,transparent)]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--fg)_14%,transparent)]" />
        </span>
        <span className="ml-1 font-mono text-[11.5px] text-muted">{file}</span>
        <span className="ml-auto rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-subtle">
          python
        </span>
      </div>

      <div
        ref={scrollRef}
        className="relative max-h-[300px] min-h-0 flex-1 overflow-auto overscroll-contain lg:max-h-none"
        tabIndex={0}
        aria-label={`${file} source code`}
      >
        <div className="relative min-w-max" style={{ paddingTop: PAD_Y, paddingBottom: PAD_Y }}>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 border-y border-[color-mix(in_oklab,var(--accent)_28%,transparent)] bg-[color-mix(in_oklab,var(--accent)_13%,transparent)]"
            initial={false}
            animate={{ top, height, opacity: lo ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
          >
            <span className="absolute inset-y-0 left-0 w-[3px] bg-accent shadow-[0_0_14px_var(--accent)]" />
          </motion.div>
          <pre className="relative m-0 font-mono text-[12.5px]">
            {lines.map((html, i) => {
              const n = i + 1
              const on = n >= lo && n <= hi && lo > 0
              return (
                <div key={i} className="flex" style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}>
                  <span
                    className={cn(
                      'w-10 shrink-0 select-none pr-3 text-right tabular transition-colors duration-200',
                      on ? 'text-accent' : 'text-[color-mix(in_oklab,var(--fg)_26%,transparent)]',
                    )}
                    aria-hidden="true"
                  >
                    {n}
                  </span>
                  <code
                    className={cn('hljs whitespace-pre pr-6 transition-opacity duration-300', lo && !on ? 'opacity-[0.62]' : 'opacity-100')}
                    style={{ background: 'transparent', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              )
            })}
          </pre>
        </div>
      </div>

      {vars && vars.length > 0 && (
        <div className="border-t border-line px-3 py-3">
          <div className="mb-2 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
            <span className="h-1 w-1 rounded-full bg-accent" /> Watch
          </div>
          <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {vars.map((v) => (
              <div key={v.name} className="min-w-0 rounded-lg border border-line bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)] px-2.5 py-1.5">
                <dt className="truncate font-mono text-[10.5px] text-subtle">{v.name}</dt>
                <dd className="truncate font-mono text-[12.5px] font-medium tabular" style={{ color: v.color ?? 'var(--fg)' }}>
                  {v.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
})

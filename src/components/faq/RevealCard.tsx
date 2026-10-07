import { useId, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, Link2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

/** Render `inline code` spans in plain question text. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded-md border border-line bg-soft px-1.5 py-0.5 font-mono text-[0.85em] text-fg">
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function RevealCard({
  id,
  number,
  category,
  hue,
  question,
  answer,
  open,
  onToggle,
  onCopyLink,
  highlightQuestion,
  className,
}: {
  id?: string
  number: string
  category?: string
  hue?: string
  question: string
  answer: ReactNode
  open: boolean
  onToggle: () => void
  onCopyLink?: () => void
  highlightQuestion?: ReactNode
  className?: string
}) {
  const uid = useId()
  const regionId = `ans-${uid}`
  const headingId = `q-${uid}`

  return (
    <article
      id={id}
      className={cn(
        'card-surface group/card relative scroll-mt-28 overflow-hidden rounded-2xl transition-[border-color,box-shadow,transform] duration-500 ease-[var(--ease-out-quint)]',
        open ? 'border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] shadow-[var(--shadow-glow)]' : 'hover:border-line-strong',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), var(--accent-2), transparent)' }}
        aria-hidden="true"
      />
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span
            className={cn(
              'mt-0.5 shrink-0 rounded-lg border px-2 py-1 font-mono text-[11px] tabular transition-colors duration-300',
              open ? 'border-accent/40 bg-accent/12 text-accent' : 'border-line bg-soft/60 text-subtle',
            )}
          >
            {number}
          </span>
          <div className="min-w-0 flex-1">
            {category && (
              <span className="mb-1.5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-subtle">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hue ?? 'var(--accent)' }} aria-hidden="true" />
                {category}
              </span>
            )}
            <h3 id={headingId} className="text-pretty text-[15.5px] font-medium leading-snug text-fg sm:text-[17px]">
              {highlightQuestion ?? <InlineCode text={question} />}
            </h3>
          </div>
          {onCopyLink && (
            <button
              onClick={onCopyLink}
              aria-label="Copy link to this question"
              title="Copy link"
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition-[opacity,color,background-color] hover:bg-soft hover:text-fg focus-visible:opacity-100 group-hover/card:opacity-100 sm:grid"
            >
              <Link2 size={15} />
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={regionId}
              role="region"
              aria-labelledby={headingId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.45, ease: EASE }, opacity: { duration: 0.3, delay: 0.08 } } }}
              exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.35, ease: EASE }, opacity: { duration: 0.15 } } }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: 8, filter: 'blur(4px)' }}
                animate={{ y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.45, ease: EASE }}
                className="mt-4 border-t border-dashed border-line pt-4 sm:ml-[3.25rem]"
              >
                {answer}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex sm:ml-[3.25rem]">
          <button
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={regionId}
            className={cn(
              'group/rv relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-full border px-4 text-[13px] font-medium transition-[background-color,border-color,color,transform] duration-300 active:scale-95',
              open
                ? 'border-line bg-soft text-muted hover:text-fg'
                : 'border-accent/35 bg-accent/10 text-accent hover:bg-accent/18',
            )}
          >
            <span className="relative grid h-4 w-4 place-items-center">
              <motion.span
                key={open ? 'off' : 'on'}
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute"
              >
                {open ? <EyeOff size={15} /> : <Eye size={15} />}
              </motion.span>
            </span>
            <span className="relative block h-5 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={open ? 'hide' : 'reveal'}
                  className="block leading-5"
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -18, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  {open ? 'Hide Answer' : 'Reveal Answer'}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}

import { useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import { useDismiss } from '../../hooks'
import { cn } from '../../lib/utils'

export interface Option<T extends string> {
  value: T
  label: string
  hint?: string
}

/** Accessible custom dropdown (listbox) with keyboard support. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  icon,
  className,
  align = 'left',
}: {
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  label: string
  icon?: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  useDismiss(ref, open, () => setOpen(false))
  const current = options.find((o) => o.value === value)

  const openList = () => {
    setFocus(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
    requestAnimationFrame(() => listRef.current?.focus())
  }

  const onListKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocus((f) => Math.min(options.length - 1, f + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocus((f) => Math.max(0, f - 1))
    } else if (e.key === 'Home') {
      setFocus(0)
    } else if (e.key === 'End') {
      setFocus(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(options[focus].value)
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? ''}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            openList()
          }
        }}
        className={cn(
          'inline-flex h-10 w-full items-center gap-2 rounded-xl border border-line bg-elev/70 px-3 text-left text-[13px] text-fg transition-colors hover:border-line-strong',
          open && 'border-accent/50',
        )}
      >
        {icon && <span className="text-subtle">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">
          <span className="text-subtle">{label}: </span>
          {current?.label}
        </span>
        <ChevronDown size={14} className={cn('shrink-0 text-subtle transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={id}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-${focus}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className={cn(
              'glass-strong absolute top-[calc(100%+6px)] z-50 max-h-[min(360px,60dvh)] min-w-full overflow-y-auto rounded-2xl border border-line-strong p-1.5 shadow-[var(--shadow-lift)] outline-none sm:min-w-[240px]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {options.map((o, i) => {
              const selected = o.value === value
              return (
                <li
                  key={o.value}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setFocus(i)}
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                    i === focus ? 'bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] text-fg' : 'text-muted',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="font-mono text-[11px] text-subtle">{o.hint}</span>}
                  <Check size={14} className={cn('shrink-0 text-accent', !selected && 'invisible')} />
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  layoutId,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  label: string
  layoutId: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex h-10 items-center rounded-xl border border-line bg-elev/70 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-[12.5px] font-medium transition-colors',
              active ? 'text-fg' : 'text-subtle hover:text-muted',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg border border-line-strong bg-[color-mix(in_oklab,var(--fg)_8%,var(--bg-elev))] shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

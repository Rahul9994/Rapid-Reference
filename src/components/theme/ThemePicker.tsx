import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Dices, Monitor, Palette } from 'lucide-react'
import { themes, type ThemeChoice } from '../../data/themes'
import { resolveTheme, setTheme, themeStore } from '../../lib/theme'
import { cn, pickRandom } from '../../lib/utils'
import { useDismiss, useMediaQuery } from '../../hooks'
import { toast } from '../../lib/toast'

function ThemePreview({ id }: { id: string }) {
  return (
    <div
      data-theme={id}
      className="relative h-[68px] overflow-hidden rounded-xl border border-line"
      style={{ background: 'var(--bg)' }}
      aria-hidden="true"
    >
      <div
        className="absolute -right-4 -top-6 h-16 w-16 rounded-full opacity-60 blur-xl"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <div
        className="absolute bottom-2 left-2 right-6 top-2.5 rounded-lg border border-line p-2"
        style={{ background: 'var(--bg-elev)' }}
      >
        <div className="h-1.5 w-10 rounded-full" style={{ background: 'var(--fg)' }} />
        <div className="mt-1.5 h-1 w-14 rounded-full opacity-60" style={{ background: 'var(--fg-muted)' }} />
        <div className="mt-2 flex gap-1">
          <div className="h-2.5 w-7 rounded-full" style={{ background: 'var(--accent)' }} />
          <div className="h-2.5 w-4 rounded-full" style={{ background: 'var(--accent-2)' }} />
          <div className="h-2.5 w-3 rounded-full" style={{ background: 'var(--accent-3)' }} />
        </div>
      </div>
    </div>
  )
}

function ThemeGrid({ onPicked }: { onPicked?: () => void }) {
  const choice = themeStore.use()
  const active = choice === 'system' ? null : choice
  const gridRef = useRef<HTMLDivElement>(null)

  const pick = (id: ThemeChoice, e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const origin = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setTheme(id, origin)
    onPicked?.()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>('button[data-theme-option]') ?? [])
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const cols = 2
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key]
    if (delta === undefined) return
    e.preventDefault()
    buttons[(i + delta + buttons.length) % buttons.length]?.focus()
  }

  return (
    <div ref={gridRef} onKeyDown={onKeyDown} className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Themes">
      {themes.map((t) => {
        const selected = active === t.id
        return (
          <button
            key={t.id}
            data-theme-option
            role="radio"
            aria-checked={selected}
            onClick={(e) => pick(t.id, e)}
            className={cn(
              'group/theme rounded-2xl border p-1.5 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5',
              selected ? 'border-accent/70 bg-accent/8' : 'border-line hover:border-line-strong hover:bg-soft/60',
            )}
          >
            <ThemePreview id={t.id} />
            <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-fg">{t.name}</div>
                <div className="truncate text-[11px] text-subtle">{t.blurb}</div>
              </div>
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full transition-all duration-300',
                  selected ? 'scale-100 bg-accent text-on-accent' : 'scale-75 opacity-0',
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function PanelHeader() {
  const choice = themeStore.use()
  const random = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const current = resolveTheme(choice)
    const next = pickRandom(themes.filter((t) => t.id !== current))
    if (next) {
      setTheme(next.id, { x: e.clientX, y: e.clientY })
      toast(`Theme: ${next.name}`, { description: next.blurb, tone: 'info', duration: 1800 })
    }
  }
  return (
    <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
      <div>
        <div className="text-sm font-semibold text-fg">Theme</div>
        <div className="text-[12px] text-subtle">Saved on this device</div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => setTheme('system', { x: e.clientX, y: e.clientY })}
          aria-pressed={choice === 'system'}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors',
            choice === 'system' ? 'border-accent/60 bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg',
          )}
        >
          <Monitor size={13} /> System
        </button>
        <button
          onClick={random}
          aria-label="Random theme"
          title="Random theme"
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted transition-[color,transform] duration-300 hover:rotate-90 hover:text-fg"
        >
          <Dices size={14} />
        </button>
      </div>
    </div>
  )
}

export function ThemePicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 639px)')
  useDismiss(ref, open && !isMobile, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose theme"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-[color,border-color,background-color,transform] duration-300 hover:border-line-strong hover:text-fg active:scale-95',
          open && 'border-line-strong bg-soft text-fg',
        )}
      >
        <Palette size={16} />
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--bg)]"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && !isMobile && (
          <motion.div
            role="dialog"
            aria-label="Theme picker"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ transformOrigin: 'top right' }}
            className="glass-strong absolute right-0 top-[calc(100%+12px)] z-50 w-[380px] max-h-[min(640px,calc(100dvh-110px))] overflow-y-auto rounded-3xl border border-line-strong p-3.5 shadow-[var(--shadow-lift)]"
          >
            <PanelHeader />
            <ThemeGrid />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && isMobile && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="Theme picker"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 500) setOpen(false)
              }}
              className="glass-strong fixed inset-x-0 bottom-0 z-[81] max-h-[82dvh] overflow-y-auto rounded-t-[28px] border-t border-line-strong px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[color-mix(in_oklab,var(--fg)_20%,transparent)]" aria-hidden="true" />
              <PanelHeader />
              <ThemeGrid />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { dismissToast, useToasts } from '../../lib/toast'
import { cn } from '../../lib/utils'

export function Toaster() {
  const toasts = useToasts()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line-strong p-3.5 pr-2.5 shadow-[var(--shadow-lift)]"
          >
            <span
              className={cn(
                'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full',
                t.tone === 'success' && 'bg-easy/15 text-easy',
                t.tone === 'error' && 'bg-hard/15 text-hard',
                (t.tone === 'info' || t.tone === 'default') && 'bg-accent/15 text-accent',
              )}
            >
              {t.tone === 'success' ? <CircleCheck size={15} /> : t.tone === 'error' ? <CircleAlert size={15} /> : <Info size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{t.message}</p>
              {t.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.description}</p>}
            </div>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick()
                  dismissToast(t.id)
                }}
                className="shrink-0 rounded-lg bg-accent/12 px-2.5 py-1 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-soft hover:text-fg"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

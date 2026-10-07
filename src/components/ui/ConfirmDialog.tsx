import { useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useBodyScrollLock, useFocusTrap } from '../../hooks'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  icon,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'default'
  icon?: ReactNode
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)
  useFocusTrap(ref, open)
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[160] grid place-items-center p-4" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="glass-strong relative w-full max-w-sm rounded-3xl border border-line-strong p-6 shadow-[var(--shadow-lift)]"
          >
            {icon && (
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl ${tone === 'danger' ? 'bg-hard/12 text-hard' : 'bg-accent/12 text-accent'}`}>
                {icon}
              </div>
            )}
            <h2 id="confirm-title" className="text-lg font-semibold text-fg">
              {title}
            </h2>
            <p id="confirm-desc" className="mt-1.5 text-sm leading-relaxed text-muted">
              {description}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={onClose} autoFocus>
                Cancel
              </Button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={`inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform active:scale-95 ${
                  tone === 'danger' ? 'bg-hard text-white' : 'bg-accent text-on-accent'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

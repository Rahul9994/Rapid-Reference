import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { bootDone } from '../../lib/atom'
import { LogoMark } from '../ui/Logo'

const EASE = [0.22, 1, 0.36, 1] as const
const LINES = ['loading notes — python, dsa, os, dbms, cn', "syncing striver's a2z sheet", 'warming up command palette', 'ready.']
const NAME = 'Rapid_Reference'

/** First-visit boot sequence (home page only, once per session, skipped for reduced motion). */
export function BootScreen({ onFinished }: { onFinished: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setVisible(false)
      bootDone.set(true)
    }, 1650)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AnimatePresence onExitComplete={onFinished}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] grid place-items-center bg-bg"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
          aria-hidden="true"
        >
          <div className="bg-grid mask-radial absolute inset-0 opacity-60" />
          <div
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
          />
          <motion.div
            className="relative flex flex-col items-center px-6"
            exit={{ y: -40, opacity: 0, transition: { duration: 0.5, ease: EASE } }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <LogoMark className="h-16 w-16 drop-shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_45%,transparent)]" animated />
            </motion.div>
            <div className="mt-6 flex overflow-hidden text-3xl font-semibold tracking-[-0.04em] text-fg sm:text-4xl">
              {NAME.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  className={ch === '_' ? 'text-accent' : undefined}
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 0.15 + i * 0.03, duration: 0.6, ease: EASE }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            <div className="mt-7 w-[min(340px,84vw)] space-y-1.5 font-mono text-[11.5px] text-subtle">
              {LINES.map((line, i) => (
                <motion.div
                  key={line}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.22, duration: 0.35 }}
                >
                  <span className="text-accent">›</span>
                  <span className={i === LINES.length - 1 ? 'text-fg' : undefined}>{line}</span>
                  <motion.span
                    className="ml-auto text-easy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.22, type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 h-[2px] w-[min(340px,84vw)] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_10%,transparent)]">
              <motion.div
                className="h-full origin-left rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.45, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

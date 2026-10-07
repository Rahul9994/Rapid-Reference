import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import { prefersReducedMotion } from '../../lib/utils'

export function ScrollToTop() {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })
  const [visible, setVisible] = useState(false)

  useEffect(() => scrollY.on('change', (y) => setVisible(y > 700)), [scrollY])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
          aria-label="Back to top"
          className="glass fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-line-strong text-fg shadow-[var(--shadow-lift)] sm:right-6"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
            <motion.circle
              cx="24"
              cy="24"
              r="19"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength: progress }}
            />
          </svg>
          <ArrowUp size={17} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

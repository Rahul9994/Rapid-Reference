import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      id="main"
      tabIndex={-1}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' } }}
      className={cn('relative min-h-[100dvh] outline-none', className)}
    >
      {children}
    </motion.main>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pt-32 sm:px-8" aria-busy="true" aria-label="Loading page">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-5 h-12 w-2/3 max-w-xl" />
      <div className="skeleton mt-4 h-4 w-1/2 max-w-md" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

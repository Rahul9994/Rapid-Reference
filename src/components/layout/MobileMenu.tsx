import { useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Search, Shuffle, Target } from 'lucide-react'
import { navLinks, site } from '../../data/site'
import { mobileMenuOpen, paletteOpen } from '../../lib/atom'
import { cn } from '../../lib/utils'
import { useBodyScrollLock, useFocusTrap } from '../../hooks'
import { useRandomActions } from '../../lib/random'
import { isActivePath } from './Navbar'

const EASE = [0.22, 1, 0.36, 1] as const

export function MobileMenu() {
  const open = mobileMenuOpen.use()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const { randomTopic, randomProblem } = useRandomActions()
  useBodyScrollLock(open)
  useFocusTrap(ref, open)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
          onKeyDown={(e) => e.key === 'Escape' && mobileMenuOpen.set(false)}
        >
          <div className="glass-strong absolute inset-0" />
          <div className="bg-grid mask-radial absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative flex h-full flex-col overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24">
            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {navLinks.map((l, i) => {
                  const active = isActivePath(pathname, l.to)
                  return (
                    <motion.li
                      key={l.to}
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.06, duration: 0.55, ease: EASE } }}
                      exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }}
                    >
                      <Link
                        to={l.to}
                        onClick={() => mobileMenuOpen.set(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex items-center justify-between border-b border-line py-4 text-[2rem] font-semibold tracking-[-0.03em] transition-colors',
                          active ? 'text-fg' : 'text-muted',
                        )}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className="font-mono text-xs font-normal text-subtle">0{i + 1}</span>
                          {l.label}
                        </span>
                        <ArrowUpRight
                          size={22}
                          className={cn('transition-all duration-300', active ? 'text-accent' : 'text-subtle')}
                        />
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            </nav>

            <motion.div
              className="mt-8 grid grid-cols-3 gap-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5, ease: EASE } }}
              exit={{ opacity: 0 }}
            >
              {[
                { label: 'Search', icon: Search, onClick: () => { mobileMenuOpen.set(false); paletteOpen.set(true) } },
                { label: 'Random topic', icon: Shuffle, onClick: () => { mobileMenuOpen.set(false); randomTopic() } },
                { label: 'Random problem', icon: Target, onClick: () => { mobileMenuOpen.set(false); randomProblem() } },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-elev/70 px-2 py-4 text-[12px] font-medium text-muted transition-colors active:bg-soft"
                >
                  <a.icon size={18} className="text-accent" />
                  {a.label}
                </button>
              ))}
            </motion.div>

            <motion.p
              className="mt-auto pt-10 text-sm text-subtle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.4 } }}
              exit={{ opacity: 0 }}
            >
              <span className="text-fg">{site.name}</span> — {site.tagline}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

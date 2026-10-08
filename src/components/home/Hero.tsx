import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionValue, useScroll, useTransform } from 'motion/react'
import { ArrowRight, ListChecks, Sparkles } from 'lucide-react'
import { bootDone, paletteOpen } from '../../lib/atom'
import { totalAllTopics } from '../../data/catalog'
import { totalLabTopics } from '../../data/labs'
import sheetMeta from '../../data/a2z-meta.json'
import { ButtonLink } from '../ui/Button'
import { Kbd, ModKey } from '../ui/misc'
import { HeroCanvas } from './HeroCanvas'
import { FloatingCards } from './FloatingCards'

const EASE = [0.22, 1, 0.36, 1] as const
const TITLE = 'Rapid_Reference'

export function Hero() {
  const ready = bootDone.use()
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2)
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2)
  }

  const show = ready ? 'show' : 'hidden'

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-28 xl:min-h-[max(100svh,820px)]"
      aria-labelledby="hero-title"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="bg-grid mask-radial absolute inset-0 opacity-80" />
        <div
          className="animate-drift-a absolute left-[8%] top-[6%] h-[42vmax] w-[42vmax] rounded-full opacity-[0.16] blur-[80px] sm:blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
        />
        <div
          className="animate-drift-b absolute right-[2%] top-[28%] h-[36vmax] w-[36vmax] rounded-full opacity-[0.13] blur-[80px] sm:blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--accent-2), transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[30%] h-[28vmax] w-[28vmax] rounded-full opacity-[0.08] blur-[90px]"
          style={{ background: 'radial-gradient(circle, var(--accent-3), transparent 65%)' }}
        />
        <div className="absolute inset-0">
          <HeroCanvas className="h-full w-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-bg" />
      </div>

      {ready && <FloatingCards mx={mx} my={my} />}

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
        <motion.div
          initial="hidden"
          animate={show}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
        >
          <motion.button
            onClick={() => paletteOpen.set(true)}
            variants={{ hidden: { opacity: 0, y: -12 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            className="group relative mx-auto mb-7 inline-flex items-center gap-2 overflow-hidden rounded-full border border-line-strong bg-elev/60 py-1.5 pl-1.5 pr-3.5 text-[12.5px] text-muted backdrop-blur transition-colors hover:text-fg sm:text-[13px]"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
              <Sparkles size={12} /> New
            </span>
            <span>
              {totalAllTopics} topics · {totalLabTopics} live AI/ML labs · {sheetMeta.total} A2Z items
            </span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--fg)_10%,transparent)] to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            />
          </motion.button>
        </motion.div>

        <h1
          id="hero-title"
          aria-label={TITLE}
          className="hero-title mx-auto font-semibold leading-[0.95] tracking-[-0.055em]"
        >
          <span className="flex flex-wrap justify-center" aria-hidden="true">
            {['Rapid_', 'Reference'].map((word, w) => (
              <span key={word} className="inline-flex">
                {word.split('').map((ch, j) => {
                  const i = w * 6 + j
                  return (
                    <motion.span
                      key={j}
                      className={ch === '_' ? 'relative text-accent' : 'text-gradient-fg inline-block pb-[0.08em]'}
                      initial={{ opacity: 0, y: '45%', filter: 'blur(12px)' }}
                      animate={ready ? { opacity: 1, y: '0%', filter: 'blur(0px)' } : undefined}
                      transition={{ delay: 0.25 + i * 0.035, duration: 0.9, ease: EASE }}
                      style={{ display: 'inline-block' }}
                    >
                      {ch === '_' ? <span className="animate-cursor">_</span> : ch}
                    </motion.span>
                  )
                })}
              </span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={ready ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE }}
          className="mx-auto mt-6 max-w-2xl text-balance text-[1.05rem] leading-relaxed text-muted sm:mt-8 sm:text-xl"
        >
          Your{' '}
          <span className="font-serif text-[1.18em] italic text-gradient pr-0.5">fast-track</span>{' '}
          reference for Python, DSA, AI, ML, OS, DBMS, Computer Networks and Technical Interviews.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 1, duration: 0.8, ease: EASE }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row"
        >
          <ButtonLink to="/notes" variant="primary" size="lg" className="w-full max-w-[260px] sm:w-auto">
            Explore Notes
            <ArrowRight size={17} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </ButtonLink>
          <ButtonLink to="/dsa-sheet" variant="secondary" size="lg" className="w-full max-w-[260px] sm:w-auto">
            <ListChecks size={17} className="text-accent" />
            Open DSA Sheet
          </ButtonLink>
        </motion.div>

        <motion.button
          onClick={() => paletteOpen.set(true)}
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mx-auto mt-8 hidden items-center gap-2 text-[13px] text-subtle transition-colors hover:text-muted sm:inline-flex"
        >
          or press
          <Kbd>
            <ModKey />
          </Kbd>
          <Kbd>K</Kbd>
          to search anything
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 1.6 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 sm:block"
        aria-hidden="true"
      >
        <div className="flex h-9 w-[22px] justify-center rounded-full border border-line-strong pt-1.5">
          <motion.span
            className="h-1.5 w-1 rounded-full bg-fg/70"
            animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  )
}

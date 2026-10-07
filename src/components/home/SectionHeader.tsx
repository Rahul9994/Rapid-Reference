import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, useInView } from 'motion/react'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/misc'
import { cn } from '../../lib/utils'

export function SectionHeader({
  label,
  title,
  description,
  align = 'center',
  className,
}: {
  label: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div className={cn(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl', className)}>
      <Reveal>
        <SectionLabel>{label}</SectionLabel>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-5 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-fg sm:text-5xl lg:text-[3.4rem]">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className={cn('mt-5 text-pretty text-base leading-relaxed text-muted sm:text-lg', align === 'center' && 'mx-auto max-w-2xl')}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** Serif-italic accent used inside headings. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="font-serif font-normal italic tracking-[-0.02em] text-gradient pr-1">{children}</span>
}

export function CountUp({ value, suffix = '', className }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value])
  return (
    <span ref={ref} className={cn('tabular', className)}>
      {display}
      {suffix}
    </span>
  )
}

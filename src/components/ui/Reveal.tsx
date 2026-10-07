import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const

// Blur is lovely on desktop but costly on low-end phones — only use it with a fine pointer.
const canBlur = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function fadeUp(delay = 0, distance = 22) {
  return {
    initial: { opacity: 0, y: distance, filter: canBlur ? 'blur(6px)' : 'blur(0px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, margin: '0px 0px -10% 0px' },
    transition: { duration: 0.8, ease: EASE, delay },
  } as const
}

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number
  distance?: number
  children: ReactNode
}

export function Reveal({ delay = 0, distance = 22, children, ...props }: RevealProps) {
  return (
    <motion.div {...fadeUp(delay, distance)} {...props}>
      {children}
    </motion.div>
  )
}

/** Word-by-word reveal for headings. */
export function RevealWords({
  text,
  className,
  delay = 0,
  stagger = 0.06,
  as = 'span',
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}) {
  const Tag = motion[as]
  const words = text.split(' ')
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-top" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '105%', opacity: 0 },
              show: { y: '0%', opacity: 1, transition: { duration: 0.75, ease: EASE } },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

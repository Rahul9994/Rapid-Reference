import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Home, Search, Shuffle } from 'lucide-react'
import { paletteOpen } from '../lib/atom'
import { useRandomActions } from '../lib/random'
import { Button, ButtonLink } from '../components/ui/Button'

const NODES = [
  { x: 60, y: 70 },
  { x: 150, y: 30 },
  { x: 240, y: 80 },
  { x: 120, y: 140 },
  { x: 210, y: 160 },
]
const EDGES = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [2, 4],
]

export default function NotFound() {
  const { randomTopic } = useRandomActions()

  useEffect(() => {
    document.title = 'Page not found — Rapid_Reference'
  }, [])

  return (
    <div className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden px-5 pb-16 pt-32">
      <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="text-center">
        <svg viewBox="0 0 380 200" className="mx-auto w-[min(380px,90vw)]" aria-hidden="true">
          {EDGES.map(([a, b], i) => (
            <motion.line
              key={i}
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              stroke="var(--border-strong)"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
            />
          ))}
          <motion.line
            x1={240}
            y1={80}
            x2={330}
            y2={110}
            stroke="var(--hard)"
            strokeWidth="1.5"
            strokeDasharray="4 5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.2, 0.8] }}
            transition={{ delay: 0.9, duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
          {NODES.map((n, i) => (
            <motion.circle
              key={i}
              cx={n.x}
              cy={n.y}
              r="9"
              fill="var(--bg-elev)"
              stroke="var(--accent)"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 400, damping: 18 }}
            />
          ))}
          <motion.g
            initial={{ x: 0, y: 0 }}
            animate={{ x: [0, 6, -4, 0], y: [0, -8, 4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="330" cy="110" r="22" fill="color-mix(in oklab, var(--hard) 14%, var(--bg-elev))" stroke="var(--hard)" strokeWidth="2" />
            <text x="330" y="115" textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill="var(--hard)">
              404
            </text>
          </motion.g>
        </svg>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-balance text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl"
        >
          This node isn&apos;t connected.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mx-auto mt-4 max-w-md text-muted"
        >
          The page you&apos;re looking for doesn&apos;t exist — no path from here leads to it. Try one of these instead.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <ButtonLink to="/" variant="primary">
            <Home size={16} /> Go home
          </ButtonLink>
          <Button onClick={() => paletteOpen.set(true)}>
            <Search size={16} /> Search
          </Button>
          <Button onClick={randomTopic}>
            <Shuffle size={16} /> Random topic
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

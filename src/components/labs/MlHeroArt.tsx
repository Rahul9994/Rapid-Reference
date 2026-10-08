import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { rng } from '../../viz/core/math'
import { useInView, useReducedMotion } from '../../viz/core/hooks'

/**
 * Landing art for M.L: one cloud of points that keeps re-organising itself —
 * regression → classification → clustering — while the matching
 * scikit-learn line types itself out.
 */

const W = 800
const H = 600
const N = 66
const SCENES = ['regression', 'classification', 'clustering'] as const
type Scene = (typeof SCENES)[number]

const CODE: Record<Scene, { label: string; line: string }> = {
  regression: { label: 'Regression', line: 'LinearRegression().fit(X, y)' },
  classification: { label: 'Classification', line: 'LogisticRegression().fit(X, y)' },
  clustering: { label: 'Clustering', line: 'KMeans(n_clusters=3).fit(X)' },
}

const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)']

function useLayouts() {
  return useMemo(() => {
    const r = rng(42)
    const reg = Array.from({ length: N }, (_, i) => {
      const x = 150 + (520 * i) / (N - 1) + r.range(-6, 6)
      return { x, y: 470 - (x - 150) * 0.62 + r.normal(0, 26), c: 1 }
    })
    const cls = Array.from({ length: N }, (_, i) => {
      const a = i % 2 === 0
      const cx = a ? 300 : 520
      const cy = a ? 380 : 230
      return { x: cx + r.normal(0, 62), y: cy + r.normal(0, 52), c: a ? 1 : 2 }
    })
    const centers = [
      [250, 230],
      [560, 210],
      [430, 440],
    ]
    const clu = Array.from({ length: N }, (_, i) => {
      const k = i % 3
      return { x: centers[k][0] + r.normal(0, 40), y: centers[k][1] + r.normal(0, 36), c: k }
    })
    return { regression: reg, classification: cls, clustering: clu, centers }
  }, [])
}

export default function MlHeroArt() {
  const layouts = useLayouts()
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>('0px')
  const [i, setI] = useState(0)
  const scene = SCENES[i % SCENES.length]

  useEffect(() => {
    if (reduced || !inView) return
    const t = window.setInterval(() => setI((v) => v + 1), 5200)
    return () => window.clearInterval(t)
  }, [reduced, inView])

  const pts = layouts[scene]

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="ml-glow">
            <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.35 }} />
            <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* axes */}
        <g opacity={0.5}>
          <line x1={120} y1={520} x2={720} y2={520} className="viz-axis" />
          <line x1={120} y1={80} x2={120} y2={520} className="viz-axis" />
          {Array.from({ length: 7 }).map((_, k) => (
            <line key={k} x1={120 + k * 100} y1={80} x2={120 + k * 100} y2={520} className="viz-grid" />
          ))}
          {Array.from({ length: 5 }).map((_, k) => (
            <line key={k} x1={120} y1={80 + k * 110} x2={720} y2={80 + k * 110} className="viz-grid" />
          ))}
        </g>

        <AnimatePresence>
          {scene === 'regression' && (
            <motion.line
              key="reg"
              x1={140}
              y1={482}
              x2={690}
              y2={141}
              strokeWidth={3.5}
              strokeLinecap="round"
              style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 10px var(--accent))' }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, transition: { duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            />
          )}
          {scene === 'classification' && (
            <motion.path
              key="cls"
              d="M 250 120 C 380 230, 420 300, 600 500"
              fill="none"
              strokeWidth={3}
              strokeDasharray="10 9"
              style={{ stroke: 'var(--fg-muted)' }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9, transition: { duration: 1.3, delay: 1, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            />
          )}
          {scene === 'clustering' &&
            layouts.centers.map(([cx, cy], k) => (
              <motion.g key={`c${k}`} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1, transition: { delay: 1 + k * 0.15, duration: 0.6 } }} exit={{ opacity: 0 }} style={{ transformOrigin: `${cx}px ${cy}px` }}>
                <circle cx={cx} cy={cy} r={86} fill="url(#ml-glow)" opacity={0.6} />
                <circle cx={cx} cy={cy} r={64} fill="none" strokeWidth={1.2} strokeDasharray="4 6" style={{ stroke: COLORS[k] }} opacity={0.7} />
                <path d={`M${cx - 9},${cy - 9} L${cx + 9},${cy + 9} M${cx + 9},${cy - 9} L${cx - 9},${cy + 9}`} strokeWidth={3.5} strokeLinecap="round" style={{ stroke: COLORS[k] }} />
              </motion.g>
            ))}
        </AnimatePresence>

        {pts.map((p, k) => (
          <motion.circle
            key={k}
            r={5.5}
            initial={false}
            animate={{ cx: p.x, cy: p.y }}
            transition={{ duration: 1.3, delay: (k % 22) * 0.018, ease: [0.65, 0, 0.35, 1] }}
            style={{
              fill: scene === 'regression' ? 'var(--accent-2)' : COLORS[p.c],
              stroke: 'var(--bg)',
              strokeWidth: 1.5,
              transition: `fill 0.9s ease ${0.4 + (k % 22) * 0.018}s`,
            }}
          />
        ))}
      </svg>

      {/* Live code card */}
      <div className="absolute bottom-[14%] right-[6%] hidden w-[min(360px,40%)] lg:block">
        <div className="glass overflow-hidden rounded-2xl border border-line-strong shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
            <span className="flex gap-1">
              <i className="h-2 w-2 rounded-full bg-[color-mix(in_oklab,var(--fg)_16%,transparent)]" />
              <i className="h-2 w-2 rounded-full bg-[color-mix(in_oklab,var(--fg)_16%,transparent)]" />
              <i className="h-2 w-2 rounded-full bg-[color-mix(in_oklab,var(--fg)_16%,transparent)]" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={scene}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="ml-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-subtle"
              >
                {CODE[scene].label}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="px-3.5 py-3 font-mono text-[12.5px]">
            <span style={{ color: 'var(--tk-comment)' }}>{'>>> '}</span>
            <Typed key={scene} text={CODE[scene].line} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    let k = 0
    const t = window.setInterval(() => {
      k++
      setN(k)
      if (k >= text.length) window.clearInterval(t)
    }, 32)
    return () => window.clearInterval(t)
  }, [text])
  const shown = text.slice(0, n)
  const paren = shown.indexOf('(')
  return (
    <span>
      <span style={{ color: 'var(--tk-function)' }}>{paren === -1 ? shown : shown.slice(0, paren)}</span>
      <span style={{ color: 'var(--code-fg)' }}>{paren === -1 ? '' : shown.slice(paren)}</span>
      <span className="animate-blink ml-px inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-accent" />
    </span>
  )
}

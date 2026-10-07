import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useSpring, type MotionValue } from 'motion/react'
import { sheetProgressStore } from '../../lib/storage'
import sheetMeta from '../../data/a2z-meta.json'

type Tok = [string, string?]

const T = {
  kw: 'var(--tk-keyword)',
  fn: 'var(--tk-function)',
  num: 'var(--tk-number)',
  str: 'var(--tk-string)',
  bi: 'var(--tk-builtin)',
  op: 'var(--tk-operator)',
  cm: 'var(--tk-comment)',
} as const

const CODE: Tok[][] = [
  [['def ', T.kw], ['binary_search', T.fn], ['(nums, target):']],
  [['    lo, hi = '], ['0', T.num], [', '], ['len', T.bi], ['(nums) - '], ['1', T.num]],
  [['    while ', T.kw], ['lo <= hi:']],
  [['        mid = (lo + hi) '], ['//', T.op], [' '], ['2', T.num]],
  [['        if ', T.kw], ['nums[mid] == target:']],
  [['            return ', T.kw], ['mid']],
  [['        if ', T.kw], ['nums[mid] < target:']],
  [['            lo = mid + '], ['1', T.num]],
  [['        else', T.kw], [':']],
  [['            hi = mid - '], ['1', T.num]],
  [['    return ', T.kw], ['-1', T.num], ['  '], ['# O(log n)', T.cm]],
]

function Window({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`glass-strong overflow-hidden rounded-2xl border border-line-strong shadow-[var(--shadow-lift)] ${className ?? ''}`}>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2 w-2 rounded-full bg-[#ff5f57]/80" />
          <i className="h-2 w-2 rounded-full bg-[#febc2e]/80" />
          <i className="h-2 w-2 rounded-full bg-[#28c840]/80" />
        </span>
        <span className="font-mono text-[10.5px] text-subtle">{title}</span>
      </div>
      {children}
    </div>
  )
}

function CodeCard() {
  return (
    <Window title="binary_search.py" className="w-[268px]">
      <pre className="overflow-hidden px-3 py-2.5 font-mono text-[10.5px] leading-[1.65] text-[var(--code-fg)]">
        {CODE.map((line, i) => (
          <div key={i} className="whitespace-pre">
            <span className="mr-3 inline-block w-3 text-right text-subtle/60 select-none">{i + 1}</span>
            {line.map(([t, c], j) => (
              <span key={j} style={c ? { color: c } : undefined}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </pre>
    </Window>
  )
}

function TerminalCard() {
  const done = Object.keys(sheetProgressStore.use()).length
  const pct = Math.round((done / sheetMeta.total) * 100)
  const bars = Math.round(pct / 8.33)
  const cmd = 'rr revise --topic graphs'
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    let i = 0
    let timer = 0
    const tick = () => {
      i = i >= cmd.length + 40 ? 0 : i + 1
      setTyped(i)
      timer = window.setTimeout(tick, i === 0 ? 400 : i <= cmd.length ? 70 : 90)
    }
    timer = window.setTimeout(tick, 900)
    return () => window.clearTimeout(timer)
  }, [])
  const showOut = typed > cmd.length + 2
  return (
    <Window title="~/rapid_reference" className="w-[262px]">
      <div className="space-y-1 px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-muted">
        <div>
          <span className="text-accent">❯</span> <span className="text-fg">{cmd.slice(0, Math.min(typed, cmd.length))}</span>
          {!showOut && <span className="animate-blink ml-px inline-block h-3 w-1.5 translate-y-0.5 bg-accent" />}
        </div>
        <div className={`transition-opacity duration-500 ${showOut ? 'opacity-100' : 'opacity-0'}`}>
          <div>
            <span className="text-easy">✓</span> bfs-dfs <span className="ml-3 text-easy">✓</span> topo-sort
          </div>
          <div>
            <span className="text-easy">✓</span> dijkstra <span className="ml-2.5 text-medium">◌</span> mst
          </div>
          <div className="mt-1.5">
            <span className="text-accent">❯</span> <span className="text-fg">rr sheet --progress</span>
          </div>
          <div>
            <span className="text-accent-2">{'█'.repeat(bars)}</span>
            <span className="text-subtle/50">{'░'.repeat(12 - bars)}</span> <span className="text-fg">{pct}%</span>{' '}
            <span className="text-subtle">({done}/{sheetMeta.total})</span>
          </div>
        </div>
      </div>
    </Window>
  )
}

const TREE = [
  { v: 8, x: 110, y: 22 },
  { v: 4, x: 60, y: 62 },
  { v: 12, x: 160, y: 62 },
  { v: 2, x: 34, y: 102 },
  { v: 6, x: 86, y: 102 },
  { v: 10, x: 134, y: 102 },
  { v: 14, x: 186, y: 102 },
]
const EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
]
const INORDER = [3, 1, 4, 0, 5, 2, 6]

function TreeCard() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % (INORDER.length + 3)), 650)
    return () => window.clearInterval(id)
  }, [])
  const visited = INORDER.slice(0, Math.min(step, INORDER.length))
  const current = step > 0 && step <= INORDER.length ? INORDER[step - 1] : -1
  return (
    <Window title="bst.inorder()" className="w-[232px]">
      <svg viewBox="0 0 220 122" className="w-full px-1.5 pt-1.5" aria-hidden="true">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={TREE[a].x}
            y1={TREE[a].y}
            x2={TREE[b].x}
            y2={TREE[b].y}
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="60"
            strokeDashoffset="60"
            style={{ animation: `dash 1.2s ${0.3 + i * 0.12}s var(--ease-out-expo) forwards` }}
          />
        ))}
        {TREE.map((n, i) => {
          const isCur = i === current
          const seen = visited.includes(i)
          return (
            <g key={n.v}>
              {isCur && <circle cx={n.x} cy={n.y} r="16" fill="var(--accent)" opacity="0.18" />}
              <circle
                cx={n.x}
                cy={n.y}
                r="11"
                fill={isCur ? 'var(--accent)' : seen ? 'color-mix(in oklab, var(--accent) 22%, var(--bg-elev))' : 'var(--bg-elev)'}
                stroke={seen || isCur ? 'var(--accent)' : 'var(--border-strong)'}
                strokeWidth="1.5"
                style={{ transition: 'fill .3s, stroke .3s' }}
              />
              <text
                x={n.x}
                y={n.y + 3.5}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill={isCur ? 'var(--accent-fg)' : 'var(--fg)'}
              >
                {n.v}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="px-3 pb-2.5 font-mono text-[10px] text-subtle">
        inorder →{' '}
        {INORDER.map((i, k) => (
          <span key={i} className={visited.includes(i) ? 'text-fg' : undefined}>
            {TREE[i].v}
            {k < INORDER.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </Window>
  )
}

function SqlCard() {
  const rows = [
    { t: 'arrays', n: 32 },
    { t: 'graphs', n: 21 },
    { t: 'dp', n: 18 },
  ]
  return (
    <Window title="progress.sql" className="w-[258px]">
      <pre className="px-3 pt-2.5 font-mono text-[10.5px] leading-[1.6] text-[var(--code-fg)]">
        <span style={{ color: T.kw }}>SELECT</span> topic, <span style={{ color: T.bi }}>COUNT</span>(*) <span style={{ color: T.kw }}>AS</span> solved{'\n'}
        <span style={{ color: T.kw }}>FROM</span> progress <span style={{ color: T.kw }}>GROUP BY</span> topic{'\n'}
        <span style={{ color: T.kw }}>ORDER BY</span> solved <span style={{ color: T.kw }}>DESC</span>;
      </pre>
      <div className="m-3 mt-2 overflow-hidden rounded-lg border border-line font-mono text-[10px]">
        {rows.map((r, i) => (
          <div key={r.t} className="flex items-center gap-2 border-b border-line px-2 py-1.5 last:border-b-0">
            <span className="w-11 text-muted">{r.t}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.n / 32) * 100}%` }}
                transition={{ delay: 1 + i * 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="w-5 text-right text-fg">{r.n}</span>
          </div>
        ))}
      </div>
    </Window>
  )
}

interface Placement {
  card: ReactNode
  style: CSSProperties
  depth: number
  rotate: number
  delay: number
  float: string
}

function Floating({ p, mx, my, index }: { p: Placement; mx: MotionValue<number>; my: MotionValue<number>; index: number }) {
  const x = useSpring(0, { stiffness: 60, damping: 18 })
  const y = useSpring(0, { stiffness: 60, damping: 18 })
  useEffect(() => {
    const ux = mx.on('change', (v) => x.set(v * p.depth))
    const uy = my.on('change', (v) => y.set(v * p.depth))
    return () => {
      ux()
      uy()
    }
  }, [mx, my, x, y, p.depth])
  return (
    <motion.div
      className="absolute"
      style={{ ...p.style, x, y }}
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.9 + index * 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="animate-float"
        style={{ '--r': `${p.rotate}deg`, '--dur': p.float, '--delay': `${p.delay}s`, '--fy': '-12px' } as CSSProperties}
      >
        {p.card}
      </div>
    </motion.div>
  )
}

export function FloatingCards({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const edge = 'max(1.5rem, calc(50% - 49rem))'
  const placements: Placement[] = [
    { card: <CodeCard />, style: { left: edge, top: '11%' }, depth: 18, rotate: -3, delay: 0, float: '8s' },
    { card: <TerminalCard />, style: { right: edge, top: '13%' }, depth: 24, rotate: 2.5, delay: 1.2, float: '9s' },
    { card: <TreeCard />, style: { left: `calc(${edge} + 2.5rem)`, bottom: '11%' }, depth: 28, rotate: 2, delay: 0.6, float: '7.5s' },
    { card: <SqlCard />, style: { right: `calc(${edge} + 1.5rem)`, bottom: '10%' }, depth: 14, rotate: -2, delay: 1.8, float: '8.5s' },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 hidden min-[1360px]:block" aria-hidden="true">
      {placements.map((p, i) => (
        <Floating key={i} p={p} mx={mx} my={my} index={i} />
      ))}
    </div>
  )
}

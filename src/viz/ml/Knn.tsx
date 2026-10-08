import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, FieldCanvas, Stage, frame2d, type Box } from '../core/plot'
import { fmt } from '../core/math'
import { blobs, CLASS_COLORS, type Point } from '../core/datasets'
import { useThemeColors } from '../core/hooks'

const CODE = `import numpy as np
from collections import Counter

def knn_predict(X_train, y_train, x, k=5):
    # 1. distance from the query to every training point
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
    # 2. indices of the k closest points
    nearest = np.argsort(dists)[:k]
    # 3. majority vote among their labels
    votes = Counter(y_train[nearest])
    return votes.most_common(1)[0][0]`

const QUERIES: [number, number][] = [
  [0.2, 0.4],
  [-1.2, 1.4],
  [1.3, -0.4],
  [-0.4, -1.1],
  [0.9, 1.5],
  [-1.6, -0.2],
]

interface Frame extends StepFrame {
  q: [number, number]
  phase: 'move' | 'dist' | 'sort' | 'vote' | 'predict'
  order: number[]
  votes: number[]
  pred?: number
}

function predict(pts: Point[], q: [number, number], k: number) {
  const d = pts.map((p) => (p.x - q[0]) ** 2 + (p.y - q[1]) ** 2)
  const order = d.map((_, i) => i).sort((a, b) => d[a] - d[b])
  const votes = [0, 0, 0]
  for (const i of order.slice(0, k)) votes[pts[i].c]++
  // ties → the class of the nearest neighbour among the tied classes
  const best = Math.max(...votes)
  const pred = pts[order.find((i) => votes[pts[i].c] === best)!].c
  return { order, votes, pred, d }
}

function* program(pts: Point[], k: number, queries: [number, number][]): Generator<Frame, void, void> {
  let first = true
  for (const q of queries) {
    const res = predict(pts, q, k)
    const narrate = first
    yield { q, phase: 'move', order: res.order, votes: [0, 0, 0], line: 4, dwell: narrate ? 1.4 : 0.9, note: 'A new, unlabeled point arrives. KNN does no training — it simply looks at the stored data.' }
    yield { q, phase: 'dist', order: res.order, votes: [0, 0, 0], line: [5, 6], dwell: narrate ? 1.6 : 0.8, note: 'Measure the Euclidean distance from the query to every training point.' }
    yield { q, phase: 'sort', order: res.order, votes: [0, 0, 0], line: [7, 8], dwell: narrate ? 1.6 : 0.9, note: `Keep only the k = ${k} nearest neighbours — the circle grows until it holds exactly ${k} points.` }
    yield { q, phase: 'vote', order: res.order, votes: res.votes, line: [9, 10], dwell: narrate ? 1.6 : 0.9, note: 'Each neighbour votes for its class.' }
    yield { q, phase: 'predict', order: res.order, votes: res.votes, pred: res.pred, line: 11, dwell: narrate ? 2 : 1.4, note: `Majority wins → predicted class ${res.pred}. The shaded regions show what every location would be classified as.` }
    first = false
  }
}

export default function Knn() {
  const [k, setK] = useState(5)
  const [custom, setCustom] = useState<[number, number] | null>(null)
  const pts = useMemo(() => blobs([[-1.1, 0.9], [1.1, 0.7], [0.1, -1.1]], 18, 0.62, 9), [])
  const queries = useMemo(() => (custom ? [custom] : QUERIES), [custom])
  const player = usePlayer(() => program(pts, k, queries), [k, queries], { interval: 650, loop: custom ? false : 1600 })
  const fr = player.frame

  const place = (q: [number, number]) => {
    setCustom(q)
    player.play()
  }

  return (
    <LabFrame
      title="K-nearest neighbours · click to place a query"
      status={`k = ${k}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Board box={box} pts={pts} k={k} f={fr} onPlace={place} />}
        </Stage>
      }
      legend={[
        { label: 'class 0', color: CLASS_COLORS[0] },
        { label: 'class 1', color: CLASS_COLORS[1] },
        { label: 'class 2', color: CLASS_COLORS[2] },
        { label: 'query', color: 'var(--fg)', shape: 'ring' },
      ]}
      below={
        <MiniPanel title="Votes from the k nearest" right={fr.pred !== undefined ? `prediction: class ${fr.pred}` : undefined}>
          <div className="space-y-2 px-1 py-1">
            {[0, 1, 2].map((c) => (
              <div key={c} className="flex items-center gap-3">
                <span className="w-14 font-mono text-[11px] text-muted">class {c}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: CLASS_COLORS[c] }}
                    initial={false}
                    animate={{ width: `${(fr.votes[c] / k) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-[12px] text-fg tabular">{fr.votes[c]}</span>
              </div>
            ))}
          </div>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'knn.py',
        vars: [
          { name: 'x', value: `(${fmt(fr.q[0], 2)}, ${fmt(fr.q[1], 2)})` },
          { name: 'k', value: String(k), color: 'var(--accent)' },
          { name: 'nearest[0]', value: fr.phase === 'move' || fr.phase === 'dist' ? '—' : `#${fr.order[0]}` },
          { name: 'votes', value: fr.phase === 'vote' || fr.phase === 'predict' ? `{${fr.votes.map((v, c) => `${c}: ${v}`).join(', ')}}` : '—' },
          { name: 'prediction', value: fr.pred !== undefined ? String(fr.pred) : '—', color: fr.pred !== undefined ? CLASS_COLORS[fr.pred] : undefined },
        ],
      }}
      params={
        <>
          <Slider label="k (neighbours)" value={k} min={1} max={15} step={2} onChange={setK} />
          {custom && (
            <button type="button" onClick={() => setCustom(null)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-fg">
              Back to the tour
            </button>
          )}
        </>
      }
    />
  )
}

function Board({ box, pts, k, f, onPlace }: { box: Box; pts: Point[]; k: number; f: Frame; onPlace: (q: [number, number]) => void }) {
  const ref = useRef<SVGSVGElement>(null)
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-2.8, 2.8], [-2.8 * aspect, 2.8 * aspect], pad)
  const { sx, sy } = fr
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1], c: CLASS_COLORS[2] })
  const paint = useMemo(() => {
    const cols = [C.a, C.b, C.c]
    return (x: number, y: number): [number, number, number, number] => {
      const { pred } = predict(pts, [x, y], k)
      const c = cols[pred]
      return [c[0], c[1], c[2], 34]
    }
  }, [C, pts, k])

  const q = f.q
  const nearest = f.order.slice(0, k)
  const showNear = f.phase === 'sort' || f.phase === 'vote' || f.phase === 'predict'
  const radius = Math.sqrt((pts[f.order[k - 1]].x - q[0]) ** 2 + (pts[f.order[k - 1]].y - q[1]) ** 2)

  const onClick = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = fr.sx.invert(e.clientX - rect.left)
    const y = fr.sy.invert(e.clientY - rect.top)
    if (x < fr.sx.domain[0] || x > fr.sx.domain[1]) return
    onPlace([x, y])
  }

  return (
    <>
      <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={6} />
      <svg ref={ref} width={box.width} height={box.height} className="absolute inset-0 cursor-crosshair" onPointerDown={onClick} role="img" aria-label="KNN classification of a query point">
        <Axes f={fr} xLabel="x₁" yLabel="x₂" />
        <AnimatePresence>
          {f.phase === 'dist' &&
            pts.map((p, i) => (
              <motion.line
                key={`d${i}`}
                x1={sx(q[0])}
                y1={sy(q[1])}
                x2={sx(p.x)}
                y2={sy(p.y)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.006 }}
                strokeWidth={1}
                style={{ stroke: 'var(--fg-muted)' }}
              />
            ))}
        </AnimatePresence>
        <motion.ellipse
          cx={sx(q[0])}
          cy={sy(q[1])}
          initial={false}
          animate={{ rx: showNear ? Math.abs(sx(radius) - sx(0)) : 0, ry: showNear ? Math.abs(sy(radius) - sy(0)) : 0, opacity: showNear ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          style={{ fill: 'color-mix(in oklab, var(--fg) 5%, transparent)', stroke: 'var(--fg-muted)' }}
        />
        {showNear &&
          nearest.map((i) => (
            <motion.line
              key={`n${i}`}
              x1={sx(q[0])}
              y1={sy(q[1])}
              x2={sx(pts[i].x)}
              y2={sy(pts[i].y)}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
              strokeWidth={1.8}
              style={{ stroke: CLASS_COLORS[pts[i].c] }}
            />
          ))}
        {pts.map((p, i) => {
          const near = showNear && nearest.includes(i)
          return (
            <circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={near ? 6.5 : 4.5}
              strokeWidth={near ? 2.5 : 1.5}
              style={{ fill: CLASS_COLORS[p.c], stroke: near ? 'var(--fg)' : 'var(--bg)', transition: 'r 0.3s, stroke 0.3s' }}
            />
          )
        })}
        <motion.g initial={false} animate={{ x: sx(q[0]), y: sy(q[1]) }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
          <circle r={14} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--fg)', opacity: 0.35 }} />
          <circle r={8} strokeWidth={2.5} style={{ fill: f.pred !== undefined ? CLASS_COLORS[f.pred] : 'var(--bg)', stroke: 'var(--fg)', transition: 'fill 0.4s' }} />
        </motion.g>
      </svg>
    </>
  )
}

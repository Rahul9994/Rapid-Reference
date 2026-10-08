import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Pills, Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, FieldCanvas, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { blobs, CLASS_COLORS, type Point } from '../core/datasets'
import { useThemeColors } from '../core/hooks'

const CODE = `import numpy as np

def kmeans(X, k, iters=20):
    C = init_centroids(X, k)            # random points or k-means++
    for _ in range(iters):
        # assign: each point joins its nearest centroid
        d = np.linalg.norm(X[:, None] - C[None], axis=2)
        labels = d.argmin(axis=1)
        # update: move each centroid to the mean of its points
        C_new = np.array([X[labels == j].mean(axis=0) for j in range(k)])
        if np.allclose(C, C_new):
            break                       # converged
        C = C_new
    inertia = ((X - C[labels]) ** 2).sum()
    return labels, C, inertia`

type Init = 'random' | 'kmeans++'

interface Frame extends StepFrame {
  iter: number
  C: [number, number][]
  trails: [number, number][][]
  labels: number[] | null
  inertia: number[]
  phase: 'init' | 'assign' | 'update' | 'done'
}

const d2 = (p: Point, c: [number, number]) => (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2

function initCentroids(pts: Point[], k: number, init: Init, seed: number): [number, number][] {
  const r = rng(seed)
  if (init === 'random') {
    const idx = r.shuffle(pts.map((_, i) => i)).slice(0, k)
    return idx.map((i) => [pts[i].x, pts[i].y])
  }
  const C: [number, number][] = []
  const first = pts[r.int(0, pts.length - 1)]
  C.push([first.x, first.y])
  while (C.length < k) {
    const D = pts.map((p) => Math.min(...C.map((c) => d2(p, c))))
    const total = D.reduce((s, v) => s + v, 0)
    let u = r.next() * total
    let pick = 0
    for (let i = 0; i < D.length; i++) {
      u -= D[i]
      if (u <= 0) {
        pick = i
        break
      }
    }
    C.push([pts[pick].x, pts[pick].y])
  }
  return C
}

function* program(pts: Point[], k: number, init: Init, seed: number): Generator<Frame, void, void> {
  let C = initCentroids(pts, k, init, seed)
  const trails: [number, number][][] = C.map((c) => [[...c]])
  const inertia: number[] = []
  yield { iter: 0, C, trails: trails.map((t) => [...t]), labels: null, inertia: [], phase: 'init', line: 4, dwell: 1.6, note: init === 'random' ? `Pick ${k} random points as the starting centroids (◆).` : `k-means++: pick the first centroid at random, then favour points far from existing centroids.` }
  for (let it = 0; it < 20; it++) {
    const labels = pts.map((p) => {
      let best = 0
      let bd = Infinity
      C.forEach((c, j) => {
        const d = d2(p, c)
        if (d < bd) {
          bd = d
          best = j
        }
      })
      return best
    })
    const J = pts.reduce((s, p, i) => s + d2(p, C[labels[i]]), 0)
    inertia.push(J)
    const narrate = it < 2
    yield { iter: it + 1, C, trails: trails.map((t) => [...t]), labels, inertia: [...inertia], phase: 'assign', line: [6, 8], dwell: narrate ? 1.6 : 0.8, note: narrate ? 'Assignment step: every point takes the colour of its nearest centroid. The shaded cells are the Voronoi regions.' : `Iteration ${it + 1}: re-assign points.` }
    const Cn: [number, number][] = C.map((c, j) => {
      const mine = pts.filter((_, i) => labels[i] === j)
      if (!mine.length) return c
      return [mine.reduce((s, p) => s + p.x, 0) / mine.length, mine.reduce((s, p) => s + p.y, 0) / mine.length]
    })
    const moved = Cn.some((c, j) => Math.abs(c[0] - C[j][0]) + Math.abs(c[1] - C[j][1]) > 1e-9)
    if (!moved) {
      yield { iter: it + 1, C, trails: trails.map((t) => [...t]), labels, inertia: [...inertia], phase: 'done', line: [11, 12], dwell: 6, note: `Converged after ${it + 1} iterations — centroids stopped moving. Inertia (within-cluster sum of squares) = ${fmt(J, 2)}.` }
      return
    }
    C = Cn
    C.forEach((c, j) => trails[j].push([...c]))
    yield { iter: it + 1, C, trails: trails.map((t) => [...t]), labels, inertia: [...inertia], phase: 'update', line: [9, 10], dwell: narrate ? 1.6 : 0.8, note: narrate ? 'Update step: each centroid glides to the mean of the points assigned to it.' : `Iteration ${it + 1}: centroids move to their cluster means.` }
  }
}

export default function KMeans() {
  const [k, setK] = useState(4)
  const [init, setInit] = useState<Init>('random')
  const [seed, setSeed] = useState(4)
  const pts = useMemo(() => blobs([[-1.6, 1.1], [1.5, 1.3], [0.2, -1.4], [-1.5, -1.2], [1.8, -0.9]], 14, 0.42, 8), [])
  const player = usePlayer(() => program(pts, k, init, seed), [k, init, seed], { interval: 650, loop: 2400 })
  const fr = player.frame

  return (
    <LabFrame
      title="K-means · Lloyd's algorithm"
      status={fr.phase === 'done' ? `converged · iter ${fr.iter}` : `iteration ${fr.iter}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Board box={box} pts={pts} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'centroid', color: 'var(--fg)', shape: 'square' },
        { label: 'centroid path', color: 'var(--fg-muted)', shape: 'dash' },
        { label: 'unassigned point', color: 'var(--fg-subtle)' },
      ]}
      below={
        <MiniPanel title="Inertia per iteration" right={fr.inertia.length ? fmt(fr.inertia[fr.inertia.length - 1], 2) : undefined}>
          <Stage aspect={0.25} min={110} max={140}>
            {(box) => <InertiaChart box={box} values={fr.inertia} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'kmeans.py',
        vars: [
          { name: 'k', value: String(k), color: 'var(--accent)' },
          { name: 'iteration', value: String(fr.iter) },
          { name: 'inertia', value: fr.inertia.length ? fmt(fr.inertia[fr.inertia.length - 1], 2) : '—', color: 'var(--accent-3)' },
          { name: 'sizes', value: fr.labels ? `[${Array.from({ length: k }, (_, j) => fr.labels!.filter((l) => l === j).length).join(', ')}]` : '—' },
          { name: 'init', value: init },
        ],
      }}
      params={
        <>
          <Slider label="k (clusters)" value={k} min={2} max={6} onChange={setK} />
          <Pills
            label="Initialisation"
            value={init}
            onChange={setInit}
            options={[
              { value: 'random', label: 'Random' },
              { value: 'kmeans++', label: 'k-means++' },
            ]}
          />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            New random start
          </button>
        </>
      }
    />
  )
}

function Board({ box, pts, f }: { box: Box; pts: Point[]; f: Frame }) {
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-3.2, 3.2], [-3.2 * aspect, 3.2 * aspect], pad)
  const { sx, sy } = fr
  const C = useThemeColors({ c0: CLASS_COLORS[0], c1: CLASS_COLORS[1], c2: CLASS_COLORS[2], c3: CLASS_COLORS[3], c4: CLASS_COLORS[4], c5: CLASS_COLORS[5] })
  const cents = f.C
  const showRegions = f.labels !== null
  const paint = useMemo(() => {
    const cols = [C.c0, C.c1, C.c2, C.c3, C.c4, C.c5]
    return (x: number, y: number): [number, number, number, number] => {
      let best = 0
      let bd = Infinity
      cents.forEach((c, j) => {
        const d = (x - c[0]) ** 2 + (y - c[1]) ** 2
        if (d < bd) {
          bd = d
          best = j
        }
      })
      const c = cols[best]
      return [c[0], c[1], c[2], 30]
    }
  }, [C, cents])
  return (
    <>
      {showRegions && <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={4} />}
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="K-means clustering">
        <Axes f={fr} xLabel="x₁" yLabel="x₂" />
        <AnimatePresence>
          {f.phase === 'assign' &&
            pts.map((p, i) => (
              <motion.line
                key={`l${i}`}
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(cents[f.labels![i]][0])}
                y2={sy(cents[f.labels![i]][1])}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                strokeWidth={1}
                style={{ stroke: CLASS_COLORS[f.labels![i]] }}
              />
            ))}
        </AnimatePresence>
        {f.trails.map((t, j) => (
          <path key={`t${j}`} d={pathOf(t.map(([a, b]) => [sx(a), sy(b)]))} fill="none" strokeWidth={1.5} strokeDasharray="3 4" style={{ stroke: 'var(--fg-muted)' }} />
        ))}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={4.6}
            strokeWidth={1.3}
            style={{ fill: f.labels ? CLASS_COLORS[f.labels[i]] : 'var(--fg-subtle)', stroke: 'var(--bg)', transition: `fill 0.5s ease ${(i % 12) * 0.02}s` }}
          />
        ))}
        {cents.map((c, j) => (
          <motion.g key={`c${j}`} initial={false} animate={{ x: sx(c[0]), y: sy(c[1]) }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
            <circle r={16} style={{ fill: `color-mix(in oklab, ${CLASS_COLORS[j]} 22%, transparent)` }} />
            <rect x={-8} y={-8} width={16} height={16} rx={4} transform="rotate(45)" strokeWidth={2.5} style={{ fill: CLASS_COLORS[j], stroke: 'var(--fg)' }} />
          </motion.g>
        ))}
      </svg>
    </>
  )
}

function InertiaChart({ box, values }: { box: Box; values: number[] }) {
  const top = Math.max(1, ...values)
  const fr = frame2d(box, [1, Math.max(6, values.length)], [0, top * 1.1], { l: 40, b: 20, t: 6, r: 8 })
  const pts = values.map((v, i) => [fr.sx(i + 1), fr.sy(v)] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={6} yTicks={3} xLabel="iteration" />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} style={{ fill: 'var(--accent-3)' }} />
      ))}
    </svg>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { CLASS_COLORS, moons, type Point } from '../core/datasets'

const CODE = `import numpy as np

def dbscan(X, eps, min_pts):
    labels = np.full(len(X), -1)          # -1 = noise / not yet assigned
    cluster = 0
    for i in range(len(X)):
        if labels[i] != -1:
            continue
        nbrs = region_query(X, i, eps)    # points within eps (incl. i)
        if len(nbrs) < min_pts:
            continue                      # not a core point
        labels[i] = cluster               # start a new cluster
        queue = list(nbrs)
        while queue:                      # grow it outward
            j = queue.pop()
            if labels[j] == -1:
                labels[j] = cluster
                more = region_query(X, j, eps)
                if len(more) >= min_pts:  # j is also a core point
                    queue.extend(more)
        cluster += 1
    return labels`

interface Frame extends StepFrame {
  labels: number[]
  core: boolean[]
  focus?: number
  ring?: number
  clusters: number
  phase: 'start' | 'check' | 'skip' | 'seed' | 'grow' | 'done'
}

function makeData(): Point[] {
  const r = rng(19)
  const pts = moons(26, 0.075, 6).map((p) => ({ x: p.x * 1.45 - 0.7, y: p.y * 1.45 - 0.2, c: 0 }))
  for (let i = 0; i < 9; i++) pts.push({ x: r.range(-2.5, 2.6), y: r.range(-1.5, 1.8), c: 0 })
  return pts
}

function* program(pts: Point[], eps: number, minPts: number): Generator<Frame, void, void> {
  const n = pts.length
  const labels = new Array(n).fill(-1)
  const core = new Array(n).fill(false)
  const near = (i: number) => {
    const out: number[] = []
    for (let j = 0; j < n; j++) if ((pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2 <= eps * eps) out.push(j)
    return out
  }
  let cluster = 0
  const snap = (x: Omit<Frame, 'labels' | 'core' | 'clusters'>): Frame => ({ ...x, labels: [...labels], core: [...core], clusters: cluster })
  yield snap({ phase: 'start', line: [4, 5], dwell: 1.6, note: `Every point starts unlabelled. A point is a core point if at least ${minPts} points (itself included) lie within ε = ${eps.toFixed(2)}.` })
  let narrated = 0
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue
    const nb = near(i)
    if (nb.length < minPts) {
      yield snap({ phase: 'skip', focus: i, ring: i, line: [9, 11], dwell: narrated < 1 ? 1.4 : 0.35, note: `Point ${i}: only ${nb.length} neighbour${nb.length === 1 ? '' : 's'} within ε → not a core point. Stays noise unless a cluster reaches it.` })
      narrated++
      continue
    }
    core[i] = true
    labels[i] = cluster
    yield snap({ phase: 'seed', focus: i, ring: i, line: [12, 13], dwell: 1.4, note: `Point ${i} has ${nb.length} neighbours → core point. Start cluster ${cluster} and queue its neighbours.` })
    const queue = [...nb]
    let steps = 0
    while (queue.length) {
      const j = queue.pop()!
      if (labels[j] === -1) {
        labels[j] = cluster
        const more = near(j)
        if (more.length >= minPts) {
          core[j] = true
          queue.push(...more)
        }
        yield snap({ phase: 'grow', focus: j, ring: core[j] ? j : undefined, line: core[j] ? [18, 20] : [16, 17], dwell: steps < 3 && cluster === 0 ? 1 : 0.22, note: core[j] ? `Point ${j} is also core → its ε-neighbourhood joins the queue; the cluster spreads.` : `Point ${j} is a border point: in the cluster, but it does not expand it.` })
        steps++
      }
    }
    cluster++
  }
  yield snap({ phase: 'done', line: 22, dwell: 6, note: `Found ${cluster} cluster${cluster === 1 ? '' : 's'} of arbitrary shape; grey points are noise (label −1). No k had to be chosen.` })
}

export default function Dbscan() {
  const [eps, setEps] = useState(0.38)
  const [minPts, setMinPts] = useState(4)
  const pts = useMemo(makeData, [])
  const player = usePlayer(() => program(pts, eps, minPts), [eps, minPts], { interval: 600, loop: 2600 })
  const fr = player.frame
  const noise = fr.phase === 'done' ? fr.labels.filter((l) => l === -1).length : 0

  return (
    <LabFrame
      title="DBSCAN · density-based clustering"
      status={`${fr.clusters} cluster${fr.clusters === 1 ? '' : 's'}${fr.phase === 'done' ? ` · ${noise} noise` : ''}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Board box={box} pts={pts} f={fr} eps={eps} />}
        </Stage>
      }
      legend={[
        { label: 'core point', color: 'var(--fg)', shape: 'ring' },
        { label: 'ε-neighbourhood', color: 'var(--accent)', shape: 'ring' },
        { label: 'noise', color: 'var(--fg-subtle)' },
      ]}
      code={{
        source: CODE,
        file: 'dbscan.py',
        vars: [
          { name: 'eps', value: eps.toFixed(2), color: 'var(--accent)' },
          { name: 'min_pts', value: String(minPts) },
          { name: 'i / j', value: fr.focus !== undefined ? String(fr.focus) : '—' },
          { name: 'cluster', value: String(fr.clusters), color: 'var(--accent-2)' },
          { name: 'core points', value: String(fr.core.filter(Boolean).length) },
          { name: 'labelled', value: `${fr.labels.filter((l) => l >= 0).length}/${pts.length}` },
        ],
      }}
      params={
        <>
          <Slider label="ε (neighbourhood radius)" value={eps} min={0.2} max={0.7} step={0.02} onChange={setEps} format={(v) => v.toFixed(2)} />
          <Slider label="min_pts" value={minPts} min={2} max={8} onChange={setMinPts} />
        </>
      }
    />
  )
}

function Board({ box, pts, f, eps }: { box: Box; pts: Point[]; f: Frame; eps: number }) {
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-2.8, 2.8], [-2.8 * aspect + 0.15, 2.8 * aspect + 0.15], pad)
  const { sx, sy } = fr
  const rx = Math.abs(sx(eps) - sx(0))
  const ry = Math.abs(sy(eps) - sy(0))
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="DBSCAN expanding clusters">
      <Axes f={fr} xLabel="x₁" yLabel="x₂" />
      {pts.map((p, i) =>
        f.core[i] ? (
          <motion.ellipse
            key={`e${i}`}
            cx={sx(p.x)}
            cy={sy(p.y)}
            initial={{ rx: 0, ry: 0, opacity: 0 }}
            animate={{ rx, ry, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ fill: `color-mix(in oklab, ${CLASS_COLORS[f.labels[i] % CLASS_COLORS.length]} 9%, transparent)`, stroke: `color-mix(in oklab, ${CLASS_COLORS[f.labels[i] % CLASS_COLORS.length]} 35%, transparent)` }}
            strokeWidth={1}
          />
        ) : null,
      )}
      {f.ring !== undefined && (
        <motion.ellipse
          key={`ring-${f.ring}`}
          cx={sx(pts[f.ring].x)}
          cy={sy(pts[f.ring].y)}
          initial={{ rx: 0, ry: 0 }}
          animate={{ rx, ry }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 4"
          style={{ stroke: f.phase === 'skip' ? 'var(--fg-subtle)' : 'var(--accent)' }}
        />
      )}
      {pts.map((p, i) => {
        const l = f.labels[i]
        const isNoise = l === -1
        return (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={f.core[i] ? 5.2 : 4.4}
            strokeWidth={f.core[i] ? 1.8 : 1.2}
            style={{
              fill: isNoise ? 'var(--fg-subtle)' : CLASS_COLORS[l % CLASS_COLORS.length],
              stroke: f.core[i] ? 'var(--fg)' : 'var(--bg)',
              opacity: isNoise && f.phase === 'done' ? 0.55 : 1,
              transition: 'fill 0.35s',
            }}
          />
        )
      })}
      {f.focus !== undefined && (
        <motion.circle initial={false} animate={{ cx: sx(pts[f.focus].x), cy: sy(pts[f.focus].y) }} transition={{ duration: 0.2 }} r={9.5} fill="none" strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
      )}
      <text x={fr.right - 6} y={fr.top + 15} textAnchor="end" className="viz-text" fontSize={12}>
        ε = {fmt(eps, 2)}
      </text>
    </svg>
  )
}

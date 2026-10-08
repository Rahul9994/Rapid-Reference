import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, fitFrame, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, mean, rng } from '../core/math'
import { eig2 } from '../core/linalg'

const CODE = `import numpy as np

X_c = X - X.mean(axis=0)                 # 1. centre the data
cov = np.cov(X_c, rowvar=False)          # 2. covariance matrix
eigvals, eigvecs = np.linalg.eigh(cov)   # 3. eigen-decomposition
order = np.argsort(eigvals)[::-1]        # 4. sort by variance
components = eigvecs[:, order]
explained = eigvals[order] / eigvals.sum()
Z = X_c @ components[:, :1]              # 5. project onto PC1
X_back = Z @ components[:, :1].T         #    (reconstruct in 2-D)`

interface Data {
  raw: [number, number][]
  mx: number
  my: number
  cov: [number, number, number]
  eig: ReturnType<typeof eig2>
}

function makeData(corr: number): Data {
  const r = rng(29)
  const raw: [number, number][] = []
  for (let i = 0; i < 46; i++) {
    const a = r.normal(0, 1.35)
    const b = r.normal(0, 0.45)
    const ang = Math.atan(corr)
    raw.push([3 + a * Math.cos(ang) - b * Math.sin(ang), 2.2 + a * Math.sin(ang) + b * Math.cos(ang)])
  }
  const mx = mean(raw.map((p) => p[0]))
  const my = mean(raw.map((p) => p[1]))
  const n = raw.length
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const [x, y] of raw) {
    sxx += (x - mx) ** 2
    sxy += (x - mx) * (y - my)
    syy += (y - my) ** 2
  }
  const cov: [number, number, number] = [sxx / (n - 1), sxy / (n - 1), syy / (n - 1)]
  return { raw, mx, my, cov, eig: eig2(cov[0], cov[1], cov[2]) }
}

type Phase = 'raw' | 'center' | 'cov' | 'sweep' | 'eig' | 'project' | 'reduce'

interface Frame extends StepFrame {
  phase: Phase
  angle: number
  sweep: [number, number][]
}

function* program(d: Data): Generator<Frame, void, void> {
  const pc = d.eig.vectors[0]
  let best = Math.atan2(pc[1], pc[0])
  if (best > Math.PI / 2) best -= Math.PI
  if (best < -Math.PI / 2) best += Math.PI
  const variance = (a: number) => {
    const u = [Math.cos(a), Math.sin(a)]
    return mean(d.raw.map(([x, y]) => ((x - d.mx) * u[0] + (y - d.my) * u[1]) ** 2)) * (d.raw.length / (d.raw.length - 1))
  }
  yield { phase: 'raw', angle: 0, sweep: [], line: 1, dwell: 1.4, note: 'Two correlated features. PCA looks for new axes that capture as much of the spread as possible.' }
  yield { phase: 'center', angle: 0, sweep: [], line: 3, dwell: 1.6, note: 'Step 1 — centre: subtract the mean so the cloud sits on the origin.' }
  yield { phase: 'cov', angle: 0, sweep: [], line: 4, dwell: 1.8, note: 'Step 2 — covariance: how the features vary together. Its shape is the ellipse around the data.' }
  const sweep: [number, number][] = []
  const N = 36
  for (let k = 0; k <= N; k++) {
    const a = -Math.PI / 2 + (Math.PI * k) / N
    sweep.push([a, variance(a)])
    yield { phase: 'sweep', angle: a, sweep: [...sweep], line: 5, dwell: k === 0 ? 1.2 : 0.16, note: 'Intuition: spin a line through the origin and measure the variance of the points projected onto it…' }
  }
  yield { phase: 'eig', angle: best, sweep, line: [5, 8], dwell: 2.2, note: `…the maximum is exactly the top eigenvector of the covariance matrix: PC1 explains ${(d.eig.values[0] / (d.eig.values[0] + d.eig.values[1]) * 100).toFixed(1)}% of the variance. PC2 is perpendicular to it.` }
  yield { phase: 'project', angle: best, sweep, line: 9, dwell: 2, note: 'Step 5 — project: each point drops perpendicularly onto PC1.' }
  yield { phase: 'reduce', angle: best, sweep, line: [9, 10], dwell: 3, note: 'Keep only that one coordinate: 2 features → 1, losing only the small PC2 spread.' }
}

export default function Pca() {
  const [corr, setCorr] = useState(0.65)
  const data = useMemo(() => makeData(corr), [corr])
  const player = usePlayer(() => program(data), [data], { interval: 650, loop: 2400 })
  const fr = player.frame
  const ratio = data.eig.values[0] / (data.eig.values[0] + data.eig.values[1])

  return (
    <LabFrame
      title="Principal component analysis"
      status={`PC1 explains ${(ratio * 100).toFixed(1)}%`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Board box={box} d={data} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'data', color: 'var(--accent-2)' },
        { label: 'PC1', color: 'var(--accent)', shape: 'line' },
        { label: 'PC2', color: 'var(--accent-3)', shape: 'line' },
        { label: 'projections', color: 'var(--fg-subtle)', shape: 'dash' },
      ]}
      below={
        <MiniPanel title="Variance of the projection vs angle" right={fr.sweep.length ? fmt(fr.sweep[fr.sweep.length - 1][1], 3) : undefined}>
          <Stage aspect={0.25} min={110} max={140}>
            {(box) => <SweepChart box={box} f={fr} max={data.eig.values[0]} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'pca.py',
        vars: [
          { name: 'mean', value: `[${fmt(data.mx, 2)}, ${fmt(data.my, 2)}]` },
          { name: 'cov', value: `[[${fmt(data.cov[0], 2)}, ${fmt(data.cov[1], 2)}], …]` },
          { name: 'eigvals', value: `[${fmt(data.eig.values[0], 3)}, ${fmt(data.eig.values[1], 3)}]`, color: 'var(--accent)' },
          { name: 'PC1', value: `[${fmt(data.eig.vectors[0][0], 2)}, ${fmt(data.eig.vectors[0][1], 2)}]`, color: 'var(--accent)' },
          { name: 'explained', value: `[${fmt(ratio, 3)}, ${fmt(1 - ratio, 3)}]`, color: 'var(--accent-3)' },
        ],
      }}
      params={<Slider label="Correlation (slope of the cloud)" value={corr} min={-1.4} max={1.4} step={0.05} onChange={setCorr} format={(v) => v.toFixed(2)} />}
    />
  )
}

function Board({ box, d, f }: { box: Box; d: Data; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const all: [number, number][] = [...d.raw, ...d.raw.map(([x, y]) => [x - d.mx, y - d.my] as [number, number]), [0, 0]]
  const fr = fitFrame(box, all, pad, 0.08)
  const { sx, sy } = fr
  const centered = f.phase !== 'raw'
  const off = centered ? [d.mx, d.my] : [0, 0]
  const u = [Math.cos(f.angle), Math.sin(f.angle)]
  const showAxis = f.phase === 'sweep' || f.phase === 'eig' || f.phase === 'project' || f.phase === 'reduce'
  const proj = (p: [number, number]) => {
    const x = p[0] - d.mx
    const y = p[1] - d.my
    const t = x * u[0] + y * u[1]
    return [t * u[0], t * u[1]] as [number, number]
  }
  const L = 6
  const pc2 = d.eig.vectors[1]
  const sd = [Math.sqrt(d.eig.values[0]), Math.sqrt(d.eig.values[1])]
  const ang = (Math.atan2(d.eig.vectors[0][1], d.eig.vectors[0][0]) * 180) / Math.PI
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="PCA projecting 2-D data onto its first principal component">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xLabel="x₁" yLabel="x₂" zeroLines />
      <g clipPath={`url(#${clip})`}>
        {(f.phase === 'cov' || f.phase === 'sweep' || f.phase === 'eig') && (
          <motion.ellipse
            cx={sx(0)}
            cy={sy(0)}
            rx={Math.abs(sx(2 * sd[0]) - sx(0))}
            ry={Math.abs(sy(2 * sd[1]) - sy(0))}
            transform={`rotate(${-ang} ${sx(0)} ${sy(0)})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            style={{ fill: 'color-mix(in oklab, var(--accent) 7%, transparent)', stroke: 'var(--accent)' }}
          />
        )}
        {showAxis && (
          <motion.line
            initial={false}
            animate={{ x1: sx(-u[0] * L), y1: sy(-u[1] * L), x2: sx(u[0] * L), y2: sy(u[1] * L) }}
            transition={{ duration: 0.2 }}
            strokeWidth={2.5}
            style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent))' }}
          />
        )}
        {(f.phase === 'eig' || f.phase === 'project') && (
          <line x1={sx(-pc2[0] * 3)} y1={sy(-pc2[1] * 3)} x2={sx(pc2[0] * 3)} y2={sy(pc2[1] * 3)} strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
        )}
        {(f.phase === 'sweep' || f.phase === 'project') &&
          d.raw.map((p, i) => {
            const q = proj(p)
            return <line key={`p${i}`} x1={sx(p[0] - d.mx)} y1={sy(p[1] - d.my)} x2={sx(q[0])} y2={sy(q[1])} strokeWidth={1} strokeDasharray="2 3" style={{ stroke: 'var(--fg-subtle)' }} />
          })}
        {(f.phase === 'sweep' || f.phase === 'project') &&
          d.raw.map((p, i) => {
            const q = proj(p)
            return <circle key={`q${i}`} cx={sx(q[0])} cy={sy(q[1])} r={2.6} style={{ fill: 'var(--accent)' }} />
          })}
      </g>
      {d.raw.map((p, i) => {
        const target = f.phase === 'reduce' ? proj(p) : ([p[0] - off[0], p[1] - off[1]] as [number, number])
        return (
          <motion.circle
            key={i}
            initial={false}
            animate={{ cx: sx(target[0]), cy: sy(target[1]) }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: (i % 15) * 0.012 }}
            r={4.5}
            strokeWidth={1.3}
            style={{ fill: f.phase === 'reduce' ? 'var(--accent)' : 'var(--accent-2)', stroke: 'var(--bg)', transition: 'fill 0.6s' }}
          />
        )
      })}
      {!centered && <circle cx={sx(d.mx)} cy={sy(d.my)} r={5} fill="none" strokeWidth={2} style={{ stroke: 'var(--fg)' }} />}
    </svg>
  )
}

function SweepChart({ box, f, max }: { box: Box; f: Frame; max: number }) {
  const fr = frame2d(box, [-90, 90], [0, max * 1.1], { l: 34, b: 20, t: 6, r: 8 })
  const pts = f.sweep.map(([a, v]) => [fr.sx((a * 180) / Math.PI), fr.sy(v)] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={6} yTicks={3} xLabel="angle (°)" digits={1} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
      {(f.phase === 'eig' || f.phase === 'project' || f.phase === 'reduce') && (
        <circle cx={fr.sx((f.angle * 180) / Math.PI)} cy={fr.sy(max)} r={5} fill="none" strokeWidth={2} style={{ stroke: 'var(--easy)' }} />
      )}
    </svg>
  )
}

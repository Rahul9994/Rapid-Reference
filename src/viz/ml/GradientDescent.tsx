import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Pills, Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, FieldCanvas, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { useThemeColors } from '../core/hooks'

type Method = 'gd' | 'sgd' | 'momentum'

const CODE = `import numpy as np

A = np.array([[3.0, 1.2],
              [1.2, 1.0]])      # f(w) = ½ wᵀAw: a tilted bowl

def grad(w):
    return A @ w               # ∇f(w)

w = np.array([-4.0, 3.0])       # starting point
v = np.zeros(2)                 # velocity (momentum)
lr, method = 0.15, "momentum"   # or "gd" / "sgd"
for step in range(60):
    g = grad(w)
    if method == "sgd":         # noisy mini-batch estimate
        g = g + np.random.normal(0, 1.5, size=2)
    if method == "momentum":
        v = 0.9 * v + g         # accumulate past gradients
        g = v
    w = w - lr * g              # step against the gradient`

const A = [
  [3, 1.2],
  [1.2, 1],
]
const STEPS = 60
const f = (w: number, v: number) => 0.5 * (A[0][0] * w * w + 2 * A[0][1] * w * v + A[1][1] * v * v)
const gradAt = (w: number, v: number): [number, number] => [A[0][0] * w + A[0][1] * v, A[1][0] * w + A[1][1] * v]

interface Frame extends StepFrame {
  step: number
  w: [number, number]
  g?: [number, number]
  path: [number, number][]
  losses: number[]
  diverged?: boolean
}

function* program(method: Method, lr: number, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  let w: [number, number] = [-4, 3]
  let v: [number, number] = [0, 0]
  const path: [number, number][] = [[...w]]
  const losses = [f(...w)]
  const snap = (x: Omit<Frame, 'w' | 'path' | 'losses'>): Frame => ({ ...x, w: [...w] as [number, number], path: [...path], losses: [...losses] })
  yield snap({ step: 0, line: [3, 4], dwell: 1.4, note: 'The loss surface: a stretched, tilted bowl. Its lowest point (the minimum) is at w = (0, 0).' })
  yield snap({ step: 0, line: [9, 11], dwell: 1.2, note: 'Start far from the minimum. Darker contours mean lower loss.' })
  for (let s = 0; s < STEPS; s++) {
    const narrate = s < 2
    const dwell = narrate ? 1.3 : s < 6 ? 0.5 : 0.18
    let g = gradAt(...w)
    yield snap({ step: s, g, line: 13, dwell, note: narrate ? 'Compute the gradient: the direction of steepest ascent at the current point.' : `Step ${s + 1}: gradient → (optional noise / momentum) → move.` })
    if (method === 'sgd') {
      g = [g[0] + r.normal(0, 1.5), g[1] + r.normal(0, 1.5)]
      yield snap({ step: s, g, line: [14, 15], dwell, note: narrate ? 'SGD sees only a mini-batch, so its gradient estimate is noisy — the path jitters.' : `Step ${s + 1}: noisy gradient from a mini-batch.` })
    }
    if (method === 'momentum') {
      v = [0.9 * v[0] + g[0], 0.9 * v[1] + g[1]]
      g = v
      yield snap({ step: s, g, line: [16, 18], dwell, note: narrate ? 'Momentum keeps a running sum of past gradients — it builds speed along the valley.' : `Step ${s + 1}: velocity = 0.9·velocity + gradient.` })
    }
    w = [w[0] - lr * g[0], w[1] - lr * g[1]]
    path.push([...w])
    losses.push(f(...w))
    if (!Number.isFinite(w[0]) || Math.abs(w[0]) + Math.abs(w[1]) > 60) {
      yield snap({ step: s + 1, diverged: true, line: 19, dwell: 4, note: 'Diverged — the learning rate is too big for the steepest direction, so every step overshoots further.' })
      return
    }
    yield snap({ step: s + 1, line: 19, dwell, note: narrate ? 'Take a step downhill: w ← w − lr · g.' : `Step ${s + 1}: loss = ${fmt(losses[losses.length - 1], 4)}` })
  }
  yield snap({ step: STEPS, line: 19, dwell: 5, note: `Finished ${STEPS} steps. Final loss ${fmt(losses[losses.length - 1], 5)}.` })
}

export default function GradientDescent() {
  const [method, setMethod] = useState<Method>('gd')
  const [lr, setLr] = useState(0.15)
  const [seed, setSeed] = useState(3)
  const player = usePlayer(() => program(method, lr, seed), [method, lr, seed], { interval: 560, loop: 2400 })
  const fr = player.frame
  const last = fr.losses[fr.losses.length - 1]

  return (
    <LabFrame
      title="Gradient descent on a loss surface"
      status={fr.diverged ? 'diverged' : `step ${fr.step}/${STEPS}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={480}>
          {(box) => <Surface box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'path of w', color: 'var(--accent-3)', shape: 'line' },
        { label: 'gradient step', color: 'var(--accent-2)', shape: 'line' },
        { label: 'minimum', color: 'var(--accent)' },
      ]}
      below={
        <MiniPanel title="Loss f(w) per step (log scale)" right={fmt(last, 4)}>
          <Stage aspect={0.26} min={110} max={150}>
            {(box) => <LossLog box={box} losses={fr.losses} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'gradient_descent.py',
        vars: [
          { name: 'step', value: String(fr.step) },
          { name: 'w', value: `[${fmt(fr.w[0], 2)}, ${fmt(fr.w[1], 2)}]`, color: 'var(--accent-3)' },
          { name: 'f(w)', value: fmt(last, 4), color: 'var(--accent)' },
          { name: 'g', value: fr.g ? `[${fmt(fr.g[0], 2)}, ${fmt(fr.g[1], 2)}]` : '—', color: 'var(--accent-2)' },
          { name: 'lr', value: lr.toFixed(2) },
          { name: 'method', value: method },
        ],
      }}
      params={
        <>
          <Pills
            label="Optimizer"
            value={method}
            onChange={(m) => {
              setMethod(m)
              setSeed((s) => s + 1)
            }}
            options={[
              { value: 'gd', label: 'Batch GD' },
              { value: 'sgd', label: 'SGD' },
              { value: 'momentum', label: 'Momentum' },
            ]}
          />
          <Slider label="Learning rate" value={lr} min={0.02} max={0.65} step={0.01} onChange={setLr} format={(v) => v.toFixed(2)} />
        </>
      }
    />
  )
}

function Surface({ box, f: fr }: { box: Box; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const marker = `gd-arrow-${clip}`
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const xr = 6
  const fr2 = frame2d(box, [-xr, xr], [-xr * aspect, xr * aspect], pad)
  const { sx, sy } = fr2
  const C = useThemeColors({ a: 'var(--accent)', bg: 'var(--bg)', fg: 'var(--fg)' })
  const maxF = f(xr, xr * aspect)
  const paint = useMemo(
    () => (x: number, y: number): [number, number, number, number] => {
      const v = f(x, y)
      const t = Math.sqrt(v / maxF)
      const band = Math.abs(((t * 9) % 1) - 0.5) < 0.06 ? 0.22 : 0
      const k = Math.max(0, 1 - t)
      return [C.a[0], C.a[1], C.a[2], Math.round(255 * Math.min(0.75, k * 0.42 + band))]
    },
    [C, maxF],
  )
  const g = fr.g
  const gl = g ? Math.hypot(g[0], g[1]) : 0
  const scale = g && gl ? Math.min(2.2, gl * 0.4) / gl : 0
  return (
    <>
      <FieldCanvas f={fr2} paint={paint} deps={[paint]} resolution={3} />
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Contour plot with the optimizer path">
        <defs>
          <ClipRect id={clip} f={fr2} />
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent-2)' }} />
          </marker>
        </defs>
        <Axes f={fr2} xLabel="w₁" yLabel="w₂" zeroLines />
        <g clipPath={`url(#${clip})`}>
          <circle cx={sx(0)} cy={sy(0)} r={5} style={{ fill: 'var(--accent)' }} />
          <circle cx={sx(0)} cy={sy(0)} r={11} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--accent)' }} opacity={0.5} />
          <path d={pathOf(fr.path.map(([a, b]) => [sx(a), sy(b)]))} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: 'var(--accent-3)' }} />
          {fr.path.map(([a, b], i) => (
            <circle key={i} cx={sx(a)} cy={sy(b)} r={2.2} style={{ fill: 'var(--accent-3)' }} />
          ))}
          {g && (
            <line
              x1={sx(fr.w[0])}
              y1={sy(fr.w[1])}
              x2={sx(fr.w[0] - g[0] * scale)}
              y2={sy(fr.w[1] - g[1] * scale)}
              strokeWidth={2.5}
              markerEnd={`url(#${marker})`}
              style={{ stroke: 'var(--accent-2)' }}
            />
          )}
          <motion.circle
            initial={false}
            animate={{ cx: sx(fr.w[0]), cy: sy(fr.w[1]) }}
            transition={{ type: 'spring', stiffness: 170, damping: 22 }}
            r={7}
            strokeWidth={2.5}
            style={{ fill: 'var(--bg)', stroke: 'var(--accent-3)', filter: 'drop-shadow(0 0 6px var(--accent-3))' }}
          />
        </g>
      </svg>
    </>
  )
}

function LossLog({ box, losses }: { box: Box; losses: number[] }) {
  const logs = losses.map((v) => Math.log10(Math.max(v, 1e-8)))
  const top = Math.max(2, ...logs)
  const fr = frame2d(box, [0, STEPS], [-6, Math.ceil(top)], { l: 34, b: 20, t: 6, r: 8 })
  const pts = logs.map((v, i) => [fr.sx(i), fr.sy(Math.max(-6, v))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={6} yTicks={3} xLabel="step" />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} style={{ fill: 'var(--accent-3)' }} />}
    </svg>
  )
}

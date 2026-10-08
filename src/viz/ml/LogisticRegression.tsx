import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, FieldCanvas, Stage, curve, frame2d, pathOf, type Box, type Frame2D } from '../core/plot'
import { fmt, mean, sigmoid } from '../core/math'
import { blobs, CLASS_COLORS, type Point } from '../core/datasets'
import { useThemeColors } from '../core/hooks'

const CODE = `import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

w, b = np.zeros(2), 0.0
for epoch in range(150):
    z = X @ w + b                 # linear score
    p = sigmoid(z)                # P(y = 1 | x)
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    dw = X.T @ (p - y) / n        # gradient of log-loss
    db = np.mean(p - y)
    w -= lr * dw
    b -= lr * db`

const EPOCHS = 150

interface Frame extends StepFrame {
  epoch: number
  w: [number, number]
  b: number
  loss?: number
  losses: number[]
  phase: 'init' | 'score' | 'loss' | 'grad' | 'update' | 'done'
}

function* program(pts: Point[], lr: number): Generator<Frame, void, void> {
  let w: [number, number] = [0, 0]
  let b = 0
  const n = pts.length
  const losses: number[] = []
  const snap = (x: Omit<Frame, 'w' | 'b' | 'losses'>): Frame => ({ ...x, w: [...w] as [number, number], b, losses: [...losses] })
  yield snap({ epoch: 0, phase: 'init', line: 6, dwell: 1.5, note: 'Start with w = 0: every point gets p = σ(0) = 0.5 — the model is completely unsure.' })
  for (let e = 0; e < EPOCHS; e++) {
    const narrate = e < 2
    const dwell = narrate ? 1.4 : e < 6 ? 0.5 : 0.1
    const quick = `Epoch ${e + 1}: score → sigmoid → log-loss → gradient → update.`
    const ps = pts.map((p) => sigmoid(w[0] * p.x + w[1] * p.y + b))
    yield snap({ epoch: e, phase: 'score', line: [8, 9], dwell, note: narrate ? 'z = w·x + b is a signed distance from the boundary; the sigmoid squashes it into a probability.' : quick })
    const loss = -mean(pts.map((p, i) => (p.c === 1 ? Math.log(ps[i] + 1e-12) : Math.log(1 - ps[i] + 1e-12))))
    losses.push(loss)
    yield snap({ epoch: e, phase: 'loss', loss, line: 10, dwell, note: narrate ? 'Log-loss punishes confident mistakes hard: predicting 0.01 for a true 1 costs −log(0.01) ≈ 4.6.' : quick })
    const err = ps.map((p, i) => p - pts[i].c)
    const dw: [number, number] = [pts.reduce((s, p, i) => s + p.x * err[i], 0) / n, pts.reduce((s, p, i) => s + p.y * err[i], 0) / n]
    const db = mean(err)
    yield snap({ epoch: e, phase: 'grad', loss, line: [11, 12], dwell, note: narrate ? 'The gradient is simply (p − y)·x averaged over points — the same form as linear regression.' : quick })
    w = [w[0] - lr * dw[0], w[1] - lr * dw[1]]
    b -= lr * db
    yield snap({ epoch: e, phase: 'update', loss, line: [13, 14], dwell, note: narrate ? 'Step downhill: the decision boundary (p = 0.5) rotates and slides toward the gap between classes.' : quick })
  }
  yield snap({ epoch: EPOCHS, phase: 'done', loss: losses[losses.length - 1], line: [13, 14], dwell: 5, note: 'Trained. Points far from the boundary get confident probabilities; points near it stay close to 0.5.' })
}

export default function LogisticRegression() {
  const [lr, setLr] = useState(0.5)
  const [spread, setSpread] = useState(0.7)
  const pts = useMemo(() => blobs([[-1, -0.6], [1, 0.7]], 26, spread, 4), [spread])
  const player = usePlayer(() => program(pts, lr), [pts, lr], { interval: 600, loop: 2600 })
  const fr = player.frame
  const acc = mean(pts.map((p) => ((sigmoid(fr.w[0] * p.x + fr.w[1] * p.y + fr.b) >= 0.5 ? 1 : 0) === p.c ? 1 : 0)))

  return (
    <LabFrame
      title="Logistic regression · learning a boundary"
      status={fr.phase === 'done' ? `accuracy ${(acc * 100).toFixed(0)}%` : `epoch ${Math.min(fr.epoch + 1, EPOCHS)}/${EPOCHS}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Field box={box} pts={pts} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'class 0', color: CLASS_COLORS[0] },
        { label: 'class 1', color: CLASS_COLORS[1] },
        { label: 'boundary p = 0.5', color: 'var(--fg)', shape: 'line' },
        { label: 'p = 0.1 / 0.9', color: 'var(--fg-subtle)', shape: 'dash' },
      ]}
      below={
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniPanel title="Sigmoid: z → p">
            <Stage aspect={0.55} min={140} max={190}>
              {(box) => <SigmoidPanel box={box} pts={pts} f={fr} />}
            </Stage>
          </MiniPanel>
          <MiniPanel title="Log-loss per epoch" right={fmt(fr.losses[fr.losses.length - 1], 3)}>
            <Stage aspect={0.55} min={140} max={190}>
              {(box) => <LossPanel box={box} losses={fr.losses} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{
        source: CODE,
        file: 'logistic_regression.py',
        vars: [
          { name: 'epoch', value: String(Math.min(fr.epoch + 1, EPOCHS)) },
          { name: 'w', value: `[${fmt(fr.w[0], 2)}, ${fmt(fr.w[1], 2)}]`, color: 'var(--accent)' },
          { name: 'b', value: fmt(fr.b, 3), color: 'var(--accent)' },
          { name: 'loss', value: fmt(fr.loss, 4), color: 'var(--accent-3)' },
          { name: 'accuracy', value: `${(acc * 100).toFixed(1)}%`, color: 'var(--easy)' },
          { name: 'lr', value: lr.toFixed(2) },
        ],
      }}
      params={
        <>
          <Slider label="Learning rate" value={lr} min={0.05} max={3} step={0.05} onChange={setLr} format={(v) => v.toFixed(2)} />
          <Slider label="Class overlap" value={spread} min={0.3} max={1.3} step={0.05} onChange={setSpread} format={(v) => `σ = ${v.toFixed(2)}`} />
        </>
      }
    />
  )
}

function boundaryLine(fr: Frame2D, w: [number, number], b: number, p: number) {
  // w·x + b = logit(p)
  const z = Math.log(p / (1 - p))
  const [x0, x1] = fr.sx.domain
  const [y0, y1] = fr.sy.domain
  if (Math.abs(w[1]) > Math.abs(w[0])) {
    const y = (x: number) => (z - b - w[0] * x) / w[1]
    return { x1: fr.sx(x0), y1: fr.sy(y(x0)), x2: fr.sx(x1), y2: fr.sy(y(x1)) }
  }
  if (Math.abs(w[0]) < 1e-9) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  const x = (y: number) => (z - b - w[1] * y) / w[0]
  return { x1: fr.sx(x(y0)), y1: fr.sy(y0), x2: fr.sx(x(y1)), y2: fr.sy(y1) }
}

function Field({ box, pts, f }: { box: Box; pts: Point[]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-3.4, 3.4], [-3.4 * aspect, 3.4 * aspect], pad)
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1] })
  const [w0, w1] = f.w
  const paint = useMemo(
    () => (x: number, y: number): [number, number, number, number] => {
      const p = sigmoid(w0 * x + w1 * y + f.b)
      const c = p >= 0.5 ? C.b : C.a
      return [c[0], c[1], c[2], Math.round(255 * Math.abs(p - 0.5) * 0.5)]
    },
    [C, w0, w1, f.b],
  )
  const started = Math.abs(w0) + Math.abs(w1) > 1e-6
  return (
    <>
      <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={5} />
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Two classes with a learned decision boundary">
        <defs>
          <ClipRect id={clip} f={fr} />
        </defs>
        <Axes f={fr} xLabel="x₁" yLabel="x₂" />
        <g clipPath={`url(#${clip})`}>
          {started &&
            [0.1, 0.9].map((p) => (
              <motion.line key={p} initial={false} animate={boundaryLine(fr, f.w, f.b, p)} transition={{ duration: 0.25 }} strokeDasharray="4 5" strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />
            ))}
          {started && (
            <motion.line
              initial={false}
              animate={boundaryLine(fr, f.w, f.b, 0.5)}
              transition={{ duration: 0.25 }}
              strokeWidth={2.5}
              style={{ stroke: 'var(--fg)', filter: 'drop-shadow(0 0 5px color-mix(in oklab, var(--fg) 40%, transparent))' }}
            />
          )}
        </g>
        {pts.map((p, i) => {
          const prob = sigmoid(f.w[0] * p.x + f.w[1] * p.y + f.b)
          const wrong = started && (prob >= 0.5 ? 1 : 0) !== p.c
          return (
            <g key={i}>
              {wrong && <circle cx={fr.sx(p.x)} cy={fr.sy(p.y)} r={9} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--hard)' }} />}
              <circle cx={fr.sx(p.x)} cy={fr.sy(p.y)} r={5} strokeWidth={1.5} style={{ fill: CLASS_COLORS[p.c], stroke: 'var(--bg)' }} />
            </g>
          )
        })}
      </svg>
    </>
  )
}

function SigmoidPanel({ box, pts, f }: { box: Box; pts: Point[]; f: Frame }) {
  const fr = frame2d(box, [-7, 7], [-0.08, 1.08], { l: 30, b: 20, t: 6, r: 8 })
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={4} yTicks={2} xLabel="z" />
      <line x1={fr.sx(0)} x2={fr.sx(0)} y1={fr.top} y2={fr.bottom} className="viz-axis" />
      <path d={curve(fr, sigmoid)} fill="none" strokeWidth={2.2} style={{ stroke: 'var(--accent)' }} />
      {pts.map((p, i) => {
        const z = Math.max(-7, Math.min(7, f.w[0] * p.x + f.w[1] * p.y + f.b))
        return (
          <motion.circle
            key={i}
            initial={false}
            animate={{ cx: fr.sx(z), cy: fr.sy(sigmoid(z)) }}
            transition={{ duration: 0.25 }}
            r={3.4}
            style={{ fill: CLASS_COLORS[p.c], opacity: 0.85 }}
          />
        )
      })}
    </svg>
  )
}

function LossPanel({ box, losses }: { box: Box; losses: number[] }) {
  const fr = frame2d(box, [0, EPOCHS], [0, 0.75], { l: 30, b: 20, t: 6, r: 8 })
  const pts = losses.map((v, i) => [fr.sx(i), fr.sy(Math.min(0.75, v))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={3} yTicks={3} xLabel="epoch" />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
    </svg>
  )
}

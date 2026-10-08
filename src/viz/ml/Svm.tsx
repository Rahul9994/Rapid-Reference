import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Slider, Toggle } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, type Box, type Frame2D } from '../core/plot'
import { fmt, rng } from '../core/math'
import { CLASS_COLORS } from '../core/datasets'

const CODE = `import numpy as np

w, b = np.zeros(2), 0.0
for epoch in range(300):
    margins = y * (X @ w + b)          # functional margin of each point
    viol = margins < 1                 # inside the margin or misclassified
    # gradient of  lam/2·||w||² + mean(max(0, 1 − margin))
    dw = lam * w - (y[viol, None] * X[viol]).sum(axis=0) / n
    db = -y[viol].sum() / n
    w -= lr * dw
    b -= lr * db

support = np.where(margins <= 1 + 1e-3)[0]   # on or inside the margin
margin_width = 2 / np.linalg.norm(w)`

const EPOCHS = 300
const LR = 0.1

interface P {
  x: number
  y: number
  label: 1 | -1
}

interface Frame extends StepFrame {
  epoch: number
  w: [number, number]
  b: number
  viol: boolean[]
  done: boolean
}

function* program(pts: P[], lam: number): Generator<Frame, void, void> {
  const n = pts.length
  let w: [number, number] = [0, 0]
  let b = 0
  const none = pts.map(() => false)
  yield { epoch: 0, w, b, viol: none, done: false, line: 3, dwell: 1.4, note: 'Start with w = 0. Goal: a line with the widest possible “street” between the classes.' }
  for (let e = 0; e < EPOCHS; e++) {
    const margins = pts.map((p) => p.label * (w[0] * p.x + w[1] * p.y + b))
    const viol = margins.map((m) => m < 1)
    const narrate = e < 2
    if (e < 4) {
      const d = narrate ? 1.4 : 0.5
      yield { epoch: e, w, b, viol, done: false, line: [5, 6], dwell: d, note: narrate ? 'Margin = y·(w·x + b). Points with margin < 1 sit inside the street (or on the wrong side) — they are ringed.' : `Epoch ${e + 1}: find margin violators.` }
      yield { epoch: e, w, b, viol, done: false, line: [7, 9], dwell: d, note: narrate ? 'Only the violators push on the boundary (hinge loss); the λ·w term pulls ||w|| down, which widens the street.' : `Epoch ${e + 1}: gradient.` }
    }
    let gx = lam * w[0]
    let gy = lam * w[1]
    let gb = 0
    pts.forEach((p, i) => {
      if (viol[i]) {
        gx -= (p.label * p.x) / n
        gy -= (p.label * p.y) / n
        gb -= p.label / n
      }
    })
    w = [w[0] - LR * gx, w[1] - LR * gy]
    b -= LR * gb
    yield { epoch: e + 1, w, b, viol, done: false, line: e < 4 ? [10, 11] : [5, 11], dwell: e < 2 ? 1.4 : e < 4 ? 0.5 : e < 40 ? 0.12 : 0.04, note: e < 2 ? 'Update w and b. The dashed margin lines are where w·x + b = ±1.' : `Epoch ${e + 1}: street width 2/||w|| = ${fmt(2 / Math.hypot(w[0], w[1]), 3)}` }
  }
  const margins = pts.map((p) => p.label * (w[0] * p.x + w[1] * p.y + b))
  yield { epoch: EPOCHS, w, b, viol: margins.map((m) => m <= 1 + 1e-3), done: true, line: [13, 14], dwell: 6, note: 'Converged. The glowing points on the margin are the support vectors — move any other point and the boundary would not change.' }
}

function makeData(outlier: boolean): P[] {
  const r = rng(5)
  const pts: P[] = []
  for (let i = 0; i < 22; i++) pts.push({ x: r.normal(-1.2, 0.45), y: r.normal(-0.8, 0.45), label: -1 })
  for (let i = 0; i < 22; i++) pts.push({ x: r.normal(1.2, 0.45), y: r.normal(0.9, 0.45), label: 1 })
  if (outlier) pts.push({ x: -0.55, y: -0.05, label: 1 })
  return pts
}

export default function Svm() {
  const [lam, setLam] = useState(0.02)
  const [outlier, setOutlier] = useState(false)
  const pts = useMemo(() => makeData(outlier), [outlier])
  const player = usePlayer(() => program(pts, lam), [pts, lam], { interval: 600, loop: 2600 })
  const fr = player.frame
  const norm = Math.hypot(fr.w[0], fr.w[1])
  const nViol = fr.viol.filter(Boolean).length

  return (
    <LabFrame
      title="Support vector machine · maximising the margin"
      status={fr.done ? `${nViol} support vectors` : `epoch ${fr.epoch}/${EPOCHS}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={480}>
          {(box) => <Board box={box} pts={pts} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'y = −1', color: CLASS_COLORS[0] },
        { label: 'y = +1', color: CLASS_COLORS[1] },
        { label: 'decision boundary', color: 'var(--fg)', shape: 'line' },
        { label: 'margins w·x + b = ±1', color: 'var(--accent)', shape: 'dash' },
        { label: fr.done ? 'support vectors' : 'margin violators', color: fr.done ? 'var(--accent)' : 'var(--hard)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'linear_svm.py',
        vars: [
          { name: 'epoch', value: String(fr.epoch) },
          { name: 'w', value: `[${fmt(fr.w[0], 3)}, ${fmt(fr.w[1], 3)}]`, color: 'var(--accent)' },
          { name: 'b', value: fmt(fr.b, 3), color: 'var(--accent)' },
          { name: 'viol.sum()', value: String(nViol), color: 'var(--hard)' },
          { name: 'margin_width', value: norm > 1e-6 ? fmt(2 / norm, 3) : '∞', color: 'var(--accent-2)' },
          { name: 'C ≈ 1/(n·lam)', value: fmt(1 / (pts.length * lam), 2) },
        ],
      }}
      params={
        <>
          <Slider label="Regularisation λ (smaller = harder margin)" value={lam} min={0.005} max={0.3} step={0.005} onChange={setLam} format={(v) => v.toFixed(3)} />
          <Toggle label="Add an outlier" checked={outlier} onChange={setOutlier} />
        </>
      }
    />
  )
}

function lineAt(fr: Frame2D, w: [number, number], b: number, level: number) {
  const [x0, x1] = fr.sx.domain
  const [y0, y1] = fr.sy.domain
  if (Math.abs(w[1]) >= Math.abs(w[0]) && Math.abs(w[1]) > 1e-9) {
    const y = (x: number) => (level - b - w[0] * x) / w[1]
    return { x1: fr.sx(x0), y1: fr.sy(y(x0)), x2: fr.sx(x1), y2: fr.sy(y(x1)) }
  }
  if (Math.abs(w[0]) < 1e-9) return null
  const x = (y: number) => (level - b - w[1] * y) / w[0]
  return { x1: fr.sx(x(y0)), y1: fr.sy(y0), x2: fr.sx(x(y1)), y2: fr.sy(y1) }
}

function Board({ box, pts, f }: { box: Box; pts: P[]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-3, 3], [-3 * aspect, 3 * aspect], pad)
  const { sx, sy } = fr
  const mid = lineAt(fr, f.w, f.b, 0)
  const up = lineAt(fr, f.w, f.b, 1)
  const dn = lineAt(fr, f.w, f.b, -1)
  const band = up && dn ? `M${up.x1},${up.y1} L${up.x2},${up.y2} L${dn.x2},${dn.y2} L${dn.x1},${dn.y1} Z` : ''
  const spring = { duration: 0.25 }
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Linear SVM with its margin">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xLabel="x₁" yLabel="x₂" />
      <g clipPath={`url(#${clip})`}>
        {band && <motion.path initial={false} animate={{ d: band }} transition={spring} style={{ fill: 'color-mix(in oklab, var(--accent) 10%, transparent)' }} />}
        {up && <motion.line initial={false} animate={up} transition={spring} strokeWidth={1.6} strokeDasharray="6 5" style={{ stroke: 'var(--accent)' }} />}
        {dn && <motion.line initial={false} animate={dn} transition={spring} strokeWidth={1.6} strokeDasharray="6 5" style={{ stroke: 'var(--accent)' }} />}
        {mid && <motion.line initial={false} animate={mid} transition={spring} strokeWidth={2.6} style={{ stroke: 'var(--fg)' }} />}
      </g>
      {pts.map((p, i) => {
        const ring = f.viol[i]
        return (
          <g key={i}>
            {ring && (
              <circle
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={10}
                fill="none"
                strokeWidth={2}
                style={{ stroke: f.done ? 'var(--accent)' : 'var(--hard)', filter: f.done ? 'drop-shadow(0 0 6px var(--accent))' : undefined }}
              />
            )}
            <circle cx={sx(p.x)} cy={sy(p.y)} r={5} strokeWidth={1.4} style={{ fill: CLASS_COLORS[p.label === 1 ? 1 : 0], stroke: 'var(--bg)' }} />
          </g>
        )
      })}
    </svg>
  )
}

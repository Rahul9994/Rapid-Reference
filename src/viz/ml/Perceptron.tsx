import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, type Box, type Frame2D } from '../core/plot'
import { fmt, rng } from '../core/math'
import { CLASS_COLORS } from '../core/datasets'

const CODE = `import numpy as np

w, b = np.zeros(2), 0.0
for epoch in range(20):
    mistakes = 0
    for xi, yi in zip(X, y):            # yi is -1 or +1
        if yi * (xi @ w + b) <= 0:       # wrong side (or on the line)
            w += lr * yi * xi            # nudge the boundary
            b += lr * yi
            mistakes += 1
    if mistakes == 0:
        break                            # every point is classified`

interface P {
  x: number
  y: number
  label: 1 | -1
}

interface Frame extends StepFrame {
  epoch: number
  i: number
  w: [number, number]
  b: number
  mistakes: number
  history: number[]
  updated: boolean
  done: boolean
}

function* program(pts: P[], lr: number): Generator<Frame, void, void> {
  let w: [number, number] = [0, 0]
  let b = 0
  const history: number[] = []
  yield { epoch: 0, i: -1, w, b, mistakes: 0, history: [], updated: false, done: false, line: 3, dwell: 1.4, note: 'A perceptron: output +1 if w·x + b > 0, else −1. Start with w = 0.' }
  let shown = 0
  for (let e = 0; e < 20; e++) {
    let mistakes = 0
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const wrong = p.label * (w[0] * p.x + w[1] * p.y + b) <= 0
      if (wrong) {
        yield { epoch: e, i, w, b, mistakes, history: [...history], updated: false, done: false, line: [6, 7], dwell: shown < 3 ? 1.3 : 0.4, note: shown < 3 ? `Point ${i} is on the wrong side — a mistake.` : `Epoch ${e + 1}: mistake on point ${i}.` }
        w = [w[0] + lr * p.label * p.x, w[1] + lr * p.label * p.y]
        b += lr * p.label
        mistakes++
        yield { epoch: e, i, w, b, mistakes, history: [...history], updated: true, done: false, line: [8, 10], dwell: shown < 3 ? 1.5 : 0.45, note: shown < 3 ? 'Update: w += lr·y·x rotates the boundary toward classifying this point correctly.' : `Epoch ${e + 1}: boundary nudged.` }
        shown++
      } else if (e === 0 && i < 3) {
        yield { epoch: e, i, w, b, mistakes, history: [...history], updated: false, done: false, line: [6, 7], dwell: 0.8, note: `Point ${i} is already on the correct side — nothing changes.` }
      }
    }
    history.push(mistakes)
    if (mistakes === 0) {
      yield { epoch: e, i: -1, w, b, mistakes, history: [...history], updated: false, done: true, line: [11, 12], dwell: 6, note: `Epoch ${e + 1} had zero mistakes → converged. For linearly separable data the perceptron is guaranteed to get here.` }
      return
    }
    yield { epoch: e, i: -1, w, b, mistakes, history: [...history], updated: false, done: false, line: 11, dwell: 0.9, note: `End of epoch ${e + 1}: ${mistakes} mistake${mistakes === 1 ? '' : 's'}. Another pass…` }
  }
  yield { epoch: 19, i: -1, w, b, mistakes: history[history.length - 1], history, updated: false, done: true, line: 4, dwell: 5, note: 'Stopped after 20 epochs. With a tiny gap the perceptron needs more passes — it only converges when the data is linearly separable.' }
}

function makeData(gap: number): P[] {
  const r = rng(41)
  const pts: P[] = []
  while (pts.length < 40) {
    const x = r.range(-2.6, 2.6)
    const y = r.range(-2, 2)
    const s = 0.8 * x - y + 0.2
    if (Math.abs(s) < gap) continue
    pts.push({ x, y, label: s > 0 ? 1 : -1 })
  }
  return pts
}

export default function Perceptron() {
  const [lr, setLr] = useState(0.5)
  const [gap, setGap] = useState(0.35)
  const pts = useMemo(() => makeData(gap), [gap])
  const player = usePlayer(() => program(pts, lr), [pts, lr], { interval: 600, loop: 2600 })
  const fr = player.frame

  return (
    <LabFrame
      title="Perceptron learning rule"
      status={fr.done ? 'converged' : `epoch ${fr.epoch + 1}`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Board box={box} pts={pts} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'y = −1', color: CLASS_COLORS[0] },
        { label: 'y = +1', color: CLASS_COLORS[1] },
        { label: 'boundary w·x + b = 0', color: 'var(--fg)', shape: 'line' },
        { label: 'weight vector w', color: 'var(--accent)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Mistakes per epoch">
          <div className="flex h-[70px] items-end gap-1.5 px-1">
            {fr.history.map((m, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.max(4, (m / Math.max(...fr.history, 1)) * 100)}%` }} className="relative flex-1 rounded-t-md" style={{ background: m === 0 ? 'var(--easy)' : 'var(--accent-3)', maxWidth: 34 }}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted">{m}</span>
              </motion.div>
            ))}
          </div>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'perceptron.py',
        vars: [
          { name: 'epoch', value: String(fr.epoch + 1) },
          { name: 'w', value: `[${fmt(fr.w[0], 2)}, ${fmt(fr.w[1], 2)}]`, color: 'var(--accent)' },
          { name: 'b', value: fmt(fr.b, 2), color: 'var(--accent)' },
          { name: 'xi', value: fr.i >= 0 ? `[${fmt(pts[fr.i].x, 2)}, ${fmt(pts[fr.i].y, 2)}]` : '—' },
          { name: 'yi', value: fr.i >= 0 ? String(pts[fr.i].label) : '—' },
          { name: 'mistakes', value: String(fr.mistakes), color: 'var(--accent-3)' },
        ],
      }}
      params={
        <>
          <Slider label="Learning rate" value={lr} min={0.1} max={1.5} step={0.1} onChange={setLr} format={(v) => v.toFixed(1)} />
          <Slider label="Gap between classes" value={gap} min={0.05} max={0.8} step={0.05} onChange={setGap} format={(v) => v.toFixed(2)} />
        </>
      }
    />
  )
}

function line(fr: Frame2D, w: [number, number], b: number) {
  const [x0, x1] = fr.sx.domain
  const [y0, y1] = fr.sy.domain
  if (Math.abs(w[1]) >= Math.abs(w[0]) && Math.abs(w[1]) > 1e-9) {
    const y = (x: number) => (-b - w[0] * x) / w[1]
    return { x1: fr.sx(x0), y1: fr.sy(y(x0)), x2: fr.sx(x1), y2: fr.sy(y(x1)) }
  }
  if (Math.abs(w[0]) < 1e-9) return null
  const x = (y: number) => (-b - w[1] * y) / w[0]
  return { x1: fr.sx(x(y0)), y1: fr.sy(y0), x2: fr.sx(x(y1)), y2: fr.sy(y1) }
}

function Board({ box, pts, f }: { box: Box; pts: P[]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const marker = `pc-arrow-${clip}`
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-3, 3], [-3 * aspect, 3 * aspect], pad)
  const { sx, sy } = fr
  const l = line(fr, f.w, f.b)
  const norm = Math.hypot(f.w[0], f.w[1])
  // foot of the perpendicular from the origin to the boundary, then w direction
  const foot: [number, number] = norm > 1e-9 ? [(-f.b * f.w[0]) / (norm * norm), (-f.b * f.w[1]) / (norm * norm)] : [0, 0]
  const tip: [number, number] = norm > 1e-9 ? [foot[0] + (f.w[0] / norm) * 0.9, foot[1] + (f.w[1] / norm) * 0.9] : foot
  const cur = f.i >= 0 ? pts[f.i] : null
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Perceptron decision boundary">
      <defs>
        <ClipRect id={clip} f={fr} />
        <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent)' }} />
        </marker>
      </defs>
      <Axes f={fr} xLabel="x₁" yLabel="x₂" />
      <g clipPath={`url(#${clip})`}>
        {l && <motion.line initial={false} animate={l} transition={{ type: 'spring', stiffness: 140, damping: 18 }} strokeWidth={2.6} style={{ stroke: 'var(--fg)' }} />}
        {norm > 1e-9 && (
          <motion.line
            initial={false}
            animate={{ x1: sx(foot[0]), y1: sy(foot[1]), x2: sx(tip[0]), y2: sy(tip[1]) }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            strokeWidth={2.5}
            markerEnd={`url(#${marker})`}
            style={{ stroke: 'var(--accent)' }}
          />
        )}
      </g>
      {pts.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} strokeWidth={1.3} style={{ fill: CLASS_COLORS[p.label === 1 ? 1 : 0], stroke: 'var(--bg)' }} />
      ))}
      {cur && (
        <motion.circle
          key={`${f.i}-${f.updated}`}
          cx={sx(cur.x)}
          cy={sy(cur.y)}
          initial={{ r: 4, opacity: 1 }}
          animate={{ r: 15, opacity: f.updated ? 0.3 : 1 }}
          transition={{ duration: 0.5 }}
          fill="none"
          strokeWidth={2.5}
          style={{ stroke: f.updated ? 'var(--easy)' : 'var(--hard)' }}
        />
      )}
    </svg>
  )
}

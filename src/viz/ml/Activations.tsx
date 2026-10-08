import { useState } from 'react'
import { LabFrame } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, curve, frame2d, type Box } from '../core/plot'
import { fmt, sigmoid } from '../core/math'

const CODE = `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))          # (0, 1)

def tanh(x):
    return np.tanh(x)                    # (-1, 1), zero-centred

def relu(x):
    return np.maximum(0, x)              # [0, ∞)

def leaky_relu(x, a=0.1):
    return np.where(x > 0, x, a * x)     # small slope for x < 0

# derivatives used by backprop
d_sigmoid = lambda x: sigmoid(x) * (1 - sigmoid(x))   # max 0.25
d_tanh = lambda x: 1 - np.tanh(x) ** 2                # max 1
d_relu = lambda x: (x > 0).astype(float)              # 0 or 1`

type Fn = 'sigmoid' | 'tanh' | 'relu' | 'leaky'
const FNS: Record<Fn, { f: (x: number) => number; d: (x: number) => number; lines: number[]; dline: number; label: string; note: string }> = {
  sigmoid: {
    f: sigmoid,
    d: (x) => sigmoid(x) * (1 - sigmoid(x)),
    lines: [3, 4],
    dline: 16,
    label: 'Sigmoid',
    note: 'Sigmoid squashes to (0, 1). Its slope never exceeds 0.25 and vanishes for large |x| — gradients shrink layer after layer.',
  },
  tanh: {
    f: Math.tanh,
    d: (x) => 1 - Math.tanh(x) ** 2,
    lines: [6, 7],
    dline: 17,
    label: 'Tanh',
    note: 'Tanh is zero-centred with slope up to 1, but still saturates at both ends.',
  },
  relu: {
    f: (x) => Math.max(0, x),
    d: (x) => (x > 0 ? 1 : 0),
    lines: [9, 10],
    dline: 18,
    label: 'ReLU',
    note: 'ReLU passes positives unchanged (slope 1) and zeroes negatives. Cheap, no saturation for x > 0 — the default in deep nets.',
  },
  leaky: {
    f: (x) => (x > 0 ? x : 0.1 * x),
    d: (x) => (x > 0 ? 1 : 0.1),
    lines: [12, 13],
    dline: 18,
    label: 'Leaky ReLU',
    note: 'Leaky ReLU keeps a small slope for negatives, so neurons cannot get permanently stuck at zero (“dying ReLU”).',
  },
}
const ORDER: Fn[] = ['sigmoid', 'tanh', 'relu', 'leaky']

interface Frame extends StepFrame {
  fn: Fn
  x: number
}

function* program(start: Fn): Generator<Frame, void, void> {
  const seq = [...ORDER.slice(ORDER.indexOf(start)), ...ORDER.slice(0, ORDER.indexOf(start))]
  for (const fn of seq) {
    const spec = FNS[fn]
    for (let k = 0; k <= 60; k++) {
      const x = -5 + (10 * k) / 60
      yield { fn, x, line: k % 20 < 14 ? spec.lines : spec.dline, dwell: k === 0 ? 2 : 0.09, note: spec.note }
    }
  }
}

export default function Activations() {
  const [start, setStart] = useState<Fn>('sigmoid')
  const player = usePlayer(() => program(start), [start], { interval: 600, loop: 800 })
  const fr = player.frame
  const spec = FNS[fr.fn]
  return (
    <LabFrame
      title={`Activation functions · ${spec.label}`}
      status={`x = ${fmt(fr.x, 2)}`}
      player={player}
      stage={
        <Stage aspect={0.5} min={240} max={380}>
          {(box) => <Plot box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'f(x)', color: 'var(--accent)', shape: 'line' },
        { label: "f′(x) — the gradient backprop sees", color: 'var(--accent-3)', shape: 'dash' },
        { label: 'tangent', color: 'var(--accent-2)', shape: 'line' },
      ]}
      code={{
        source: CODE,
        file: 'activations.py',
        vars: [
          { name: 'x', value: fmt(fr.x, 2) },
          { name: 'f(x)', value: fmt(spec.f(fr.x), 3), color: 'var(--accent)' },
          { name: "f'(x)", value: fmt(spec.d(fr.x), 3), color: 'var(--accent-3)' },
        ],
      }}
      params={
        <Pills
          label="Function"
          value={start}
          onChange={setStart}
          options={ORDER.map((k) => ({ value: k, label: FNS[k].label }))}
        />
      }
    />
  )
}

function Plot({ box, f }: { box: Box; f: Frame }) {
  const fr = frame2d(box, [-5, 5], [-1.6, 3], { l: 34, b: 26, t: 12, r: 12 })
  const { sx, sy } = fr
  const spec = FNS[f.fn]
  const y = spec.f(f.x)
  const slope = spec.d(f.x)
  const t = 1.4
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label={`${spec.label} activation and its derivative`}>
      <Axes f={fr} xLabel="x" zeroLines />
      <path d={curve(fr, spec.d)} fill="none" strokeWidth={2} strokeDasharray="6 5" style={{ stroke: 'var(--accent-3)' }} />
      <path d={curve(fr, spec.f)} fill="none" strokeWidth={3} style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 50%, transparent))' }} />
      <line x1={sx(f.x - t)} y1={sy(y - slope * t)} x2={sx(f.x + t)} y2={sy(y + slope * t)} strokeWidth={2} style={{ stroke: 'var(--accent-2)' }} />
      <line x1={sx(f.x)} x2={sx(f.x)} y1={sy(0)} y2={sy(y)} strokeDasharray="3 4" style={{ stroke: 'var(--fg-subtle)' }} />
      <circle cx={sx(f.x)} cy={sy(spec.d(f.x))} r={4.5} style={{ fill: 'var(--accent-3)' }} />
      <circle cx={sx(f.x)} cy={sy(y)} r={6.5} strokeWidth={2.5} style={{ fill: 'var(--bg)', stroke: 'var(--accent)' }} />
    </svg>
  )
}

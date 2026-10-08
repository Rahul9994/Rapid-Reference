import { useState } from 'react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Pulse, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, sigmoid } from '../core/math'

const CODE = `import math

# forward pass
z = w1 * x1 + w2 * x2 + b
a = 1 / (1 + math.exp(-z))           # sigmoid
L = (a - y) ** 2                     # squared error

# backward pass: chain rule, right → left
dL_da = 2 * (a - y)
da_dz = a * (1 - a)
dL_dz = dL_da * da_dz
dL_dw1 = dL_dz * x1                  # ∂z/∂w1 = x1
dL_dw2 = dL_dz * x2                  # ∂z/∂w2 = x2
dL_db = dL_dz                        # ∂z/∂b = 1

# gradient step
w1 -= lr * dL_dw1
w2 -= lr * dL_dw2
b -= lr * dL_db`

const X1 = 1.5
const X2 = -0.5
const Y = 1

type NodeId = 'x1' | 'w1' | 'x2' | 'w2' | 'b' | 'm1' | 'm2' | 'z' | 'a' | 'L'
type Edge = [NodeId, NodeId]
const EDGES: Edge[] = [
  ['x1', 'm1'],
  ['w1', 'm1'],
  ['x2', 'm2'],
  ['w2', 'm2'],
  ['m1', 'z'],
  ['m2', 'z'],
  ['b', 'z'],
  ['z', 'a'],
  ['a', 'L'],
]

interface State {
  w1: number
  w2: number
  b: number
}

interface Frame extends StepFrame {
  iter: number
  s: State
  vals: Partial<Record<NodeId, number>>
  grads: Partial<Record<NodeId, number>>
  active: Edge[]
  dir: 'fwd' | 'bwd' | null
  losses: number[]
}

function* program(lr: number): Generator<Frame, void, void> {
  const s: State = { w1: -0.6, w2: 0.9, b: 0.1 }
  const losses: number[] = []
  for (let it = 0; it < 40; it++) {
    const narrate = it < 2
    const d = narrate ? 1.5 : it < 4 ? 0.5 : 0.07
    const base = { x1: X1, x2: X2, w1: s.w1, w2: s.w2, b: s.b }
    const m1 = s.w1 * X1
    const m2 = s.w2 * X2
    const z = m1 + m2 + s.b
    const a = sigmoid(z)
    const L = (a - Y) ** 2
    const snap = (x: Omit<Frame, 'iter' | 's' | 'losses'>): Frame => ({ ...x, iter: it, s: { ...s }, losses: [...losses] })
    if (it < 4) {
      yield snap({ vals: { ...base, m1, m2, z }, grads: {}, active: EDGES.slice(0, 7), dir: 'fwd', line: 4, dwell: d, note: narrate ? `Forward: multiply each input by its weight and add the bias → z = ${fmt(z, 3)}.` : `Iteration ${it + 1}: forward.` })
      yield snap({ vals: { ...base, m1, m2, z, a }, grads: {}, active: [['z', 'a']], dir: 'fwd', line: 5, dwell: d, note: narrate ? `Squash with the sigmoid → a = ${fmt(a, 3)}.` : `Iteration ${it + 1}: forward.` })
      yield snap({ vals: { ...base, m1, m2, z, a, L }, grads: {}, active: [['a', 'L']], dir: 'fwd', line: 6, dwell: d, note: narrate ? `Compare with the target y = 1 → loss L = ${fmt(L, 4)}.` : `Iteration ${it + 1}: loss ${fmt(L, 4)}.` })
    }
    const dL_da = 2 * (a - Y)
    const da_dz = a * (1 - a)
    const dL_dz = dL_da * da_dz
    const g = { L: 1, a: dL_da, z: dL_dz, m1: dL_dz, m2: dL_dz, b: dL_dz, w1: dL_dz * X1, w2: dL_dz * X2, x1: dL_dz * s.w1, x2: dL_dz * s.w2 }
    const vals = { ...base, m1, m2, z, a, L }
    if (it < 4) {
      yield snap({ vals, grads: { L: 1, a: dL_da }, active: [['a', 'L']], dir: 'bwd', line: 9, dwell: d, note: narrate ? `Backward starts at the loss: ∂L/∂a = 2(a − y) = ${fmt(dL_da, 3)}.` : `Iteration ${it + 1}: backward.` })
      yield snap({ vals, grads: { L: 1, a: dL_da, z: dL_dz }, active: [['z', 'a']], dir: 'bwd', line: [10, 11], dwell: d, note: narrate ? `Through the sigmoid: multiply by its local slope a(1 − a) = ${fmt(da_dz, 3)} → ∂L/∂z = ${fmt(dL_dz, 3)}.` : `Iteration ${it + 1}: backward.` })
      yield snap({ vals, grads: { L: 1, a: dL_da, z: dL_dz, m1: dL_dz, m2: dL_dz, b: dL_dz }, active: [['m1', 'z'], ['m2', 'z'], ['b', 'z']], dir: 'bwd', line: 14, dwell: d, note: narrate ? 'An addition node copies its gradient to every input unchanged (∂z/∂b = 1).' : `Iteration ${it + 1}: backward.` })
      yield snap({ vals, grads: g, active: [['w1', 'm1'], ['w2', 'm2'], ['x1', 'm1'], ['x2', 'm2']], dir: 'bwd', line: [12, 13], dwell: d, note: narrate ? `A multiply node swaps its inputs: ∂L/∂w₁ = ∂L/∂z · x₁ = ${fmt(g.w1, 3)}.` : `Iteration ${it + 1}: backward.` })
    }
    s.w1 -= lr * g.w1
    s.w2 -= lr * g.w2
    s.b -= lr * g.b
    losses.push(L)
    yield snap({ vals, grads: g, active: [], dir: null, line: [17, 19], dwell: it < 4 ? d * 1.1 : d, note: narrate ? `Gradient step (lr = ${lr}): w₁ ${fmt(base.w1, 3)} → ${fmt(s.w1, 3)}. Run it again and the loss is lower.` : `Iteration ${it + 1}: loss ${fmt(L, 4)}` })
  }
  yield { iter: 40, s: { ...s }, vals: {}, grads: {}, active: [], dir: null, losses: [...losses], line: [17, 19], dwell: 5, note: 'After 40 iterations the output is close to the target. Real networks run exactly this, just with millions of nodes.' }
}

const COLS: Record<NodeId, [number, number]> = {
  x1: [0, 0],
  w1: [0, 1],
  x2: [0, 2.2],
  w2: [0, 3.2],
  b: [0, 4.4],
  m1: [1, 0.5],
  m2: [1, 2.7],
  z: [2, 2.2],
  a: [3, 2.2],
  L: [4, 2.2],
}
const LABEL: Record<NodeId, string> = { x1: 'x₁', w1: 'w₁', x2: 'x₂', w2: 'w₂', b: 'b', m1: '×', m2: '×', z: '+  z', a: 'σ  a', L: 'L' }

export default function Backprop() {
  const [lr, setLr] = useState(1)
  const player = usePlayer(() => program(lr), [lr], { interval: 650, loop: 2600 })
  const fr = player.frame
  return (
    <LabFrame
      title="Backpropagation on a computational graph"
      status={`iteration ${Math.min(fr.iter + 1, 40)}`}
      player={player}
      stage={
        <Stage aspect={0.5} min={280} max={420}>
          {(box) => <Graph box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'forward value', color: 'var(--accent-2)' },
        { label: 'gradient ∂L/∂·', color: 'var(--accent-3)' },
      ]}
      below={
        <MiniPanel title="Loss per iteration" right={fr.losses.length ? fmt(fr.losses[fr.losses.length - 1], 4) : undefined}>
          <Stage aspect={0.22} min={100} max={130}>
            {(box) => <LossChart box={box} losses={fr.losses} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'backprop.py',
        vars: [
          { name: 'w1', value: fmt(fr.s.w1, 3), color: 'var(--accent)' },
          { name: 'w2', value: fmt(fr.s.w2, 3), color: 'var(--accent)' },
          { name: 'b', value: fmt(fr.s.b, 3), color: 'var(--accent)' },
          { name: 'L', value: fmt(fr.vals.L, 4), color: 'var(--accent-2)' },
          { name: 'dL_dz', value: fmt(fr.grads.z, 4), color: 'var(--accent-3)' },
          { name: 'dL_dw1', value: fmt(fr.grads.w1, 4), color: 'var(--accent-3)' },
        ],
      }}
      params={<Slider label="Learning rate" value={lr} min={0.2} max={4} step={0.1} onChange={setLr} format={(v) => v.toFixed(1)} />}
    />
  )
}

function Graph({ box, f }: { box: Box; f: Frame }) {
  const nw = Math.min(118, (box.width - 40) / 5.6)
  const nh = 46
  const px = (c: number) => 20 + nw / 2 + ((box.width - 40 - nw) * c) / 4
  const py = (r: number) => 16 + nh / 2 + ((box.height - 32 - nh) * r) / 4.4
  const pos = (id: NodeId) => [px(COLS[id][0]), py(COLS[id][1])] as const
  const isActive = (e: Edge) => f.active.some((a) => a[0] === e[0] && a[1] === e[1])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Computational graph with forward values and backward gradients">
      {EDGES.map((e) => {
        const [x1, y1] = pos(e[0])
        const [x2, y2] = pos(e[1])
        const on = isActive(e)
        const sx = x1 + nw / 2
        const ex = x2 - nw / 2
        const mid = (sx + ex) / 2
        const d = `M${sx},${y1} C${mid},${y1} ${mid},${y2} ${ex},${y2}`
        return (
          <g key={e.join('-')}>
            <path d={d} fill="none" strokeWidth={on ? 2.5 : 1.4} style={{ stroke: on ? (f.dir === 'bwd' ? 'var(--accent-3)' : 'var(--accent-2)') : 'var(--border-strong)', transition: 'stroke 0.3s' }} />
            {on && <Pulse key={`${e.join('-')}-${f.dir}-${f.line}-${f.iter}`} d={d} reverse={f.dir === 'bwd'} color={f.dir === 'bwd' ? 'var(--accent-3)' : 'var(--accent-2)'} />}
          </g>
        )
      })}
      {(Object.keys(COLS) as NodeId[]).map((id) => {
        const [x, y] = pos(id)
        const v = f.vals[id]
        const g = f.grads[id]
        const op = id === 'm1' || id === 'm2' || id === 'z' || id === 'a' || id === 'L'
        return (
          <g key={id} transform={`translate(${x - nw / 2} ${y - nh / 2})`}>
            <rect width={nw} height={nh} rx={12} strokeWidth={1.4} style={{ fill: op ? 'color-mix(in oklab, var(--accent) 9%, var(--bg-elev))' : 'var(--bg-elev)', stroke: g !== undefined ? 'var(--accent-3)' : v !== undefined && op ? 'var(--accent-2)' : 'var(--border-strong)', transition: 'stroke 0.3s' }} />
            <text x={10} y={18} fontSize={11.5} className="viz-text" fontWeight={600}>
              {LABEL[id]}
            </text>
            <text x={nw - 8} y={18} textAnchor="end" fontSize={11} style={{ fill: 'var(--accent-2)' }} className="font-mono">
              {v !== undefined ? fmt(v, 3) : ''}
            </text>
            <text x={nw - 8} y={36} textAnchor="end" fontSize={10.5} style={{ fill: 'var(--accent-3)' }} className="font-mono">
              {g !== undefined ? `∇ ${fmt(g, 3)}` : ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LossChart({ box, losses }: { box: Box; losses: number[] }) {
  const fr = frame2d(box, [0, 40], [0, Math.max(0.65, ...losses)], { l: 34, b: 20, t: 6, r: 8 })
  const pts = losses.map((v, i) => [fr.sx(i + 1), fr.sy(v)] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={8} yTicks={2} xLabel="iteration" digits={1} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-2)' }} />
    </svg>
  )
}

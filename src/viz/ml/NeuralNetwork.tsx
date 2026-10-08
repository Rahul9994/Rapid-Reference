import { useEffect, useMemo, useRef, useState } from 'react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Pills, Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, FieldCanvas, Stage, fitFrame, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng, sigmoid } from '../core/math'
import { circles, CLASS_COLORS, moons, xor, type Point } from '../core/datasets'
import { rgba, useThemeColors, type RGB } from '../core/hooks'

const CODE = `import numpy as np

rng = np.random.default_rng(0)          # X: (n, 2), y: (n, 1)
W1, b1 = rng.normal(0, 1, (2, H)), np.zeros(H)
W2, b2 = rng.normal(0, 1, (H, 1)), np.zeros(1)

for epoch in range(1000):
    A1 = np.tanh(X @ W1 + b1)                  # hidden layer
    p = 1 / (1 + np.exp(-(A1 @ W2 + b2)))      # output probability
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    dZ2 = (p - y) / n                          # backprop: output
    dW2, db2 = A1.T @ dZ2, dZ2.sum(0)
    dZ1 = dZ2 @ W2.T * (1 - A1 ** 2)           # through tanh
    dW1, db1 = X.T @ dZ1, dZ1.sum(0)
    W1 -= lr * dW1; b1 -= lr * db1             # gradient step
    W2 -= lr * dW2; b2 -= lr * db2`

type DataId = 'circles' | 'moons' | 'xor'

interface Net {
  W1: number[][] // [2][H]
  b1: number[]
  W2: number[]
  b2: number
}

function initNet(H: number, seed: number): Net {
  const r = rng(seed)
  return {
    W1: [Array.from({ length: H }, () => r.normal(0, 1)), Array.from({ length: H }, () => r.normal(0, 1))],
    b1: new Array(H).fill(0),
    W2: Array.from({ length: H }, () => r.normal(0, 1)),
    b2: 0,
  }
}

const cloneNet = (n: Net): Net => ({ W1: [n.W1[0].slice(), n.W1[1].slice()], b1: n.b1.slice(), W2: n.W2.slice(), b2: n.b2 })

function hidden(net: Net, x: number, y: number) {
  return net.b1.map((b, j) => Math.tanh(x * net.W1[0][j] + y * net.W1[1][j] + b))
}

function predict(net: Net, x: number, y: number) {
  const a = hidden(net, x, y)
  let z = net.b2
  for (let j = 0; j < a.length; j++) z += a[j] * net.W2[j]
  return sigmoid(z)
}

function trainEpoch(net: Net, pts: Point[], lr: number) {
  const H = net.b1.length
  const n = pts.length
  const gW1 = [new Array(H).fill(0), new Array(H).fill(0)]
  const gb1 = new Array(H).fill(0)
  const gW2 = new Array(H).fill(0)
  let gb2 = 0
  let loss = 0
  let correct = 0
  for (const p of pts) {
    const a = hidden(net, p.x, p.y)
    let z = net.b2
    for (let j = 0; j < H; j++) z += a[j] * net.W2[j]
    const out = sigmoid(z)
    loss -= p.c === 1 ? Math.log(out + 1e-12) : Math.log(1 - out + 1e-12)
    if ((out >= 0.5 ? 1 : 0) === p.c) correct++
    const dz2 = (out - p.c) / n
    gb2 += dz2
    for (let j = 0; j < H; j++) {
      gW2[j] += a[j] * dz2
      const dz1 = dz2 * net.W2[j] * (1 - a[j] * a[j])
      gW1[0][j] += p.x * dz1
      gW1[1][j] += p.y * dz1
      gb1[j] += dz1
    }
  }
  for (let j = 0; j < H; j++) {
    net.W1[0][j] -= lr * gW1[0][j]
    net.W1[1][j] -= lr * gW1[1][j]
    net.b1[j] -= lr * gb1[j]
    net.W2[j] -= lr * gW2[j]
  }
  net.b2 -= lr * gb2
  return { loss: loss / n, acc: correct / n }
}

interface Frame extends StepFrame {
  epoch: number
  net: Net
  losses: number[]
  acc: number
  phase: 'init' | 'forward' | 'loss' | 'backward' | 'update' | 'train' | 'done'
}

const EPOCHS = 1000

function* program(pts: Point[], H: number, lr: number): Generator<Frame, void, void> {
  const net = initNet(H, 7)
  const losses: number[] = []
  yield { epoch: 0, net: cloneNet(net), losses: [], acc: 0, phase: 'init', line: [4, 5], dwell: 1.6, note: `A 2 → ${H} → 1 network with random weights. The background is its current prediction for every point of the plane.` }
  let acc = 0
  for (let e = 0; e < EPOCHS; ) {
    if (e < 2) {
      const narrate = e === 0
      yield { epoch: e, net: cloneNet(net), losses: [...losses], acc, phase: 'forward', line: [8, 9], dwell: narrate ? 1.5 : 0.6, note: 'Forward pass: each hidden neuron computes tanh(w·x + b) — one soft line across the plane — and the output neuron blends them.' }
      yield { epoch: e, net: cloneNet(net), losses: [...losses], acc, phase: 'loss', line: 10, dwell: narrate ? 1.2 : 0.5, note: 'Measure the log-loss of every prediction.' }
      yield { epoch: e, net: cloneNet(net), losses: [...losses], acc, phase: 'backward', line: [11, 14], dwell: narrate ? 1.6 : 0.6, note: 'Backward pass: the chain rule sends the error back through W2 and the tanh derivative to every weight.' }
      const r = trainEpoch(net, pts, lr)
      losses.push(r.loss)
      acc = r.acc
      e++
      yield { epoch: e, net: cloneNet(net), losses: [...losses], acc, phase: 'update', line: [15, 16], dwell: narrate ? 1.4 : 0.6, note: 'Update every weight a little against its gradient. Repeat…' }
      continue
    }
    const batch = e < 60 ? 2 : e < 300 ? 6 : 15
    for (let k = 0; k < batch && e < EPOCHS; k++, e++) {
      const r = trainEpoch(net, pts, lr)
      losses.push(r.loss)
      acc = r.acc
    }
    const cycle = Math.floor(e / batch) % 4
    yield { epoch: e, net: cloneNet(net), losses: [...losses], acc, phase: 'train', line: cycle === 0 ? [8, 9] : cycle === 1 ? 10 : cycle === 2 ? [11, 14] : [15, 16], dwell: 0.16, note: `Epoch ${e}: loss ${fmt(losses[losses.length - 1], 4)}, accuracy ${(acc * 100).toFixed(1)}%. The boundary bends as hidden neurons specialise.` }
  }
  yield { epoch: EPOCHS, net: cloneNet(net), losses, acc, phase: 'done', line: [15, 16], dwell: 6, note: `Trained for ${EPOCHS} epochs: ${(acc * 100).toFixed(1)}% training accuracy. A single straight line could never separate this data — the hidden layer makes it possible.` }
}

function makeData(id: DataId): Point[] {
  if (id === 'circles') return circles(180, 0.09, 3).map((p) => ({ ...p, x: p.x * 1.6, y: p.y * 1.6 }))
  if (id === 'moons') return moons(90, 0.12, 4).map((p) => ({ ...p, x: (p.x - 0.5) * 1.5, y: (p.y - 0.25) * 1.5 }))
  return xor(200, 5).map((p) => ({ ...p, x: p.x * 1.6, y: p.y * 1.6 }))
}

export default function NeuralNetwork() {
  const [data, setData] = useState<DataId>('circles')
  const [H, setH] = useState(6)
  const [lr, setLr] = useState(1)
  const pts = useMemo(() => makeData(data), [data])
  const player = usePlayer(() => program(pts, H, lr), [pts, H, lr], { interval: 600, loop: 2600 })
  const fr = player.frame
  const loss = fr.losses[fr.losses.length - 1]

  return (
    <LabFrame
      title={`Neural network · 2 → ${H} → 1`}
      status={`epoch ${fr.epoch} · acc ${(fr.acc * 100).toFixed(0)}%`}
      player={player}
      stage={
        <Stage aspect={0.6} min={260} max={470}>
          {(box) => <Field box={box} pts={pts} net={fr.net} />}
        </Stage>
      }
      legend={[
        { label: 'class 0', color: CLASS_COLORS[0] },
        { label: 'class 1', color: CLASS_COLORS[1] },
        { label: 'positive weight', color: 'var(--accent-2)', shape: 'line' },
        { label: 'negative weight', color: 'var(--accent-3)', shape: 'line' },
      ]}
      below={
        <div className="grid gap-3 md:grid-cols-[1.25fr_1fr]">
          <MiniPanel title="Network · what each hidden neuron sees">
            <NetworkDiagram net={fr.net} phase={fr.phase} />
          </MiniPanel>
          <MiniPanel title="Log-loss" right={fmt(loss, 4)}>
            <Stage aspect={0.62} min={150} max={200}>
              {(box) => <LossChart box={box} losses={fr.losses} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{
        source: CODE,
        file: 'mlp_numpy.py',
        vars: [
          { name: 'epoch', value: String(fr.epoch) },
          { name: 'H', value: String(H) },
          { name: 'loss', value: fmt(loss, 4), color: 'var(--accent-3)' },
          { name: 'accuracy', value: `${(fr.acc * 100).toFixed(1)}%`, color: 'var(--easy)' },
          { name: 'lr', value: lr.toFixed(2) },
          { name: '|W2|', value: fmt(Math.hypot(...fr.net.W2), 2) },
        ],
      }}
      params={
        <>
          <Pills
            label="Dataset"
            value={data}
            onChange={setData}
            options={[
              { value: 'circles', label: 'Circles' },
              { value: 'moons', label: 'Moons' },
              { value: 'xor', label: 'XOR' },
            ]}
          />
          <Slider label="Hidden neurons (H)" value={H} min={2} max={10} onChange={setH} />
          <Slider label="Learning rate" value={lr} min={0.1} max={3} step={0.1} onChange={setLr} format={(v) => v.toFixed(1)} />
        </>
      }
    />
  )
}

function Field({ box, pts, net }: { box: Box; pts: Point[]; net: Net }) {
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const fr = fitFrame(box, [[-2.3, -2.3], [2.3, 2.3]], pad, 0)
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1] })
  const paint = useMemo(
    () => (x: number, y: number): [number, number, number, number] => {
      const p = predict(net, x, y)
      const c = p >= 0.5 ? C.b : C.a
      return [c[0], c[1], c[2], Math.round(255 * (0.06 + Math.abs(p - 0.5) * 0.55))]
    },
    [C, net],
  )
  return (
    <>
      <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={5} />
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Neural network decision regions">
        <Axes f={fr} xLabel="x₁" yLabel="x₂" />
        {pts.map((p, i) => (
          <circle key={i} cx={fr.sx(p.x)} cy={fr.sy(p.y)} r={3.8} strokeWidth={1.2} style={{ fill: CLASS_COLORS[p.c], stroke: 'var(--bg)' }} />
        ))}
      </svg>
    </>
  )
}

/** Hidden-unit thumbnails drawn on canvases + weighted edges in SVG. */
function NetworkDiagram({ net, phase }: { net: Net; phase: Frame['phase'] }) {
  const H = net.b1.length
  const W = 420
  const Ht = Math.max(170, H * 30 + 20)
  const thumb = Math.min(26, (Ht - 20) / H - 4)
  const xIn = 30
  const xHid = W / 2
  const xOut = W - 34
  const yIn = (i: number) => Ht / 2 + (i - 0.5) * 60
  const yHid = (j: number) => 10 + thumb / 2 + 2 + ((Ht - 20 - thumb) * j) / Math.max(1, H - 1)
  const maxW = Math.max(...net.W1[0].map(Math.abs), ...net.W1[1].map(Math.abs), ...net.W2.map(Math.abs), 1e-6)
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1], pos: 'var(--accent-2)', neg: 'var(--accent-3)', bg: 'var(--bg)' })
  const flowing = phase === 'forward' || phase === 'train'
  const back = phase === 'backward'
  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${Ht}` }}>
      <svg viewBox={`0 0 ${W} ${Ht}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {[0, 1].map((i) =>
          net.W1[i].map((w, j) => (
            <line
              key={`a${i}${j}`}
              x1={xIn}
              y1={yIn(i)}
              x2={xHid - thumb / 2 - 4}
              y2={yHid(j)}
              strokeWidth={0.6 + (Math.abs(w) / maxW) * 3.2}
              strokeDasharray={flowing || back ? '6 6' : undefined}
              className={flowing ? 'viz-flow' : back ? 'viz-flow-back' : undefined}
              style={{ stroke: w >= 0 ? 'var(--accent-2)' : 'var(--accent-3)', opacity: 0.35 + (Math.abs(w) / maxW) * 0.55 }}
            />
          )),
        )}
        {net.W2.map((w, j) => (
          <line
            key={`b${j}`}
            x1={xHid + thumb / 2 + 4}
            y1={yHid(j)}
            x2={xOut}
            y2={Ht / 2}
            strokeWidth={0.6 + (Math.abs(w) / maxW) * 3.2}
            strokeDasharray={flowing || back ? '6 6' : undefined}
            className={flowing ? 'viz-flow' : back ? 'viz-flow-back' : undefined}
            style={{ stroke: w >= 0 ? 'var(--accent-2)' : 'var(--accent-3)', opacity: 0.35 + (Math.abs(w) / maxW) * 0.55 }}
          />
        ))}
        {[0, 1].map((i) => (
          <g key={`in${i}`}>
            <circle cx={xIn} cy={yIn(i)} r={11} strokeWidth={1.5} style={{ fill: 'var(--bg-elev)', stroke: 'var(--border-strong)' }} />
            <text x={xIn} y={yIn(i) + 3.5} textAnchor="middle" fontSize={10} className="viz-text">
              x{i === 0 ? '₁' : '₂'}
            </text>
          </g>
        ))}
        <circle cx={xOut} cy={Ht / 2} r={13} strokeWidth={1.5} style={{ fill: 'var(--bg-elev)', stroke: 'var(--accent)' }} />
        <text x={xOut} y={Ht / 2 + 3.5} textAnchor="middle" fontSize={10} className="viz-text">
          p
        </text>
      </svg>
      {Array.from({ length: H }).map((_, j) => (
        <NeuronThumb key={j} net={net} j={j} colors={[C.pos, C.neg, C.bg]} style={{ left: `${((xHid - thumb / 2) / W) * 100}%`, top: `${((yHid(j) - thumb / 2) / Ht) * 100}%`, width: `${(thumb / W) * 100}%` }} />
      ))}
    </div>
  )
}

function NeuronThumb({ net, j, colors, style }: { net: Net; j: number; colors: [RGB, RGB, RGB]; style: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const w0 = net.W1[0][j]
  const w1 = net.W1[1][j]
  const b = net.b1[j]
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const N = 18
    const img = ctx.createImageData(N, N)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = -2.3 + (4.6 * (c + 0.5)) / N
        const y = 2.3 - (4.6 * (r + 0.5)) / N
        const a = Math.tanh(x * w0 + y * w1 + b)
        const col = a >= 0 ? colors[0] : colors[1]
        const k = (r * N + c) * 4
        img.data[k] = col[0]
        img.data[k + 1] = col[1]
        img.data[k + 2] = col[2]
        img.data[k + 3] = Math.round(40 + Math.abs(a) * 200)
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [w0, w1, b, colors])
  return (
    <canvas
      ref={ref}
      width={18}
      height={18}
      aria-hidden="true"
      className="absolute aspect-square rounded-md border border-line-strong"
      style={{ ...style, imageRendering: 'auto', background: rgba(colors[2], 1), height: 'auto' }}
    />
  )
}

function LossChart({ box, losses }: { box: Box; losses: number[] }) {
  const top = Math.max(0.8, ...losses.slice(0, 2))
  const fr = frame2d(box, [0, EPOCHS], [0, top], { l: 32, b: 20, t: 6, r: 8 })
  const step = Math.max(1, Math.floor(losses.length / 200))
  const pts = losses.filter((_, i) => i % step === 0 || i === losses.length - 1).map((v, i, arr) => [fr.sx(i === arr.length - 1 ? losses.length - 1 : i * step), fr.sy(Math.min(top, v))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={4} yTicks={3} xLabel="epoch" digits={1} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
    </svg>
  )
}

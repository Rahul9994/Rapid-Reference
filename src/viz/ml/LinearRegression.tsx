import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider, Toggle } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, mean, rng } from '../core/math'

const CODE = `import numpy as np

def fit(X, y, lr=0.1, epochs=60):
    X = (X - X.mean()) / X.std()   # scale feature
    w, b = 0.0, 0.0
    n = len(X)
    for epoch in range(epochs):
        y_pred = w * X + b         # predict
        error = y_pred - y         # residuals
        loss = np.mean(error ** 2) # MSE
        dw = 2 / n * np.sum(error * X)
        db = 2 / n * np.sum(error)
        w -= lr * dw               # step downhill
        b -= lr * db
    return w, b`

const EPOCHS = 60
type Phase = 'scale' | 'init' | 'predict' | 'error' | 'loss' | 'grad' | 'update' | 'done' | 'diverged'

interface Frame extends StepFrame {
  phase: Phase
  epoch: number
  w: number
  b: number
  dw?: number
  db?: number
  loss?: number
  history: number[]
  path: [number, number][]
  narrate: boolean
}

interface Data {
  xs: number[]
  ys: number[]
  mu: number
  sd: number
  z: number[]
  /** closed-form optimum in standardized space */
  wStar: number
  bStar: number
  jMin: number
}

function makeData(noise: number, seed: number): Data {
  const r = rng(seed)
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < 22; i++) {
    const x = 0.8 + (8.6 * i) / 21 + r.range(-0.35, 0.35)
    xs.push(x)
    ys.push(3.2 + 1.45 * x + r.normal(0, noise))
  }
  const mu = mean(xs)
  const sd = Math.sqrt(mean(xs.map((x) => (x - mu) ** 2)))
  const z = xs.map((x) => (x - mu) / sd)
  const wStar = mean(z.map((v, i) => v * ys[i]))
  const bStar = mean(ys)
  const jMin = mean(z.map((v, i) => (wStar * v + bStar - ys[i]) ** 2))
  return { xs, ys, mu, sd, z, wStar, bStar, jMin }
}

function* program(d: Data, lr: number): Generator<Frame, void, void> {
  const { z, ys } = d
  const n = z.length
  let w = 0
  let b = 0
  const history: number[] = []
  const path: [number, number][] = [[0, 0]]
  const snap = (f: Omit<Frame, 'w' | 'b' | 'history' | 'path'>): Frame => ({ ...f, w, b, history: [...history], path: [...path] })

  yield snap({ phase: 'scale', epoch: 0, narrate: true, line: 4, dwell: 1.7, note: 'Standardize X to mean 0, std 1 so w and b learn at a similar pace.' })
  yield snap({ phase: 'init', epoch: 0, narrate: true, line: [5, 6], dwell: 1.5, note: 'Start from a flat line: w = 0, b = 0. It fits nothing yet.' })

  for (let e = 0; e < EPOCHS; e++) {
    const narrate = e < 2
    const dwell = e < 2 ? 1.5 : e < 5 ? 0.55 : 0.13
    const quick = `Epoch ${e + 1}: predict → residuals → loss → gradients → update.`
    const preds = z.map((v) => w * v + b)
    yield snap({ phase: 'predict', epoch: e, narrate, line: [7, 8], dwell, note: narrate ? 'Predict ŷ = w·x + b for every point (the hollow rings on the line).' : quick })
    const err = preds.map((p, i) => p - ys[i])
    yield snap({ phase: 'error', epoch: e, narrate, line: 9, dwell, note: narrate ? 'Residuals: the vertical gap between each prediction and the true y.' : quick })
    const loss = mean(err.map((v) => v * v))
    history.push(loss)
    yield snap({ phase: 'loss', epoch: e, narrate, loss, line: 10, dwell, note: narrate ? 'MSE squares every residual and averages them — big misses cost much more.' : quick })
    const dw = (2 / n) * err.reduce((s, v, i) => s + v * z[i], 0)
    const db = (2 / n) * err.reduce((s, v) => s + v, 0)
    yield snap({ phase: 'grad', epoch: e, narrate, loss, dw, db, line: [11, 12], dwell, note: narrate ? 'Gradients point uphill on the loss surface; we will step the other way.' : quick })
    w -= lr * dw
    b -= lr * db
    path.push([w, b])
    if (!Number.isFinite(w) || Math.abs(w) > 1e4 || Math.abs(b) > 1e4) {
      yield snap({ phase: 'diverged', epoch: e, narrate: true, loss, dw, db, line: [13, 14], dwell: 3, note: 'Diverged! The learning rate is so large that every step overshoots further than the last.' })
      return
    }
    yield snap({ phase: 'update', epoch: e, narrate, loss, dw, db, line: [13, 14], dwell, note: narrate ? 'Update: w and b move a small step (lr × gradient) downhill.' : quick })
  }
  const last = mean(z.map((v, i) => (w * v + b - ys[i]) ** 2))
  history.push(last)
  yield snap({ phase: 'done', epoch: EPOCHS, narrate: true, loss: last, line: 15, dwell: 6, note: `Done — after ${EPOCHS} epochs the line matches the least-squares solution (dashed).` })
}

export default function LinearRegression() {
  const [lr, setLr] = useState(0.1)
  const [noise, setNoise] = useState(1.4)
  const [showSquares, setShowSquares] = useState(true)
  const data = useMemo(() => makeData(noise, 7), [noise])
  const player = usePlayer(() => program(data, lr), [data, lr], { interval: 620, loop: 2600 })
  const f = player.frame

  const vars = [
    { name: 'epoch', value: String(Math.min(f.epoch + (f.phase === 'done' ? 0 : 1), EPOCHS)) },
    { name: 'w', value: fmt(f.w), color: 'var(--accent)' },
    { name: 'b', value: fmt(f.b), color: 'var(--accent)' },
    { name: 'loss (MSE)', value: fmt(f.loss), color: 'var(--accent-3)' },
    { name: 'dw', value: fmt(f.dw), color: 'var(--accent-2)' },
    { name: 'db', value: fmt(f.db), color: 'var(--accent-2)' },
  ]

  return (
    <LabFrame
      title="Linear regression · gradient descent"
      status={f.phase === 'done' ? 'converged' : f.phase === 'diverged' ? 'diverged' : `epoch ${Math.min(f.epoch + 1, EPOCHS)}/${EPOCHS}`}
      player={player}
      stepLabel="step"
      stage={
        <Stage aspect={0.58} min={260} max={470}>
          {(box) => <Scatter box={box} data={data} f={f} showSquares={showSquares} />}
        </Stage>
      }
      legend={[
        { label: 'data', color: 'var(--accent-2)' },
        { label: 'model ŷ = w·x + b', color: 'var(--accent)', shape: 'line' },
        { label: 'residuals', color: 'var(--accent-3)', shape: 'dash' },
        { label: 'least squares', color: 'var(--fg-subtle)', shape: 'dash' },
      ]}
      below={
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniPanel title="Loss surface J(w, b)" right={`(${fmt(f.w, 2)}, ${fmt(f.b, 2)})`}>
            <Stage aspect={0.62} min={150} max={210}>
              {(box) => <Contour box={box} data={data} f={f} />}
            </Stage>
          </MiniPanel>
          <MiniPanel title="MSE per epoch" right={fmt(f.history[f.history.length - 1], 2)}>
            <Stage aspect={0.62} min={150} max={210}>
              {(box) => <LossCurve box={box} history={f.history} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{ source: CODE, file: 'linear_regression.py', vars }}
      params={
        <>
          <Slider label="Learning rate (lr)" value={lr} min={0.01} max={1.05} step={0.01} onChange={setLr} format={(v) => v.toFixed(2)} />
          <Slider label="Noise in the data" value={noise} min={0.2} max={3} step={0.1} onChange={setNoise} format={(v) => `σ = ${v.toFixed(1)}`} />
          <Toggle label="Squared errors" checked={showSquares} onChange={setShowSquares} />
        </>
      }
    />
  )
}

function lineInOriginalUnits(d: Data, w: number, b: number) {
  const slope = w / d.sd
  return { slope, intercept: b - slope * d.mu }
}

function Scatter({ box, data, f, showSquares }: { box: Box; data: Data; f: Frame; showSquares: boolean }) {
  const clip = useId().replace(/:/g, '')
  const fr = frame2d(box, [0, 10], [0, 22], { l: 38, b: 30, t: 14, r: 14 })
  const { sx, sy } = fr
  const { slope, intercept } = lineInOriginalUnits(data, f.w, f.b)
  const yAt = (x: number) => slope * x + intercept
  const opt = lineInOriginalUnits(data, data.wStar, data.bStar)
  const showPred = ['predict', 'error', 'loss', 'grad'].includes(f.phase)
  const showResid = ['error', 'loss', 'grad'].includes(f.phase)
  const squares = showSquares && f.phase === 'loss' && f.narrate
  const spring = { type: 'spring', stiffness: 120, damping: 20, mass: 0.6 } as const

  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Scatter plot with a regression line being fitted">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xLabel="years of experience" yLabel="salary (LPA)" />
      <g clipPath={`url(#${clip})`}>
        {/* closed-form least-squares line */}
        <motion.line
          x1={sx(0)}
          x2={sx(10)}
          y1={sy(opt.intercept)}
          y2={sy(opt.slope * 10 + opt.intercept)}
          strokeDasharray="5 6"
          strokeWidth={1.5}
          style={{ stroke: 'var(--fg-subtle)' }}
          animate={{ opacity: f.phase === 'done' ? 0.9 : 0.25 }}
        />
        {/* squared errors */}
        <AnimatePresence>
          {squares &&
            data.xs.map((x, i) => {
              const yTrue = sy(data.ys[i])
              const yHat = sy(yAt(x))
              const side = Math.abs(yTrue - yHat)
              return (
                <motion.rect
                  key={`sq${i}`}
                  x={sx(x)}
                  y={Math.min(yTrue, yHat)}
                  width={side}
                  height={side}
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.015 }}
                  style={{ fill: 'color-mix(in oklab, var(--accent-3) 13%, transparent)', stroke: 'color-mix(in oklab, var(--accent-3) 45%, transparent)', transformOrigin: `${sx(x)}px ${yHat}px` }}
                />
              )
            })}
        </AnimatePresence>
        {/* residuals */}
        {data.xs.map((x, i) => (
          <motion.line
            key={`r${i}`}
            x1={sx(x)}
            x2={sx(x)}
            y1={sy(data.ys[i])}
            initial={false}
            animate={{ y2: sy(yAt(x)), opacity: showResid ? 0.9 : 0 }}
            transition={{ duration: 0.3 }}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            style={{ stroke: 'var(--accent-3)' }}
          />
        ))}
        {/* model line */}
        <motion.line
          initial={false}
          animate={{ x1: sx(0), x2: sx(10), y1: sy(yAt(0)), y2: sy(yAt(10)) }}
          transition={spring}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 60%, transparent))' }}
        />
        {/* predictions */}
        {data.xs.map((x, i) => (
          <motion.circle
            key={`p${i}`}
            cx={sx(x)}
            r={4}
            initial={false}
            animate={{ cy: sy(yAt(x)), opacity: showPred ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            strokeWidth={1.5}
            style={{ fill: 'var(--bg)', stroke: 'var(--accent)' }}
          />
        ))}
      </g>
      {/* data */}
      {data.xs.map((x, i) => (
        <motion.circle
          key={`d${i}`}
          cx={sx(x)}
          r={4.5}
          initial={{ cy: sy(data.ys[i]) - 12, opacity: 0 }}
          animate={{ cy: sy(data.ys[i]), opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.02 }}
          style={{ fill: 'var(--accent-2)', stroke: 'var(--bg)' }}
          strokeWidth={1.5}
        />
      ))}
      <text x={fr.right - 4} y={fr.top + 14} textAnchor="end" className="viz-text" fontSize={12}>
        ŷ = {fmt(slope, 2)}·x {intercept < 0 ? '−' : '+'} {fmt(Math.abs(intercept), 2)}
      </text>
    </svg>
  )
}

function Contour({ box, data, f }: { box: Box; data: Data; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const fr = frame2d(box, [-2, data.wStar + 3.5], [-3, data.bStar + 5], { l: 30, b: 22, t: 8, r: 8 })
  const { sx, sy } = fr
  // J(w,b) = (w - w*)² + (b - b*)² + Jmin in standardized space → circles.
  const radii = [1, 2.2, 3.6, 5.2, 7, 9, 11.2, 13.6]
  const grad = f.dw !== undefined && f.db !== undefined && f.phase === 'grad'
  const len = grad ? Math.hypot(f.dw!, f.db!) : 0
  const ux = grad && len ? -f.dw! / len : 0
  const uy = grad && len ? -f.db! / len : 0
  const arrow = Math.min(2.6, len * 0.25)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xTicks={4} yTicks={4} xLabel="w" yLabel="b" />
      <g clipPath={`url(#${clip})`}>
        {radii.map((r, i) => (
          <ellipse
            key={r}
            cx={sx(data.wStar)}
            cy={sy(data.bStar)}
            rx={Math.abs(sx(r) - sx(0))}
            ry={Math.abs(sy(r) - sy(0))}
            fill="none"
            strokeWidth={1}
            style={{ stroke: `color-mix(in oklab, var(--accent) ${42 - i * 4}%, transparent)` }}
          />
        ))}
        <circle cx={sx(data.wStar)} cy={sy(data.bStar)} r={3} style={{ fill: 'var(--accent)' }} />
        <path d={pathOf(f.path.map(([w, b]) => [sx(w), sy(b)]))} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--accent-3)' }} />
        {f.path.map(([w, b], i) => (
          <circle key={i} cx={sx(w)} cy={sy(b)} r={1.8} style={{ fill: 'var(--accent-3)' }} />
        ))}
        {grad && (
          <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            x1={sx(f.w)}
            y1={sy(f.b)}
            x2={sx(f.w + ux * arrow)}
            y2={sy(f.b + uy * arrow)}
            strokeWidth={2}
            markerEnd="url(#lr-arrow)"
            style={{ stroke: 'var(--accent-2)' }}
          />
        )}
        <motion.circle
          initial={false}
          animate={{ cx: sx(f.w), cy: sy(f.b) }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
          r={5}
          strokeWidth={2}
          style={{ fill: 'var(--bg)', stroke: 'var(--accent-3)' }}
        />
      </g>
      <defs>
        <marker id="lr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent-2)' }} />
        </marker>
      </defs>
    </svg>
  )
}

function LossCurve({ box, history }: { box: Box; history: number[] }) {
  const top = Math.max(1, ...history.slice(0, 3))
  const fr = frame2d(box, [0, EPOCHS], [0, top * 1.08], { l: 34, b: 22, t: 8, r: 8 })
  const { sx, sy } = fr
  const pts = history.map((v, i) => [sx(i), sy(Math.min(v, top * 1.08))] as [number, number])
  const area = pts.length > 1 ? `${pathOf(pts)}L${pts[pts.length - 1][0]},${fr.bottom}L${pts[0][0]},${fr.bottom}Z` : ''
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={4} yTicks={3} xLabel="epoch" />
      <path d={area} style={{ fill: 'color-mix(in oklab, var(--accent-3) 14%, transparent)' }} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: 'var(--accent-3)' }} />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} style={{ fill: 'var(--accent-3)' }} />}
    </svg>
  )
}

import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, mean, rng } from '../core/math'
import { polyfit } from '../core/linalg'

const CODE = `import numpy as np

train_err, test_err = [], []
for degree in range(1, 12):
    coeffs = np.polyfit(x_train, y_train, degree)
    model = np.poly1d(coeffs)
    train_err.append(np.mean((model(x_train) - y_train) ** 2))
    test_err.append(np.mean((model(x_test) - y_test) ** 2))

best = int(np.argmin(test_err)) + 1   # the sweet spot`

const MAX_DEG = 11
const truth = (x: number) => Math.sin(2 * Math.PI * x)

interface Data {
  xtr: number[]
  ytr: number[]
  xte: number[]
  yte: number[]
}

interface Fit {
  degree: number
  model: (x: number) => number
  train: number
  test: number
}

interface Frame extends StepFrame {
  degree: number
  stage: 'fit' | 'train' | 'test' | 'best'
  fits: Fit[]
  best?: number
}

function makeData(n: number, noise: number): Data {
  const r = rng(21)
  const xtr = Array.from({ length: n }, (_, i) => Math.min(0.98, Math.max(0.02, (i + 0.5) / n + r.range(-0.3, 0.3) / n)))
  const ytr = xtr.map((x) => truth(x) + r.normal(0, noise))
  const xte = Array.from({ length: 40 }, () => r.range(0.02, 0.98))
  const yte = xte.map((x) => truth(x) + r.normal(0, noise))
  return { xtr, ytr, xte, yte }
}

function* program(d: Data): Generator<Frame, void, void> {
  const fits: Fit[] = []
  const maxDeg = Math.min(MAX_DEG, d.xtr.length - 1)
  for (let deg = 1; deg <= maxDeg; deg++) {
    const model = polyfit(d.xtr, d.ytr, deg, 0.5, 2)
    const train = mean(d.xtr.map((x, i) => (model(x) - d.ytr[i]) ** 2))
    const test = mean(d.xte.map((x, i) => (model(x) - d.yte[i]) ** 2))
    const narrate = deg === 1 || deg === 3 || deg === maxDeg
    const dwell = narrate ? 1.5 : 0.7
    const fit = { degree: deg, model, train, test }
    const label =
      deg === 1
        ? 'Degree 1 is a straight line — too simple to bend with the wave. High bias: it underfits.'
        : deg === 3
          ? 'Degree 3 follows the shape without chasing the noise. Train and test errors are both low.'
          : deg === maxDeg
            ? `Degree ${deg} threads through every training point — train error ≈ 0 — but swings wildly between them. High variance: it overfits.`
            : `Degree ${deg}: more flexibility, lower training error…`
    yield { degree: deg, stage: 'fit', fits: [...fits], line: [5, 6], dwell, note: label }
    fits.push(fit)
    yield { degree: deg, stage: 'train', fits: [...fits], line: 7, dwell: dwell * 0.6, note: label }
    yield { degree: deg, stage: 'test', fits: [...fits], line: 8, dwell: dwell * 0.6, note: narrate ? label : `Degree ${deg}: training error keeps falling — watch what the test error does.` }
  }
  let best = fits[0]
  for (const f of fits) if (f.test < best.test) best = f
  yield { degree: best.degree, stage: 'best', fits, best: best.degree, line: 10, dwell: 6, note: `Lowest test error at degree ${best.degree}. Complexity should be chosen on held-out data, never on training error.` }
}

export default function PolynomialFit() {
  const [n, setN] = useState(12)
  const [noise, setNoise] = useState(0.25)
  const data = useMemo(() => makeData(n, noise), [n, noise])
  const player = usePlayer(() => program(data), [data], { interval: 700, loop: 2500 })
  const fr = player.frame
  const current = fr.fits.find((f) => f.degree === fr.degree)
  const regime = fr.degree <= 2 ? 'underfitting' : fr.best === fr.degree || (fr.degree >= 3 && fr.degree <= 5) ? 'good fit' : 'overfitting'

  return (
    <LabFrame
      title="Bias–variance · polynomial degree"
      status={`degree ${fr.degree} · ${regime}`}
      player={player}
      stage={
        <Stage aspect={0.56} min={250} max={450}>
          {(box) => <FitPlot box={box} data={data} fit={current} degree={fr.degree} />}
        </Stage>
      }
      legend={[
        { label: 'training points', color: 'var(--accent-2)' },
        { label: 'test points', color: 'var(--fg-subtle)', shape: 'ring' },
        { label: 'model', color: 'var(--accent)', shape: 'line' },
        { label: 'true function', color: 'var(--fg-subtle)', shape: 'dash' },
      ]}
      below={
        <MiniPanel title="Error vs model complexity" right={current ? `train ${fmt(current.train, 3)} · test ${fmt(current.test, 3)}` : undefined}>
          <Stage aspect={0.3} min={130} max={170}>
            {(box) => <ErrorCurves box={box} fits={fr.fits} degree={fr.degree} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'bias_variance.py',
        vars: [
          { name: 'degree', value: String(fr.degree), color: 'var(--accent)' },
          { name: 'train MSE', value: fmt(current?.train, 4), color: 'var(--accent-2)' },
          { name: 'test MSE', value: fmt(current?.test, 4), color: 'var(--accent-3)' },
          { name: 'len(x_train)', value: String(n) },
          { name: 'best', value: fr.best ? String(fr.best) : '—' },
        ],
      }}
      params={
        <>
          <Slider label="Training points" value={n} min={8} max={40} onChange={setN} />
          <Slider label="Noise" value={noise} min={0.05} max={0.6} step={0.05} onChange={setNoise} format={(v) => `σ = ${v.toFixed(2)}`} />
        </>
      }
    />
  )
}

function FitPlot({ box, data, fit, degree }: { box: Box; data: Data; fit?: Fit; degree: number }) {
  const clip = useId().replace(/:/g, '')
  const fr = frame2d(box, [0, 1], [-2, 2], { l: 34, b: 26, t: 12, r: 12 })
  const { sx, sy } = fr
  const N = 140
  const sample = (fn: (x: number) => number) =>
    pathOf(Array.from({ length: N + 1 }, (_, i) => {
      const x = i / N
      return [sx(x), sy(Math.max(-3, Math.min(3, fn(x))))] as [number, number]
    }))
  const d = fit ? sample(fit.model) : sample(() => 0)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label={`Polynomial of degree ${degree} fitted to noisy data`}>
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xTicks={5} yTicks={4} zeroLines />
      <g clipPath={`url(#${clip})`}>
        <path d={sample(truth)} fill="none" strokeWidth={1.5} strokeDasharray="5 6" style={{ stroke: 'var(--fg-subtle)' }} />
        <motion.path
          initial={false}
          animate={{ d }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 55%, transparent))' }}
        />
      </g>
      {data.xte.map((x, i) => (
        <circle key={`t${i}`} cx={sx(x)} cy={sy(data.yte[i])} r={3} fill="none" strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />
      ))}
      {data.xtr.map((x, i) => (
        <circle key={`p${i}`} cx={sx(x)} cy={sy(data.ytr[i])} r={4.5} strokeWidth={1.5} style={{ fill: 'var(--accent-2)', stroke: 'var(--bg)' }} />
      ))}
      <text x={fr.right - 6} y={fr.top + 16} textAnchor="end" className="viz-text" fontSize={13}>
        degree = {degree}
      </text>
    </svg>
  )
}

function ErrorCurves({ box, fits, degree }: { box: Box; fits: Fit[]; degree: number }) {
  const fr = frame2d(box, [1, MAX_DEG], [-3, 1], { l: 34, b: 20, t: 8, r: 10 })
  const { sx, sy } = fr
  const lg = (v: number) => Math.max(-3, Math.min(1, Math.log10(Math.max(v, 1e-6))))
  const train = fits.map((f) => [sx(f.degree), sy(lg(f.train))] as [number, number])
  const test = fits.map((f) => [sx(f.degree), sy(lg(f.test))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={10} yTicks={4} xLabel="degree" yLabel="log₁₀ MSE" />
      <line x1={sx(degree)} x2={sx(degree)} y1={fr.top} y2={fr.bottom} strokeDasharray="3 4" style={{ stroke: 'var(--accent)' }} />
      <path d={pathOf(train)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-2)' }} />
      <path d={pathOf(test)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
      {train.map(([x, y], i) => (
        <circle key={`a${i}`} cx={x} cy={y} r={2.8} style={{ fill: 'var(--accent-2)' }} />
      ))}
      {test.map(([x, y], i) => (
        <circle key={`b${i}`} cx={x} cy={y} r={2.8} style={{ fill: 'var(--accent-3)' }} />
      ))}
      <text x={fr.right - 4} y={fr.top + 12} textAnchor="end" className="viz-muted" fontSize={10.5}>
        <tspan style={{ fill: 'var(--accent-2)' }}>— train</tspan>
        <tspan dx={10} style={{ fill: 'var(--accent-3)' }}>— test</tspan>
      </text>
    </svg>
  )
}

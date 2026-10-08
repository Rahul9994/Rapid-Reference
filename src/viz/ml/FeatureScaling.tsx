import { useMemo } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, fitFrame, type Box } from '../core/plot'
import { fmt, mean, rng } from '../core/math'

const CODE = `import numpy as np

X = np.column_stack([salary, experience])   # raw: very different scales

# Min-max scaling → every feature in [0, 1]
X_mm = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0))

# Standardization → mean 0, std 1
X_std = (X - X.mean(axis=0)) / X.std(axis=0)

# In practice: fit on the training set only, then reuse
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler().fit(X_train)
X_test_scaled = scaler.transform(X_test)`

type Space = 'raw' | 'minmax' | 'standard'

interface Frame extends StepFrame {
  space: Space
  showNN: boolean
}

function* program(): Generator<Frame, void, void> {
  yield { space: 'raw', showNN: false, line: 3, dwell: 2, note: 'Salary is in thousands (20 – 200) while experience is in years (0 – 15). Drawn to the same scale, the cloud is a thin strip.' }
  yield { space: 'raw', showNN: true, line: 3, dwell: 2.4, note: 'Distance-based models see it that way too: the nearest neighbour of the ringed query is chosen almost entirely by salary.' }
  yield { space: 'minmax', showNN: false, line: [5, 6], dwell: 1.6, note: 'Min-max scaling squeezes each feature into [0, 1]: (x − min) / (max − min).' }
  yield { space: 'minmax', showNN: true, line: [5, 6], dwell: 2.4, note: 'Now both features count equally — and the query has a different nearest neighbour.' }
  yield { space: 'standard', showNN: true, line: [8, 9], dwell: 2.4, note: 'Standardization centres each feature at 0 with unit standard deviation. Preferred for gradient descent, PCA, SVMs, regularized models.' }
  yield { space: 'standard', showNN: true, line: [11, 14], dwell: 3, note: 'Always fit the scaler on training data only and reuse it on test data — otherwise test statistics leak into training.' }
}

interface Data {
  raw: [number, number][]
  q: number
}

function makeData(): Data {
  const r = rng(8)
  const raw: [number, number][] = [
    [100, 3],
    [104, 13],
    [125, 3.5],
  ]
  while (raw.length < 34) {
    const p: [number, number] = [r.range(20, 200), r.range(0, 15)]
    const dRaw = Math.hypot(p[0] - 100, p[1] - 3)
    const dMm = Math.hypot((p[0] - 100) / 180, (p[1] - 3) / 15)
    if (dRaw < 14 || dMm < 0.2) continue
    raw.push(p)
  }
  raw.push([20, 0], [200, 15])
  return { raw, q: 0 }
}

function transform(raw: [number, number][], space: Space): [number, number][] {
  if (space === 'raw') return raw
  const xs = raw.map((p) => p[0])
  const ys = raw.map((p) => p[1])
  if (space === 'minmax') {
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    return raw.map(([x, y]) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)])
  }
  const mx = mean(xs)
  const my = mean(ys)
  const sx = Math.sqrt(mean(xs.map((v) => (v - mx) ** 2)))
  const sy = Math.sqrt(mean(ys.map((v) => (v - my) ** 2)))
  return raw.map(([x, y]) => [(x - mx) / sx, (y - my) / sy])
}

function nearest(pts: [number, number][], q: number) {
  let best = -1
  let bd = Infinity
  pts.forEach((p, i) => {
    if (i === q) return
    const d = Math.hypot(p[0] - pts[q][0], p[1] - pts[q][1])
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}

export default function FeatureScaling() {
  const data = useMemo(makeData, [])
  const player = usePlayer(program, [], { interval: 700, loop: 2200 })
  const fr = player.frame
  const pts = transform(data.raw, fr.space)
  const nn = nearest(pts, data.q)
  const stats = (k: 0 | 1) => {
    const v = pts.map((p) => p[k])
    const m = mean(v)
    return { min: Math.min(...v), max: Math.max(...v), mean: m, std: Math.sqrt(mean(v.map((x) => (x - m) ** 2))) }
  }
  const s0 = stats(0)
  const s1 = stats(1)
  const label = { raw: 'raw features', minmax: 'min-max scaled', standard: 'standardized' }[fr.space]

  return (
    <LabFrame
      title={`Feature scaling · ${label}`}
      status={label}
      player={player}
      stage={
        <Stage aspect={0.56} min={260} max={440}>
          {(box) => <Board box={box} pts={pts} q={data.q} nn={fr.showNN ? nn : -1} space={fr.space} />}
        </Stage>
      }
      legend={[
        { label: 'sample', color: 'var(--accent-2)' },
        { label: 'query', color: 'var(--fg)', shape: 'ring' },
        { label: 'nearest neighbour', color: 'var(--accent-3)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Column statistics">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] font-mono text-[11.5px]">
              <thead>
                <tr className="text-subtle">
                  <th className="py-1 text-left font-normal">feature</th>
                  <th className="py-1 text-right font-normal">min</th>
                  <th className="py-1 text-right font-normal">max</th>
                  <th className="py-1 text-right font-normal">mean</th>
                  <th className="py-1 text-right font-normal">std</th>
                </tr>
              </thead>
              <tbody className="text-fg tabular">
                {[
                  ['salary', s0],
                  ['experience', s1],
                ].map(([name, s]) => {
                  const st = s as typeof s0
                  return (
                    <tr key={name as string} className="border-t border-line">
                      <td className="py-1.5 text-muted">{name as string}</td>
                      <td className="py-1.5 text-right">{fmt(st.min, 2)}</td>
                      <td className="py-1.5 text-right">{fmt(st.max, 2)}</td>
                      <td className="py-1.5 text-right">{fmt(st.mean, 2)}</td>
                      <td className="py-1.5 text-right">{fmt(st.std, 2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'scaling.py',
        vars: [
          { name: 'space', value: label },
          { name: 'query', value: `[${fmt(pts[data.q][0], 2)}, ${fmt(pts[data.q][1], 2)}]` },
          { name: 'nearest', value: fr.showNN ? `#${nn} [${fmt(pts[nn][0], 2)}, ${fmt(pts[nn][1], 2)}]` : '—', color: 'var(--accent-3)' },
        ],
      }}
    />
  )
}

function Board({ box, pts, q, nn, space }: { box: Box; pts: [number, number][]; q: number; nn: number; space: Space }) {
  const fr = fitFrame(box, pts, { l: 44, b: 30, t: 14, r: 16 }, 0.06)
  const { sx, sy } = fr
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Scatter plot before and after feature scaling (equal axis scales)">
      <motion.g key={space} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <Axes f={fr} xTicks={8} yTicks={5} xLabel={space === 'raw' ? 'salary (₹ k / month)' : 'salary'} yLabel={space === 'raw' ? 'experience (yrs)' : 'experience'} digits={space === 'raw' ? 0 : 1} />
      </motion.g>
      {nn >= 0 && (
        <motion.line key={`${space}-${nn}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} x1={sx(pts[q][0])} y1={sy(pts[q][1])} x2={sx(pts[nn][0])} y2={sy(pts[nn][1])} strokeWidth={2.5} style={{ stroke: 'var(--accent-3)' }} />
      )}
      {pts.map((p, i) => (
        <motion.circle
          key={i}
          initial={false}
          animate={{ cx: sx(p[0]), cy: sy(p[1]) }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: (i % 12) * 0.015 }}
          r={i === q ? 7 : i === nn ? 6 : 4.5}
          strokeWidth={i === q ? 2.5 : 1.3}
          style={{ fill: i === q ? 'var(--bg)' : i === nn ? 'var(--accent-3)' : 'var(--accent-2)', stroke: i === q ? 'var(--fg)' : 'var(--bg)' }}
        />
      ))}
    </svg>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, FieldCanvas, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, mean } from '../core/math'
import { blobs, CLASS_COLORS, type Point } from '../core/datasets'
import { useThemeColors } from '../core/hooks'

const CODE = `import numpy as np

def gaussian(x, mu, var):
    return np.exp(-(x - mu) ** 2 / (2 * var)) / np.sqrt(2 * np.pi * var)

# fit: per class, a mean & variance for EACH feature + a prior
for c in classes:
    Xc = X[y == c]
    mu[c], var[c] = Xc.mean(axis=0), Xc.var(axis=0)
    prior[c] = len(Xc) / len(X)

# predict: features treated as independent given the class
def predict_proba(x):
    scores = np.array([prior[c] * np.prod(gaussian(x, mu[c], var[c]))
                       for c in classes])
    return scores / scores.sum()          # normalise → posterior`

interface Model {
  mu: [number, number][]
  var: [number, number][]
  prior: number[]
}

const gauss = (x: number, m: number, v: number) => Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v)

function fit(pts: Point[]): Model {
  const model: Model = { mu: [], var: [], prior: [] }
  for (const c of [0, 1]) {
    const xc = pts.filter((p) => p.c === c)
    const mx = mean(xc.map((p) => p.x))
    const my = mean(xc.map((p) => p.y))
    model.mu.push([mx, my])
    model.var.push([mean(xc.map((p) => (p.x - mx) ** 2)), mean(xc.map((p) => (p.y - my) ** 2))])
    model.prior.push(xc.length / pts.length)
  }
  return model
}

function posterior(m: Model, x: number, y: number) {
  const s = [0, 1].map((c) => m.prior[c] * gauss(x, m.mu[c][0], m.var[c][0]) * gauss(y, m.mu[c][1], m.var[c][1]))
  const z = s[0] + s[1] || 1e-300
  return { scores: s, post: [s[0] / z, s[1] / z] }
}

const TESTS: [number, number][] = [
  [0.1, 0.3],
  [-1.6, 1.2],
  [1.5, -0.6],
  [0.9, 1.6],
]

interface Frame extends StepFrame {
  fitted: number
  q?: [number, number]
  phase: 'fit' | 'move' | 'like' | 'post'
}

function* program(): Generator<Frame, void, void> {
  yield { fitted: 0, phase: 'fit', line: [7, 8], dwell: 1.4, note: 'Fitting is just counting: for each class, compute a mean and variance per feature, plus the class prior.' }
  yield { fitted: 1, phase: 'fit', line: [9, 10], dwell: 1.6, note: 'Class 0: one Gaussian along x₁ (top) and one along x₂ (right). No interactions between features are modelled.' }
  yield { fitted: 2, phase: 'fit', line: [9, 10], dwell: 1.6, note: 'Class 1 gets its own pair of Gaussians — note it is wider, so its variance is larger.' }
  for (const [i, q] of TESTS.entries()) {
    const d = i === 0 ? 1.5 : 0.9
    yield { fitted: 2, q, phase: 'move', line: 13, dwell: d, note: 'A new point to classify.' }
    yield { fitted: 2, q, phase: 'like', line: [14, 15], dwell: d * 1.2, note: 'Read off p(x₁|c) and p(x₂|c) from each class’s curves and multiply them with the prior — the “naive” independence assumption.' }
    yield { fitted: 2, q, phase: 'post', line: 16, dwell: d * 1.3, note: 'Normalise the scores so they sum to 1: that is the posterior P(c | x).' }
  }
}

export default function NaiveBayes() {
  const [imbalance, setImbalance] = useState(0.5)
  const pts = useMemo(() => {
    const a = blobs([[-0.9, 0.6]], Math.round(40 * imbalance) + 4, [0.55, 0.45], 31).map((p) => ({ ...p, c: 0 }))
    const b = blobs([[0.9, -0.2]], Math.round(40 * (1 - imbalance)) + 4, [0.75, 0.85], 32).map((p) => ({ ...p, c: 1 }))
    return [...a, ...b]
  }, [imbalance])
  const model = useMemo(() => fit(pts), [pts])
  const player = usePlayer(program, [pts], { interval: 650, loop: 1800 })
  const fr = player.frame
  const q = fr.q
  const res = q ? posterior(model, q[0], q[1]) : null

  return (
    <LabFrame
      title="Gaussian naive Bayes"
      status={`priors ${fmt(model.prior[0], 2)} / ${fmt(model.prior[1], 2)}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={280} max={480}>
          {(box) => <Board box={box} pts={pts} model={model} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'class 0', color: CLASS_COLORS[0] },
        { label: 'class 1', color: CLASS_COLORS[1] },
        { label: 'per-feature likelihoods', color: 'var(--fg-muted)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Posterior P(class | x)">
          <div className="grid gap-2 px-1 py-1 sm:grid-cols-2">
            {[0, 1].map((c) => (
              <div key={c} className="rounded-xl border border-line px-3 py-2">
                <div className="flex items-baseline justify-between font-mono text-[11px] text-muted">
                  <span style={{ color: CLASS_COLORS[c] }}>class {c}</span>
                  <span className="text-fg tabular">{res && fr.phase === 'post' ? `${(res.post[c] * 100).toFixed(1)}%` : '—'}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: CLASS_COLORS[c] }}
                    initial={false}
                    animate={{ width: res && fr.phase === 'post' ? `${res.post[c] * 100}%` : '0%' }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  />
                </div>
                <div className="mt-1.5 font-mono text-[10.5px] text-subtle">
                  {fmt(model.prior[c], 2)} × {res && fr.phase !== 'move' ? fmt(gauss(q![0], model.mu[c][0], model.var[c][0]), 3) : '·'} × {res && fr.phase !== 'move' ? fmt(gauss(q![1], model.mu[c][1], model.var[c][1]), 3) : '·'}
                </div>
              </div>
            ))}
          </div>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'naive_bayes.py',
        vars: [
          { name: 'mu[0]', value: fr.fitted >= 1 ? `[${fmt(model.mu[0][0], 2)}, ${fmt(model.mu[0][1], 2)}]` : '—', color: CLASS_COLORS[0] },
          { name: 'mu[1]', value: fr.fitted >= 2 ? `[${fmt(model.mu[1][0], 2)}, ${fmt(model.mu[1][1], 2)}]` : '—', color: CLASS_COLORS[1] },
          { name: 'var[0]', value: fr.fitted >= 1 ? `[${fmt(model.var[0][0], 2)}, ${fmt(model.var[0][1], 2)}]` : '—' },
          { name: 'var[1]', value: fr.fitted >= 2 ? `[${fmt(model.var[1][0], 2)}, ${fmt(model.var[1][1], 2)}]` : '—' },
          { name: 'x', value: q ? `(${fmt(q[0], 2)}, ${fmt(q[1], 2)})` : '—' },
          { name: 'posterior', value: res && fr.phase === 'post' ? `[${fmt(res.post[0], 2)}, ${fmt(res.post[1], 2)}]` : '—', color: 'var(--accent)' },
        ],
      }}
      params={<Slider label="Share of class 0 (prior)" value={imbalance} min={0.15} max={0.85} step={0.05} onChange={setImbalance} format={(v) => `${Math.round(v * 100)}%`} />}
    />
  )
}

function Board({ box, pts, model, f }: { box: Box; pts: Point[]; model: Model; f: Frame }) {
  const pad = { l: 34, b: 26, t: 64, r: 70 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-3, 3], [-3 * aspect, 3 * aspect], pad)
  const { sx, sy } = fr
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1] })
  const paint = useMemo(
    () => (x: number, y: number): [number, number, number, number] => {
      const { post } = posterior(model, x, y)
      const c = post[1] >= 0.5 ? C.b : C.a
      return [c[0], c[1], c[2], Math.round(255 * Math.abs(post[1] - 0.5) * 0.42)]
    },
    [C, model],
  )
  const q = f.q
  const topH = 50
  const rightW = 56
  const peak = Math.max(...[0, 1].flatMap((c) => [gauss(model.mu[c][0], model.mu[c][0], model.var[c][0]), gauss(model.mu[c][1], model.mu[c][1], model.var[c][1])]))
  const top = (c: number) => {
    const pts2: [number, number][] = []
    for (let i = 0; i <= 120; i++) {
      const x = fr.sx.domain[0] + ((fr.sx.domain[1] - fr.sx.domain[0]) * i) / 120
      pts2.push([sx(x), fr.top - 8 - (gauss(x, model.mu[c][0], model.var[c][0]) / peak) * topH])
    }
    return pts2
  }
  const right = (c: number) => {
    const pts2: [number, number][] = []
    const [y0, y1] = fr.sy.domain
    for (let i = 0; i <= 120; i++) {
      const y = y0 + ((y1 - y0) * i) / 120
      pts2.push([fr.right + 8 + (gauss(y, model.mu[c][1], model.var[c][1]) / peak) * rightW, sy(y)])
    }
    return pts2
  }
  const showLike = q && (f.phase === 'like' || f.phase === 'post')
  return (
    <>
      {f.fitted >= 2 && <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={5} />}
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Naive Bayes with per-feature Gaussian likelihoods">
        <Axes f={fr} xLabel="x₁" yLabel="x₂" />
        {[0, 1].map((c) =>
          f.fitted > c ? (
            <g key={c}>
              <motion.path
                d={`${pathOf(top(c))}L${fr.right},${fr.top - 8}L${fr.left},${fr.top - 8}Z`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                strokeWidth={1.8}
                style={{ fill: `color-mix(in oklab, ${CLASS_COLORS[c]} 16%, transparent)`, stroke: CLASS_COLORS[c] }}
              />
              <motion.path
                d={`${pathOf(right(c))}L${fr.right + 8},${fr.top}L${fr.right + 8},${fr.bottom}Z`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                strokeWidth={1.8}
                style={{ fill: `color-mix(in oklab, ${CLASS_COLORS[c]} 16%, transparent)`, stroke: CLASS_COLORS[c] }}
              />
            </g>
          ) : null,
        )}
        <line x1={fr.left} x2={fr.right} y1={fr.top - 8} y2={fr.top - 8} className="viz-axis" />
        <line x1={fr.right + 8} x2={fr.right + 8} y1={fr.top} y2={fr.bottom} className="viz-axis" />
        <text x={fr.left} y={fr.top - topH - 14} className="viz-label">
          p(x₁ | class)
        </text>
        <text x={fr.right + 10} y={fr.top - 14} className="viz-label">
          p(x₂ | c)
        </text>
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.2} strokeWidth={1.3} style={{ fill: CLASS_COLORS[p.c], stroke: 'var(--bg)', opacity: q ? 0.55 : 1, transition: 'opacity 0.4s' }} />
        ))}
        {q && (
          <g>
            {showLike && (
              <>
                <line x1={sx(q[0])} x2={sx(q[0])} y1={sy(q[1])} y2={fr.top - 8 - topH - 4} strokeDasharray="3 4" style={{ stroke: 'var(--fg-muted)' }} />
                <line x1={sx(q[0])} x2={fr.right + 8 + rightW + 4} y1={sy(q[1])} y2={sy(q[1])} strokeDasharray="3 4" style={{ stroke: 'var(--fg-muted)' }} />
                {[0, 1].map((c) => (
                  <g key={c}>
                    <circle cx={sx(q[0])} cy={fr.top - 8 - (gauss(q[0], model.mu[c][0], model.var[c][0]) / peak) * topH} r={4} style={{ fill: CLASS_COLORS[c], stroke: 'var(--fg)' }} />
                    <circle cx={fr.right + 8 + (gauss(q[1], model.mu[c][1], model.var[c][1]) / peak) * rightW} cy={sy(q[1])} r={4} style={{ fill: CLASS_COLORS[c], stroke: 'var(--fg)' }} />
                  </g>
                ))}
              </>
            )}
            <motion.g initial={false} animate={{ x: sx(q[0]), y: sy(q[1]) }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
              <circle r={13} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--fg)', opacity: 0.4 }} />
              <circle r={7} strokeWidth={2.5} style={{ fill: f.phase === 'post' ? CLASS_COLORS[posterior(model, q[0], q[1]).post[1] >= 0.5 ? 1 : 0] : 'var(--bg)', stroke: 'var(--fg)', transition: 'fill 0.4s' }} />
            </motion.g>
          </g>
        )}
      </svg>
    </>
  )
}

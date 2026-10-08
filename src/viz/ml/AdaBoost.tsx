import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, FieldCanvas, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt, rng } from '../core/math'
import { CLASS_COLORS } from '../core/datasets'
import { useThemeColors } from '../core/hooks'

const CODE = `import numpy as np

w = np.full(n, 1 / n)                  # equal weights to start
ensemble = []
for t in range(rounds):
    stump = fit_stump(X, y, sample_weight=w)  # best weighted split
    pred = stump.predict(X)                   # labels in {-1, +1}
    err = w[pred != y].sum()                  # weighted error
    alpha = 0.5 * np.log((1 - err) / err)     # this stump's say
    w = w * np.exp(-alpha * y * pred)         # up-weight the mistakes
    w = w / w.sum()
    ensemble.append((alpha, stump))

def predict(X):
    return np.sign(sum(a * s.predict(X) for a, s in ensemble))`

interface P {
  x: number
  y: number
  label: 1 | -1
}

interface Stump {
  f: 0 | 1
  t: number
  s: 1 | -1 // predict s if x_f > t else -s
}

const stumpPredict = (st: Stump, x: number, y: number) => ((st.f === 0 ? x : y) > st.t ? st.s : -st.s)

function fitStump(pts: P[], w: number[]): Stump {
  let best: Stump = { f: 0, t: 0, s: 1 }
  let bestErr = Infinity
  for (const f of [0, 1] as const) {
    const vals = [...new Set(pts.map((p) => (f === 0 ? p.x : p.y)))].sort((a, b) => a - b)
    const cands = [vals[0] - 0.01, ...vals.slice(0, -1).map((v, i) => (v + vals[i + 1]) / 2)]
    for (const t of cands) {
      for (const s of [1, -1] as const) {
        let err = 0
        pts.forEach((p, i) => {
          if (stumpPredict({ f, t, s }, p.x, p.y) !== p.label) err += w[i]
        })
        if (err < bestErr - 1e-12) {
          bestErr = err
          best = { f, t, s }
        }
      }
    }
  }
  return best
}

interface Round {
  stump: Stump
  err: number
  alpha: number
}

interface Frame extends StepFrame {
  t: number
  w: number[]
  rounds: Round[]
  stump?: Stump
  phase: 'start' | 'fit' | 'err' | 'alpha' | 'reweight' | 'ensemble' | 'done'
  trainErr: number[]
}

function ensembleScore(rounds: Round[], x: number, y: number) {
  let F = 0
  for (const r of rounds) F += r.alpha * stumpPredict(r.stump, x, y)
  return F
}

function* program(pts: P[], T: number): Generator<Frame, void, void> {
  const n = pts.length
  let w = pts.map(() => 1 / n)
  const rounds: Round[] = []
  const trainErr: number[] = []
  yield { t: 0, w, rounds: [], trainErr: [], phase: 'start', line: [3, 4], dwell: 1.6, note: 'Every training point starts with the same weight 1/n (dot size = weight).' }
  for (let t = 0; t < T; t++) {
    const narrate = t < 2
    const d = narrate ? 1.4 : t < 5 ? 0.6 : 0.3
    const stump = fitStump(pts, w)
    yield { t, w, rounds: [...rounds], stump, trainErr: [...trainErr], phase: 'fit', line: [6, 7], dwell: d, note: narrate ? 'Fit a decision stump — a one-split tree — to the weighted data. Alone it is only slightly better than guessing.' : `Round ${t + 1}: new stump on the re-weighted data.` }
    let err = 0
    pts.forEach((p, i) => {
      if (stumpPredict(stump, p.x, p.y) !== p.label) err += w[i]
    })
    err = Math.min(Math.max(err, 1e-9), 1 - 1e-9)
    yield { t, w, rounds: [...rounds], stump, trainErr: [...trainErr], phase: 'err', line: 8, dwell: d, note: narrate ? `Weighted error = total weight of the misclassified points (ringed) = ${fmt(err, 3)}.` : `Round ${t + 1}: weighted error ${fmt(err, 3)}.` }
    const alpha = 0.5 * Math.log((1 - err) / err)
    yield { t, w, rounds: [...rounds], stump, trainErr: [...trainErr], phase: 'alpha', line: 9, dwell: d, note: narrate ? `Its vote α = ½·ln((1 − err)/err) = ${fmt(alpha, 3)}: lower error → louder voice.` : `Round ${t + 1}: α = ${fmt(alpha, 3)}.` }
    w = pts.map((p, i) => w[i] * Math.exp(-alpha * p.label * stumpPredict(stump, p.x, p.y)))
    const z = w.reduce((s, v) => s + v, 0)
    w = w.map((v) => v / z)
    yield { t, w, rounds: [...rounds], stump, trainErr: [...trainErr], phase: 'reweight', line: [10, 11], dwell: d, note: narrate ? 'Re-weight: mistakes grow, correct points shrink. The next stump is forced to focus on the hard cases.' : `Round ${t + 1}: re-weighting.` }
    rounds.push({ stump, alpha, err })
    const wrong = pts.filter((p) => Math.sign(ensembleScore(rounds, p.x, p.y)) !== p.label).length
    trainErr.push(wrong / n)
    yield { t, w, rounds: [...rounds], trainErr: [...trainErr], phase: 'ensemble', line: 12, dwell: d, note: narrate ? 'Add the stump to the ensemble. The background shows sign(Σ αₜ·hₜ(x)) — already more than one straight cut.' : `After ${t + 1} rounds: training error ${(trainErr[trainErr.length - 1] * 100).toFixed(1)}%.` }
  }
  yield { t: T, w, rounds, trainErr, phase: 'done', line: [14, 15], dwell: 5, note: `Done: ${T} weak stumps combined into one strong, non-linear classifier.` }
}

function makeData(): P[] {
  const r = rng(13)
  const pts: P[] = []
  for (let i = 0; i < 60; i++) {
    const x = r.range(-1, 1)
    const y = r.range(-1, 1)
    let label: 1 | -1 = x * x + y * y < 0.45 ? 1 : -1
    if (r.next() < 0.04) label = label === 1 ? -1 : 1
    pts.push({ x, y, label })
  }
  return pts
}

export default function AdaBoost() {
  const [T, setT] = useState(15)
  const pts = useMemo(makeData, [])
  const player = usePlayer(() => program(pts, T), [T], { interval: 620, loop: 2600 })
  const fr = player.frame
  const last = fr.rounds[fr.rounds.length - 1]

  return (
    <LabFrame
      title="AdaBoost · weak stumps, strong ensemble"
      status={`round ${Math.min(fr.t + 1, T)}/${T}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={470}>
          {(box) => <Board box={box} pts={pts} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'y = −1', color: CLASS_COLORS[0] },
        { label: 'y = +1', color: CLASS_COLORS[1] },
        { label: 'current stump', color: 'var(--accent)', shape: 'line' },
        { label: 'misclassified', color: 'var(--hard)', shape: 'ring' },
      ]}
      below={
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniPanel title="α per round (stump's vote)">
            <Stage aspect={0.5} min={130} max={170}>
              {(box) => <Alphas box={box} rounds={fr.rounds} T={T} />}
            </Stage>
          </MiniPanel>
          <MiniPanel title="Ensemble training error" right={fr.trainErr.length ? `${(fr.trainErr[fr.trainErr.length - 1] * 100).toFixed(1)}%` : undefined}>
            <Stage aspect={0.5} min={130} max={170}>
              {(box) => <ErrCurve box={box} errs={fr.trainErr} T={T} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{
        source: CODE,
        file: 'adaboost.py',
        vars: [
          { name: 't', value: String(Math.min(fr.t, T - 1)) },
          { name: 'stump', value: fr.stump ? `x${fr.stump.f === 0 ? '₁' : '₂'} > ${fmt(fr.stump.t, 2)}` : '—', color: 'var(--accent)' },
          { name: 'err', value: last && fr.phase === 'ensemble' ? fmt(last.err, 3) : '—', color: 'var(--accent-3)' },
          { name: 'alpha', value: last && fr.phase === 'ensemble' ? fmt(last.alpha, 3) : '—', color: 'var(--accent-2)' },
          { name: 'max(w)', value: fmt(Math.max(...fr.w), 3) },
          { name: 'len(ensemble)', value: String(fr.rounds.length) },
        ],
      }}
      params={<Slider label="Boosting rounds" value={T} min={3} max={30} onChange={setT} />}
    />
  )
}

function Board({ box, pts, f }: { box: Box; pts: P[]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const fr = frame2d(box, [-1.15, 1.15], [-1.15 * Math.max(1, aspect), 1.15 * Math.max(1, aspect)], pad)
  const { sx, sy } = fr
  const C = useThemeColors({ a: CLASS_COLORS[0], b: CLASS_COLORS[1] })
  const rounds = f.rounds
  const paint = useMemo(
    () => (x: number, y: number): [number, number, number, number] => {
      if (!rounds.length) return [0, 0, 0, 0]
      const F = ensembleScore(rounds, x, y)
      const c = F >= 0 ? C.b : C.a
      return [c[0], c[1], c[2], Math.round(255 * Math.min(0.32, 0.1 + Math.abs(F) * 0.08))]
    },
    [C, rounds],
  )
  const n = pts.length
  const st = f.stump
  const stumpLine = st ? (st.f === 0 ? { x1: sx(st.t), x2: sx(st.t), y1: fr.top, y2: fr.bottom } : { x1: fr.left, x2: fr.right, y1: sy(st.t), y2: sy(st.t) }) : null
  return (
    <>
      <FieldCanvas f={fr} paint={paint} deps={[paint]} resolution={5} />
      <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="AdaBoost decision regions with weighted points">
        <defs>
          <ClipRect id={clip} f={fr} />
        </defs>
        <Axes f={fr} xLabel="x₁" yLabel="x₂" digits={1} />
        <g clipPath={`url(#${clip})`}>
          {stumpLine && <motion.line initial={false} animate={stumpLine} transition={{ duration: 0.4 }} strokeWidth={3} style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent))' }} />}
        </g>
        {pts.map((p, i) => {
          const r = Math.max(2.5, Math.min(16, Math.sqrt(f.w[i] * n) * 4.6))
          const wrong = st && (f.phase === 'err' || f.phase === 'alpha' || f.phase === 'reweight') && stumpPredict(st, p.x, p.y) !== p.label
          return (
            <g key={i}>
              {wrong && <circle cx={sx(p.x)} cy={sy(p.y)} r={r + 4} fill="none" strokeWidth={1.6} style={{ stroke: 'var(--hard)' }} />}
              <motion.circle
                cx={sx(p.x)}
                cy={sy(p.y)}
                initial={false}
                animate={{ r }}
                transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                strokeWidth={1.2}
                style={{ fill: CLASS_COLORS[p.label === 1 ? 1 : 0], stroke: 'var(--bg)', opacity: 0.92 }}
              />
            </g>
          )
        })}
      </svg>
    </>
  )
}

function Alphas({ box, rounds, T }: { box: Box; rounds: Round[]; T: number }) {
  const fr = frame2d(box, [0, T], [0, Math.max(1, ...rounds.map((r) => r.alpha)) * 1.1], { l: 30, b: 20, t: 6, r: 6 })
  const bw = Math.max(2, ((fr.right - fr.left) / T) * 0.7)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={5} yTicks={3} xLabel="round" digits={1} />
      {rounds.map((r, i) => (
        <motion.rect key={i} x={fr.sx(i + 0.5) - bw / 2} width={bw} initial={{ y: fr.bottom, height: 0 }} animate={{ y: fr.sy(r.alpha), height: fr.bottom - fr.sy(r.alpha) }} rx={2} style={{ fill: 'var(--accent-2)' }} />
      ))}
    </svg>
  )
}

function ErrCurve({ box, errs, T }: { box: Box; errs: number[]; T: number }) {
  const fr = frame2d(box, [1, T], [0, 0.5], { l: 30, b: 20, t: 6, r: 6 })
  const pts = errs.map((e, i) => [fr.sx(i + 1), fr.sy(Math.min(0.5, e))] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={5} yTicks={3} xLabel="round" digits={1} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} style={{ fill: 'var(--accent-3)' }} />}
    </svg>
  )
}

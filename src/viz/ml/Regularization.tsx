import { useId, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, ClipRect, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { fmt } from '../core/math'
import { eig2 } from '../core/linalg'

type Kind = 'l2' | 'l1'

const CODE = `import numpy as np

# Loss J(w) = (w - w_ols)ᵀ H (w - w_ols)  → elliptical contours
w_lasso = w_ols.copy()
for lam in np.logspace(-2, 0.75, 40):     # weak → strong penalty
    # Ridge (L2): minimise J(w) + lam * ||w||²   (closed form)
    w_ridge = np.linalg.solve(H + lam * np.eye(2), H @ w_ols)

    # Lasso (L1): minimise J(w) + lam * ||w||₁   (coordinate descent)
    w = w_lasso.copy()                    # warm start
    for _ in range(100):
        for j in range(2):
            rho = H[j] @ (w_ols - w) + H[j, j] * w[j]
            w[j] = np.sign(rho) * max(abs(rho) - lam / 2, 0) / H[j, j]
    w_lasso = w`

const H = [
  [1, 0.55],
  [0.55, 0.8],
]
const W_OLS: [number, number] = [2.6, 0.9]
const LAMS = Array.from({ length: 40 }, (_, i) => 10 ** (-2 + (2.75 * i) / 39))

function ridge(lam: number): [number, number] {
  const a = H[0][0] + lam
  const b = H[0][1]
  const d = H[1][1] + lam
  const r0 = H[0][0] * W_OLS[0] + H[0][1] * W_OLS[1]
  const r1 = H[1][0] * W_OLS[0] + H[1][1] * W_OLS[1]
  const det = a * d - b * b
  return [(d * r0 - b * r1) / det, (a * r1 - b * r0) / det]
}

function lasso(lam: number, start: [number, number]): [number, number] {
  const w: [number, number] = [...start]
  for (let it = 0; it < 100; it++) {
    for (let j = 0; j < 2; j++) {
      const rho = H[j][0] * (W_OLS[0] - w[0]) + H[j][1] * (W_OLS[1] - w[1]) + H[j][j] * w[j]
      w[j] = (Math.sign(rho) * Math.max(Math.abs(rho) - lam / 2, 0)) / H[j][j]
    }
  }
  return w
}

const J = (w: [number, number]) => {
  const dx = w[0] - W_OLS[0]
  const dy = w[1] - W_OLS[1]
  return H[0][0] * dx * dx + 2 * H[0][1] * dx * dy + H[1][1] * dy * dy
}

interface Frame extends StepFrame {
  i: number
  ridgeW: [number, number][]
  lassoW: [number, number][]
}

function* program(kind: Kind): Generator<Frame, void, void> {
  const ridgeW: [number, number][] = []
  const lassoW: [number, number][] = []
  let lw: [number, number] = [...W_OLS]
  yield { i: -1, ridgeW: [], lassoW: [], line: [3, 4], dwell: 1.6, note: 'Unregularized least squares lands at the centre of the ellipses: w_ols, with both weights non-zero.' }
  for (let i = 0; i < LAMS.length; i++) {
    const lam = LAMS[i]
    ridgeW.push(ridge(lam))
    lw = lasso(lam, lw)
    lassoW.push(lw)
    const zero = Math.abs(lw[1]) < 1e-9
    const narrate = i === 0 || i === 18 || (kind === 'l1' && zero && Math.abs(lassoW[i - 1]?.[1] ?? 1) > 1e-9)
    const note =
      kind === 'l2'
        ? narrate
          ? i === 0
            ? 'A tiny λ barely changes anything. As λ grows, the L2 ball shrinks and pulls both weights smoothly toward 0.'
            : 'Ridge shrinks every weight, but the circle has no corners, so weights get small yet never exactly zero.'
          : `λ = ${fmt(lam, 3)} — ridge solution where the smallest ellipse touches the circle.`
        : narrate
          ? zero
            ? 'The ellipse now first touches the diamond at a corner on the w₁ axis → w₂ is exactly 0. That is feature selection.'
            : 'As λ grows, the L1 diamond shrinks. Its corners stick out along the axes…'
          : `λ = ${fmt(lam, 3)} — lasso solution${zero ? ' (w₂ = 0, sparse!)' : ''}.`
    yield { i, ridgeW: [...ridgeW], lassoW: [...lassoW], line: kind === 'l2' ? [5, 7] : [9, 15], dwell: narrate ? 2 : 0.45, note }
  }
  yield { i: LAMS.length - 1, ridgeW, lassoW, line: kind === 'l2' ? 7 : 15, dwell: 5, note: kind === 'l2' ? 'Strong L2: both weights are tiny but non-zero.' : 'Strong L1: the weaker feature was dropped entirely; only w₁ survives.' }
}

export default function Regularization() {
  const [kind, setKind] = useState<Kind>('l1')
  const player = usePlayer(() => program(kind), [kind], { interval: 600, loop: 2600 })
  const fr = player.frame
  const lam = fr.i >= 0 ? LAMS[fr.i] : 0
  const w: [number, number] = fr.i >= 0 ? (kind === 'l2' ? fr.ridgeW[fr.i] : fr.lassoW[fr.i]) : W_OLS

  return (
    <LabFrame
      title={`Regularization · ${kind === 'l2' ? 'ridge (L2)' : 'lasso (L1)'}`}
      status={`λ = ${fr.i >= 0 ? fmt(lam, 3) : '0'}`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={470}>
          {(box) => <Geometry box={box} kind={kind} w={w} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'loss contours', color: 'var(--accent)', shape: 'ring' },
        { label: kind === 'l2' ? 'L2 ball  ||w||₂ ≤ t' : 'L1 diamond  ||w||₁ ≤ t', color: 'var(--accent-2)', shape: 'square' },
        { label: 'solution path', color: 'var(--accent-3)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="Coefficient paths vs log λ" right={`w = [${fmt(w[0], 2)}, ${fmt(w[1], 2)}]`}>
          <Stage aspect={0.3} min={130} max={170}>
            {(box) => <Paths box={box} f={fr} kind={kind} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'regularization.py',
        vars: [
          { name: 'lam', value: fr.i >= 0 ? fmt(lam, 3) : '0.000' },
          { name: 'w₁', value: fmt(w[0], 3), color: 'var(--accent-2)' },
          { name: 'w₂', value: fmt(w[1], 3), color: 'var(--accent-3)' },
          { name: kind === 'l2' ? '||w||₂' : '||w||₁', value: fmt(kind === 'l2' ? Math.hypot(w[0], w[1]) : Math.abs(w[0]) + Math.abs(w[1]), 3) },
          { name: 'J(w)', value: fmt(J(w), 3) },
          { name: 'zeros', value: String((Math.abs(w[0]) < 1e-9 ? 1 : 0) + (Math.abs(w[1]) < 1e-9 ? 1 : 0)) },
        ],
      }}
      params={
        <Pills
          label="Penalty"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'l1', label: 'Lasso · L1' },
            { value: 'l2', label: 'Ridge · L2' },
          ]}
        />
      }
    />
  )
}

function Geometry({ box, kind, w, f }: { box: Box; kind: Kind; w: [number, number]; f: Frame }) {
  const clip = useId().replace(/:/g, '')
  const pad = { l: 34, b: 26, t: 12, r: 12 }
  const aspect = (box.height - pad.t - pad.b) / (box.width - pad.l - pad.r)
  const xr: [number, number] = [-1.6, 4.4]
  const span = (xr[1] - xr[0]) * aspect
  const fr = frame2d(box, xr, [-1.3, -1.3 + span], pad)
  const { sx, sy } = fr
  const e = useMemo(() => eig2(H[0][0], H[0][1], H[1][1]), [])
  const angle = (Math.atan2(e.vectors[0][1], e.vectors[0][0]) * 180) / Math.PI
  const level = J(w)
  const levels = [0.08, 0.3, 0.7, 1.3, 2.1, 3.2, 4.6]
  const ell = (c: number) => ({ rx: Math.sqrt(c / e.values[0]), ry: Math.sqrt(c / e.values[1]) })
  const t = kind === 'l2' ? Math.hypot(w[0], w[1]) : Math.abs(w[0]) + Math.abs(w[1])
  const pxX = (v: number) => Math.abs(sx(v) - sx(0))
  const pxY = (v: number) => Math.abs(sy(v) - sy(0))
  const path = (kind === 'l2' ? f.ridgeW : f.lassoW).map(([a, b]) => [sx(a), sy(b)] as [number, number])
  const diamond = `M${sx(t)},${sy(0)} L${sx(0)},${sy(t)} L${sx(-t)},${sy(0)} L${sx(0)},${sy(-t)} Z`
  const touching = ell(level)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Constraint region touching the loss contours">
      <defs>
        <ClipRect id={clip} f={fr} />
      </defs>
      <Axes f={fr} xLabel="w₁" yLabel="w₂" zeroLines />
      <g clipPath={`url(#${clip})`}>
        <g transform={`translate(${sx(W_OLS[0])} ${sy(W_OLS[1])})`}>
          {levels.map((c, i) => {
            const { rx, ry } = ell(c)
            return (
              <ellipse key={c} rx={pxX(rx)} ry={pxY(ry)} transform={`rotate(${-angle})`} fill="none" strokeWidth={1} style={{ stroke: `color-mix(in oklab, var(--accent) ${55 - i * 6}%, transparent)` }} />
            )
          })}
          <motion.ellipse
            initial={false}
            animate={{ rx: pxX(touching.rx), ry: pxY(touching.ry) }}
            transition={{ duration: 0.4 }}
            transform={`rotate(${-angle})`}
            fill="none"
            strokeWidth={2}
            strokeDasharray="6 5"
            style={{ stroke: 'var(--accent)' }}
          />
        </g>
        <circle cx={sx(W_OLS[0])} cy={sy(W_OLS[1])} r={4} style={{ fill: 'var(--accent)' }} />
        <text x={sx(W_OLS[0]) + 8} y={sy(W_OLS[1]) - 8} className="viz-muted" fontSize={11}>
          w_ols
        </text>
        {kind === 'l2' ? (
          <motion.ellipse
            cx={sx(0)}
            cy={sy(0)}
            initial={false}
            animate={{ rx: pxX(t), ry: pxY(t) }}
            transition={{ duration: 0.4 }}
            strokeWidth={2}
            style={{ fill: 'color-mix(in oklab, var(--accent-2) 16%, transparent)', stroke: 'var(--accent-2)' }}
          />
        ) : (
          <motion.path
            initial={false}
            animate={{ d: diamond }}
            transition={{ duration: 0.4 }}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ fill: 'color-mix(in oklab, var(--accent-2) 16%, transparent)', stroke: 'var(--accent-2)' }}
          />
        )}
        <path d={pathOf(path)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
        <motion.circle
          initial={false}
          animate={{ cx: sx(w[0]), cy: sy(w[1]) }}
          transition={{ duration: 0.4 }}
          r={6.5}
          strokeWidth={2.5}
          style={{ fill: 'var(--bg)', stroke: 'var(--accent-3)', filter: 'drop-shadow(0 0 6px var(--accent-3))' }}
        />
      </g>
    </svg>
  )
}

function Paths({ box, f, kind }: { box: Box; f: Frame; kind: Kind }) {
  const fr = frame2d(box, [-2, 1], [-0.3, 2.8], { l: 32, b: 20, t: 8, r: 10 })
  const { sx, sy } = fr
  const ws = kind === 'l2' ? f.ridgeW : f.lassoW
  const lx = (i: number) => sx(Math.log10(LAMS[i]))
  const p1 = ws.map((w, i) => [lx(i), sy(w[0])] as [number, number])
  const p2 = ws.map((w, i) => [lx(i), sy(w[1])] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={7} yTicks={3} xLabel="log₁₀ λ" zeroLines />
      <path d={pathOf(p1)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-2)' }} />
      <path d={pathOf(p2)} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent-3)' }} />
      {p1.length > 0 && <circle cx={p1[p1.length - 1][0]} cy={p1[p1.length - 1][1]} r={3.5} style={{ fill: 'var(--accent-2)' }} />}
      {p2.length > 0 && <circle cx={p2[p2.length - 1][0]} cy={p2[p2.length - 1][1]} r={3.5} style={{ fill: 'var(--accent-3)' }} />}
      <text x={fr.right - 4} y={fr.top + 12} textAnchor="end" fontSize={10.5} className="viz-muted">
        <tspan style={{ fill: 'var(--accent-2)' }}>— w₁</tspan>
        <tspan dx={10} style={{ fill: 'var(--accent-3)' }}>— w₂</tspan>
      </text>
    </svg>
  )
}

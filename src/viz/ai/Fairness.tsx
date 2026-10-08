import { useMemo } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { clamp, fmt, rng } from '../core/math'

const CODE = `import numpy as np

def group_metrics(scores, y, group, thresholds):
    out = {}
    for g in ("A", "B"):
        m = group == g
        pred = scores[m] >= thresholds[g]
        out[g] = {
            "selection_rate": pred.mean(),     # demographic parity
            "tpr": pred[y[m] == 1].mean(),     # equal opportunity
            "fpr": pred[y[m] == 0].mean(),     # + TPR → equalized odds
        }
    return out`

interface Person {
  s: number
  y: 0 | 1
}

function makeGroup(seed: number, n: number, base: number, shift: number): Person[] {
  const r = rng(seed)
  const out: Person[] = []
  for (let i = 0; i < n; i++) {
    const y: 0 | 1 = i < Math.round(n * base) ? 1 : 0
    out.push({ s: clamp(r.normal(y ? 0.64 - shift : 0.38 - shift, 0.11), 0.02, 0.98), y })
  }
  return out
}

function metrics(g: Person[], t: number) {
  const pred = g.map((p) => p.s >= t)
  const pos = g.filter((p) => p.y === 1)
  const neg = g.filter((p) => p.y === 0)
  return {
    sel: pred.filter(Boolean).length / g.length,
    tpr: pos.filter((p) => p.s >= t).length / Math.max(1, pos.length),
    fpr: neg.filter((p) => p.s >= t).length / Math.max(1, neg.length),
  }
}

function matchThreshold(g: Person[], target: number, key: 'sel' | 'tpr') {
  let best = 0.5
  let err = Infinity
  for (let t = 0.05; t <= 0.95; t += 0.005) {
    const e = Math.abs(metrics(g, t)[key] - target)
    if (e < err - 1e-9) {
      err = e
      best = t
    }
  }
  return best
}

interface Frame extends StepFrame {
  tA: number
  tB: number
  focus: 'none' | 'sel' | 'tpr'
  label: string
}

function* program(A: Person[], B: Person[]): Generator<Frame, void, void> {
  const shared = 0.5
  yield { tA: shared, tB: shared, focus: 'none', label: 'one threshold for everyone', line: [3, 7], dwell: 2.4, note: 'A loan model scores two groups. Group B’s scores run a little lower (e.g. a proxy feature such as postcode), and fewer of its applicants are truly creditworthy (base rates differ).' }
  yield { tA: shared, tB: shared, focus: 'tpr', label: 'one threshold for everyone', line: 10, dwell: 2.6, note: 'With the same threshold, qualified people in B are approved less often (lower true-positive rate). Treating everyone “the same” is not automatically fair.' }
  const mA = metrics(A, shared)
  const tB1 = matchThreshold(B, mA.tpr, 'tpr')
  yield { tA: shared, tB: tB1, focus: 'tpr', label: 'equal opportunity', line: 10, dwell: 3, note: 'Equal opportunity: choose group thresholds so qualified applicants in both groups are approved at the same rate (equal TPR).' }
  const tB2 = matchThreshold(B, mA.sel, 'sel')
  yield { tA: shared, tB: tB2, focus: 'sel', label: 'demographic parity', line: 9, dwell: 3, note: 'Demographic parity instead equalises the overall approval rate — but because base rates differ, TPR and FPR now drift apart again.' }
  yield { tA: shared, tB: tB1, focus: 'none', label: 'trade-offs', line: [8, 12], dwell: 5, note: 'When base rates differ, these criteria (plus calibration) cannot all hold at once for an imperfect model. Choosing one is a value judgement — document it, measure it, and involve the people affected.' }
}

export default function Fairness() {
  const A = useMemo(() => makeGroup(3, 60, 0.5, 0), [])
  const B = useMemo(() => makeGroup(4, 60, 0.32, 0.07), [])
  const player = usePlayer(() => program(A, B), [], { interval: 700, loop: 2200 })
  const fr = player.frame
  const mA = metrics(A, fr.tA)
  const mB = metrics(B, fr.tB)
  return (
    <LabFrame
      title="Fairness metrics · one model, two groups"
      status={fr.label}
      player={player}
      stage={
        <Stage aspect={0.5} min={300} max={420}>
          {(box) => <Strips box={box} A={A} B={B} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'truly qualified (y = 1)', color: 'var(--easy)' },
        { label: 'not qualified (y = 0)', color: 'var(--fg-subtle)' },
        { label: 'approved (score ≥ threshold)', color: 'var(--fg)', shape: 'ring' },
      ]}
      below={
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['Approval rate', 'sel', 'demographic parity'],
              ['True-positive rate', 'tpr', 'equal opportunity'],
              ['False-positive rate', 'fpr', 'equalized odds (with TPR)'],
            ] as const
          ).map(([title, k, crit]) => {
            const gap = Math.abs(mA[k] - mB[k])
            const hot = fr.focus === k
            return (
              <div key={k} className="rounded-xl border px-3 py-2.5" style={{ borderColor: hot ? 'var(--accent)' : 'var(--border)' }}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-fg">{title}</span>
                  <span className="font-mono text-[10.5px] text-subtle">gap {fmt(gap, 2)}</span>
                </div>
                {[
                  ['A', mA[k], 'var(--accent-2)'],
                  ['B', mB[k], 'var(--accent-3)'],
                ].map(([g, v, c]) => (
                  <div key={g as string} className="mt-1.5 flex items-center gap-2">
                    <span className="w-3 font-mono text-[11px] text-muted">{g as string}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]">
                      <motion.div className="h-full rounded-full" initial={false} animate={{ width: `${(v as number) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} style={{ background: c as string }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] text-fg tabular">{Math.round((v as number) * 100)}%</span>
                  </div>
                ))}
                <div className="mt-1.5 text-[10.5px] text-subtle">{crit}</div>
              </div>
            )
          })}
        </div>
      }
      code={{
        source: CODE,
        file: 'fairness.py',
        vars: [
          { name: 'thresholds["A"]', value: fr.tA.toFixed(3), color: 'var(--accent-2)' },
          { name: 'thresholds["B"]', value: fr.tB.toFixed(3), color: 'var(--accent-3)' },
          { name: 'tpr A / B', value: `${fmt(mA.tpr, 2)} / ${fmt(mB.tpr, 2)}` },
          { name: 'selection A / B', value: `${fmt(mA.sel, 2)} / ${fmt(mB.sel, 2)}` },
        ],
      }}
    />
  )
}

function Strips({ box, A, B, f }: { box: Box; A: Person[]; B: Person[]; f: Frame }) {
  const left = 44
  const right = box.width - 16
  const sx = (v: number) => left + v * (right - left)
  const bandH = (box.height - 40) / 2
  const bins = 30
  const dot = Math.min(9, (right - left) / bins - 1.5)
  const render = (g: Person[], t: number, y0: number, name: string, color: string) => {
    const counts = new Map<number, number>()
    return (
      <g>
        <rect x={sx(t)} y={y0} width={Math.max(0, right - sx(t))} height={bandH - 6} rx={8} style={{ fill: 'color-mix(in oklab, var(--accent) 7%, transparent)', transition: 'x 0.6s, width 0.6s' }} />
        <text x={8} y={y0 + bandH / 2} className="viz-label" style={{ fill: color }} fontWeight={700} fontSize={14}>
          {name}
        </text>
        <line x1={left} x2={right} y1={y0 + bandH - 8} y2={y0 + bandH - 8} className="viz-axis" />
        {g.map((p, i) => {
          const b = Math.min(bins - 1, Math.floor(p.s * bins))
          const k = counts.get(b) ?? 0
          counts.set(b, k + 1)
          const on = p.s >= t
          return (
            <circle
              key={i}
              cx={left + (b + 0.5) * ((right - left) / bins)}
              cy={y0 + bandH - 14 - k * (dot + 1.5)}
              r={dot / 2}
              strokeWidth={on ? 1.8 : 0}
              style={{ fill: p.y ? 'var(--easy)' : 'color-mix(in oklab, var(--fg) 30%, transparent)', stroke: 'var(--fg)', opacity: on ? 1 : 0.55, transition: 'opacity 0.4s, stroke-width 0.4s' }}
            />
          )
        })}
        <motion.g initial={false} animate={{ x: sx(t) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
          <line x1={0} x2={0} y1={y0} y2={y0 + bandH - 6} strokeWidth={2.5} style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent))' }} />
          <text x={5} y={y0 + 11} fontSize={10.5} className="viz-text">
            t = {t.toFixed(2)}
          </text>
        </motion.g>
      </g>
    )
  }
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Score distributions of two groups with approval thresholds">
      {render(A, f.tA, 10, 'A', 'var(--accent-2)')}
      {render(B, f.tB, 18 + bandH, 'B', 'var(--accent-3)')}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text key={v} x={sx(v)} y={box.height - 4} textAnchor="middle" className="viz-tick">
          {v}
        </text>
      ))}
    </svg>
  )
}

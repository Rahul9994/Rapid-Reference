import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { clamp, fmt, rng } from '../core/math'
import { CLASS_COLORS } from '../core/datasets'

const CODE = `import numpy as np

roc = []
for t in np.linspace(1, 0, 41):          # sweep the threshold
    pred = scores >= t
    TP = np.sum(pred & (y == 1))
    FP = np.sum(pred & (y == 0))
    FN = np.sum(~pred & (y == 1))
    TN = np.sum(~pred & (y == 0))
    precision = TP / max(TP + FP, 1)
    recall = TP / (TP + FN)              # = true positive rate
    fpr = FP / (FP + TN)
    f1 = 2 * precision * recall / max(precision + recall, 1e-12)
    roc.append((fpr, recall))

auc = np.trapezoid([r for _, r in roc], [f for f, _ in roc])`

interface Sample {
  s: number
  y: 0 | 1
}

interface Counts {
  TP: number
  FP: number
  FN: number
  TN: number
}

const counts = (data: Sample[], t: number): Counts => {
  const c = { TP: 0, FP: 0, FN: 0, TN: 0 }
  for (const d of data) {
    const p = d.s >= t
    if (p && d.y === 1) c.TP++
    else if (p) c.FP++
    else if (d.y === 1) c.FN++
    else c.TN++
  }
  return c
}

function metrics(c: Counts) {
  const precision = c.TP / Math.max(c.TP + c.FP, 1)
  const recall = c.TP / Math.max(c.TP + c.FN, 1)
  const fpr = c.FP / Math.max(c.FP + c.TN, 1)
  const f1 = (2 * precision * recall) / Math.max(precision + recall, 1e-12)
  const acc = (c.TP + c.TN) / (c.TP + c.TN + c.FP + c.FN)
  return { precision, recall, fpr, f1, acc }
}

interface Frame extends StepFrame {
  k: number
  t: number
  roc: [number, number][]
}

const T = Array.from({ length: 41 }, (_, i) => 1 - i / 40)

function* program(data: Sample[]): Generator<Frame, void, void> {
  const roc: [number, number][] = []
  for (let k = 0; k < T.length; k++) {
    const t = T[k]
    const m = metrics(counts(data, t))
    roc.push([m.fpr, m.recall])
    const slow = k === 0 || k === 12 || k === 20 || k === 32
    const note =
      k === 0
        ? 'Threshold 1.0: predict “positive” for almost nothing — no false positives, but recall is 0.'
        : k === 12
          ? 'Lowering the threshold catches more true positives (recall ↑)…'
          : k === 20
            ? '…but more negatives slip over the line too (false positives ↑, precision ↓). Every threshold is a trade-off.'
            : k === 32
              ? 'Each threshold is one point on the ROC curve: (false-positive rate, true-positive rate).'
              : `t = ${t.toFixed(3)} → precision ${fmt(m.precision, 2)}, recall ${fmt(m.recall, 2)}, FPR ${fmt(m.fpr, 2)}`
    yield { k, t, roc: [...roc], line: [5, 9], dwell: slow ? 2.2 : 0.3, note }
    if (slow) yield { k, t, roc: [...roc], line: [10, 14], dwell: 1.4, note }
  }
  let auc = 0
  for (let i = 1; i < roc.length; i++) auc += ((roc[i][0] - roc[i - 1][0]) * (roc[i][1] + roc[i - 1][1])) / 2
  yield { k: T.length - 1, t: 0, roc, line: 16, dwell: 5, note: `AUC = ${fmt(auc, 3)}: the probability that a random positive is scored above a random negative. 0.5 = coin flip, 1.0 = perfect ranking.` }
}

function makeData(sep: number): Sample[] {
  const r = rng(12)
  const out: Sample[] = []
  for (let i = 0; i < 60; i++) out.push({ s: clamp(r.normal(0.5 - sep / 2, 0.15), 0.01, 0.99), y: 0 })
  for (let i = 0; i < 40; i++) out.push({ s: clamp(r.normal(0.5 + sep / 2, 0.15), 0.01, 0.99), y: 1 })
  return out
}

export default function RocThreshold() {
  const [sep, setSep] = useState(0.3)
  const data = useMemo(() => makeData(sep), [sep])
  const player = usePlayer(() => program(data), [data], { interval: 600, loop: 2600 })
  const fr = player.frame
  const c = counts(data, fr.t)
  const m = metrics(c)
  let auc = 0
  for (let i = 1; i < fr.roc.length; i++) auc += ((fr.roc[i][0] - fr.roc[i - 1][0]) * (fr.roc[i][1] + fr.roc[i - 1][1])) / 2

  return (
    <LabFrame
      title="Classification threshold · confusion matrix & ROC"
      status={`threshold ${fr.t.toFixed(3)}`}
      player={player}
      stage={
        <Stage aspect={0.42} min={220} max={330}>
          {(box) => <Strip box={box} data={data} t={fr.t} />}
        </Stage>
      }
      legend={[
        { label: 'actual negative', color: CLASS_COLORS[0] },
        { label: 'actual positive', color: CLASS_COLORS[1] },
        { label: 'predicted positive (≥ t)', color: 'var(--fg)', shape: 'ring' },
      ]}
      below={
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <MiniPanel title="Confusion matrix">
            <Confusion c={c} m={m} />
          </MiniPanel>
          <MiniPanel title="ROC curve" right={`AUC so far ${fmt(auc, 3)}`}>
            <Stage aspect={0.78} min={170} max={240}>
              {(box) => <Roc box={box} roc={fr.roc} />}
            </Stage>
          </MiniPanel>
        </div>
      }
      code={{
        source: CODE,
        file: 'metrics.py',
        vars: [
          { name: 't', value: fr.t.toFixed(3), color: 'var(--accent)' },
          { name: 'precision', value: fmt(m.precision, 3), color: 'var(--accent-2)' },
          { name: 'recall', value: fmt(m.recall, 3), color: 'var(--accent-3)' },
          { name: 'fpr', value: fmt(m.fpr, 3) },
          { name: 'f1', value: fmt(m.f1, 3), color: 'var(--easy)' },
          { name: 'accuracy', value: fmt(m.acc, 3) },
        ],
      }}
      params={<Slider label="Class separation (model quality)" value={sep} min={0} max={0.7} step={0.05} onChange={setSep} format={(v) => v.toFixed(2)} />}
    />
  )
}

function Strip({ box, data, t }: { box: Box; data: Sample[]; t: number }) {
  const fr = frame2d(box, [0, 1], [0, 1], { l: 20, r: 20, t: 18, b: 30 })
  const { sx } = fr
  const bins = 40
  const stackFor = (cls: 0 | 1) => {
    const counter = new Map<number, number>()
    return data
      .filter((d) => d.y === cls)
      .map((d) => {
        const b = Math.min(bins - 1, Math.floor(d.s * bins))
        const k = counter.get(b) ?? 0
        counter.set(b, k + 1)
        return { d, b, k }
      })
  }
  const dot = Math.min(9, (fr.right - fr.left) / bins - 1)
  const midY = (fr.top + fr.bottom) / 2
  const neg = stackFor(0)
  const pos = stackFor(1)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Model scores for both classes with a threshold">
      <motion.rect initial={false} animate={{ x: sx(t), width: Math.max(0, fr.right - sx(t)) }} y={fr.top} height={fr.bottom - fr.top} style={{ fill: 'color-mix(in oklab, var(--accent) 8%, transparent)' }} />
      <line x1={fr.left} x2={fr.right} y1={midY} y2={midY} className="viz-axis" />
      <line x1={fr.left} x2={fr.right} y1={fr.bottom} y2={fr.bottom} className="viz-axis" />
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <text key={v} x={sx(v)} y={fr.bottom + 16} textAnchor="middle" className="viz-tick">
          {v}
        </text>
      ))}
      <text x={fr.right} y={fr.bottom - 6} textAnchor="end" className="viz-label">model score →</text>
      <text x={fr.left + 2} y={fr.top + 10} className="viz-label">positives</text>
      <text x={fr.left + 2} y={fr.bottom - 6} className="viz-label">negatives</text>
      {pos.map(({ d, b, k }, i) => {
        const on = d.s >= t
        return <circle key={`p${i}`} cx={fr.left + (b + 0.5) * ((fr.right - fr.left) / bins)} cy={midY - 6 - k * (dot + 1.5)} r={dot / 2} strokeWidth={on ? 1.8 : 0} style={{ fill: CLASS_COLORS[1], stroke: 'var(--fg)', opacity: on ? 1 : 0.45, transition: 'opacity 0.25s' }} />
      })}
      {neg.map(({ d, b, k }, i) => {
        const on = d.s >= t
        return <circle key={`n${i}`} cx={fr.left + (b + 0.5) * ((fr.right - fr.left) / bins)} cy={midY + 6 + k * (dot + 1.5)} r={dot / 2} strokeWidth={on ? 1.8 : 0} style={{ fill: CLASS_COLORS[0], stroke: 'var(--fg)', opacity: on ? 1 : 0.45, transition: 'opacity 0.25s' }} />
      })}
      <motion.g initial={false} animate={{ x: sx(t) }} transition={{ type: 'spring', stiffness: 200, damping: 26 }}>
        <line x1={0} x2={0} y1={fr.top - 6} y2={fr.bottom} strokeWidth={2.5} style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent))' }} />
        <text x={4} y={fr.top + 2} className="viz-text" fontSize={11}>
          t
        </text>
      </motion.g>
    </svg>
  )
}

function Confusion({ c, m }: { c: Counts; m: ReturnType<typeof metrics> }) {
  const cells = [
    { k: 'TP', v: c.TP, label: 'true positive', tone: 'var(--easy)' },
    { k: 'FN', v: c.FN, label: 'false negative', tone: 'var(--hard)' },
    { k: 'FP', v: c.FP, label: 'false positive', tone: 'var(--hard)' },
    { k: 'TN', v: c.TN, label: 'true negative', tone: 'var(--easy)' },
  ]
  return (
    <div className="px-1">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-center font-mono text-[10.5px] text-subtle">
        <span />
        <span>pred +</span>
        <span>pred −</span>
        <span className="self-center pr-1 text-right">actual +</span>
        {cells.slice(0, 2).map((x) => (
          <Cell key={x.k} {...x} />
        ))}
        <span className="self-center pr-1 text-right">actual −</span>
        <Cell {...cells[2]} />
        <Cell {...cells[3]} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-1.5 font-mono text-[11px]">
        {[
          ['precision', m.precision],
          ['recall', m.recall],
          ['F1', m.f1],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border border-line px-2 py-1.5">
            <dt className="text-subtle">{k}</dt>
            <dd className="text-[13px] font-semibold text-fg tabular">{fmt(v as number, 2)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Cell({ k, v, label, tone }: { k: string; v: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border px-2 py-2.5" style={{ borderColor: `color-mix(in oklab, ${tone} 35%, var(--border))`, background: `color-mix(in oklab, ${tone} ${Math.min(30, 6 + v)}%, transparent)` }} title={label}>
      <div className="text-[10px] text-muted">{k}</div>
      <motion.div key={v} initial={{ scale: 1.25, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="text-[17px] font-semibold text-fg tabular">
        {v}
      </motion.div>
    </div>
  )
}

function Roc({ box, roc }: { box: Box; roc: [number, number][] }) {
  const fr = frame2d(box, [0, 1], [0, 1], { l: 30, b: 22, t: 8, r: 10 })
  const pts = roc.map(([x, y]) => [fr.sx(x), fr.sy(y)] as [number, number])
  const area = pts.length > 1 ? `${pathOf(pts)}L${pts[pts.length - 1][0]},${fr.bottom}L${pts[0][0]},${fr.bottom}Z` : ''
  const last = pts[pts.length - 1]
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={fr} xTicks={4} yTicks={4} xLabel="FPR" yLabel="TPR" digits={1} />
      <line x1={fr.sx(0)} y1={fr.sy(0)} x2={fr.sx(1)} y2={fr.sy(1)} strokeDasharray="4 5" style={{ stroke: 'var(--fg-subtle)' }} />
      <path d={area} style={{ fill: 'color-mix(in oklab, var(--accent) 14%, transparent)' }} />
      <path d={pathOf(pts)} fill="none" strokeWidth={2.4} style={{ stroke: 'var(--accent)' }} />
      {last && <circle cx={last[0]} cy={last[1]} r={5} strokeWidth={2} style={{ fill: 'var(--bg)', stroke: 'var(--accent)' }} />}
    </svg>
  )
}

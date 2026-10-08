import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, frame2d, type Box } from '../core/plot'
import { fmt, mean, rng } from '../core/math'
import { blobs, CLASS_COLORS, type Point } from '../core/datasets'

const CODE = `import numpy as np
from sklearn.model_selection import KFold
from sklearn.neighbors import KNeighborsClassifier

kf = KFold(n_splits=5, shuffle=True, random_state=0)
scores = []
for fold, (train_idx, val_idx) in enumerate(kf.split(X)):
    model = KNeighborsClassifier(n_neighbors=3)
    model.fit(X[train_idx], y[train_idx])        # train on k − 1 folds
    acc = model.score(X[val_idx], y[val_idx])    # test on the held-out fold
    scores.append(acc)

print(f"{np.mean(scores):.3f} ± {np.std(scores):.3f}")`

const N = 30

function knn3(train: Point[], q: Point) {
  const near = [...train].sort((a, b) => (a.x - q.x) ** 2 + (a.y - q.y) ** 2 - ((b.x - q.x) ** 2 + (b.y - q.y) ** 2)).slice(0, 3)
  const ones = near.filter((p) => p.c === 1).length
  return ones >= 2 ? 1 : 0
}

interface Frame extends StepFrame {
  fold: number // -1 before, k after
  stage: 'shuffle' | 'split' | 'fit' | 'score' | 'done'
  scores: number[]
  preds: Map<number, number>
}

function* program(pts: Point[], order: number[], k: number): Generator<Frame, void, void> {
  const scores: number[] = []
  yield { fold: -1, stage: 'shuffle', scores: [], preds: new Map(), line: 5, dwell: 1.8, note: `Shuffle the ${N} samples and cut them into k = ${k} folds of (almost) equal size.` }
  const sizes = Array.from({ length: k }, (_, i) => Math.floor(N / k) + (i < N % k ? 1 : 0))
  let start = 0
  for (let f = 0; f < k; f++) {
    const val = order.slice(start, start + sizes[f])
    start += sizes[f]
    const valSet = new Set(val)
    const train = pts.filter((_, i) => !valSet.has(i))
    const narrate = f === 0
    yield { fold: f, stage: 'split', scores: [...scores], preds: new Map(), line: 7, dwell: narrate ? 1.6 : 0.7, note: narrate ? `Fold 1 is held out for validation; the other ${k - 1} folds (${train.length} samples) are for training.` : `Fold ${f + 1} becomes the validation set.` }
    yield { fold: f, stage: 'fit', scores: [...scores], preds: new Map(), line: [8, 9], dwell: narrate ? 1.4 : 0.6, note: narrate ? 'Train a fresh model only on the training folds — it never sees the validation fold.' : `Fold ${f + 1}: train on the rest.` }
    const preds = new Map<number, number>()
    let correct = 0
    for (const i of val) {
      const p = knn3(train, pts[i])
      preds.set(i, p)
      if (p === pts[i].c) correct++
    }
    scores.push(correct / val.length)
    yield { fold: f, stage: 'score', scores: [...scores], preds, line: [10, 11], dwell: narrate ? 1.8 : 0.9, note: `Fold ${f + 1}: ${correct}/${val.length} validation samples correct → accuracy ${fmt(correct / val.length, 3)}.` }
  }
  const m = mean(scores)
  const sd = Math.sqrt(mean(scores.map((s) => (s - m) ** 2)))
  yield { fold: k, stage: 'done', scores, preds: new Map(), line: 13, dwell: 5, note: `Every sample was used for validation exactly once. Estimate: ${fmt(m, 3)} ± ${fmt(sd, 3)} — far more reliable than a single split.` }
}

export default function KFold() {
  const [k, setK] = useState(5)
  const pts = useMemo(() => {
    const r = rng(3)
    return r.shuffle(blobs([[-0.8, -0.3], [0.8, 0.4]], N / 2, 0.75, 21))
  }, [])
  const order = useMemo(() => rng(10).shuffle(pts.map((_, i) => i)), [pts])
  const player = usePlayer(() => program(pts, order, k), [k], { interval: 650, loop: 2600 })
  const fr = player.frame
  const m = fr.scores.length ? mean(fr.scores) : 0
  const sd = fr.scores.length ? Math.sqrt(mean(fr.scores.map((s) => (s - m) ** 2))) : 0

  return (
    <LabFrame
      title={`${k}-fold cross-validation`}
      status={fr.stage === 'done' ? `${fmt(m, 3)} ± ${fmt(sd, 3)}` : fr.fold >= 0 ? `fold ${fr.fold + 1}/${k}` : 'setup'}
      player={player}
      stage={
        <Stage aspect={0.56} min={300} max={450}>
          {(box) => <Board box={box} pts={pts} order={order} k={k} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'training fold', color: 'var(--accent)', shape: 'square' },
        { label: 'validation fold', color: 'var(--accent-3)', shape: 'square' },
        { label: 'correct / wrong prediction', color: 'var(--easy)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'cross_validation.py',
        vars: [
          { name: 'n_splits', value: String(k), color: 'var(--accent)' },
          { name: 'fold', value: fr.fold >= 0 && fr.fold < k ? String(fr.fold) : '—' },
          { name: 'scores', value: fr.scores.length ? `[${fr.scores.map((s) => s.toFixed(2)).join(', ')}]` : '[]', color: 'var(--accent-2)' },
          { name: 'mean', value: fr.scores.length ? fmt(m, 3) : '—', color: 'var(--easy)' },
          { name: 'std', value: fr.scores.length ? fmt(sd, 3) : '—' },
        ],
      }}
      params={<Slider label="k (number of folds)" value={k} min={3} max={10} onChange={setK} />}
    />
  )
}

function Board({ box, pts, order, k, f }: { box: Box; pts: Point[]; order: number[]; k: number; f: Frame }) {
  const sizes = Array.from({ length: k }, (_, i) => Math.floor(N / k) + (i < N % k ? 1 : 0))
  const foldOf = new Map<number, number>()
  let s = 0
  sizes.forEach((sz, fi) => {
    for (let j = 0; j < sz; j++) foldOf.set(order[s + j], fi)
    s += sz
  })
  const pad = 16
  const stripY = 30
  const cellW = (box.width - pad * 2) / N
  const cellH = Math.min(30, cellW * 1.3)
  const lower = stripY + cellH + 46
  const narrow = box.width < 560
  const scatterW = narrow ? box.width - pad * 2 : (box.width - pad * 3) * 0.55
  const lowerH = box.height - lower - 12
  const scatterH = narrow ? lowerH * 0.55 : lowerH
  const fr = frame2d({ width: scatterW, height: scatterH }, [-3, 3], [-2.2, 2.4], { l: 8, r: 8, t: 8, b: 8 })
  const barsX = narrow ? pad : pad * 2 + scatterW
  const barsY = narrow ? lower + scatterH + 14 : lower
  const barsW = narrow ? box.width - pad * 2 : box.width - pad * 3 - scatterW
  const barsH = narrow ? lowerH - scatterH - 14 : lowerH
  const active = f.fold >= 0 && f.fold < k ? f.fold : -1
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="K-fold cross-validation">
      <text x={pad} y={stripY - 10} className="viz-label">
        samples (shuffled), grouped into {k} folds
      </text>
      {order.map((idx, pos) => {
        const fi = foldOf.get(idx)!
        const isVal = fi === active
        const isTrain = active >= 0 && !isVal
        const gapBefore = fi
        return (
          <motion.rect
            key={idx}
            initial={false}
            animate={{ y: stripY + (isVal ? -8 : 0), opacity: f.stage === 'shuffle' ? 0.85 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            x={pad + pos * cellW + 1 + gapBefore * 0}
            width={cellW - 2}
            height={cellH}
            rx={4}
            strokeWidth={1.5}
            style={{
              fill: isVal ? 'color-mix(in oklab, var(--accent-3) 30%, transparent)' : isTrain ? 'color-mix(in oklab, var(--accent) 22%, transparent)' : 'color-mix(in oklab, var(--fg) 6%, transparent)',
              stroke: CLASS_COLORS[pts[idx].c],
              transition: 'fill 0.35s',
            }}
          />
        )
      })}
      {sizes.map((_, fi) => {
        const startPos = sizes.slice(0, fi).reduce((a, b) => a + b, 0)
        return (
          <g key={fi}>
            <line x1={pad + startPos * cellW + 1} x2={pad + (startPos + sizes[fi]) * cellW - 1} y1={stripY + cellH + 9} y2={stripY + cellH + 9} strokeWidth={2} style={{ stroke: fi === active ? 'var(--accent-3)' : 'var(--border-strong)' }} />
            <text x={pad + (startPos + sizes[fi] / 2) * cellW} y={stripY + cellH + 23} textAnchor="middle" className="viz-tick" style={{ fill: fi === active ? 'var(--accent-3)' : undefined }}>
              fold {fi + 1}
            </text>
          </g>
        )
      })}

      <g transform={`translate(${pad} ${lower})`}>
        <rect width={scatterW} height={scatterH} rx={12} style={{ fill: 'color-mix(in oklab, var(--fg) 2.5%, transparent)', stroke: 'var(--border)' }} />
        {pts.map((p, i) => {
          const fi = foldOf.get(i)!
          const isVal = fi === active
          const pred = f.preds.get(i)
          return (
            <g key={i}>
              <circle cx={fr.sx(p.x)} cy={fr.sy(p.y)} r={isVal ? 6 : 4.5} strokeWidth={isVal ? 2 : 1} style={{ fill: isVal ? 'var(--bg)' : CLASS_COLORS[p.c], stroke: isVal ? CLASS_COLORS[p.c] : 'var(--bg)', opacity: active >= 0 && !isVal && f.stage !== 'fit' && f.stage !== 'score' ? 0.5 : 1 }} />
              {pred !== undefined && <circle cx={fr.sx(p.x)} cy={fr.sy(p.y)} r={10} fill="none" strokeWidth={2} style={{ stroke: pred === p.c ? 'var(--easy)' : 'var(--hard)' }} />}
            </g>
          )
        })}
      </g>

      <g transform={`translate(${barsX} ${barsY})`}>
        <text x={0} y={10} className="viz-label">
          validation accuracy per fold
        </text>
        {Array.from({ length: k }).map((_, fi) => {
          const sc = f.scores[fi]
          const bw = (barsW - 8) / k
          const h = barsH - 34
          return (
            <g key={fi} transform={`translate(${fi * bw + 4} 22)`}>
              <rect width={bw - 6} height={h} rx={5} style={{ fill: 'color-mix(in oklab, var(--fg) 4%, transparent)' }} />
              {sc !== undefined && (
                <motion.rect width={bw - 6} rx={5} initial={{ y: h, height: 0 }} animate={{ y: h * (1 - sc), height: h * sc }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ fill: fi === active ? 'var(--accent-3)' : 'var(--accent)' }} />
              )}
              <text x={(bw - 6) / 2} y={h + 12} textAnchor="middle" className="viz-tick">
                {sc !== undefined ? sc.toFixed(2) : `f${fi + 1}`}
              </text>
            </g>
          )
        })}
        {f.scores.length > 0 && (
          <line x1={0} x2={barsW} y1={22 + (barsH - 34) * (1 - mean(f.scores))} y2={22 + (barsH - 34) * (1 - mean(f.scores))} strokeDasharray="5 4" strokeWidth={1.5} style={{ stroke: 'var(--easy)' }} />
        )}
      </g>
    </svg>
  )
}

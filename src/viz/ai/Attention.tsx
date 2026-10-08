import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { fmt, softmax } from '../core/math'

const CODE = `import numpy as np

def self_attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv            # project each token
    d_k = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)              # similarity of every pair
    scores -= scores.max(axis=-1, keepdims=True)
    weights = np.exp(scores)
    weights /= weights.sum(axis=-1, keepdims=True)   # softmax per row
    return weights @ V                           # blend values by attention`

const TOKENS = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired']
// Toy 4-d query / key vectors (hand-made for illustration, not from a trained model).
const K = [
  [0.1, 0.1, 0.1, 0.3],
  [1.6, 0, 0.2, 0.2],
  [0, 0, 0.4, 0.6],
  [0.2, 0.6, 0, 0.9],
  [0.1, 0.1, 0.1, 0.3],
  [0, 1.6, 0, 0.3],
  [0, 0, 0.3, 0.4],
  [0.8, 0.2, 0, 0.2],
  [0, 0, 0.6, 0.3],
  [0, 0, 0.8, 0.1],
  [0.5, 0, 1.4, 0],
]
const Q = [
  [0.3, 0.3, 0, 0.2],
  [0.2, 0.1, 1.0, 0.3],
  [0.2, 0.2, 0.2, 1.0],
  [0.4, 1.8, 0, 0.2],
  [0.2, 0.8, 0, 0.2],
  [0.3, 0.2, 0, 1.2],
  [0.2, 0.2, 1.0, 0.4],
  [2.0, 0.1, 0.3, 0],
  [0.6, 0, 1.0, 0],
  [0.2, 0, 1.6, 0],
  [1.8, 0, 0.2, 0],
].map((r) => r.map((v) => v * 2))

const SCORES = Q.map((q) => K.map((k) => (q[0] * k[0] + q[1] * k[1] + q[2] * k[2] + q[3] * k[3]) / Math.sqrt(4)))
const WEIGHTS = SCORES.map((row) => softmax(row))

interface Frame extends StepFrame {
  q: number
  phase: 'scores' | 'softmax' | 'output'
}

const TOUR = [7, 3, 10, 1, 5]

function* program(start: number | null): Generator<Frame, void, void> {
  const order = start === null ? TOUR : [start]
  for (const [n, q] of order.entries()) {
    const first = n === 0
    yield { q, phase: 'scores', line: [4, 6], dwell: first ? 1.8 : 1.1, note: `“${TOKENS[q]}” sends out a query; every token offers a key. Their dot products (scaled by √dₖ) score how relevant each word is.` }
    yield { q, phase: 'softmax', line: [7, 9], dwell: first ? 2.4 : 1.6, note: q === 7 ? 'Softmax turns the scores into weights that sum to 1. “it” attends mostly to “animal” — this is how the model resolves what “it” refers to.' : `Softmax turns scores into weights. “${TOKENS[q]}” attends most to “${TOKENS[WEIGHTS[q].indexOf(Math.max(...WEIGHTS[q]))]}”.` }
    yield { q, phase: 'output', line: 10, dwell: first ? 2 : 1.3, note: `The new representation of “${TOKENS[q]}” is the weighted average of all value vectors — context mixed in.` }
  }
}

export default function Attention() {
  const [picked, setPicked] = useState<number | null>(null)
  const player = usePlayer(() => program(picked), [picked], { interval: 650, loop: 1800 })
  const fr = player.frame
  const w = WEIGHTS[fr.q]
  const top = useMemo(() => w.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v).slice(0, 3), [w])
  return (
    <LabFrame
      title="Self-attention · scaled dot-product"
      status={`query: “${TOKENS[fr.q]}”`}
      player={player}
      stage={
        <Stage aspect={0.6} min={330} max={460}>
          {(box) => <Board box={box} f={fr} onPick={(i) => setPicked(i)} />}
        </Stage>
      }
      legend={[
        { label: 'attention weight (line thickness)', color: 'var(--accent)', shape: 'line' },
        { label: 'click any word to query it', color: 'var(--fg-subtle)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'attention.py',
        vars: [
          { name: 'query', value: `"${TOKENS[fr.q]}"`, color: 'var(--accent)' },
          { name: 'd_k', value: '4' },
          ...top.map((t, k) => ({ name: `#${k + 1} weight`, value: `${TOKENS[t.i]} ${fmt(t.v, 2)}`, color: k === 0 ? 'var(--accent-2)' : undefined })),
          { name: 'sum(weights)', value: fmt(w.reduce((s, v) => s + v, 0), 2) },
        ],
      }}
      params={
        picked !== null ? (
          <button type="button" onClick={() => setPicked(null)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-fg">
            Back to the tour
          </button>
        ) : undefined
      }
    />
  )
}

function Board({ box, f, onPick }: { box: Box; f: Frame; onPick: (i: number) => void }) {
  const n = TOKENS.length
  const narrow = box.width < 560
  const listW = narrow ? box.width : box.width * 0.56
  const rowH = (box.height - 30) / n
  const leftX = Math.min(90, listW * 0.26)
  const rightX = listW - Math.min(90, listW * 0.26)
  const y = (i: number) => 22 + i * rowH + rowH / 2
  const w = WEIGHTS[f.q]
  const s = SCORES[f.q]
  const hmX = listW + 16
  const hmW = box.width - hmX - 10
  const cell = Math.min(hmW / n, (box.height - 46) / n)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Attention weights between words">
      <text x={leftX} y={12} textAnchor="end" className="viz-label">
        query
      </text>
      <text x={rightX} y={12} className="viz-label">
        keys
      </text>
      {TOKENS.map((_, j) => {
        const show = f.phase !== 'scores'
        const weight = show ? w[j] : 0
        return (
          <motion.line
            key={`l${j}`}
            x1={leftX + 8}
            y1={y(f.q)}
            x2={rightX - 8}
            y2={y(j)}
            initial={false}
            animate={{ strokeWidth: 0.5 + weight * 14, opacity: show ? 0.15 + weight * 1.6 : 0.08 }}
            transition={{ duration: 0.6 }}
            strokeLinecap="round"
            style={{ stroke: 'var(--accent)' }}
          />
        )
      })}
      {TOKENS.map((t, i) => (
        <g key={`q${i}`} onClick={() => onPick(i)} className="cursor-pointer">
          <rect x={4} y={y(i) - rowH / 2 + 2} width={leftX} height={rowH - 4} rx={6} style={{ fill: i === f.q ? 'color-mix(in oklab, var(--accent) 22%, transparent)' : 'transparent' }} />
          <text x={leftX} y={y(i) + 4} textAnchor="end" fontSize={12.5} fontWeight={i === f.q ? 700 : 400} style={{ fill: i === f.q ? 'var(--fg)' : 'var(--fg-muted)' }}>
            {t}
          </text>
        </g>
      ))}
      {TOKENS.map((t, j) => (
        <g key={`k${j}`} onClick={() => onPick(j)} className="cursor-pointer">
          <text x={rightX} y={y(j) + 4} fontSize={12.5} style={{ fill: f.phase !== 'scores' && w[j] > 0.2 ? 'var(--fg)' : 'var(--fg-muted)' }} fontWeight={f.phase !== 'scores' && w[j] > 0.2 ? 700 : 400}>
            {t}
          </text>
          <text x={listW - 4} y={y(j) + 4} textAnchor="end" fontSize={10.5} className="font-mono" style={{ fill: 'var(--fg-subtle)' }}>
            {f.phase === 'scores' ? fmt(s[j], 2) : `${Math.round(w[j] * 100)}%`}
          </text>
        </g>
      ))}
      {!narrow && (
        <g transform={`translate(${hmX} 30)`}>
          <text x={0} y={-12} className="viz-label">
            weights (rows = queries)
          </text>
          {WEIGHTS.map((row, i) =>
            row.map((v, j) => (
              <rect
                key={`${i}-${j}`}
                x={j * cell}
                y={i * cell}
                width={cell - 1.5}
                height={cell - 1.5}
                rx={2}
                style={{ fill: `color-mix(in oklab, var(--accent) ${Math.round(Math.min(1, v * 1.6) * 90)}%, var(--bg-elev))`, opacity: i === f.q ? 1 : 0.35, transition: 'opacity 0.3s' }}
              />
            )),
          )}
          <motion.rect initial={false} animate={{ y: f.q * cell - 2 }} x={-2} width={n * cell + 2.5} height={cell + 2.5} rx={4} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
        </g>
      )}
    </svg>
  )
}

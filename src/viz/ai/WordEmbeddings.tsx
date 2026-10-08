import { AnimatePresence, motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, frame2d, type Box } from '../core/plot'
import { fmt } from '../core/math'

const CODE = `import numpy as np

sentence = "The King and the Queen visited Paris"
tokens = sentence.lower().split()             # tokenization
vectors = np.array([emb[t] for t in tokens])  # embedding lookup

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

# analogy: king − man + woman ≈ ?
target = emb["king"] - emb["man"] + emb["woman"]
best = max((w for w in emb if w not in {"king", "man", "woman"}),
           key=lambda w: cosine(emb[w], target))      # → "queen"`

/** Toy 2-D embeddings, hand-placed for illustration (real ones have hundreds of dimensions). */
const EMB: Record<string, [number, number]> = {
  man: [-1, 0],
  woman: [1, 0],
  boy: [-1.15, -0.85],
  girl: [0.85, -0.85],
  king: [-1, 2],
  queen: [1, 2],
  prince: [-1.15, 1.25],
  princess: [0.85, 1.25],
  france: [3.1, -2.5],
  paris: [4.1, -1.7],
  italy: [2.7, -3.3],
  rome: [3.7, -2.5],
  dog: [-3.4, -2.4],
  puppy: [-3.7, -3.2],
  cat: [-2.5, -2.8],
  kitten: [-2.8, -3.6],
  the: [0.1, -2.3],
  and: [-0.45, -2.75],
  visited: [0.75, -2.95],
}
const SENTENCE = 'The King and the Queen visited Paris'
const TOKENS = SENTENCE.toLowerCase().split(' ')

const cos = (a: [number, number], b: [number, number]) => (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))

type Phase = 'text' | 'tokens' | 'lookup' | 'space' | 'analogy1' | 'analogy1b' | 'analogy2'

interface Frame extends StepFrame {
  phase: Phase
  landed: number
}

function* program(): Generator<Frame, void, void> {
  yield { phase: 'text', landed: 0, line: 3, dwell: 1.6, note: 'Models cannot read text directly. Step one is to turn it into numbers.' }
  yield { phase: 'tokens', landed: 0, line: 4, dwell: 2, note: 'Tokenize: lowercase and split into tokens. (Modern LLMs split into sub-word pieces instead of whole words.)' }
  for (let k = 1; k <= TOKENS.length; k++) yield { phase: 'lookup', landed: k, line: 5, dwell: 0.6, note: 'Look up each token in an embedding table: every word becomes a vector (a point in space).' }
  yield { phase: 'space', landed: TOKENS.length, line: 5, dwell: 2.6, note: 'Similar words end up close together: royalty, people, animals, places and function words form neighbourhoods.' }
  yield { phase: 'analogy1', landed: TOKENS.length, line: [10, 11], dwell: 2.6, note: 'Directions carry meaning too. The arrow from man to king is roughly “+ royalty”.' }
  yield { phase: 'analogy1b', landed: TOKENS.length, line: [12, 13], dwell: 3, note: 'Add that same arrow to woman and the nearest word (by cosine similarity) is queen: king − man + woman ≈ queen.' }
  yield { phase: 'analogy2', landed: TOKENS.length, line: [10, 13], dwell: 3.4, note: 'The same trick works for country → capital: paris − france + italy ≈ rome.' }
}

export default function WordEmbeddings() {
  const player = usePlayer(program, [], { interval: 700, loop: 2200 })
  const fr = player.frame
  const target: [number, number] = [EMB.king[0] - EMB.man[0] + EMB.woman[0], EMB.king[1] - EMB.man[1] + EMB.woman[1]]
  const ranked = Object.keys(EMB)
    .filter((w) => !['king', 'man', 'woman'].includes(w))
    .map((w) => ({ w, s: cos(EMB[w], target) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
  return (
    <LabFrame
      title="From words to vectors · embeddings"
      status="toy 2-D embeddings"
      player={player}
      stage={
        <Stage aspect={0.66} min={320} max={500}>
          {(box) => <Space box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'word vector', color: 'var(--accent-2)' },
        { label: 'from the sentence', color: 'var(--accent)' },
        { label: 'analogy arrow', color: 'var(--accent-3)', shape: 'line' },
      ]}
      below={
        <MiniPanel title="cosine(emb[w], king − man + woman)">
          <ul className="space-y-1.5 px-1">
            {ranked.map((r, i) => (
              <li key={r.w} className="flex items-center gap-3 font-mono text-[12px]">
                <span className="w-16 text-muted">{r.w}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]">
                  <motion.div className="h-full rounded-full" initial={false} animate={{ width: `${Math.max(0, r.s) * 100}%` }} style={{ background: i === 0 ? 'var(--accent)' : 'var(--fg-subtle)' }} />
                </div>
                <span className="w-12 text-right text-fg tabular">{fmt(r.s, 3)}</span>
              </li>
            ))}
          </ul>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'embeddings.py',
        vars: [
          { name: 'tokens', value: fr.phase === 'text' ? '—' : `[${TOKENS.map((t) => `'${t}'`).join(', ')}]` },
          { name: 'vectors.shape', value: fr.landed ? `(${fr.landed}, 2)` : '—' },
          { name: 'target', value: `[${fmt(target[0], 1)}, ${fmt(target[1], 1)}]`, color: 'var(--accent-3)' },
          { name: 'best', value: fr.phase === 'analogy1b' || fr.phase === 'analogy2' ? `'${ranked[0].w}'` : '—', color: 'var(--accent)' },
        ],
      }}
    />
  )
}

function Space({ box, f }: { box: Box; f: Frame }) {
  const bandH = 64
  const F = frame2d({ width: box.width, height: box.height - bandH }, [-4.6, 5], [-4.2, 2.8], { l: 16, r: 16, t: 10, b: 14 })
  const sx = F.sx
  const sy = (v: number) => F.sy(v) + bandH
  const showSpace = f.phase !== 'text' && f.phase !== 'tokens'
  const showAll = f.phase === 'space' || f.phase.startsWith('analogy')
  const chipW = Math.min(78, (box.width - 40) / TOKENS.length)
  const arrow = (a: [number, number], b: [number, number], color: string, key: string, delay = 0) => (
    <motion.line key={key} x1={sx(a[0])} y1={sy(a[1])} x2={sx(b[0])} y2={sy(b[1])} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.9, delay }} strokeWidth={2.6} markerEnd="url(#emb-arrow)" style={{ stroke: color }} />
  )
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Words placed in a 2-D embedding space">
      <defs>
        <marker id="emb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent-3)' }} />
        </marker>
      </defs>
      {/* sentence / tokens band */}
      <AnimatePresence mode="wait">
        {f.phase === 'text' ? (
          <motion.text key="txt" x={box.width / 2} y={36} textAnchor="middle" fontSize={Math.min(20, box.width / 26)} className="viz-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            “{SENTENCE}”
          </motion.text>
        ) : null}
      </AnimatePresence>
      {f.phase !== 'text' &&
        TOKENS.map((t, i) => {
          const landed = showSpace && i < f.landed
          const x0 = (box.width - chipW * TOKENS.length) / 2 + i * chipW + chipW / 2
          const [ex, ey] = EMB[t]
          return (
            <motion.g key={`tok${i}`} initial={{ x: x0, y: 34, opacity: 0 }} animate={landed ? { x: sx(ex), y: sy(ey), opacity: 1 } : { x: x0, y: 34, opacity: 1 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: landed ? 0 : i * 0.06 }}>
              {landed ? (
                <circle r={6} style={{ fill: 'var(--accent)', filter: 'drop-shadow(0 0 6px var(--accent))' }} />
              ) : (
                <>
                  <rect x={-chipW / 2 + 3} y={-14} width={chipW - 6} height={28} rx={9} style={{ fill: 'color-mix(in oklab, var(--accent) 14%, var(--bg-elev))', stroke: 'var(--accent)' }} />
                  <text y={4.5} textAnchor="middle" fontSize={12} className="viz-text">
                    {t}
                  </text>
                </>
              )}
            </motion.g>
          )
        })}
      {showSpace && (
        <g>
          <line x1={F.left} x2={F.right} y1={sy(0)} y2={sy(0)} className="viz-grid" />
          <line x1={sx(0)} x2={sx(0)} y1={F.top + bandH} y2={F.bottom + bandH} className="viz-grid" />
          {Object.entries(EMB).map(([w, [x, y]]) => {
            const inSentence = TOKENS.includes(w)
            if (!showAll && !inSentence) return null
            if (inSentence && !TOKENS.slice(0, f.landed).includes(w)) return null
            return (
              <motion.g key={w} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                {!inSentence && <circle cx={sx(x)} cy={sy(y)} r={4.5} style={{ fill: 'var(--accent-2)' }} />}
                <text x={sx(x) + 9} y={sy(y) + 4} fontSize={11.5} style={{ fill: inSentence ? 'var(--fg)' : 'var(--fg-muted)' }} fontWeight={inSentence ? 600 : 400}>
                  {w}
                </text>
              </motion.g>
            )
          })}
          {(f.phase === 'analogy1' || f.phase === 'analogy1b') && arrow(EMB.man, EMB.king, 'var(--accent-3)', 'a1')}
          {f.phase === 'analogy1b' && (
            <>
              {arrow(EMB.woman, EMB.queen, 'var(--accent-3)', 'a2', 0.2)}
              <motion.circle cx={sx(EMB.queen[0])} cy={sy(EMB.queen[1])} initial={{ r: 0 }} animate={{ r: 16 }} transition={{ delay: 1 }} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
            </>
          )}
          {f.phase === 'analogy2' && (
            <>
              {arrow(EMB.france, EMB.paris, 'var(--accent-3)', 'b1')}
              {arrow(EMB.italy, EMB.rome, 'var(--accent-3)', 'b2', 0.5)}
              <motion.circle cx={sx(EMB.rome[0])} cy={sy(EMB.rome[1])} initial={{ r: 0 }} animate={{ r: 16 }} transition={{ delay: 1.3 }} fill="none" strokeWidth={2} style={{ stroke: 'var(--accent)' }} />
            </>
          )}
        </g>
      )}
    </svg>
  )
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Pills, Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { fmt, rng, softmax } from '../core/math'
import { cn } from '../../lib/utils'

const CODE = `import numpy as np

def sample_next(logits, temperature=1.0, top_k=None, top_p=None):
    logits = logits / temperature               # <1 sharpens, >1 flattens
    if top_k is not None:
        cutoff = np.sort(logits)[-top_k]
        logits = np.where(logits < cutoff, -np.inf, logits)
    probs = np.exp(logits - logits.max())
    probs /= probs.sum()
    if top_p is not None:                       # nucleus sampling
        order = np.argsort(probs)[::-1]
        before = np.cumsum(probs[order]) - probs[order]
        keep = order[before < top_p]            # smallest set reaching p
        mask = np.zeros_like(probs, dtype=bool)
        mask[keep] = True
        probs = np.where(mask, probs, 0)
        probs /= probs.sum()
    return np.random.choice(len(probs), p=probs)`

const PROMPT = 'The capital of France is'
/** A tiny hand-written "language model": next-token logits keyed by the previous token. Illustrative only. */
const MODEL: Record<string, [string, number][]> = {
  is: [[' Paris', 6], [' a', 3.4], [' the', 3], [' located', 2.5], [' home', 2], [' Lyon', 1], [' not', 0.6], [' Berlin', -0.6]],
  ' Paris': [['.', 5.2], [',', 4.4], [' and', 2.8], ['!', 1.2], [' city', 0.3]],
  ' a': [[' city', 3.2], [' beautiful', 2.9], [' major', 2.4], [' question', 0.8]],
  ' the': [[' city', 3.4], [' Paris', 3], [' capital', 1.5], [' largest', 1.2]],
  ' located': [[' in', 4], [' on', 2.4], [' near', 2]],
  ' home': [[' to', 4.5], [' of', 2.2]],
  ' to': [[' Paris', 3.6], [' the', 2.2], [' many', 1.6]],
  ' in': [[' Paris', 3.8], [' the', 2.4], [' Europe', 2]],
  ' city': [['.', 3.5], [' of', 3], [',', 2.4]],
  ' beautiful': [[' city', 4], ['.', 1.5]],
  ' major': [[' city', 4.2], [' hub', 2.5]],
}
const FALLBACK: [string, number][] = [['.', 3], [',', 2.1], [' and', 1.8], [' the', 1.5]]

type TopK = 0 | 3 | 5

function distribution(cands: [string, number][], T: number, topK: TopK, topP: number) {
  let logits = cands.map((c) => c[1] / T)
  if (topK) {
    const cutoff = [...logits].sort((a, b) => b - a)[Math.min(topK, logits.length) - 1]
    logits = logits.map((l) => (l < cutoff ? -Infinity : l))
  }
  let probs = softmax(logits.map((l) => (Number.isFinite(l) ? l : -1e9)))
  probs = probs.map((p, i) => (Number.isFinite(logits[i]) ? p : 0))
  const z0 = probs.reduce((s, p) => s + p, 0)
  probs = probs.map((p) => p / z0)
  const kept = probs.map((p) => p > 0)
  if (topP < 1) {
    const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a])
    let before = 0
    const keep = new Set<number>()
    for (const i of order) {
      if (before < topP) keep.add(i)
      before += probs[i]
    }
    probs = probs.map((p, i) => (keep.has(i) ? p : 0))
    kept.forEach((_, i) => (kept[i] = keep.has(i)))
    const z = probs.reduce((s, p) => s + p, 0)
    probs = probs.map((p) => p / z)
  }
  return { probs, kept }
}

interface Frame extends StepFrame {
  text: string[]
  cands: [string, number][]
  probs: number[]
  kept: boolean[]
  pick?: number
  phase: 'logits' | 'probs' | 'pick' | 'done'
}

function* program(T: number, topK: TopK, topP: number, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  const text: string[] = []
  for (let step = 0; step < 5; step++) {
    const prev = text.length ? text[text.length - 1] : 'is'
    const cands = MODEL[prev] ?? FALLBACK
    const raw = cands.map(() => 0)
    const first = step === 0
    yield { text: [...text], cands, probs: raw, kept: cands.map(() => true), phase: 'logits', line: [3, 4], dwell: first ? 1.8 : 0.9, note: first ? 'The model outputs a score (logit) for every token in its vocabulary. Divide by the temperature first.' : 'Next position: a fresh distribution over the vocabulary, conditioned on everything so far.' }
    const { probs, kept } = distribution(cands, T, topK, topP)
    yield { text: [...text], cands, probs, kept, phase: 'probs', line: topK || topP < 1 ? [5, 17] : [8, 9], dwell: first ? 2.2 : 1.2, note: first ? `Softmax turns logits into probabilities${topK ? `; top-k keeps only the ${topK} best` : ''}${topP < 1 ? `; top-p keeps the smallest set covering ${Math.round(topP * 100)}%` : ''}. Greyed bars can no longer be sampled.` : `Temperature ${T.toFixed(2)}: ${T < 0.6 ? 'sharp — almost always the top token.' : T > 1.3 ? 'flat — unlikely tokens get a real chance (more creative, more errors).' : 'balanced.'}` }
    let u = r.next()
    let pick = probs.length - 1
    for (let i = 0; i < probs.length; i++) {
      u -= probs[i]
      if (u <= 0 && probs[i] > 0) {
        pick = i
        break
      }
    }
    text.push(cands[pick][0])
    yield { text: [...text], cands, probs, kept, pick, phase: 'pick', line: 18, dwell: first ? 2 : 1.3, note: cands[pick][0].trim() === 'Lyon' || cands[pick][0].trim() === 'Berlin' ? `Sampled “${cands[pick][0].trim()}” — fluent but false. Sampling a low-probability token is one way models hallucinate.` : `Sample one token in proportion to its probability → “${cands[pick][0]}”, then append it and repeat.` }
    if (cands[pick][0] === '.' || cands[pick][0] === '!') break
  }
  yield { text: [...text], cands: [], probs: [], kept: [], phase: 'done', line: 18, dwell: 4, note: 'Generation is just this loop: predict a distribution, sample a token, append, repeat — one token at a time.' }
}

export default function NextToken() {
  const [T, setT] = useState(1)
  const [topK, setTopK] = useState<TopK>(0)
  const [topP, setTopP] = useState(1)
  const [seed, setSeed] = useState(1)
  const player = usePlayer(() => program(T, topK, topP, seed), [T, topK, topP, seed], { interval: 650, loop: 1800 })
  const fr = player.frame
  return (
    <LabFrame
      title="Large language models · next-token sampling"
      status={`T = ${T.toFixed(2)}${topK ? ` · top-k ${topK}` : ''}${topP < 1 ? ` · top-p ${topP.toFixed(2)}` : ''}`}
      player={player}
      stage={<Board f={fr} />}
      code={{
        source: CODE,
        file: 'sampling.py',
        vars: [
          { name: 'temperature', value: T.toFixed(2), color: 'var(--accent)' },
          { name: 'top_k', value: topK ? String(topK) : 'None' },
          { name: 'top_p', value: topP < 1 ? topP.toFixed(2) : 'None' },
          { name: 'sampled', value: fr.pick !== undefined ? JSON.stringify(fr.cands[fr.pick][0]) : '—', color: 'var(--accent-2)' },
          { name: 'p(sampled)', value: fr.pick !== undefined ? fmt(fr.probs[fr.pick], 3) : '—' },
        ],
      }}
      params={
        <>
          <Slider label="Temperature" value={T} min={0.1} max={2.5} step={0.05} onChange={setT} format={(v) => v.toFixed(2)} />
          <Slider label="Top-p (nucleus)" value={topP} min={0.3} max={1} step={0.05} onChange={setTopP} format={(v) => (v >= 1 ? 'off' : v.toFixed(2))} />
          <Pills
            label="Top-k"
            value={topK}
            onChange={setTopK}
            options={[
              { value: 0, label: 'off' },
              { value: 3, label: '3' },
              { value: 5, label: '5' },
            ]}
          />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            Resample
          </button>
        </>
      }
    />
  )
}

function Board({ f }: { f: Frame }) {
  const max = Math.max(0.0001, ...f.probs)
  return (
    <div className="min-h-[360px] p-4 sm:p-6">
      <div className="rounded-2xl border border-line bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] px-4 py-4 font-mono text-[14px] leading-relaxed sm:text-[15.5px]">
        <span className="text-muted">{PROMPT}</span>
        <AnimatePresence initial={false}>
          {f.text.map((t, i) => (
            <motion.span key={`${i}-${t}`} initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} className={cn('rounded px-0.5', i === f.text.length - 1 && f.phase === 'pick' ? 'bg-accent/20 text-fg' : 'text-fg')}>
              {t.replace(/ /g, ' ')}
            </motion.span>
          ))}
        </AnimatePresence>
        {f.phase !== 'done' && <span className="animate-blink ml-0.5 inline-block h-[1.1em] w-[8px] translate-y-[3px] bg-accent" />}
      </div>
      <div className="mt-5 space-y-2">
        <AnimatePresence mode="popLayout">
          {f.cands.map(([tok, logit], i) => {
            const p = f.probs[i] ?? 0
            const off = !f.kept[i]
            const picked = f.pick === i
            return (
              <motion.div key={`${tok}-${f.text.length}`} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="flex items-center gap-3">
                <span className={cn('w-24 shrink-0 truncate text-right font-mono text-[12.5px]', picked ? 'font-semibold text-accent' : off ? 'text-subtle line-through' : 'text-fg')}>{JSON.stringify(tok)}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-[color-mix(in_oklab,var(--fg)_5%,transparent)]">
                  <motion.div
                    className="h-full rounded-md"
                    initial={false}
                    animate={{ width: `${f.phase === 'logits' ? Math.max(4, ((logit + 1) / 7.5) * 100) : (p / max) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    style={{ background: picked ? 'var(--accent)' : off ? 'color-mix(in oklab, var(--fg) 14%, transparent)' : f.phase === 'logits' ? 'color-mix(in oklab, var(--accent-2) 45%, transparent)' : 'color-mix(in oklab, var(--accent) 55%, transparent)' }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[11.5px] text-muted tabular">{f.phase === 'logits' ? `z=${logit.toFixed(1)}` : `${(p * 100).toFixed(1)}%`}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { fmt } from '../core/math'

const CODE = `def posterior(prior, sensitivity, specificity):
    # P(+) = P(+|D)·P(D) + P(+|¬D)·P(¬D)
    p_pos = sensitivity * prior + (1 - specificity) * (1 - prior)
    # Bayes: P(D|+) = P(+|D)·P(D) / P(+)
    return sensitivity * prior / p_pos

print(posterior(prior=0.01, sensitivity=0.95, specificity=0.90))  # 0.0876`

const N = 1000
const COLS = 40
const ROWS = 25

type Phase = 'people' | 'disease' | 'test' | 'sort' | 'focus'

interface Frame extends StepFrame {
  phase: Phase
}

function* program(): Generator<Frame, void, void> {
  yield { phase: 'people', line: 1, dwell: 1.6, note: 'Imagine 1,000 people taking a screening test.' }
  yield { phase: 'disease', line: 7, dwell: 2.2, note: 'The prior: only a small fraction actually have the disease (the coloured dots).' }
  yield { phase: 'test', line: [2, 3], dwell: 2.4, note: 'The test catches most sick people (sensitivity) but also flags some healthy people by mistake (1 − specificity). Ringed = tested positive.' }
  yield { phase: 'sort', line: [2, 3], dwell: 2.4, note: 'Group everyone by outcome: true positives, false positives, false negatives, true negatives.' }
  yield { phase: 'focus', line: [4, 5], dwell: 5, note: 'Given a positive test, look only at the ringed people. The share who are actually sick is P(disease | +) — usually far lower than the test’s accuracy suggests, because healthy people vastly outnumber sick ones.' }
}

export default function BayesTheorem() {
  const [prior, setPrior] = useState(0.01)
  const [sens, setSens] = useState(0.95)
  const [spec, setSpec] = useState(0.9)
  const player = usePlayer(program, [prior, sens, spec], { interval: 700, loop: 2000 })
  const fr = player.frame
  const sick = Math.round(N * prior)
  const TP = Math.round(sick * sens)
  const FN = sick - TP
  const healthy = N - sick
  const FP = Math.round(healthy * (1 - spec))
  const TN = healthy - FP
  const exact = (sens * prior) / (sens * prior + (1 - spec) * (1 - prior))
  const people = useMemo(() => {
    // type per person in natural (shuffled-looking) order: deterministic interleave
    const kinds: ('TP' | 'FN' | 'FP' | 'TN')[] = [...Array(TP).fill('TP'), ...Array(FN).fill('FN'), ...Array(FP).fill('FP'), ...Array(TN).fill('TN')]
    const scatter = kinds.map((k, i) => ({ k, key: (i * 7919) % 1009 }))
    scatter.sort((a, b) => a.key - b.key)
    return scatter.map((s, slot) => ({ kind: s.k, natural: slot }))
  }, [TP, FN, FP])
  const sortedIndex = useMemo(() => {
    const order = ['TP', 'FP', 'FN', 'TN']
    const idx = people.map((p, i) => ({ i, o: order.indexOf(p.kind) }))
    idx.sort((a, b) => a.o - b.o || a.i - b.i)
    const pos = new Array(people.length)
    idx.forEach((v, slot) => (pos[v.i] = slot))
    return pos as number[]
  }, [people])

  return (
    <LabFrame
      title="Bayes' theorem · why a positive test can still mean ‘probably fine’"
      status={`P(D | +) = ${(exact * 100).toFixed(1)}%`}
      player={player}
      stage={
        <Stage aspect={0.62} min={260} max={460}>
          {(box) => <Icons box={box} people={people} sorted={sortedIndex} phase={fr.phase} />}
        </Stage>
      }
      legend={[
        { label: 'has the disease', color: 'var(--accent-3)' },
        { label: 'healthy', color: 'var(--fg-subtle)' },
        { label: 'tested positive', color: 'var(--accent)', shape: 'ring' },
      ]}
      below={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['True positives', TP, 'var(--accent-3)'],
            ['False positives', FP, 'var(--medium)'],
            ['False negatives', FN, 'var(--hard)'],
            ['True negatives', TN, 'var(--fg-subtle)'],
          ].map(([l, v, c]) => (
            <div key={l as string} className="rounded-xl border border-line px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-subtle">{l as string}</div>
              <div className="mt-0.5 font-mono text-[18px] font-semibold tabular" style={{ color: c as string }}>
                {v as number}
              </div>
            </div>
          ))}
          <div className="col-span-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 sm:col-span-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[12px]">
              <span className="text-muted">P(disease | positive) = TP / (TP + FP)</span>
              <span className="text-fg tabular">
                {TP} / ({TP} + {FP}) = <b className="text-accent">{TP + FP ? ((TP / (TP + FP)) * 100).toFixed(1) : '0'}%</b>
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]">
              <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: `${(TP / Math.max(1, TP + FP)) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
        </div>
      }
      code={{
        source: CODE,
        file: 'bayes.py',
        vars: [
          { name: 'prior', value: fmt(prior, 3), color: 'var(--accent-3)' },
          { name: 'sensitivity', value: fmt(sens, 2) },
          { name: 'specificity', value: fmt(spec, 2) },
          { name: 'p_pos', value: fmt(sens * prior + (1 - spec) * (1 - prior), 4) },
          { name: 'posterior', value: fmt(exact, 4), color: 'var(--accent)' },
        ],
      }}
      params={
        <>
          <Slider label="Prevalence P(D)" value={prior} min={0.005} max={0.3} step={0.005} onChange={setPrior} format={(v) => `${(v * 100).toFixed(1)}%`} />
          <Slider label="Sensitivity P(+|D)" value={sens} min={0.5} max={0.99} step={0.01} onChange={setSens} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Specificity P(−|¬D)" value={spec} min={0.5} max={0.99} step={0.01} onChange={setSpec} format={(v) => `${Math.round(v * 100)}%`} />
        </>
      }
    />
  )
}

function Icons({ box, people, sorted, phase }: { box: Box; people: { kind: string; natural: number }[]; sorted: number[]; phase: Phase }) {
  const cell = Math.min((box.width - 24) / COLS, (box.height - 24) / ROWS)
  const ox = (box.width - cell * COLS) / 2
  const oy = (box.height - cell * ROWS) / 2
  const r = cell * 0.34
  const grouped = phase === 'sort' || phase === 'focus'
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Icon array of 1,000 people">
      {people.map((p, i) => {
        const slot = grouped ? sorted[i] : p.natural
        // column-major fill when grouped so each outcome forms a vertical band
        const col = grouped ? Math.floor(slot / ROWS) : slot % COLS
        const row = grouped ? slot % ROWS : Math.floor(slot / COLS)
        const sick = p.kind === 'TP' || p.kind === 'FN'
        const pos = p.kind === 'TP' || p.kind === 'FP'
        const showSick = phase !== 'people'
        const showTest = phase === 'test' || grouped
        const faded = phase === 'focus' && !pos
        return (
          <g
            key={i}
            style={{
              transform: `translate(${ox + col * cell + cell / 2}px, ${oy + row * cell + cell / 2}px)`,
              opacity: faded ? 0.15 : 1,
              transition: `transform 1s cubic-bezier(0.65, 0, 0.35, 1) ${grouped ? (i % 40) * 0.008 : 0}s, opacity 0.6s`,
            }}
          >
            <circle r={r} style={{ fill: showSick && sick ? 'var(--accent-3)' : 'color-mix(in oklab, var(--fg) 30%, transparent)', transition: 'fill 0.5s' }} />
            {showTest && pos && <circle r={r + Math.max(1.5, cell * 0.12)} fill="none" strokeWidth={Math.max(1.2, cell * 0.1)} style={{ stroke: 'var(--accent)' }} />}
          </g>
        )
      })}
    </svg>
  )
}

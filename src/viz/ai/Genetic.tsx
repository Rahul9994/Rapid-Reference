import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame, MiniPanel } from '../core/LabFrame'
import { Slider } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, pathOf, type Box } from '../core/plot'
import { rng } from '../core/math'
import { cn } from '../../lib/utils'

const TARGET = 'RAPID_REFERENCE'
const GENES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
const POP = 60

const CODE = `import random

TARGET = "RAPID_REFERENCE"
GENES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_"
def fitness(s):
    return sum(a == b for a, b in zip(s, TARGET))
def random_string(n): return "".join(random.choice(GENES) for _ in range(n))
population = [random_string(len(TARGET)) for _ in range(60)]
for generation in range(300):
    population.sort(key=fitness, reverse=True)
    if fitness(population[0]) == len(TARGET):
        break                                      # solved
    parents = population[:20]                      # selection (top third)
    children = population[:2]                      # elitism
    while len(children) < 60:
        a, b = random.sample(parents, 2)
        cut = random.randrange(len(TARGET))
        child = a[:cut] + b[cut:]                  # crossover
        child = "".join(c if random.random() > rate else random.choice(GENES)
                        for c in child)            # mutation
        children.append(child)
    population = children`

const fitness = (s: string) => {
  let n = 0
  for (let i = 0; i < TARGET.length; i++) if (s[i] === TARGET[i]) n++
  return n
}

interface Cross {
  a: string
  b: string
  cut: number
  child: string
  mutated: number[]
}

interface Frame extends StepFrame {
  gen: number
  top: string[]
  best: number[]
  avg: number[]
  cross?: Cross
  solved: boolean
}

function* program(rate: number, seed: number): Generator<Frame, void, void> {
  const r = rng(seed)
  const rand = (n: number) => Array.from({ length: n }, () => GENES[r.int(0, GENES.length - 1)]).join('')
  let pop = Array.from({ length: POP }, () => rand(TARGET.length))
  const best: number[] = []
  const avg: number[] = []
  yield { gen: 0, top: pop.slice(0, 8), best: [], avg: [], solved: false, line: 8, dwell: 1.6, note: '60 random strings. Each character is a gene; fitness = number of characters already correct.' }
  for (let gen = 0; gen < 300; gen++) {
    pop.sort((a, b) => fitness(b) - fitness(a))
    best.push(fitness(pop[0]))
    avg.push(pop.reduce((s, p) => s + fitness(p), 0) / POP)
    const narrate = gen < 2
    yield { gen, top: pop.slice(0, 8), best: [...best], avg: [...avg], solved: false, line: [10, 11], dwell: narrate ? 1.4 : 0.35, note: narrate ? 'Evaluate and sort by fitness: the best individuals rise to the top.' : `Generation ${gen}: best ${best[gen]}/${TARGET.length}, average ${avg[gen].toFixed(1)}.` }
    if (fitness(pop[0]) === TARGET.length) {
      yield { gen, top: pop.slice(0, 8), best, avg, solved: true, line: [11, 12], dwell: 6, note: `Solved in ${gen} generations — selection, crossover and mutation found the target without ever being told how.` }
      return
    }
    const parents = pop.slice(0, 20)
    const children = pop.slice(0, 2)
    let shown: Cross | undefined
    while (children.length < POP) {
      const i = r.int(0, 19)
      let j = r.int(0, 18)
      if (j >= i) j++
      const a = parents[i]
      const b = parents[j]
      const cut = r.int(0, TARGET.length - 1)
      const mixed = a.slice(0, cut) + b.slice(cut)
      const mutated: number[] = []
      const child = mixed
        .split('')
        .map((c, k) => {
          if (r.next() > rate) return c
          mutated.push(k)
          return GENES[r.int(0, GENES.length - 1)]
        })
        .join('')
      if (!shown) shown = { a, b, cut, child, mutated }
      children.push(child)
    }
    if (narrate || gen % 8 === 0) {
      yield { gen, top: pop.slice(0, 8), best: [...best], avg: [...avg], cross: shown, solved: false, line: [16, 18], dwell: narrate ? 2.2 : 1, note: narrate ? 'Crossover: pick two fit parents, cut at a random point and splice — the child inherits a prefix from one and a suffix from the other.' : 'Breeding the next generation…' }
      yield { gen, top: pop.slice(0, 8), best: [...best], avg: [...avg], cross: shown, solved: false, line: [19, 20], dwell: narrate ? 1.8 : 0.8, note: narrate ? 'Mutation: each gene has a small chance to flip at random — the source of brand-new material.' : 'Mutating…' }
    }
    pop = children
  }
  yield { gen: 300, top: pop.slice(0, 8), best, avg, solved: false, line: 9, dwell: 5, note: 'Stopped after 300 generations. Try a different mutation rate.' }
}

export default function Genetic() {
  const [rate, setRate] = useState(1 / 15)
  const [seed, setSeed] = useState(3)
  const player = usePlayer(() => program(rate, seed), [rate, seed], { interval: 600, loop: 2600 })
  const fr = player.frame
  return (
    <LabFrame
      title="Genetic algorithm · evolving a string"
      status={fr.solved ? `solved · gen ${fr.gen}` : `generation ${fr.gen}`}
      player={player}
      stage={<Population f={fr} />}
      below={
        <MiniPanel title="Fitness per generation" right={fr.best.length ? `best ${fr.best[fr.best.length - 1]}/${TARGET.length}` : undefined}>
          <Stage aspect={0.22} min={100} max={130}>
            {(box) => <FitnessChart box={box} f={fr} />}
          </Stage>
        </MiniPanel>
      }
      code={{
        source: CODE,
        file: 'genetic_algorithm.py',
        vars: [
          { name: 'generation', value: String(fr.gen) },
          { name: 'best', value: fr.top[0] ? `"${fr.top[0]}"` : '—', color: 'var(--accent)' },
          { name: 'fitness(best)', value: fr.top[0] ? `${fitness(fr.top[0])}/${TARGET.length}` : '—', color: 'var(--easy)' },
          { name: 'rate', value: rate.toFixed(3) },
          { name: 'cut', value: fr.cross ? String(fr.cross.cut) : '—' },
        ],
      }}
      params={
        <>
          <Slider label="Mutation rate" value={rate} min={0.005} max={0.25} step={0.005} onChange={setRate} format={(v) => v.toFixed(3)} />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            New population
          </button>
        </>
      }
    />
  )
}

function Genome({ s, highlight, cut, mutated, size = 'md' }: { s: string; highlight?: boolean; cut?: number; mutated?: number[]; size?: 'md' | 'sm' }) {
  return (
    <span className="inline-flex gap-[3px]">
      {s.split('').map((c, i) => {
        const ok = c === TARGET[i]
        return (
          <span
            key={i}
            className={cn(
              'grid place-items-center rounded-[5px] font-mono font-semibold transition-colors duration-300',
              size === 'md' ? 'h-6 w-[clamp(14px,2.6vw,22px)] text-[11px] sm:h-7 sm:text-[12.5px]' : 'h-5 w-[clamp(12px,2.2vw,18px)] text-[10px]',
              ok ? 'text-on-accent' : 'text-muted',
              cut !== undefined && i === cut && 'ml-2',
            )}
            style={{
              background: mutated?.includes(i) ? 'var(--medium)' : ok ? (highlight ? 'var(--accent)' : 'var(--accent-2)') : 'color-mix(in oklab, var(--fg) 7%, transparent)',
            }}
          >
            {c}
          </span>
        )
      })}
    </span>
  )
}

function Population({ f }: { f: Frame }) {
  return (
    <div className="min-h-[340px] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-subtle">
        <span>Top of the population</span>
        <span>fitness</span>
      </div>
      <ul className="space-y-1.5 overflow-x-auto pb-1">
        <AnimatePresence initial={false}>
          {f.top.map((s, i) => (
            <motion.li key={`${s}-${i}`} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-3">
              <span className="w-5 shrink-0 font-mono text-[10.5px] text-subtle tabular">{i + 1}</span>
              <Genome s={s} highlight={i === 0} />
              <span className="ml-auto shrink-0 font-mono text-[12px] text-fg tabular">
                {fitness(s)}/{TARGET.length}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="mt-4 min-h-[92px] rounded-xl border border-line bg-[color-mix(in_oklab,var(--fg)_2.5%,transparent)] p-3">
        {f.cross ? (
          <div className="space-y-1.5 overflow-x-auto">
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-subtle">
              <span className="w-14 shrink-0">parent A</span>
              <Genome s={f.cross.a} size="sm" cut={f.cross.cut} />
            </div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-subtle">
              <span className="w-14 shrink-0">parent B</span>
              <Genome s={f.cross.b} size="sm" cut={f.cross.cut} />
            </div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-subtle">
              <span className="w-14 shrink-0">child</span>
              <Genome s={f.cross.child} size="sm" cut={f.cross.cut} mutated={f.line && (Array.isArray(f.line) ? f.line[0] === 19 : false) ? f.cross.mutated : []} />
            </div>
          </div>
        ) : (
          <p className="text-[12.5px] text-subtle">Crossover and mutation examples appear here while breeding.</p>
        )}
      </div>
    </div>
  )
}

function FitnessChart({ box, f }: { box: Box; f: Frame }) {
  const n = Math.max(20, f.best.length)
  const F = frame2d(box, [0, n], [0, TARGET.length], { l: 28, b: 18, t: 6, r: 8 })
  const b = f.best.map((v, i) => [F.sx(i), F.sy(v)] as [number, number])
  const a = f.avg.map((v, i) => [F.sx(i), F.sy(v)] as [number, number])
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" aria-hidden="true">
      <Axes f={F} xTicks={6} yTicks={3} xLabel="generation" />
      <path d={pathOf(a)} fill="none" strokeWidth={1.6} strokeDasharray="4 4" style={{ stroke: 'var(--accent-2)' }} />
      <path d={pathOf(b)} fill="none" strokeWidth={2.2} style={{ stroke: 'var(--accent)' }} />
    </svg>
  )
}

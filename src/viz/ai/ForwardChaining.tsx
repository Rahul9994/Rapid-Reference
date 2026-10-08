import { AnimatePresence, motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'

const CODE = `from collections import deque

def forward_chaining(rules, facts, query):
    count = {r: len(r.premises) for r in rules}   # unmet premises
    inferred = set()
    agenda = deque(facts)                         # known, not yet used
    while agenda:
        p = agenda.popleft()
        if p == query:
            return True
        if p in inferred:
            continue
        inferred.add(p)
        for r in rules:
            if p in r.premises:
                count[r] -= 1
                if count[r] == 0:                 # every premise known
                    agenda.append(r.conclusion)
    return False`

type Sym = 'A' | 'B' | 'L' | 'M' | 'P' | 'Q'
interface Rule {
  id: string
  prem: Sym[]
  concl: Sym
  pos: [number, number]
}
const RULES: Rule[] = [
  { id: 'r1', prem: ['P'], concl: 'Q', pos: [0.5, 0.2] },
  { id: 'r2', prem: ['L', 'M'], concl: 'P', pos: [0.5, 0.42] },
  { id: 'r3', prem: ['B', 'L'], concl: 'M', pos: [0.66, 0.72] },
  { id: 'r4', prem: ['A', 'P'], concl: 'L', pos: [0.16, 0.42] },
  { id: 'r5', prem: ['A', 'B'], concl: 'L', pos: [0.4, 0.74] },
]
const SYM_POS: Record<Sym, [number, number]> = { Q: [0.5, 0.05], P: [0.5, 0.3], L: [0.3, 0.57], M: [0.72, 0.57], A: [0.25, 0.92], B: [0.72, 0.92] }
const FACTS: Sym[] = ['A', 'B']
const QUERY: Sym = 'Q'

interface Frame extends StepFrame {
  agenda: Sym[]
  inferred: Sym[]
  count: Record<string, number>
  p?: Sym
  rule?: string
  fired: string[]
  proved: boolean
}

function* program(): Generator<Frame, void, void> {
  const count: Record<string, number> = Object.fromEntries(RULES.map((r) => [r.id, r.prem.length]))
  const inferred: Sym[] = []
  const agenda: Sym[] = [...FACTS]
  const fired: string[] = []
  const snap = (x: Partial<Frame> & StepFrame): Frame => ({ agenda: [...agenda], inferred: [...inferred], count: { ...count }, fired: [...fired], proved: false, ...x })
  yield snap({ line: [4, 6], dwell: 2, note: 'Knowledge base of Horn clauses (rule badges show how many premises are still unknown). Known facts A and B start on the agenda. Goal: prove Q.' })
  while (agenda.length) {
    const p = agenda.shift()!
    yield snap({ p, line: 8, dwell: 1.2, note: `Take ${p} from the front of the agenda.` })
    if (p === QUERY) {
      yield snap({ p, proved: true, line: [9, 10], dwell: 6, note: 'Q came off the agenda — it is entailed by the knowledge base. Proved, using only facts and modus ponens.' })
      return
    }
    if (inferred.includes(p)) {
      yield snap({ p, line: [11, 12], dwell: 1.1, note: `${p} was already inferred — skip it.` })
      continue
    }
    inferred.push(p)
    yield snap({ p, line: 13, dwell: 1, note: `Mark ${p} as known.` })
    for (const r of RULES) {
      if (!r.prem.includes(p)) continue
      count[r.id]--
      if (count[r.id] === 0) {
        agenda.push(r.concl)
        fired.push(r.id)
        yield snap({ p, rule: r.id, line: [16, 18], dwell: 1.5, note: `Every premise of ${r.prem.join(' ∧ ')} ⇒ ${r.concl} is known: the rule fires and ${r.concl} joins the agenda.` })
      } else {
        yield snap({ p, rule: r.id, line: [15, 16], dwell: 1.1, note: count[r.id] < 0 ? `${r.prem.join(' ∧ ')} ⇒ ${r.concl} already fired — nothing new.` : `${p} satisfies one premise of ${r.prem.join(' ∧ ')} ⇒ ${r.concl}; ${count[r.id]} still unknown.` })
      }
    }
  }
}

export default function ForwardChaining() {
  const player = usePlayer(program, [], { interval: 650, loop: 2600 })
  const fr = player.frame
  return (
    <LabFrame
      title="Forward chaining · data-driven inference"
      status={fr.proved ? 'Q proved' : `${fr.inferred.length} facts known`}
      player={player}
      stage={
        <Stage aspect={0.62} min={300} max={470}>
          {(box) => <Graph box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'known fact', color: 'var(--accent-2)' },
        { label: 'rule (unknown premises)', color: 'var(--accent)', shape: 'square' },
        { label: 'fired rule', color: 'var(--easy)', shape: 'square' },
        { label: 'goal', color: 'var(--accent-3)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'forward_chaining.py',
        vars: [
          { name: 'p', value: fr.p ?? '—', color: 'var(--accent)' },
          { name: 'agenda', value: `[${fr.agenda.join(', ')}]` },
          { name: 'inferred', value: `{${fr.inferred.join(', ')}}`, color: 'var(--accent-2)' },
          { name: 'count', value: RULES.map((r) => `${r.id}:${Math.max(0, fr.count[r.id])}`).join(' ') },
        ],
      }}
    />
  )
}

function Graph({ box, f }: { box: Box; f: Frame }) {
  const px = (x: number) => 30 + x * (box.width - 60) * 0.78
  const py = (y: number) => 26 + y * (box.height - 52)
  const symR = 20
  const known = new Set(f.inferred)
  const sidebarX = box.width * 0.8
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="AND-OR graph of Horn clauses with forward chaining">
      {RULES.map((r) => {
        const [rx, ry] = [px(r.pos[0]), py(r.pos[1])]
        const fired = f.fired.includes(r.id)
        const active = f.rule === r.id
        return (
          <g key={r.id}>
            {r.prem.map((s) => (
              <line key={s} x1={px(SYM_POS[s][0])} y1={py(SYM_POS[s][1])} x2={rx} y2={ry} strokeWidth={active ? 2.6 : 1.6} style={{ stroke: known.has(s) ? 'var(--accent-2)' : 'var(--border-strong)', transition: 'stroke 0.4s' }} />
            ))}
            <line x1={rx} y1={ry} x2={px(SYM_POS[r.concl][0])} y2={py(SYM_POS[r.concl][1])} strokeWidth={fired ? 2.6 : 1.6} markerEnd="" style={{ stroke: fired ? 'var(--easy)' : 'var(--border-strong)', transition: 'stroke 0.4s' }} />
          </g>
        )
      })}
      {RULES.map((r) => {
        const [rx, ry] = [px(r.pos[0]), py(r.pos[1])]
        const fired = f.fired.includes(r.id)
        const active = f.rule === r.id
        const c = Math.max(0, f.count[r.id])
        return (
          <g key={`n${r.id}`} transform={`translate(${rx} ${ry})`}>
            {active && <motion.circle initial={{ r: 12, opacity: 0.8 }} animate={{ r: 24, opacity: 0 }} transition={{ duration: 0.9, repeat: Infinity }} style={{ fill: fired ? 'var(--easy)' : 'var(--accent)' }} />}
            <rect x={-16} y={-11} width={32} height={22} rx={8} strokeWidth={1.6} style={{ fill: fired ? 'color-mix(in oklab, var(--easy) 30%, var(--bg-elev))' : 'var(--bg-elev)', stroke: fired ? 'var(--easy)' : active ? 'var(--accent)' : 'var(--border-strong)', transition: 'fill 0.4s' }} />
            <text y={4} textAnchor="middle" fontSize={11} fontWeight={600} className="viz-text">
              {fired ? '✓' : c}
            </text>
            <text y={-16} textAnchor="middle" fontSize={9.5} className="viz-muted">
              {r.prem.join('∧')}⇒{r.concl}
            </text>
          </g>
        )
      })}
      {(Object.keys(SYM_POS) as Sym[]).map((s) => {
        const on = known.has(s)
        const cur = f.p === s
        const goal = s === QUERY
        return (
          <g key={s} transform={`translate(${px(SYM_POS[s][0])} ${py(SYM_POS[s][1])})`}>
            {cur && <motion.circle initial={{ r: symR }} animate={{ r: symR + 8 }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }} style={{ fill: 'color-mix(in oklab, var(--accent) 25%, transparent)' }} />}
            <circle
              r={symR}
              strokeWidth={goal ? 3 : 1.8}
              style={{
                fill: (goal && f.proved) || on ? `color-mix(in oklab, ${goal ? 'var(--accent-3)' : 'var(--accent-2)'} 75%, var(--bg-elev))` : 'var(--bg-elev)',
                stroke: goal ? 'var(--accent-3)' : on ? 'var(--accent-2)' : 'var(--border-strong)',
                transition: 'fill 0.4s',
              }}
            />
            <text y={5} textAnchor="middle" fontSize={15} fontWeight={700} style={{ fill: on || (goal && f.proved) ? 'var(--bg)' : 'var(--fg)' }}>
              {s}
            </text>
          </g>
        )
      })}
      <g transform={`translate(${sidebarX} 24)`}>
        <text className="viz-label">agenda</text>
        <AnimatePresence>
          {f.agenda.map((s, i) => (
            <motion.g key={`${s}-${i}-${f.agenda.length}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0, y: 14 + i * 30 }} exit={{ opacity: 0 }}>
              <rect width={40} height={24} rx={8} style={{ fill: 'color-mix(in oklab, var(--accent) 16%, var(--bg-elev))', stroke: 'var(--accent)' }} />
              <text x={20} y={16} textAnchor="middle" fontSize={12} fontWeight={600} className="viz-text">
                {s}
              </text>
            </motion.g>
          ))}
        </AnimatePresence>
      </g>
    </svg>
  )
}

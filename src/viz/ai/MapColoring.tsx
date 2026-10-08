import { useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'

type Mode = 'plain' | 'fc' | 'mrv'

const CODE = `def backtrack(assignment, domains):
    if len(assignment) == len(variables):
        return assignment                        # every region coloured
    var = select_unassigned(assignment, domains)     # fixed order or MRV
    for color in domains[var]:
        if all(assignment.get(n) != color for n in neighbours[var]):
            assignment[var] = color
            pruned = forward_check(var, color, domains)
            if pruned is not None:               # no neighbour left empty
                result = backtrack(assignment, domains)
                if result:
                    return result
                restore(domains, pruned)
            del assignment[var]                  # undo → try next colour
    return None                                  # dead end: backtrack`

const VARS = ['WA', 'NT', 'SA', 'Q', 'NSW', 'V', 'T'] as const
type V = (typeof VARS)[number]
const POS: Record<V, [number, number]> = { WA: [0.16, 0.48], NT: [0.42, 0.24], SA: [0.47, 0.6], Q: [0.72, 0.27], NSW: [0.76, 0.6], V: [0.66, 0.82], T: [0.86, 0.92] }
const NAMES: Record<V, string> = { WA: 'Western Australia', NT: 'Northern Territory', SA: 'South Australia', Q: 'Queensland', NSW: 'New South Wales', V: 'Victoria', T: 'Tasmania' }
const EDGES: [V, V][] = [
  ['WA', 'NT'],
  ['WA', 'SA'],
  ['NT', 'SA'],
  ['NT', 'Q'],
  ['SA', 'Q'],
  ['SA', 'NSW'],
  ['SA', 'V'],
  ['Q', 'NSW'],
  ['NSW', 'V'],
]
const NB: Record<V, V[]> = Object.fromEntries(VARS.map((v) => [v, EDGES.filter((e) => e.includes(v)).map((e) => (e[0] === v ? e[1] : e[0]))])) as Record<V, V[]>
const COLORS = ['R', 'G', 'B'] as const
type C = (typeof COLORS)[number]
const SWATCH: Record<C, string> = { R: 'var(--hard)', G: 'var(--easy)', B: 'var(--accent-2)' }
const ORDER: V[] = ['WA', 'NT', 'NSW', 'Q', 'SA', 'V', 'T']

interface Frame extends StepFrame {
  assign: Partial<Record<V, C>>
  domains: Record<V, C[]>
  focus?: V
  trying?: C
  conflict?: V
  emptied?: V
  backtracks: number
  assignments: number
  solved: boolean
}

function* program(mode: Mode): Generator<Frame, void, void> {
  const assign: Partial<Record<V, C>> = {}
  const domains = Object.fromEntries(VARS.map((v) => [v, [...COLORS]])) as Record<V, C[]>
  let backtracks = 0
  let assignments = 0
  const snap = (x: Partial<Frame> & StepFrame): Frame => ({
    assign: { ...assign },
    domains: Object.fromEntries(VARS.map((v) => [v, [...domains[v]]])) as Record<V, C[]>,
    backtracks,
    assignments,
    solved: false,
    ...x,
  })

  const select = (): V => {
    const un = VARS.filter((v) => !assign[v])
    if (mode !== 'mrv') return ORDER.find((v) => !assign[v])!
    // MRV, ties broken by degree (most unassigned neighbours), then order
    return [...un].sort((a, b) => domains[a].length - domains[b].length || NB[b].filter((n) => !assign[n]).length - NB[a].filter((n) => !assign[n]).length || ORDER.indexOf(a) - ORDER.indexOf(b))[0]
  }

  function* bt(): Generator<Frame, boolean, void> {
    if (VARS.every((v) => assign[v])) return true
    const v = select()
    yield snap({ focus: v, line: 4, dwell: 1.1, note: mode === 'mrv' ? `MRV: pick ${v} — it has the fewest legal colours left (${domains[v].length}).` : `Next variable in the fixed order: ${v} (${NAMES[v]}).` })
    for (const c of [...domains[v]]) {
      const clash = NB[v].find((n) => assign[n] === c)
      if (clash) {
        yield snap({ focus: v, trying: c, conflict: clash, line: [5, 6], dwell: 0.9, note: `${c} for ${v} clashes with neighbour ${clash}.` })
        continue
      }
      assign[v] = c
      assignments++
      yield snap({ focus: v, trying: c, line: 7, dwell: 0.9, note: `Assign ${v} = ${c}.` })
      let pruned: [V, C][] | null = []
      if (mode !== 'plain') {
        for (const n of NB[v]) {
          if (!assign[n] && domains[n].includes(c)) {
            domains[n] = domains[n].filter((x) => x !== c)
            pruned.push([n, c])
          }
        }
        const empty = NB[v].find((n) => !assign[n] && domains[n].length === 0)
        yield snap({ focus: v, trying: c, emptied: empty, line: 8, dwell: 1.1, note: empty ? `Forward checking: ${empty} has no colours left — this assignment is doomed, so reject it now.` : `Forward checking removes ${c} from ${v}'s unassigned neighbours.` })
        if (empty) {
          for (const [n, col] of pruned) domains[n] = [...domains[n], col].sort((a, b) => COLORS.indexOf(a) - COLORS.indexOf(b))
          pruned = null
        }
      }
      if (pruned !== null) {
        const ok = yield* bt()
        if (ok) return true
        for (const [n, col] of pruned) domains[n] = [...domains[n], col].sort((a, b) => COLORS.indexOf(a) - COLORS.indexOf(b))
      }
      delete assign[v]
      backtracks++
      yield snap({ focus: v, line: [13, 14], dwell: 1.2, note: `Undo ${v} = ${c} and try its next colour.` })
    }
    yield snap({ focus: v, conflict: v, line: 15, dwell: 1.4, note: `${v} has no consistent colour — dead end. Backtrack to the previous decision.` })
    return false
  }

  yield snap({ line: [1, 3], dwell: 1.6, note: 'Colour each region red, green or blue so that no two neighbours share a colour.' })
  yield* bt()
  yield snap({ solved: true, line: [2, 3], dwell: 6, note: `Solved with ${assignments} assignments and ${backtracks} backtracks. ${mode === 'plain' ? 'Try forward checking or MRV to see the work shrink.' : mode === 'fc' ? 'MRV goes further by tackling the most constrained region first.' : 'MRV + forward checking solve it with no backtracking at all.'}` })
}

export default function MapColoring() {
  const [mode, setMode] = useState<Mode>('plain')
  const player = usePlayer(() => program(mode), [mode], { interval: 650, loop: 2600 })
  const fr = player.frame
  return (
    <LabFrame
      title="Constraint satisfaction · map colouring"
      status={`${fr.assignments} assignments · ${fr.backtracks} backtracks`}
      player={player}
      stage={
        <Stage aspect={0.6} min={280} max={460}>
          {(box) => <MapGraph box={box} f={fr} />}
        </Stage>
      }
      legend={[
        { label: 'constraint (must differ)', color: 'var(--border-strong)', shape: 'line' },
        { label: 'remaining domain', color: 'var(--fg-muted)' },
        { label: 'conflict / empty domain', color: 'var(--hard)', shape: 'ring' },
      ]}
      code={{
        source: CODE,
        file: 'csp_backtracking.py',
        vars: [
          { name: 'var', value: fr.focus ?? '—', color: 'var(--accent)' },
          { name: 'color', value: fr.trying ?? '—' },
          { name: 'assignment', value: `{${VARS.filter((v) => fr.assign[v]).map((v) => `${v}:${fr.assign[v]}`).join(', ')}}` },
          { name: 'backtracks', value: String(fr.backtracks), color: 'var(--hard)' },
        ],
      }}
      params={
        <Pills
          label="Strategy"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'plain', label: 'Backtracking' },
            { value: 'fc', label: '+ Forward checking' },
            { value: 'mrv', label: '+ MRV' },
          ]}
        />
      }
    />
  )
}

function MapGraph({ box, f }: { box: Box; f: Frame }) {
  const r = Math.max(20, Math.min(34, box.width * 0.045))
  const px = (v: V) => 24 + POS[v][0] * (box.width - 48)
  const py = (v: V) => 10 + POS[v][1] * (box.height - 40)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Constraint graph of Australian regions">
      {EDGES.map(([a, b]) => {
        const hot = (f.conflict === a && f.focus === b) || (f.conflict === b && f.focus === a)
        return <line key={`${a}${b}`} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} strokeWidth={hot ? 3.5 : 2} style={{ stroke: hot ? 'var(--hard)' : 'var(--border-strong)', transition: 'stroke 0.25s' }} />
      })}
      {VARS.map((v) => {
        const c = f.assign[v]
        const focus = f.focus === v
        const bad = f.emptied === v || (f.conflict === v && !f.trying)
        return (
          <g key={v}>
            {focus && <motion.circle cx={px(v)} cy={py(v)} initial={{ r: r }} animate={{ r: r + 9 }} transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }} style={{ fill: 'color-mix(in oklab, var(--accent) 22%, transparent)' }} />}
            <motion.circle
              cx={px(v)}
              cy={py(v)}
              r={r}
              initial={false}
              animate={{ scale: c ? 1 : 0.94 }}
              strokeWidth={bad ? 3.5 : focus ? 2.5 : 1.5}
              style={{
                fill: c ? `color-mix(in oklab, ${SWATCH[c]} 70%, var(--bg-elev))` : f.trying && focus ? `color-mix(in oklab, ${SWATCH[f.trying]} 25%, var(--bg-elev))` : 'var(--bg-elev)',
                stroke: bad ? 'var(--hard)' : focus ? 'var(--accent)' : 'var(--border-strong)',
                transition: 'fill 0.35s',
              }}
            />
            <text x={px(v)} y={py(v) + 4.5} textAnchor="middle" fontSize={Math.min(14, r * 0.5)} fontWeight={700} style={{ fill: c ? 'var(--bg)' : 'var(--fg)' }}>
              {v}
            </text>
            <g transform={`translate(${px(v) - 19} ${py(v) + r + 9})`}>
              {COLORS.map((col, k) => {
                const has = f.domains[v].includes(col)
                return (
                  <g key={col}>
                    <circle cx={k * 19 + 0} cy={0} r={5.5} style={{ fill: SWATCH[col], opacity: has ? 0.95 : 0.15, transition: 'opacity 0.3s' }} />
                    {!has && <line x1={k * 19 - 6} y1={6} x2={k * 19 + 6} y2={-6} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />}
                  </g>
                )
              })}
            </g>
          </g>
        )
      })}
    </svg>
  )
}

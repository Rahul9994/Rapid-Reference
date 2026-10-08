import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { Pills } from '../core/controls'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { rng } from '../core/math'

type Mode = 'minimax' | 'alphabeta'

const CODE: Record<Mode, string> = {
  minimax: `import math

def minimax(node, maximizing):
    if node.is_leaf():
        return node.value
    if maximizing:
        best = -math.inf
        for child in node.children:
            best = max(best, minimax(child, False))
        return best
    best = math.inf
    for child in node.children:
        best = min(best, minimax(child, True))
    return best`,
  alphabeta: `import math

def alphabeta(node, alpha, beta, maximizing):
    if node.is_leaf():
        return node.value
    if maximizing:
        best = -math.inf
        for child in node.children:
            best = max(best, alphabeta(child, alpha, beta, False))
            alpha = max(alpha, best)
            if alpha >= beta:
                break                # β cut-off: MIN won't allow this
        return best
    best = math.inf
    for child in node.children:
        best = min(best, alphabeta(child, alpha, beta, True))
        beta = min(beta, best)
        if alpha >= beta:
            break                    # α cut-off: MAX won't allow this
    return best`,
}

// line numbers per mode
const LN = {
  minimax: { leaf: [4, 5], maxInit: 7, maxLoop: [8, 9], maxRet: 10, minInit: 11, minLoop: [12, 13], minRet: 14, cutMax: 0, cutMin: 0, abMax: 0, abMin: 0 },
  alphabeta: { leaf: [4, 5], maxInit: 7, maxLoop: [8, 9], maxRet: 13, minInit: 14, minLoop: [15, 16], minRet: 20, cutMax: [11, 12], cutMin: [18, 19], abMax: 10, abMin: 17 },
}

const DEPTH = 4
const LEAVES = 2 ** DEPTH
// node ids in heap order: root = 1, children of i are 2i and 2i + 1; leaves are 16..31
const isLeaf = (i: number) => i >= LEAVES
const depthOf = (i: number) => Math.floor(Math.log2(i))

interface NodeState {
  value?: number
  alpha?: number
  beta?: number
  done?: boolean
  pruned?: boolean
}

interface Frame extends StepFrame {
  nodes: Record<number, NodeState>
  current: number
  evaluated: number
  edgeOn: number // child id whose edge to parent is lit
}

function* program(leaves: number[], mode: Mode): Generator<Frame, void, void> {
  const L = LN[mode]
  const nodes: Record<number, NodeState> = {}
  let evaluated = 0
  const snap = (current: number, line: number | number[], note: string, dwell = 1, edgeOn = 0): Frame => ({
    nodes: structuredClone(nodes),
    current,
    evaluated,
    edgeOn,
    line,
    note,
    dwell,
  })
  const pruneSubtree = (i: number) => {
    nodes[i] = { ...nodes[i], pruned: true }
    if (!isLeaf(i)) {
      pruneSubtree(2 * i)
      pruneSubtree(2 * i + 1)
    }
  }
  let narrated = 0
  const slow = () => narrated++ < 6

  function* visit(i: number, alpha: number, beta: number, maximizing: boolean): Generator<Frame, number, void> {
    if (isLeaf(i)) {
      const v = leaves[i - LEAVES]
      evaluated++
      nodes[i] = { value: v, done: true }
      const s = slow()
      yield snap(i, L.leaf, s ? `Leaf reached: utility ${v}.` : `Evaluate leaf → ${v}.`, s ? 1 : 0.45, i)
      return v
    }
    let best = maximizing ? -Infinity : Infinity
    nodes[i] = { ...nodes[i], alpha: mode === 'alphabeta' ? alpha : undefined, beta: mode === 'alphabeta' ? beta : undefined }
    const s0 = slow()
    yield snap(i, maximizing ? L.maxInit : L.minInit, `${maximizing ? 'MAX' : 'MIN'} node: start with best = ${maximizing ? '−∞' : '+∞'}${mode === 'alphabeta' ? `, window α = ${fmtInf(alpha)}, β = ${fmtInf(beta)}` : ''}.`, s0 ? 1.1 : 0.4)
    for (const c of [2 * i, 2 * i + 1]) {
      const v = yield* visit(c, alpha, beta, !maximizing)
      best = maximizing ? Math.max(best, v) : Math.min(best, v)
      nodes[i] = { ...nodes[i], value: best }
      const s1 = slow()
      yield snap(i, maximizing ? L.maxLoop : L.minLoop, `${maximizing ? 'MAX takes the larger' : 'MIN takes the smaller'} value → best = ${best}.`, s1 ? 1.1 : 0.4, c)
      if (mode === 'alphabeta') {
        if (maximizing) alpha = Math.max(alpha, best)
        else beta = Math.min(beta, best)
        nodes[i] = { ...nodes[i], alpha, beta }
        if (alpha >= beta) {
          const rest = c === 2 * i ? [2 * i + 1] : []
          rest.forEach(pruneSubtree)
          yield snap(i, maximizing ? (L.cutMax as number[]) : (L.cutMin as number[]), rest.length ? `α = ${fmtInf(alpha)} ≥ β = ${fmtInf(beta)}: the ${maximizing ? 'MIN' : 'MAX'} player above would never let play reach here, so the remaining branch is pruned ✂.` : `α ≥ β — but no siblings are left to prune.`, 2)
          break
        }
      }
    }
    nodes[i] = { ...nodes[i], done: true }
    const s2 = slow()
    yield snap(i, maximizing ? L.maxRet : L.minRet, `Return ${best} to the parent.`, s2 ? 1 : 0.4)
    return best
  }

  yield snap(0, 3, mode === 'alphabeta' ? 'Alpha–beta: the same search as minimax, but it carries a window [α, β] and skips branches that cannot change the result.' : 'Minimax: MAX (▲) picks the highest value, MIN (▼) the lowest, assuming both play perfectly.', 1.8)
  const v = yield* visit(1, -Infinity, Infinity, true)
  yield snap(1, mode === 'alphabeta' ? LN.alphabeta.maxRet : LN.minimax.maxRet, `Root value = ${v}. ${mode === 'alphabeta' ? `Only ${evaluated} of ${LEAVES} leaves were evaluated — same answer, less work.` : `All ${LEAVES} leaves were evaluated.`}`, 6)
}

const fmtInf = (v: number) => (v === Infinity ? '+∞' : v === -Infinity ? '−∞' : String(v))

export default function Minimax() {
  const [mode, setMode] = useState<Mode>('alphabeta')
  const [seed, setSeed] = useState(0)
  const leaves = useMemo(() => {
    if (seed === 0) return [3, 12, 8, 2, 4, 6, 14, 5, 2, 9, 1, 7, 11, 3, 6, 10]
    const r = rng(seed * 7 + 1)
    return Array.from({ length: LEAVES }, () => r.int(0, 15))
  }, [seed])
  const player = usePlayer(() => program(leaves, mode), [leaves, mode], { interval: 600, loop: 2400 })
  const fr = player.frame
  return (
    <LabFrame
      title={mode === 'alphabeta' ? 'Alpha–beta pruning' : 'Minimax game tree'}
      status={`leaves evaluated ${fr.evaluated}/${LEAVES}`}
      player={player}
      stage={
        <Stage aspect={0.56} min={280} max={440}>
          {(box) => <Tree box={box} f={fr} leaves={leaves} mode={mode} />}
        </Stage>
      }
      legend={[
        { label: 'MAX node ▲', color: 'var(--accent-2)', shape: 'square' },
        { label: 'MIN node ▼', color: 'var(--accent-3)', shape: 'square' },
        { label: 'current', color: 'var(--accent)', shape: 'ring' },
        { label: 'pruned', color: 'var(--fg-subtle)', shape: 'dash' },
      ]}
      code={{
        source: CODE[mode],
        file: mode === 'alphabeta' ? 'alpha_beta.py' : 'minimax.py',
        vars: [
          { name: 'node depth', value: fr.current ? String(depthOf(fr.current)) : '—' },
          { name: 'best', value: fr.current && fr.nodes[fr.current]?.value !== undefined ? String(fr.nodes[fr.current].value) : '—', color: 'var(--accent)' },
          ...(mode === 'alphabeta'
            ? [
                { name: 'alpha', value: fr.current && fr.nodes[fr.current]?.alpha !== undefined ? fmtInf(fr.nodes[fr.current].alpha!) : '—', color: 'var(--accent-2)' },
                { name: 'beta', value: fr.current && fr.nodes[fr.current]?.beta !== undefined ? fmtInf(fr.nodes[fr.current].beta!) : '—', color: 'var(--accent-3)' },
              ]
            : []),
          { name: 'leaves evaluated', value: String(fr.evaluated) },
        ],
      }}
      params={
        <>
          <Pills
            label="Algorithm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'alphabeta', label: 'Alpha–beta' },
              { value: 'minimax', label: 'Plain minimax' },
            ]}
          />
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="self-end rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-fg">
            Random leaves
          </button>
        </>
      }
    />
  )
}

function Tree({ box, f, leaves, mode }: { box: Box; f: Frame; leaves: number[]; mode: Mode }) {
  const padX = 20
  const top = 40
  const bottom = box.height - 30
  const leafW = (box.width - padX * 2) / LEAVES
  const x = (i: number): number => (isLeaf(i) ? padX + (i - LEAVES + 0.5) * leafW : (x(2 * i) + x(2 * i + 1)) / 2)
  const y = (i: number) => top + ((bottom - top) * depthOf(i)) / DEPTH
  const r = Math.max(10, Math.min(17, leafW * 0.42))
  const ids = Array.from({ length: 2 * LEAVES - 1 }, (_, k) => k + 1)
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Game tree search">
      {ids
        .filter((i) => i > 1)
        .map((i) => {
          const p = Math.floor(i / 2)
          const st = f.nodes[i]
          const lit = st?.done && !st.pruned
          return (
            <line
              key={`e${i}`}
              x1={x(p)}
              y1={y(p)}
              x2={x(i)}
              y2={y(i)}
              strokeWidth={f.edgeOn === i ? 3 : lit ? 1.8 : 1.2}
              strokeDasharray={st?.pruned ? '3 4' : undefined}
              style={{ stroke: f.edgeOn === i ? 'var(--accent)' : st?.pruned ? 'var(--fg-subtle)' : lit ? 'var(--fg-muted)' : 'var(--border-strong)', opacity: st?.pruned ? 0.5 : 1, transition: 'stroke 0.3s' }}
            />
          )
        })}
      {ids.map((i) => {
        const st = f.nodes[i] ?? {}
        const leaf = isLeaf(i)
        const max = depthOf(i) % 2 === 0
        const col = leaf ? 'var(--fg-muted)' : max ? 'var(--accent-2)' : 'var(--accent-3)'
        const cur = f.current === i
        const v = leaf ? leaves[i - LEAVES] : st.value
        return (
          <g key={i} style={{ opacity: st.pruned ? 0.3 : 1, transition: 'opacity 0.4s' }}>
            {cur && <motion.circle cx={x(i)} cy={y(i)} initial={{ r: r }} animate={{ r: r + 7 }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }} style={{ fill: 'color-mix(in oklab, var(--accent) 24%, transparent)' }} />}
            {leaf ? (
              <rect x={x(i) - r * 0.85} y={y(i) - r * 0.85} width={r * 1.7} height={r * 1.7} rx={5} strokeWidth={1.5} style={{ fill: st.done ? 'color-mix(in oklab, var(--fg) 14%, var(--bg-elev))' : 'var(--bg-elev)', stroke: cur ? 'var(--accent)' : 'var(--border-strong)' }} />
            ) : (
              <path
                d={max ? `M${x(i)},${y(i) - r} L${x(i) + r * 1.05},${y(i) + r * 0.75} L${x(i) - r * 1.05},${y(i) + r * 0.75} Z` : `M${x(i)},${y(i) + r} L${x(i) + r * 1.05},${y(i) - r * 0.75} L${x(i) - r * 1.05},${y(i) - r * 0.75} Z`}
                strokeWidth={1.8}
                strokeLinejoin="round"
                style={{ fill: st.done ? `color-mix(in oklab, ${col} 30%, var(--bg-elev))` : 'var(--bg-elev)', stroke: cur ? 'var(--accent)' : col, transition: 'fill 0.3s' }}
              />
            )}
            {v !== undefined && Number.isFinite(v) && (
              <text x={x(i)} y={y(i) + (leaf ? 4 : max ? 7 : 0)} textAnchor="middle" fontSize={leaf ? Math.min(12, r * 0.9) : 11} fontWeight={600} className="viz-text">
                {v}
              </text>
            )}
            {st.pruned && leaf && (
              <text x={x(i)} y={y(i) + r + 13} textAnchor="middle" fontSize={11} style={{ fill: 'var(--hard)' }}>
                ✂
              </text>
            )}
            {mode === 'alphabeta' && !leaf && st.alpha !== undefined && !st.pruned && (
              <text x={x(i)} y={y(i) - r - 6} textAnchor="middle" fontSize={9.5} className="viz-muted">
                [{fmtInf(st.alpha)}, {fmtInf(st.beta!)}]
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

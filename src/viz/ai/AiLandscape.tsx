import { AnimatePresence, motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Stage, type Box } from '../core/plot'
import { cn } from '../../lib/utils'

type Ring = 'ai' | 'ml' | 'dl' | 'gen'

const RINGS: { id: Ring; label: string; sub: string; color: string }[] = [
  { id: 'ai', label: 'Artificial Intelligence', sub: 'machines doing tasks that need intelligence', color: 'var(--accent)' },
  { id: 'ml', label: 'Machine Learning', sub: 'learning patterns from data', color: 'var(--accent-2)' },
  { id: 'dl', label: 'Deep Learning', sub: 'many-layered neural networks', color: 'var(--accent-3)' },
  { id: 'gen', label: 'Generative AI', sub: 'creating text, images, code', color: 'var(--medium)' },
]

const MILESTONES: { year: number; title: string; text: string; ring: Ring }[] = [
  { year: 1950, title: 'The Turing test', text: 'Alan Turing’s paper “Computing Machinery and Intelligence” proposes the imitation game.', ring: 'ai' },
  { year: 1956, title: 'AI gets its name', text: 'The Dartmouth summer workshop launches “artificial intelligence” as a field.', ring: 'ai' },
  { year: 1958, title: 'The perceptron', text: 'Frank Rosenblatt’s perceptron learns simple classifications from examples.', ring: 'ml' },
  { year: 1966, title: 'ELIZA', text: 'Joseph Weizenbaum’s ELIZA, one of the first chatbots, mimics a therapist with pattern rules.', ring: 'ai' },
  { year: 1986, title: 'Backpropagation', text: 'Rumelhart, Hinton and Williams popularise backprop for training multi-layer networks.', ring: 'ml' },
  { year: 1997, title: 'Deep Blue', text: 'IBM’s Deep Blue defeats world chess champion Garry Kasparov — powered by search, not learning.', ring: 'ai' },
  { year: 2012, title: 'AlexNet', text: 'A deep convolutional network wins the ImageNet challenge by a wide margin, igniting the deep-learning boom.', ring: 'dl' },
  { year: 2016, title: 'AlphaGo', text: 'DeepMind’s AlphaGo beats Lee Sedol at Go, combining deep networks with reinforcement learning and search.', ring: 'dl' },
  { year: 2017, title: 'The Transformer', text: '“Attention Is All You Need” introduces the architecture behind modern language models.', ring: 'dl' },
  { year: 2022, title: 'ChatGPT', text: 'Large language models reach the public as conversational assistants.', ring: 'gen' },
]

interface Frame extends StepFrame {
  k: number
}

function* program(): Generator<Frame, void, void> {
  yield { k: -1, dwell: 2.4, note: 'AI is the broad goal. Machine learning is one way to reach it, deep learning is one kind of machine learning, and generative AI is one use of deep learning.' }
  for (let k = 0; k < MILESTONES.length; k++) {
    const m = MILESTONES[k]
    yield { k, dwell: 2.1, note: `${m.year} · ${m.title}: ${m.text}` }
  }
}

export default function AiLandscape() {
  const player = usePlayer(program, [], { interval: 700, loop: 1800 })
  const fr = player.frame
  const m = fr.k >= 0 ? MILESTONES[fr.k] : null
  return (
    <LabFrame
      title="The AI landscape · nested fields & milestones"
      status={m ? String(m.year) : 'overview'}
      player={player}
      stage={
        <Stage aspect={0.62} min={300} max={460}>
          {(box) => <Rings box={box} active={m?.ring} />}
        </Stage>
      }
      side={
        <div className="flex h-full flex-col p-4 sm:p-5">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-subtle">Timeline</div>
          <ol className="relative space-y-1 border-l border-line pl-4">
            {MILESTONES.map((ms, i) => {
              const on = i === fr.k
              const past = i < fr.k
              const ring = RINGS.find((r) => r.id === ms.ring)!
              return (
                <li key={ms.year} className="relative">
                  <span
                    className={cn('absolute -left-[21px] top-2.5 h-2.5 w-2.5 rounded-full border-2 transition-all duration-300', on && 'scale-125')}
                    style={{ borderColor: ring.color, background: on || past ? ring.color : 'var(--bg)' }}
                  />
                  <div className={cn('rounded-xl px-3 py-1.5 transition-colors duration-300', on ? 'bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]' : '')}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11.5px] tabular" style={{ color: on ? ring.color : 'var(--fg-subtle)' }}>
                        {ms.year}
                      </span>
                      <span className={cn('text-[13px] transition-colors', on ? 'font-semibold text-fg' : past ? 'text-muted' : 'text-subtle')}>{ms.title}</span>
                    </div>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-[12.5px] leading-relaxed text-muted">
                          <span className="block pt-1">{ms.text}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      }
    />
  )
}

function Rings({ box, active }: { box: Box; active?: Ring }) {
  const cx = box.width / 2
  const cy = box.height / 2 + 6
  const R = Math.min(box.width * 0.46, box.height * 0.47)
  const radii = [R, R * 0.74, R * 0.5, R * 0.28]
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="AI contains ML, which contains deep learning, which contains generative AI">
      <defs>
        {RINGS.map((r) => (
          <radialGradient key={r.id} id={`ring-${r.id}`}>
            <stop offset="0.6" style={{ stopColor: r.color, stopOpacity: 0.04 }} />
            <stop offset="1" style={{ stopColor: r.color, stopOpacity: 0.16 }} />
          </radialGradient>
        ))}
      </defs>
      {RINGS.map((r, i) => {
        const on = active === r.id
        const rr = radii[i]
        return (
          <g key={r.id}>
            <motion.circle
              cx={cx}
              cy={cy + (R - rr) * 0.55}
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: rr, opacity: 1 }}
              transition={{ duration: 1.1, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              strokeWidth={on ? 3 : 1.5}
              style={{ fill: `url(#ring-${r.id})`, stroke: r.color, filter: on ? `drop-shadow(0 0 14px ${r.color})` : undefined, transition: 'stroke-width 0.3s' }}
            />
            <text x={cx} y={cy + (R - rr) * 0.55 - rr + Math.max(18, rr * 0.16)} textAnchor="middle" fontSize={Math.max(11, Math.min(16, rr * 0.11))} fontWeight={on ? 700 : 600} style={{ fill: on ? 'var(--fg)' : 'var(--fg-muted)', transition: 'fill 0.3s' }}>
              {r.label}
            </text>
            {i === RINGS.length - 1 && (
              <text x={cx} y={cy + (R - rr) * 0.55 + 6} textAnchor="middle" fontSize={10.5} className="viz-muted">
                {r.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

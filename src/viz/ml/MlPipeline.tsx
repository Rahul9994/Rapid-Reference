import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LabFrame } from '../core/LabFrame'
import { usePlayer, type StepFrame } from '../core/player'
import { Axes, Stage, frame2d, type Box } from '../core/plot'
import { mean } from '../core/math'
import { CLASS_COLORS } from '../core/datasets'

const CODE = `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)                     # 1. collect
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=1)              # 2. split
scaler = StandardScaler().fit(X_train)                # 3. preprocess
X_train = scaler.transform(X_train)
X_test = scaler.transform(X_test)
model = LogisticRegression().fit(X_train, y_train)    # 4. train
y_pred = model.predict(X_test)                        # 5. predict
print(accuracy_score(y_test, y_pred))                 # 6. evaluate → 0.9667`

// Fisher's Iris data (public domain): petal length, petal width, species.
const IRIS: [number, number, number][] = [[1.4,0.2,0],[1.4,0.2,0],[1.3,0.2,0],[1.5,0.2,0],[1.4,0.2,0],[1.7,0.4,0],[1.4,0.3,0],[1.5,0.2,0],[1.4,0.2,0],[1.5,0.1,0],[1.5,0.2,0],[1.6,0.2,0],[1.4,0.1,0],[1.1,0.1,0],[1.2,0.2,0],[1.5,0.4,0],[1.3,0.4,0],[1.4,0.3,0],[1.7,0.3,0],[1.5,0.3,0],[1.7,0.2,0],[1.5,0.4,0],[1.0,0.2,0],[1.7,0.5,0],[1.9,0.2,0],[1.6,0.2,0],[1.6,0.4,0],[1.5,0.2,0],[1.4,0.2,0],[1.6,0.2,0],[1.6,0.2,0],[1.5,0.4,0],[1.5,0.1,0],[1.4,0.2,0],[1.5,0.2,0],[1.2,0.2,0],[1.3,0.2,0],[1.4,0.1,0],[1.3,0.2,0],[1.5,0.2,0],[1.3,0.3,0],[1.3,0.3,0],[1.3,0.2,0],[1.6,0.6,0],[1.9,0.4,0],[1.4,0.3,0],[1.6,0.2,0],[1.4,0.2,0],[1.5,0.2,0],[1.4,0.2,0],[4.7,1.4,1],[4.5,1.5,1],[4.9,1.5,1],[4.0,1.3,1],[4.6,1.5,1],[4.5,1.3,1],[4.7,1.6,1],[3.3,1.0,1],[4.6,1.3,1],[3.9,1.4,1],[3.5,1.0,1],[4.2,1.5,1],[4.0,1.0,1],[4.7,1.4,1],[3.6,1.3,1],[4.4,1.4,1],[4.5,1.5,1],[4.1,1.0,1],[4.5,1.5,1],[3.9,1.1,1],[4.8,1.8,1],[4.0,1.3,1],[4.9,1.5,1],[4.7,1.2,1],[4.3,1.3,1],[4.4,1.4,1],[4.8,1.4,1],[5.0,1.7,1],[4.5,1.5,1],[3.5,1.0,1],[3.8,1.1,1],[3.7,1.0,1],[3.9,1.2,1],[5.1,1.6,1],[4.5,1.5,1],[4.5,1.6,1],[4.7,1.5,1],[4.4,1.3,1],[4.1,1.3,1],[4.0,1.3,1],[4.4,1.2,1],[4.6,1.4,1],[4.0,1.2,1],[3.3,1.0,1],[4.2,1.3,1],[4.2,1.2,1],[4.2,1.3,1],[4.3,1.3,1],[3.0,1.1,1],[4.1,1.3,1],[6.0,2.5,2],[5.1,1.9,2],[5.9,2.1,2],[5.6,1.8,2],[5.8,2.2,2],[6.6,2.1,2],[4.5,1.7,2],[6.3,1.8,2],[5.8,1.8,2],[6.1,2.5,2],[5.1,2.0,2],[5.3,1.9,2],[5.5,2.1,2],[5.0,2.0,2],[5.1,2.4,2],[5.3,2.3,2],[5.5,1.8,2],[6.7,2.2,2],[6.9,2.3,2],[5.0,1.5,2],[5.7,2.3,2],[4.9,2.0,2],[6.7,2.0,2],[4.9,1.8,2],[5.7,2.1,2],[6.0,1.8,2],[4.8,1.8,2],[4.9,1.8,2],[5.6,2.1,2],[5.8,1.6,2],[6.1,1.9,2],[6.4,2.0,2],[5.6,2.2,2],[5.1,1.5,2],[5.6,1.4,2],[6.1,2.3,2],[5.6,2.4,2],[5.5,1.8,2],[4.8,1.8,2],[5.4,2.1,2],[5.6,2.4,2],[5.1,2.3,2],[5.1,1.9,2],[5.9,2.3,2],[5.7,2.5,2],[5.2,2.3,2],[5.0,1.9,2],[5.2,2.0,2],[5.4,2.3,2],[5.1,1.8,2]]
// Test indices and predictions produced by the code above (random_state=1).
const TEST = [14, 98, 75, 16, 131, 56, 141, 44, 29, 120, 94, 5, 102, 51, 78, 42, 92, 66, 31, 35, 90, 84, 77, 40, 125, 99, 33, 19, 73, 146]
const PRED = [0, 1, 1, 0, 2, 1, 2, 0, 0, 2, 1, 0, 2, 1, 1, 0, 1, 1, 0, 0, 1, 1, 2, 0, 2, 1, 0, 0, 1, 2]

const STAGES = ['Collect', 'Split', 'Preprocess', 'Train', 'Predict', 'Evaluate'] as const
const SPECIES = ['setosa', 'versicolor', 'virginica']

interface Frame extends StepFrame {
  stage: number
  shown: number
}

function* program(): Generator<Frame, void, void> {
  yield { stage: -1, shown: 0, line: [1, 5], dwell: 1.2, note: 'The whole workflow fits in a dozen lines of scikit-learn. Watch the data move through it.' }
  for (let k = 10; k <= 150; k += 20) yield { stage: 0, shown: k, line: 7, dwell: k === 10 ? 1 : 0.35, note: '1 · Collect: 150 iris flowers, 4 measurements each, 3 species (only the two petal measurements are plotted).' }
  yield { stage: 1, shown: 150, line: [8, 9], dwell: 2.4, note: '2 · Split: hold back 20% (30 flowers, the rings) as a test set the model must never train on.' }
  yield { stage: 2, shown: 150, line: [10, 12], dwell: 2.6, note: '3 · Preprocess: standardize every feature to mean 0, std 1 — fit the scaler on the training set only, then apply it to both.' }
  yield { stage: 3, shown: 150, line: 13, dwell: 2.4, note: '4 · Train: logistic regression learns 3 × 4 weights + 3 intercepts from the 120 training flowers.' }
  yield { stage: 4, shown: 150, line: 14, dwell: 2.4, note: '5 · Predict: the trained model labels each of the 30 unseen test flowers (ring colour = prediction).' }
  yield { stage: 5, shown: 150, line: 15, dwell: 5, note: '6 · Evaluate: 29 of 30 correct → accuracy 0.9667. The one miss is a versicolor that sits right on the border with virginica.' }
}

export default function MlPipeline() {
  const player = usePlayer(program, [], { interval: 700, loop: 2400 })
  const fr = player.frame
  const testSet = useMemo(() => new Set(TEST), [])
  const correct = TEST.filter((i, k) => PRED[k] === IRIS[i][2]).length
  return (
    <LabFrame
      title="The machine learning workflow · iris species"
      status={fr.stage >= 0 ? STAGES[fr.stage].toLowerCase() : 'ready'}
      player={player}
      stage={
        <Stage aspect={0.6} min={300} max={480}>
          {(box) => <Board box={box} f={fr} testSet={testSet} />}
        </Stage>
      }
      legend={[...SPECIES.map((s, c) => ({ label: s, color: CLASS_COLORS[c] })), { label: 'test flower', color: 'var(--fg)', shape: 'ring' as const }]}
      code={{
        source: CODE,
        file: 'workflow.py',
        vars: [
          { name: 'X.shape', value: fr.shown ? '(150, 4)' : '—' },
          { name: 'X_train.shape', value: fr.stage >= 1 ? '(120, 4)' : '—' },
          { name: 'X_test.shape', value: fr.stage >= 1 ? '(30, 4)' : '—' },
          { name: 'model', value: fr.stage >= 3 ? 'fitted ✓' : '—', color: 'var(--accent)' },
          { name: 'accuracy', value: fr.stage >= 5 ? `${correct}/30 = 0.9667` : '—', color: 'var(--easy)' },
        ],
      }}
    />
  )
}

function Board({ box, f, testSet }: { box: Box; f: Frame; testSet: Set<number> }) {
  const trainIdx = IRIS.map((_, i) => i).filter((i) => !testSet.has(i))
  const mx = mean(trainIdx.map((i) => IRIS[i][0]))
  const my = mean(trainIdx.map((i) => IRIS[i][1]))
  const sx0 = Math.sqrt(mean(trainIdx.map((i) => (IRIS[i][0] - mx) ** 2)))
  const sy0 = Math.sqrt(mean(trainIdx.map((i) => (IRIS[i][1] - my) ** 2)))
  const scaled = f.stage >= 2
  const trackH = 58
  const fr = scaled
    ? frame2d({ width: box.width, height: box.height - trackH }, [-1.9, 1.9], [-1.7, 1.9], { l: 40, b: 30, t: 14, r: 16 })
    : frame2d({ width: box.width, height: box.height - trackH }, [0.5, 7.2], [-0.1, 2.7], { l: 40, b: 30, t: 14, r: 16 })
  const pos = (i: number) => {
    const [x, y] = IRIS[i]
    return scaled ? [fr.sx((x - mx) / sx0), fr.sy((y - my) / sy0)] : [fr.sx(x), fr.sy(y)]
  }
  const stepW = (box.width - 32) / STAGES.length
  return (
    <svg width={box.width} height={box.height} className="absolute inset-0" role="img" aria-label="Iris data moving through an ML pipeline">
      {/* pipeline track */}
      <line x1={16 + stepW / 2} x2={16 + stepW * (STAGES.length - 0.5)} y1={30} y2={30} strokeWidth={2} style={{ stroke: 'var(--border-strong)' }} />
      <motion.line
        x1={16 + stepW / 2}
        y1={30}
        y2={30}
        initial={false}
        animate={{ x2: 16 + stepW / 2 + stepW * Math.max(0, f.stage) }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        strokeWidth={2.5}
        style={{ stroke: 'var(--accent)', filter: 'drop-shadow(0 0 5px var(--accent))' }}
      />
      {STAGES.map((s, k) => {
        const on = k <= f.stage
        const cur = k === f.stage
        const cx = 16 + stepW * (k + 0.5)
        return (
          <g key={s}>
            {cur && <circle cx={cx} cy={30} r={14} style={{ fill: 'color-mix(in oklab, var(--accent) 22%, transparent)' }} className="animate-pulse" />}
            <circle cx={cx} cy={30} r={7} strokeWidth={2} style={{ fill: on ? 'var(--accent)' : 'var(--bg-elev)', stroke: on ? 'var(--accent)' : 'var(--border-strong)', transition: 'fill 0.4s, stroke 0.4s' }} />
            <text x={cx} y={54} textAnchor="middle" fontSize={box.width < 520 ? 9 : 11} style={{ fill: cur ? 'var(--fg)' : 'var(--fg-subtle)' }} className="font-mono">
              {box.width < 420 ? `${k + 1}` : s}
            </text>
          </g>
        )
      })}

      <g transform={`translate(0 ${trackH})`}>
        <Axes f={fr} xTicks={6} yTicks={4} xLabel={scaled ? 'petal length (standardized)' : 'petal length (cm)'} yLabel={scaled ? 'petal width (std.)' : 'petal width (cm)'} digits={scaled ? 1 : 0} />
        <AnimatePresence>
          {f.stage === 3 && (
            <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <rect x={fr.left + 12} y={fr.top + 6} width={210} height={52} rx={12} style={{ fill: 'color-mix(in oklab, var(--bg-elev) 90%, transparent)', stroke: 'var(--accent)' }} />
              <text x={fr.left + 26} y={fr.top + 27} fontSize={12} className="viz-text" fontWeight={600}>
                LogisticRegression ✓
              </text>
              <text x={fr.left + 26} y={fr.top + 45} fontSize={10.5} className="viz-muted">
                coef_ 3×4 + intercept_ 3 = 15 params
              </text>
            </motion.g>
          )}
        </AnimatePresence>
        {IRIS.map((row, i) => {
          if (i >= f.shown) return null
          const isTest = testSet.has(i)
          const k = TEST.indexOf(i)
          const [x, y] = pos(i)
          const showTest = f.stage >= 1 && isTest
          const predicted = f.stage >= 4 && isTest
          const wrong = f.stage >= 5 && isTest && PRED[k] !== row[2]
          const jitter = ((i * 37) % 11) - 5
          return (
            <motion.g key={i} initial={{ opacity: 0, x: x + jitter, y: -30 }} animate={{ opacity: 1, x: x + jitter * 0.6, y: y + (((i * 53) % 9) - 4) * 0.6 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 20) * 0.015 }}>
              {showTest ? (
                <>
                  <circle r={6.5} strokeWidth={2.4} style={{ fill: predicted ? CLASS_COLORS[PRED[k]] : 'var(--bg)', stroke: CLASS_COLORS[row[2]], transition: 'fill 0.5s' }} />
                  {wrong && <circle r={12} fill="none" strokeWidth={2.5} style={{ stroke: 'var(--hard)' }} className="animate-pulse" />}
                </>
              ) : (
                <circle r={4.2} style={{ fill: CLASS_COLORS[row[2]], opacity: f.stage >= 1 ? (f.stage === 3 ? 1 : 0.7) : 1 }} />
              )}
            </motion.g>
          )
        })}
      </g>
    </svg>
  )
}

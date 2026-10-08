import { useCallback, useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from './hooks'

/**
 * Algorithms are written as generators that `yield` a snapshot after every
 * interesting line. The player pulls snapshots on a timer, so the same code
 * drives play / pause / single-step / speed, and the code panel can highlight
 * the line that produced each frame.
 */
export interface StepFrame {
  /** 1-based code line(s) to highlight. */
  line?: number | number[]
  /** One-sentence narration of what this step does. */
  note?: string
  /** Relative time this frame stays on screen (default 1). */
  dwell?: number
}

export const SPEEDS = [0.5, 1, 2, 4] as const
export type Speed = (typeof SPEEDS)[number]

export interface PlayerOptions {
  /** Milliseconds per frame at 1× (before `dwell`). */
  interval?: number
  /** Restart automatically after finishing (value = pause in ms). */
  loop?: number | false
  autoplay?: boolean
}

export interface Player<F extends StepFrame> {
  frame: F
  step: number
  playing: boolean
  done: boolean
  speed: Speed
  setSpeed: (s: Speed) => void
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  reset: () => void
  /** Attach to the lab container so it pauses off-screen. */
  viewRef: React.RefObject<HTMLDivElement | null>
}

export function usePlayer<F extends StepFrame>(
  program: () => Generator<F, void, void>,
  deps: readonly unknown[],
  { interval = 650, loop = false, autoplay = true }: PlayerOptions = {},
): Player<F> {
  const reduced = useReducedMotion()
  const [viewRef, inView] = useInView<HTMLDivElement>()
  const programRef = useRef(program)
  programRef.current = program

  const genRef = useRef<Generator<F, void, void> | null>(null)
  const frameRef = useRef<F | null>(null)
  const stepRef = useRef(0)

  const start = () => {
    const gen = programRef.current()
    genRef.current = gen
    const first = gen.next()
    frameRef.current = first.done ? ({} as F) : first.value
    stepRef.current = 0
    return frameRef.current
  }

  const [frame, setFrame] = useState<F>(() => start())
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const startedRef = useRef(false)

  /** Advance one frame; returns false when the program has finished. */
  const advance = useCallback((): boolean => {
    const gen = genRef.current
    if (!gen) return false
    const r = gen.next()
    if (r.done) return false
    frameRef.current = r.value
    stepRef.current++
    return true
  }, [])

  const commit = useCallback(() => {
    if (frameRef.current) setFrame(frameRef.current)
    setStep(stepRef.current)
  }, [])

  const reset = useCallback(() => {
    start()
    setDone(false)
    commit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit])

  // Restart when inputs (dataset, hyper-parameters...) change.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Autoplay the first time the lab scrolls into view.
  useEffect(() => {
    if (inView && !startedRef.current) {
      startedRef.current = true
      if (autoplay && !reduced) setPlaying(true)
    }
  }, [inView, autoplay, reduced])

  // Main loop.
  useEffect(() => {
    if (!playing || !inView) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    let restartAt = 0
    const tick = (now: number) => {
      const dt = Math.min(100, now - last)
      last = now
      if (restartAt) {
        if (now >= restartAt) {
          restartAt = 0
          start()
          setDone(false)
          commit()
        }
        raf = requestAnimationFrame(tick)
        return
      }
      acc += dt * speed
      let changed = false
      let guard = 0
      while (guard++ < 400) {
        const need = interval * (frameRef.current?.dwell ?? 1)
        if (acc < need) break
        acc -= need
        if (!advance()) {
          if (changed) commit()
          if (loop !== false) {
            restartAt = now + loop
            setDone(true)
            raf = requestAnimationFrame(tick)
          } else {
            setDone(true)
            setPlaying(false)
          }
          return
        }
        changed = true
      }
      if (changed) commit()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, inView, speed, interval, loop, advance, commit])

  const play = useCallback(() => {
    if (done) reset()
    setPlaying(true)
  }, [done, reset])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play])
  const next = useCallback(() => {
    setPlaying(false)
    if (done) {
      reset()
      return
    }
    if (advance()) commit()
    else setDone(true)
  }, [advance, commit, done, reset])

  return { frame, step, playing, done, speed, setSpeed, play, pause, toggle, next, reset, viewRef }
}

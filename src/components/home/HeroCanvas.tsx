import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/utils'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hub: boolean
}

interface Packet {
  from: number
  to: number
  t: number
  hops: number
}

function readColors() {
  const s = getComputedStyle(document.documentElement)
  return {
    fg: s.getPropertyValue('--fg').trim() || '#fff',
    accent: s.getPropertyValue('--accent').trim() || '#8b7dff',
    accent2: s.getPropertyValue('--accent-2').trim() || '#22d3ee',
  }
}

/**
 * Ambient "graph constellation": drifting nodes connect when close, and small
 * packets hop node-to-node like a traversal. Tuned for low cost: capped DPR,
 * fewer nodes on small screens, paused when off-screen or the tab is hidden.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = prefersReducedMotion()
    let colors = readColors()
    let w = 0
    let h = 0
    let dpr = 1
    let nodes: Node[] = []
    let packets: Packet[] = []
    let linkDist = 140
    let raf = 0
    let running = false
    let visible = true
    const pointer = { x: -9999, y: -9999, active: false }

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      const mobile = w < 640
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      linkDist = mobile ? 105 : w < 1280 ? 130 : 150
      const count = Math.round(Math.min(64, Math.max(18, (w * h) / (mobile ? 19000 : 26000))))
      nodes = Array.from({ length: count }, () => {
        const speed = 0.12 + Math.random() * 0.18
        const angle = Math.random() * Math.PI * 2
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1.1 + Math.random() * 1.5,
          hub: Math.random() < 0.12,
        }
      })
      packets = []
    }

    const neighbors = (i: number) => {
      const a = nodes[i]
      const out: number[] = []
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        if (dx * dx + dy * dy < linkDist * linkDist) out.push(j)
      }
      return out
    }

    const spawnPacket = () => {
      if (packets.length >= (w < 640 ? 2 : 5) || nodes.length === 0) return
      const from = Math.floor(Math.random() * nodes.length)
      const ns = neighbors(from)
      if (ns.length === 0) return
      packets.push({ from, to: ns[Math.floor(Math.random() * ns.length)], t: 0, hops: 3 + Math.floor(Math.random() * 4) })
    }

    const draw = (animate: boolean) => {
      ctx.clearRect(0, 0, w, h)
      const ld2 = linkDist * linkDist

      if (animate) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < -20) n.x = w + 20
          else if (n.x > w + 20) n.x = -20
          if (n.y < -20) n.y = h + 20
          else if (n.y > h + 20) n.y = -20
          if (pointer.active) {
            const dx = pointer.x - n.x
            const dy = pointer.y - n.y
            const d2 = dx * dx + dy * dy
            if (d2 < 32000 && d2 > 1) {
              const f = 0.0009
              n.x += dx * f
              n.y += dy * f
            }
          }
        }
      }

      // Edges
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < ld2) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.22
            ctx.globalAlpha = alpha
            ctx.strokeStyle = colors.fg
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        if (pointer.active) {
          const dx = a.x - pointer.x
          const dy = a.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < 30000) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / 173) * 0.5
            ctx.strokeStyle = colors.accent
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(pointer.x, pointer.y)
            ctx.stroke()
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        ctx.globalAlpha = n.hub ? 0.95 : 0.55
        ctx.fillStyle = n.hub ? colors.accent : colors.fg
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.hub ? n.r + 1 : n.r, 0, Math.PI * 2)
        ctx.fill()
        if (n.hub) {
          ctx.globalAlpha = 0.25
          ctx.strokeStyle = colors.accent
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Packets hopping along edges (a tiny traversal)
      if (animate) {
        if (Math.random() < 0.035) spawnPacket()
        packets = packets.filter((p) => {
          p.t += 0.022
          if (p.t >= 1) {
            p.hops -= 1
            if (p.hops <= 0) return false
            const ns = neighbors(p.to).filter((j) => j !== p.from)
            if (ns.length === 0) return false
            p.from = p.to
            p.to = ns[Math.floor(Math.random() * ns.length)]
            p.t = 0
          }
          return true
        })
      }
      for (const p of packets) {
        const a = nodes[p.from]
        const b = nodes[p.to]
        const x = a.x + (b.x - a.x) * p.t
        const y = a.y + (b.y - a.y) * p.t
        ctx.globalAlpha = 0.45
        ctx.strokeStyle = colors.accent2
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.lineWidth = 1
        ctx.globalAlpha = 1
        ctx.fillStyle = colors.accent2
        ctx.beginPath()
        ctx.arc(x, y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const loop = () => {
      draw(true)
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || reduced || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    setup()
    draw(false)
    start()

    const ro = new ResizeObserver(() => {
      setup()
      draw(false)
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    const mo = new MutationObserver(() => {
      colors = readColors()
      if (!running) draw(false)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const parent = canvas.parentElement?.parentElement ?? canvas
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }
    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}

import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react"
import ReactDOM from "react-dom"
import styled, { ThemeContext } from "styled-components"
import { navigate } from "gatsby"
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from "d3-force"

/* ── Obsidian-style tag graph ────────────────────────────
   Nodes = posts + tags. Each post links to every tag it
   carries, so tags act as hubs and posts cluster around
   them. Rendered on a <canvas> with a hand-run d3-force
   simulation so the colours follow the theme exactly.

   SSR: d3-force is pure math (no window), but the canvas
   work all happens inside useEffect — mirrors Cursor.
   ──────────────────────────────────────────────────── */

const POST_R = 3
const TAG_MIN_R = 4.5
const TAG_MAX_R = 13
const ZOOM_MIN = 0.2
const ZOOM_MAX = 5
const DRAG_THRESHOLD = 4 // px before a press counts as a drag, not a click
const SETTLE_TICKS = 300

const tagRadius = count =>
  Math.max(TAG_MIN_R, Math.min(TAG_MAX_R, 4.5 + Math.sqrt(count) * 1.5))

/* Build the raw graph spec (no x/y — positions live on the
   per-instance working copies inside GraphCanvas). */
const buildGraph = (posts, tags) => {
  const tagSet = new Set(tags.map(t => t.fieldValue))
  const nodes = []

  tags.forEach(t =>
    nodes.push({
      id: `tag:${t.fieldValue}`,
      type: "tag",
      tag: t.fieldValue,
      label: t.fieldValue,
      count: t.totalCount,
      r: tagRadius(t.totalCount),
    })
  )

  posts.forEach(p => {
    const slug = p.fields.slug
    nodes.push({
      id: `post:${slug}`,
      type: "post",
      slug,
      label: p.frontmatter.title,
      r: POST_R,
    })
  })

  const links = []
  posts.forEach(p => {
    const postId = `post:${p.fields.slug}`
    const postTags = p.frontmatter.tags || []
    postTags.forEach(tag => {
      if (tagSet.has(tag)) {
        links.push({ source: postId, target: `tag:${tag}` })
      }
    })
  })

  return { nodes, links }
}

/* ── Canvas + simulation ─────────────────────────────────
   Imperative API (zoomIn/zoomOut/fit) is exposed via ref so
   the parent's control buttons can drive it.
   ──────────────────────────────────────────────────── */
const GraphCanvas = forwardRef(({ graphData, fullscreen }, ref) => {
  const theme = useContext(ThemeContext)
  const canvasRef = useRef(null)
  const colorsRef = useRef(theme.colors)
  const apiRef = useRef(null)

  // Keep the colours the draw loop reads in sync with the theme, and
  // repaint immediately on a light/dark toggle even when the sim is idle.
  colorsRef.current = theme.colors
  useEffect(() => {
    if (apiRef.current) apiRef.current.draw()
  }, [theme.name])

  useEffect(() => {
    if (typeof window === "undefined") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    // Per-instance working copy so the inline graph and the fullscreen
    // overlay never fight over the same node positions.
    const nodes = graphData.nodes.map(n => ({ ...n }))
    const links = graphData.links.map(l => ({ ...l }))
    const byId = new Map(nodes.map(n => [n.id, n]))

    // Adjacency for hover highlighting.
    const adj = new Map(nodes.map(n => [n.id, new Set()]))
    links.forEach(l => {
      adj.get(l.source)?.add(l.target)
      adj.get(l.target)?.add(l.source)
    })

    // Seed positions on a circle for a calm, repeatable layout.
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2
      const radius = 120 + (n.type === "post" ? 40 : 0)
      n.x = Math.cos(a) * radius
      n.y = Math.sin(a) * radius
    })

    const sim = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links)
          .id(d => d.id)
          .distance(l => (l.target.type === "tag" ? 26 : 30))
          .strength(0.45)
      )
      .force("charge", forceManyBody().strength(-55))
      .force("center", forceCenter(0, 0))
      .force(
        "collide",
        forceCollide().radius(d => d.r + 3)
      )
      .force("x", forceX(0).strength(0.04))
      .force("y", forceY(0).strength(0.04))
      .stop()

    const view = { zoom: 1, panX: 0, panY: 0 }
    const size = { w: 0, h: 0, dpr: 1 }
    let hoverId = null
    let settled = false
    let rafId = null

    const project = n => ({
      x: size.w / 2 + view.panX + n.x * view.zoom,
      y: size.h / 2 + view.panY + n.y * view.zoom,
    })

    // Cursor (screen) → simulation coordinates.
    const unproject = (sx, sy) => ({
      x: (sx - size.w / 2 - view.panX) / view.zoom,
      y: (sy - size.h / 2 - view.panY) / view.zoom,
    })

    const fitView = () => {
      if (!nodes.length || !size.w || !size.h) return
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      nodes.forEach(n => {
        minX = Math.min(minX, n.x)
        minY = Math.min(minY, n.y)
        maxX = Math.max(maxX, n.x)
        maxY = Math.max(maxY, n.y)
      })
      const gw = Math.max(1, maxX - minX)
      const gh = Math.max(1, maxY - minY)
      const pad = fullscreen ? 80 : 28
      const z = Math.min(
        (size.w - pad * 2) / gw,
        (size.h - pad * 2) / gh
      )
      view.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
      view.panX = -((minX + maxX) / 2) * view.zoom
      view.panY = -((minY + maxY) / 2) * view.zoom
    }

    const draw = () => {
      const c = colorsRef.current
      const dpr = size.dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.w, size.h)

      const neighbors = hoverId ? adj.get(hoverId) : null
      const isLit = id =>
        !hoverId || id === hoverId || (neighbors && neighbors.has(id))

      // ── Edges — faint hairlines in the divider grey. Only the hovered
      //    node's own edges lift to accent; the rest recede. ──
      ctx.lineCap = "round"
      ctx.lineWidth = 1
      links.forEach(l => {
        const s = byId.get(l.source.id || l.source)
        const t = byId.get(l.target.id || l.target)
        if (!s || !t) return
        const ps = project(s)
        const pt = project(t)
        const lit =
          !hoverId || l.source.id === hoverId || l.target.id === hoverId
        if (hoverId && lit) {
          ctx.strokeStyle = c.accent
          ctx.globalAlpha = 0.4
        } else {
          ctx.strokeStyle = c.border
          ctx.globalAlpha = hoverId ? 0.06 : 0.4
        }
        ctx.beginPath()
        ctx.moveTo(ps.x, ps.y)
        ctx.lineTo(pt.x, pt.y)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // ── Nodes — a quiet monochrome constellation. Tags vs posts are told
      //    apart by size alone (like Obsidian), all in the same muted grey;
      //    the single accent colour only appears on the hovered node. Each
      //    node is punched out of the edge layer for a clean overlap. ──
      nodes.forEach(n => {
        const p = project(n)
        const r = Math.max(2, n.r * view.zoom)
        const lit = isLit(n.id)
        const focused = n.id === hoverId
        ctx.globalAlpha = lit ? 1 : 0.3

        ctx.beginPath()
        ctx.arc(p.x, p.y, r + 1.5, 0, Math.PI * 2)
        ctx.fillStyle = c.bodyBackground
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = focused ? c.accent : c.tertiaryText
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // ── Labels — readable, never piled up. Candidates are placed greedily
      //    biggest-first and any that would overlap an already-placed label
      //    are skipped, so zooming out shows just a few hubs and zooming in
      //    reveals more as nodes spread apart. Each is drawn with a thick
      //    background outline for crisp contrast over edges/nodes. ──
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.lineJoin = "round"

      const neighborSet = hoverId ? adj.get(hoverId) : null
      const candidates = nodes
        .filter(n =>
          hoverId
            ? n.id === hoverId || (neighborSet && neighborSet.has(n.id))
            : n.type === "tag"
        )
        .sort((a, b) => {
          if (a.id === hoverId) return -1
          if (b.id === hoverId) return 1
          return b.r - a.r
        })

      const placed = []
      const overlaps = (x, y, w, h) =>
        placed.some(
          q => x < q.x + q.w && x + w > q.x && y < q.y + q.h && y + h > q.y
        )

      candidates.forEach(n => {
        const p = project(n)
        if (p.x < 0 || p.x > size.w || p.y < 0 || p.y > size.h) return
        const r = Math.max(2, n.r * view.zoom)
        const focused = n.id === hoverId
        const fontSize = n.type === "tag" || focused ? 12 : 11
        ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`
        const text =
          n.label.length > 24 ? `${n.label.slice(0, 23)}…` : n.label
        const w = ctx.measureText(text).width
        const x = p.x - w / 2
        const y = p.y + r + 5
        const box = { x: x - 3, y: y - 2, w: w + 6, h: fontSize + 4 }
        if (overlaps(box.x, box.y, box.w, box.h)) return
        placed.push(box)

        ctx.lineWidth = 3
        ctx.strokeStyle = c.bodyBackground
        ctx.strokeText(text, p.x, y)
        ctx.fillStyle = focused ? c.text : c.secondaryText
        ctx.fillText(text, p.x, y)
      })
      ctx.globalAlpha = 1
    }

    const startRAF = () => {
      if (rafId != null) return
      const loop = () => {
        sim.tick()
        draw()
        if (sim.alpha() < sim.alphaMin()) {
          rafId = null
          return
        }
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return // hidden (mobile) — stay idle
      const dpr = window.devicePixelRatio || 1
      size.w = rect.width
      size.h = rect.height
      size.dpr = dpr
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)

      if (!settled) {
        for (let i = 0; i < SETTLE_TICKS; i++) sim.tick()
        settled = true
        fitView()
      } else {
        fitView()
      }
      draw()
    }

    // ── Pointer interaction ──
    const pointer = { down: false, moved: false, mode: null, dragNode: null }

    const nodeAt = (sx, sy) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const p = project(n)
        const r = Math.max(2, n.r * view.zoom) + 4
        if ((p.x - sx) ** 2 + (p.y - sy) ** 2 <= r * r) return n
      }
      return null
    }

    const localPoint = e => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMove = e => {
      const { x, y } = localPoint(e)
      if (pointer.down) {
        if (
          Math.abs(x - pointer.startX) > DRAG_THRESHOLD ||
          Math.abs(y - pointer.startY) > DRAG_THRESHOLD
        ) {
          pointer.moved = true
        }
        if (pointer.mode === "node" && pointer.dragNode) {
          const simPt = unproject(x, y)
          pointer.dragNode.fx = simPt.x
          pointer.dragNode.fy = simPt.y
          startRAF()
        } else if (pointer.mode === "pan") {
          view.panX += x - pointer.lastX
          view.panY += y - pointer.lastY
          pointer.lastX = x
          pointer.lastY = y
          draw()
        }
      } else {
        const n = nodeAt(x, y)
        const id = n ? n.id : null
        canvas.style.cursor = n ? "pointer" : "grab"
        if (id !== hoverId) {
          hoverId = id
          draw()
        }
      }
    }

    const onDown = e => {
      const { x, y } = localPoint(e)
      pointer.down = true
      pointer.moved = false
      pointer.startX = x
      pointer.startY = y
      pointer.lastX = x
      pointer.lastY = y
      const n = nodeAt(x, y)
      if (n) {
        pointer.mode = "node"
        pointer.dragNode = n
        n.fx = n.x
        n.fy = n.y
        sim.alphaTarget(0.3).restart()
        startRAF()
      } else {
        pointer.mode = "pan"
        canvas.style.cursor = "grabbing"
      }
    }

    const onUp = e => {
      if (!pointer.down) return
      const { x, y } = localPoint(e)
      if (!pointer.moved) {
        const n = nodeAt(x, y)
        if (n) {
          if (n.type === "post") navigate(n.slug)
          else navigate(`/posts?q=${n.tag}`)
        }
      }
      if (pointer.dragNode) {
        pointer.dragNode.fx = null
        pointer.dragNode.fy = null
      }
      sim.alphaTarget(0)
      pointer.down = false
      pointer.mode = null
      pointer.dragNode = null
      canvas.style.cursor = "grab"
    }

    const onLeave = () => {
      if (hoverId) {
        hoverId = null
        draw()
      }
    }

    const zoomAt = (cx, cy, factor) => {
      const before = unproject(cx, cy)
      view.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, view.zoom * factor))
      view.panX = cx - size.w / 2 - before.x * view.zoom
      view.panY = cy - size.h / 2 - before.y * view.zoom
      draw()
    }

    const onWheel = e => {
      if (!fullscreen) return // inline uses the +/- buttons (no scroll-jack)
      e.preventDefault()
      const { x, y } = localPoint(e)
      zoomAt(x, y, e.deltaY < 0 ? 1.12 : 1 / 1.12)
    }

    canvas.addEventListener("mousemove", onMove)
    canvas.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)
    canvas.addEventListener("mouseleave", onLeave)
    canvas.addEventListener("wheel", onWheel, { passive: false })

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // Expose imperative controls to the parent.
    apiRef.current = {
      draw,
      zoomIn: () => zoomAt(size.w / 2, size.h / 2, 1.25),
      zoomOut: () => zoomAt(size.w / 2, size.h / 2, 1 / 1.25),
      fit: () => {
        fitView()
        draw()
      },
    }

    return () => {
      canvas.removeEventListener("mousemove", onMove)
      canvas.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      canvas.removeEventListener("mouseleave", onLeave)
      canvas.removeEventListener("wheel", onWheel)
      ro.disconnect()
      if (rafId != null) cancelAnimationFrame(rafId)
      sim.stop()
      apiRef.current = null
    }
  }, [graphData, fullscreen])

  useImperativeHandle(ref, () => ({
    zoomIn: () => apiRef.current?.zoomIn(),
    zoomOut: () => apiRef.current?.zoomOut(),
    fit: () => apiRef.current?.fit(),
  }))

  return <Canvas ref={canvasRef} />
})

GraphCanvas.displayName = "GraphCanvas"

/* ── Public component ────────────────────────────────────
   Label + inline canvas in the sidebar, plus a fullscreen
   overlay for proper zooming.
   ──────────────────────────────────────────────────── */
const TagGraph = ({ posts, tags }) => {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const inlineRef = useRef(null)
  const fsRef = useRef(null)

  useEffect(() => setMounted(true), [])

  const graphData = useMemo(() => buildGraph(posts, tags), [posts, tags])

  // Esc closes the fullscreen overlay; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const overlay =
    open && mounted && typeof document !== "undefined"
      ? ReactDOM.createPortal(
          <Overlay onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
            <OverlayCanvasWrap>
              <GraphCanvas ref={fsRef} graphData={graphData} fullscreen />
              <Controls>
                <CtrlButton onClick={() => fsRef.current?.zoomIn()} aria-label="zoom in">
                  +
                </CtrlButton>
                <CtrlButton onClick={() => fsRef.current?.zoomOut()} aria-label="zoom out">
                  −
                </CtrlButton>
                <CtrlButton onClick={() => fsRef.current?.fit()} aria-label="fit">
                  ⤢
                </CtrlButton>
                <CtrlButton onClick={() => setOpen(false)} aria-label="close">
                  ✕
                </CtrlButton>
              </Controls>
              <OverlayHint>scroll to zoom · drag to pan · click a node to open</OverlayHint>
            </OverlayCanvasWrap>
          </Overlay>,
          document.body
        )
      : null

  return (
    <Wrap>
      <GraphLabel>/ graph</GraphLabel>
      <InlineWrap>
        {mounted && <GraphCanvas ref={inlineRef} graphData={graphData} />}
        <Controls>
          <CtrlButton onClick={() => inlineRef.current?.zoomIn()} aria-label="zoom in">
            +
          </CtrlButton>
          <CtrlButton onClick={() => inlineRef.current?.zoomOut()} aria-label="zoom out">
            −
          </CtrlButton>
          <CtrlButton onClick={() => setOpen(true)} aria-label="expand">
            ⤢
          </CtrlButton>
        </Controls>
      </InlineWrap>
      {overlay}
    </Wrap>
  )
}

export default TagGraph

/* ── styles ── */

const Wrap = styled.div`
  margin-top: ${props => props.theme.space[6]};

  /* Interaction-heavy + cramped on phones — keep the tag chips above
     as the mobile affordance and hide the canvas. */
  @media (max-width: ${props => props.theme.bp.md}) {
    display: none;
  }
`

const GraphLabel = styled.p`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
`

const InlineWrap = styled.div`
  position: relative;
  width: 100%;
  height: 260px;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.lg};
  background: ${props => props.theme.colors.bodyBackground};
  overflow: hidden;
`

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`

const Controls = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
`

const CtrlButton = styled.button`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.colors.bodyBackground};
  color: ${props => props.theme.colors.secondaryText};
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.md};
  line-height: 1;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.accent};
    border-color: ${props => props.theme.colors.accent};
  }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: ${props => props.theme.colors.bodyBackground}f2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.space[6]};
`

const OverlayCanvasWrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1100px;
`

const OverlayHint = styled.p`
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  pointer-events: none;
`

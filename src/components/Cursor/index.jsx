import React, { useEffect, useRef } from "react"
import styled, { createGlobalStyle } from "styled-components"

/* ── Custom cursor: magnetic (PC only) ───────────────────
   A dot tracks the pointer exactly; a ring trails behind. Over small
   interactive elements (links, buttons, chips, TOC items) the ring
   "snaps" — morphing to wrap the element's box. Position, size and
   corner radius are eased together in one rAF loop, so the morph reads
   as a single fluid shape. Mark the *visual* hover element with
   `data-magnetic` when a wrapping <Link> would give the wrong box.
   Mouse-only devices; touch/mobile keep the native cursor. Colour =
   theme accent.
   ──────────────────────────────────────────────────── */

const RING = 30 // idle ring diameter (px)
const MINI = 10 // shrunken idle ring over [data-cursor-mini] elements (px)
const DOT = 6 // dot diameter (px)
const PAD = 6 // extra padding around a snapped element (px)
const ROW_PAD_X = 28 // wider horizontal padding for list rows (wide & short)
const EASE = 0.2 // follow / snap speed (0–1, higher = snappier)
const MAG_MAX_W = 1200 // snap to elements up to this width…
const MAG_MAX_H = 600 // …and height (cards & rows included; guards against
//                       accidentally wrapping a full-page element)

// Hide the native cursor only on devices that actually have a mouse.
const HideNativeCursor = createGlobalStyle`
  @media (pointer: fine) {
    *,
    *::before,
    *::after {
      cursor: none !important;
    }
  }
`

const Ring = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${RING}px;
  height: ${RING}px;
  border: 1.5px solid ${props => props.theme.colors.accent};
  border-radius: ${RING / 2}px;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  transition: opacity 0.25s ease;
  will-change: transform, width, height;
`

const Dot = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${DOT}px;
  height: ${DOT}px;
  background: ${props => props.theme.colors.accent};
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  transition: opacity 0.2s ease;
  will-change: transform;
`

// Visual hover element preferred via [data-magnetic]; otherwise these tags.
const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, [data-clickable]'

const Cursor = () => {
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const mouse = useRef({ x: -100, y: -100 })
  // r* = the four corner radii (TL, TR, BR, BL), eased independently so the
  // ring can match elements with asymmetric corners (e.g. end cards in a
  // joined grid that round only their outer side).
  const cur = useRef({
    x: -100,
    y: -100,
    w: RING,
    h: RING,
    rtl: RING / 2,
    rtr: RING / 2,
    rbr: RING / 2,
    rbl: RING / 2,
  })
  const target = useRef(null) // element currently snapped onto
  const mini = useRef(false) // pointer is over a [data-cursor-mini] zone
  const rafRef = useRef(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    // PC only — bail out on touch / coarse-pointer devices.
    if (!window.matchMedia("(pointer: fine)").matches) return

    const ringEl = ringRef.current
    const dotEl = dotRef.current

    const hide = () => {
      if (dotEl) dotEl.style.opacity = "0"
      if (ringEl) ringEl.style.opacity = "0"
    }

    // True when the last known pointer position is over any iframe (Giscus).
    const overIframe = () => {
      const frames = document.getElementsByTagName("iframe")
      const { x, y } = mouse.current
      for (let i = 0; i < frames.length; i++) {
        const r = frames[i].getBoundingClientRect()
        if (
          r.width &&
          r.height &&
          x >= r.left - RING &&
          x <= r.right + RING &&
          y >= r.top - RING &&
          y <= r.bottom + RING
        ) {
          return true
        }
      }
      return false
    }

    const move = e => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      // Hide over the comments wrapper / any iframe (see Cursor history).
      const inComments = e.target.closest && e.target.closest("[data-comments]")
      if (inComments || overIframe()) {
        hide()
        target.current = null
        return
      }

      // Dot tracks the pointer exactly.
      if (dotEl) {
        dotEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
      }

      // Prefer the element explicitly marked as the magnetic target (its box
      // matches the visible hover area); else the nearest interactive element.
      let snap = null
      // [data-no-magnetic] opts an element out of the snap (keeps the plain
      // dot+ring), e.g. the header logo whose own hover effect owns the visual.
      const optedOut = e.target.closest && e.target.closest("[data-no-magnetic]")
      const el =
        e.target.closest &&
        (e.target.closest("[data-magnetic]") || e.target.closest(INTERACTIVE))
      if (el && !optedOut) {
        const r = el.getBoundingClientRect()
        if (r.width <= MAG_MAX_W && r.height <= MAG_MAX_H) snap = el
      }
      target.current = snap
      // Shrink the idle ring over opted-in zones (e.g. the logo) so the
      // element's own hover effect stays legible.
      mini.current = !!(e.target.closest && e.target.closest("[data-cursor-mini]"))

      if (ringEl) ringEl.style.opacity = "1"
      // Hide the dot while wrapped so it reads as a single shape.
      if (dotEl) dotEl.style.opacity = snap ? "0" : "1"
    }

    // Leaving page content to a cross-origin iframe / out of the window.
    const out = e => {
      if (!e.relatedTarget || e.relatedTarget.tagName === "IFRAME") hide()
    }

    const loop = () => {
      if (ringEl) {
        const snap = target.current
        let dx, dy, dw, dh, drtl, drtr, drbr, drbl
        if (snap && document.contains(snap)) {
          // Destination = the element's box (centre, size, per-corner radius).
          const r = snap.getBoundingClientRect()
          // Wide, short elements (list rows) get extra horizontal breathing room.
          const padX = r.width >= 480 && r.height <= 100 ? ROW_PAD_X : PAD
          dx = r.left + r.width / 2
          dy = r.top + r.height / 2
          dw = r.width + padX
          dh = r.height + PAD
          // Read each corner separately — end cards round only their outer side,
          // so a single radius would bulge the square corners (or square the
          // rounded ones). PAD/2 keeps the ring concentric with the box.
          const cs = getComputedStyle(snap)
          const pr = PAD / 2
          drtl = (parseFloat(cs.borderTopLeftRadius) || 0) + pr
          drtr = (parseFloat(cs.borderTopRightRadius) || 0) + pr
          drbr = (parseFloat(cs.borderBottomRightRadius) || 0) + pr
          drbl = (parseFloat(cs.borderBottomLeftRadius) || 0) + pr
        } else {
          // Destination = a circle at the pointer (shrunken over mini zones).
          const size = mini.current ? MINI : RING
          dx = mouse.current.x
          dy = mouse.current.y
          dw = size
          dh = size
          drtl = drtr = drbr = drbl = size / 2
        }
        // Ease position, size and each corner radius together for one fluid morph.
        const c = cur.current
        c.x += (dx - c.x) * EASE
        c.y += (dy - c.y) * EASE
        c.w += (dw - c.w) * EASE
        c.h += (dh - c.h) * EASE
        c.rtl += (drtl - c.rtl) * EASE
        c.rtr += (drtr - c.rtr) * EASE
        c.rbr += (drbr - c.rbr) * EASE
        c.rbl += (drbl - c.rbl) * EASE
        ringEl.style.width = `${c.w}px`
        ringEl.style.height = `${c.h}px`
        ringEl.style.borderRadius = `${c.rtl}px ${c.rtr}px ${c.rbr}px ${c.rbl}px`
        ringEl.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) translate(-50%, -50%)`
      }
      if (overIframe()) hide()
      rafRef.current = requestAnimationFrame(loop)
    }

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseout", out)
    document.documentElement.addEventListener("mouseleave", hide)
    document.documentElement.addEventListener("mouseenter", move)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseout", out)
      document.documentElement.removeEventListener("mouseleave", hide)
      document.documentElement.removeEventListener("mouseenter", move)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <HideNativeCursor />
      <Ring ref={ringRef} aria-hidden="true" />
      <Dot ref={dotRef} aria-hidden="true" />
    </>
  )
}

export default Cursor

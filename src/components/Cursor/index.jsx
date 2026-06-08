import React, { useEffect, useRef } from "react"
import styled, { createGlobalStyle } from "styled-components"

/* ── Custom cursor (PC only) ─────────────────────────────
   A small dot that tracks the pointer exactly + a ring that
   trails behind with easing. Only enabled on fine-pointer
   (mouse) devices; touch/mobile keep the native cursor.
   Colour follows the theme accent; tweak the sizes below.
   ──────────────────────────────────────────────────── */

const RING = 34 // ring diameter (px)
const RING_ACTIVE = 60 // ring diameter over links/buttons
const DOT = 6 // dot diameter (px)
const EASE = 0.38 // ring follow speed (0–1, higher = snappier)

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
  margin: ${-RING / 2}px 0 0 ${-RING / 2}px;
  border: 1.5px solid ${props => props.theme.colors.accent};
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  transition: opacity 0.25s ease, width 0.2s ease, height 0.2s ease,
    margin 0.2s ease, background 0.2s ease, border-width 0.2s ease;
  will-change: transform;

  &.is-active {
    width: ${RING_ACTIVE}px;
    height: ${RING_ACTIVE}px;
    margin: ${-RING_ACTIVE / 2}px 0 0 ${-RING_ACTIVE / 2}px;
    border-width: 2px;
    background: ${props => props.theme.colors.accent}14;
  }
`

const Dot = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${DOT}px;
  height: ${DOT}px;
  margin: ${-DOT / 2}px 0 0 ${-DOT / 2}px;
  background: ${props => props.theme.colors.accent};
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  opacity: 0;
  transition: opacity 0.25s ease;
  will-change: transform;
`

const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, [data-clickable]'

const Cursor = () => {
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const mouse = useRef({ x: -100, y: -100 })
  const pos = useRef({ x: -100, y: -100 })
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

    // Whether the last known pointer position is inside any iframe's box.
    // We test geometry rather than events because — depending on browser /
    // iframe — a cross-origin frame (Giscus) may OR may not deliver mousemove
    // to us. If it does, `move` would otherwise re-show the cursor on every
    // event; if it doesn't, the position simply freezes at the edge. Either way
    // this check is the source of truth. The margin absorbs the gap between
    // mousemove samples and stops the ring (radius ~RING/2) overlapping the edge.
    const TOL = RING
    const overIframe = () => {
      const frames = document.getElementsByTagName("iframe")
      const { x, y } = mouse.current
      for (let i = 0; i < frames.length; i++) {
        const r = frames[i].getBoundingClientRect()
        if (
          r.width &&
          r.height &&
          x >= r.left - TOL &&
          x <= r.right + TOL &&
          y >= r.top - TOL &&
          y <= r.bottom + TOL
        ) {
          return true
        }
      }
      return false
    }

    const move = e => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      // Inside the comments wrapper (which contains the Giscus iframe) or
      // directly over any iframe: keep the custom cursor hidden and bail out,
      // so we never re-show it there on mousemove. The wrapper check is the
      // reliable one — the pointer always passes through it before reaching the
      // iframe, where mousemove events stop reaching us.
      const inComments = e.target.closest && e.target.closest("[data-comments]")
      if (inComments || overIframe()) {
        hide()
        return
      }
      if (dotEl) {
        dotEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
        dotEl.style.opacity = "1"
      }
      if (ringEl) {
        ringEl.style.opacity = "1"
        const interactive = e.target.closest && e.target.closest(INTERACTIVE)
        ringEl.classList.toggle("is-active", !!interactive)
      }
    }

    // Leaving the page content to a cross-origin iframe (or out of the window)
    // fires mouseout with a null relatedTarget — catches fast jumps into Giscus.
    const out = e => {
      if (!e.relatedTarget || e.relatedTarget.tagName === "IFRAME") hide()
    }

    const loop = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * EASE
      pos.current.y += (mouse.current.y - pos.current.y) * EASE
      if (ringEl) {
        ringEl.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`
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

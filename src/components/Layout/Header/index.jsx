import React, { useEffect, useState, useRef } from "react"
import styled, { useTheme } from "styled-components"
import { Link } from "gatsby"
import { useLocation } from "@reach/router"
import { title } from "../../../../gatsby-meta-config"
import { FaSun, FaMoon } from "react-icons/fa"
import { chipHover } from "assets/theme/mixins"

const HeaderWrapper = styled.header`
  display: block;
  position: fixed;
  top: ${props => (props.isHidden ? -64 : 0)}px;
  left: 0;
  right: 0;
  height: 60px;
  background-color: ${props => props.theme.colors.headerBackground};
  box-shadow: ${props => props.theme.shadow.hairline}
    ${props => props.theme.colors.divider};
  backdrop-filter: blur(8px);
  opacity: ${props => (props.isHidden ? 0 : 1)};
  transition: top ${props => props.theme.transition.slow},
    opacity ${props => props.theme.transition.slow};
  z-index: 999;
`

const Inner = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 100%;
  max-width: ${props => props.theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 ${props => props.theme.space[8]};

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: 0 ${props => props.theme.space[5]};
  }

  @media (max-width: ${props => props.theme.bp.xs}) {
    padding: 0 14px;
  }
`

const BlogTitle = styled.span`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: ${props => props.theme.font.body};
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.text};
  justify-self: start;

  & > a {
    text-decoration: none;
    color: inherit;
    display: inline-flex;
  }
`

/* Each glyph is its own inline-block so it can be nudged independently. The
   transition gives the pull a slight trailing ease (and a smooth snap back). */
const Char = styled.span`
  display: inline-block;
  white-space: pre;
  transition: transform 0.18s ease-out;
  will-change: transform;
`

/* ── Magnetic logo ──────────────────────────────────────
   On pointer move each letter is nudged toward the cursor, the pull scaling
   with proximity (none past RADIUS). Transforms are written straight to the
   DOM — no per-move re-render — and reset on leave. Skipped for reduced-motion. */
const RADIUS = 70 // px: influence radius around each glyph's centre
const MAX_PULL = 5 // px: strongest displacement when the cursor is on a glyph

const MagneticLogo = ({ text }) => {
  const refs = useRef([])
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const handleMove = e => {
    if (reduced.current) return
    refs.current.forEach(el => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy) || 1
      if (dist < RADIUS) {
        const f = (1 - dist / RADIUS) * MAX_PULL
        el.style.transform = `translate(${(dx / dist) * f}px, ${(dy / dist) * f}px)`
      } else {
        el.style.transform = "translate(0, 0)"
      }
    })
  }

  const reset = () => {
    refs.current.forEach(el => {
      if (el) el.style.transform = "translate(0, 0)"
    })
  }

  return (
    <span onMouseMove={handleMove} onMouseLeave={reset}>
      {text.split("").map((ch, i) => (
        <Char key={i} aria-hidden="true" ref={el => (refs.current[i] = el)}>
          {ch}
        </Char>
      ))}
    </span>
  )
}

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
`

const NavLink = styled.span.attrs({ "data-magnetic": true })`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.font.md};
  font-weight: ${props => (props.active ? "600" : "500")};
  color: ${props =>
    props.active
      ? props.theme.colors.accentText
      : props.theme.colors.tertiaryText};
  background-color: ${props =>
    props.active ? props.theme.colors.accentBg : "transparent"};
  cursor: pointer;
  ${chipHover}

  @media (max-width: ${props => props.theme.bp.xs}) {
    padding: 6px 6px;
    font-size: ${props => props.theme.font.sm};
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  background: transparent;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }

  & svg {
    width: 16px;
    height: 16px;
  }

  & svg path {
    fill: ${props => props.theme.colors.icon};
    transition: fill 0.2s;
  }

  &:hover svg path {
    fill: ${props => props.theme.colors.text};
  }
`

const ToggleWrapper = styled.div`
  width: 16px;
  height: 20px;
  overflow: hidden;
`

const IconRail = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 36px;
  position: relative;
  top: ${props => (props.theme === "light" ? "-17px" : "0px")};
  transition: top 0.4s;

  & > svg {
    width: 16px !important;
    height: 16px !important;
    transition: opacity 0.25s;
  }

  & > svg:first-child {
    opacity: ${props => (props.theme === "light" ? 0 : 1)};
  }

  & > svg:last-child {
    opacity: ${props => (props.theme === "dark" ? 0 : 1)};
  }
`

const Header = ({ toggleTheme }) => {
  const theme = useTheme()
  const location = useLocation()
  const [scrollY, setScrollY] = useState(0)
  const [hidden, setHidden] = useState(false)

  const isActive = path => {
    if (path === "/") return location.pathname === "/"
    return location.pathname.startsWith(path)
  }

  const detectScrollDirection = () => {
    if (scrollY >= window.scrollY) {
      setHidden(false)
    } else if (scrollY < window.scrollY && 400 <= window.scrollY) {
      setHidden(true)
    }
    setScrollY(window.scrollY)
  }

  useEffect(() => {
    window.addEventListener("scroll", detectScrollDirection)
    return () => window.removeEventListener("scroll", detectScrollDirection)
  }, [scrollY])

  useEffect(() => {
    setScrollY(window.scrollY)
  }, [])

  return (
    <HeaderWrapper isHidden={hidden}>
      <Inner>
        <BlogTitle>
          <Link to="/" aria-label={title} data-no-magnetic data-cursor-mini>
            <MagneticLogo text={title} />
          </Link>
        </BlogTitle>

        <NavLinks>
          <Link to="/posts" style={{ textDecoration: "none" }}>
            <NavLink active={isActive("/posts")}>Posts</NavLink>
          </Link>
          <Link to="/series" style={{ textDecoration: "none" }}>
            <NavLink active={isActive("/series")}>Series</NavLink>
          </Link>
          <Link to="/about" style={{ textDecoration: "none" }}>
            <NavLink active={isActive("/about")}>About</NavLink>
          </Link>
        </NavLinks>

        <Actions>
          <IconButton onClick={toggleTheme}>
            <ToggleWrapper>
              <IconRail theme={theme.name}>
                <FaSun />
                <FaMoon />
              </IconRail>
            </ToggleWrapper>
          </IconButton>
        </Actions>
      </Inner>
    </HeaderWrapper>
  )
}

export default Header

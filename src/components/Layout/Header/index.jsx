import React, { useEffect, useState } from "react"
import styled, { useTheme } from "styled-components"
import { Link } from "gatsby"
import { useLocation } from "@reach/router"
import { title } from "../../../../gatsby-meta-config"
import { FaSun, FaMoon, FaSearch } from "react-icons/fa"

const HeaderWrapper = styled.header`
  display: block;
  position: fixed;
  top: ${props => (props.isHidden ? -64 : 0)}px;
  left: 0;
  right: 0;
  padding: 0 32px;
  height: 60px;
  background-color: ${props => props.theme.colors.headerBackground};
  box-shadow: 0 1px 0 ${props => props.theme.colors.divider};
  backdrop-filter: blur(8px);
  opacity: ${props => (props.isHidden ? 0 : 1)};
  transition: top 0.4s, opacity 0.4s;
  z-index: 999;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const Inner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
`

const BlogTitle = styled.span`
  letter-spacing: -0.5px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: ${props => props.theme.colors.text};
  flex-shrink: 0;

  & > a {
    text-decoration: none;
    color: inherit;
  }
`

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 32px;

  @media (max-width: 480px) {
    margin-left: 12px;
    gap: 0;
  }
`

const NavLink = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${props => (props.active ? "600" : "500")};
  color: ${props =>
    props.active
      ? props.theme.colors.accentText
      : props.theme.colors.tertiaryText};
  background-color: ${props =>
    props.active ? props.theme.colors.accentBg : "transparent"};
  transition: all 0.18s;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.accentBg};
    color: ${props => props.theme.colors.accentText};
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 13px;
  }
`

const NavLeft = styled.div`
  display: flex;
  align-items: center;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.18s;

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
        <NavLeft>
          <BlogTitle>
            <Link to="/">{title}</Link>
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
        </NavLeft>

        <Actions>
          <IconButton onClick={toggleTheme}>
            <ToggleWrapper>
              <IconRail theme={theme.name}>
                <FaSun />
                <FaMoon />
              </IconRail>
            </ToggleWrapper>
          </IconButton>
          <Link to="/search" style={{ textDecoration: "none" }}>
            <IconButton as="div">
              <FaSearch />
            </IconButton>
          </Link>
        </Actions>
      </Inner>
    </HeaderWrapper>
  )
}

export default Header

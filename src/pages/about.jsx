import React, { useState, useEffect, useRef } from "react"
import { graphql } from "gatsby"
import styled, { keyframes } from "styled-components"

import Layout from "components/Layout"
import SEO from "components/SEO"
import Info from "components/Info"

import NotFoundPage from "pages/404"

import { title, description, siteUrl, useAbout } from "../../gatsby-meta-config"

/* ── About layout ────────────────────────────────────────
   .about-layout: grid 1fr 200px, gap 56px, padding 56px 0 72px
   ──────────────────────────────────────────────────── */

const AboutLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 56px;
  align-items: start;
  padding: 56px 0 72px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px 0 56px;
  }
`

const AboutBodyWrap = styled.div`
  min-width: 0;
`

/* ── Article body ────────────────────────────────────────
   Matches .about-body styles from style.css
   ──────────────────────────────────────────────────── */

const AboutBody = styled.article`
  font-size: 16px;
  line-height: 1.75;
  color: ${props => props.theme.colors.secondaryText};
  word-break: keep-all;

  h2 {
    font-family: "Noto Sans KR", sans-serif;
    font-size: 22px;
    font-weight: 700;
    margin-top: 44px;
    margin-bottom: 14px;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.02em;
  }

  h2:first-child {
    margin-top: 0;
  }

  p {
    margin-bottom: 16px;
    word-break: keep-all;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
    padding-left: 0;
    list-style: none;
  }

  ul li {
    padding-left: 20px;
    position: relative;
    font-size: 15px;
    color: ${props => props.theme.colors.secondaryText};
    line-height: 1.65;
  }

  ul li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 11px;
    width: 10px;
    height: 1px;
    background: ${props => props.theme.colors.mutedText};
  }

  a {
    color: ${props => props.theme.colors.accent};
    border-bottom: 1px solid ${props => props.theme.colors.accentBg};
    transition: border-color 0.18s;
    text-decoration: none;
  }

  a:hover {
    border-color: ${props => props.theme.colors.accent};
  }

  @media (max-width: 760px) {
    font-size: 15px;

    h2 {
      font-size: 19px;
    }
  }
`

/* ── TOC sidebar ─────────────────────────────────────────
   .about-toc: sticky top 84px
   ──────────────────────────────────────────────────── */

const AboutTocSidebar = styled.aside`
  position: sticky;
  top: 84px;

  @media (max-width: 880px) {
    position: static;
    top: auto;
  }
`

const TocLabel = styled.p`
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
`

const TocList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 880px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
`

const TocItem = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${props =>
    props.$active ? props.theme.colors.accent : props.theme.colors.secondaryText};
  padding: 4px 0;
  transition: color 0.18s;
  text-decoration: none;
  word-break: keep-all;
  line-height: 1.45;
  cursor: pointer;

  &::before {
    content: "";
    width: ${props => (props.$active ? "16px" : "8px")};
    height: 1px;
    background: ${props =>
      props.$active ? props.theme.colors.accent : props.theme.colors.mutedText};
    flex-shrink: 0;
    transition: all 0.18s;
  }

  &:hover {
    color: ${props => props.theme.colors.accent};
  }

  &:hover::before {
    background: ${props => props.theme.colors.accent};
    width: 16px;
  }

  @media (max-width: 880px) {
    padding: 6px 10px;
    background: ${props => props.theme.colors.background};
    border-radius: 6px;

    &::before {
      display: none;
    }
  }
`

/* ── Component ───────────────────────────────────────── */

const AboutPage = ({ data }) => {
  const aboutPost = data.markdownRemark
  const { author, language } = data.site.siteMetadata

  const [toc, setToc] = useState([])
  const [activeId, setActiveId] = useState("")
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!useAbout || !bodyRef.current) return
    const headings = Array.from(bodyRef.current.querySelectorAll("h2"))
    setToc(
      headings.map(h => ({
        id: h.id || h.textContent.replace(/\s+/g, "-").toLowerCase(),
        text: h.textContent,
      }))
    )
    headings.forEach(h => {
      if (!h.id)
        h.id = h.textContent.replace(/\s+/g, "-").toLowerCase()
    })
  }, [aboutPost?.html])

  useEffect(() => {
    if (!useAbout) return
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120
      let currentId = ""
      toc.forEach(item => {
        const el = document.getElementById(item.id)
        if (el && el.offsetTop <= scrollPos) currentId = item.id
      })
      setActiveId(currentId)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [toc])

  if (!useAbout) return <NotFoundPage />

  const scrollTo = id => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" })
  }

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />
      <Info author={author} language={language} />

      <AboutLayout>
        <AboutBodyWrap>
          <AboutBody
            ref={bodyRef}
            dangerouslySetInnerHTML={{ __html: aboutPost.html }}
          />
        </AboutBodyWrap>

        {toc.length > 0 && (
          <AboutTocSidebar>
            <TocLabel>/ contents</TocLabel>
            <TocList>
              {toc.map(item => (
                <TocItem
                  key={item.id}
                  $active={activeId === item.id}
                  href={`#${item.id}`}
                  onClick={e => {
                    e.preventDefault()
                    scrollTo(item.id)
                  }}
                >
                  {item.text}
                </TocItem>
              ))}
            </TocList>
          </AboutTocSidebar>
        )}
      </AboutLayout>
    </Layout>
  )
}

export default AboutPage

export const pageQuery = graphql`
  query {
    markdownRemark(frontmatter: { title: { eq: "README" } }) {
      html
      frontmatter {
        title
      }
    }
    site {
      siteMetadata {
        title
        language
        author {
          name
          bio {
            role
            description
            thumbnail
          }
        }
        links {
          github
          linkedIn
          email
        }
      }
    }
  }
`

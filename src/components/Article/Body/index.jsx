import React, { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import styled from "styled-components"

import useOffsetTop from "hooks/useOffsetTop"

import Toc from "./Toc"
import StyledMarkdown from "./StyledMarkdown"
import PrismTheme from "./PrismTheme"

const Wrapper = styled.div`
  position: relative;
  margin-bottom: 112px;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`

const getMermaidConfig = isDark => ({
  startOnLoad: false,
  theme: "base",
  themeVariables: isDark
    ? {
        primaryColor: "#2d333b",
        primaryTextColor: "#e6edf3",
        primaryBorderColor: "#444c56",
        lineColor: "#768390",
        secondaryColor: "#373e47",
        tertiaryColor: "#2d333b",
        noteBkgColor: "#3d4148",
        noteTextColor: "#e6edf3",
        noteBorderColor: "#444c56",
        actorBkg: "#2d333b",
        actorTextColor: "#e6edf3",
        actorBorder: "#444c56",
        actorLineColor: "#768390",
        signalColor: "#e6edf3",
        signalTextColor: "#e6edf3",
        labelBoxBkgColor: "#3d4148",
        labelBoxBorderColor: "#444c56",
        labelTextColor: "#e6edf3",
        loopTextColor: "#e6edf3",
        activationBorderColor: "#444c56",
        activationBkgColor: "#373e47",
        sequenceNumberColor: "#e6edf3",
      }
    : {
        primaryColor: "#f0f4f8",
        primaryTextColor: "#1a1a1a",
        primaryBorderColor: "#d0d7de",
        lineColor: "#656d76",
        secondaryColor: "#eaeef2",
        tertiaryColor: "#f6f8fa",
        noteBkgColor: "#fff8c5",
        noteTextColor: "#1a1a1a",
        noteBorderColor: "#d4a72c",
      },
})

const Body = ({ html }) => {
  const [toc, setToc] = useState([])
  const theme = useSelector(state => state.theme.theme)
  const mermaidSources = useRef([])

  const [ref, offsetTop] = useOffsetTop()

  useEffect(() => {
    setToc(
      Array.from(
        document.querySelectorAll("#article-body > h2, #article-body > h3")
      )
    )

    // 최초 1회: code block → placeholder div로 교체하면서 소스 저장
    const codeBlocks = document.querySelectorAll(
      '#article-body pre > code[class="language-mermaid"]'
    )
    if (codeBlocks.length > 0) {
      const sources = []
      codeBlocks.forEach((cb, i) => {
        const pre = cb.parentElement
        const source = cb.textContent
        sources.push(source)

        const placeholder = document.createElement("div")
        placeholder.className = "mermaid-placeholder"
        placeholder.dataset.index = i
        pre.parentElement.replaceChild(placeholder, pre)
      })
      mermaidSources.current = sources
    }
  }, [])

  useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidSources.current.length === 0) return

      const mermaid = (await import("mermaid")).default
      mermaid.initialize(getMermaidConfig(theme === "dark"))

      const placeholders = document.querySelectorAll(
        "#article-body .mermaid-placeholder"
      )

      for (const placeholder of placeholders) {
        const idx = parseInt(placeholder.dataset.index, 10)
        const source = mermaidSources.current[idx]
        if (!source) continue

        const id = `mermaid-${idx}-${Date.now()}`
        const { svg } = await mermaid.render(id, source)
        placeholder.innerHTML = svg
      }
    }

    renderMermaid()
  }, [theme])

  return (
    <Wrapper>
      <Toc items={toc} articleOffset={offsetTop} />

      <PrismTheme />

      <StyledMarkdown
        id="article-body"
        dangerouslySetInnerHTML={{ __html: html }}
        itemProp="articleBody"
        ref={ref}
      />
    </Wrapper>
  )
}

export default Body

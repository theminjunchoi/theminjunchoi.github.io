import React, { useState, useEffect } from "react"
import styled, { css } from "styled-components"

import useScroll from "hooks/useScroll"

import getElementOffset from "utils/getElmentOffset"

import RevealOnScroll from "components/RevealOnScroll"

const STICK_OFFSET = 100

const TocWrapper = styled.div`
  position: absolute;
  opacity: 1;
  left: 100%;

  & > div {
    padding-right: 20px;
    padding-left: 16px;
    margin-left: 48px;
    position: relative;
    width: 240px;
    max-height: calc(100% - 185px);
    overflow-y: auto;

    ::-webkit-scrollbar {
      width: 3px;
    }
    ::-webkit-scrollbar-track {
      background: ${props => props.theme.colors.scrollTrack};
    }

    ::-webkit-scrollbar-thumb {
      background: ${props => props.theme.colors.scrollHandle};
    }

    ${props =>
      props.stick &&
      css`
        position: fixed;
        top: ${STICK_OFFSET}px;
      `}
  }

  @media (max-width: ${props => props.theme.bp.toc}) {
    display: None;
  }
`

const ParagraphTitle = styled.div`
  margin-bottom: ${props => props.theme.space[2]};
  padding-left: ${props => (props.subtitle ? 19.2 : 0)}px;
  font-size: ${props => props.theme.font.md};
  color: ${props => props.theme.colors.mutedText};
  line-height: 1.3;
  transition: all ${props => props.theme.transition.fast};

  ${props =>
    props.active &&
    css`
      transform: translate(-11.2px, 0);
      color: ${props => props.theme.colors.accentText};
    `}

  &:hover {
    color: ${props => props.theme.colors.accent};
    cursor: pointer;
  }
`

const Toc = ({ items, articleOffset }) => {
  const { y } = useScroll()

  const [revealAt, setRevealAt] = useState(Infinity)
  const [headers, setHeaders] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    setHeaders(
      [
        ...document.querySelectorAll("#article-body > h2, #article-body > h3"),
      ].map(element => getElementOffset(element).top)
    )
  }, [])

  useEffect(() => {
    headers.forEach((header, i) => {
      if (header - 300 < y) {
        setActive(i)
        return
      }
    })
  }, [y])

  const handleClickTitle = index => {
    window.scrollTo({ top: headers[index] - 100 })
  }

  return (
    <RevealOnScroll revealAt={revealAt} reverse>
      <TocWrapper stick={y > articleOffset - STICK_OFFSET}>
        <div>
          {items.map((item, i) => (
            <ParagraphTitle
              key={i}
              data-clickable
              subtitle={item.tagName === "H3"}
              active={i === active}
              onClick={() => handleClickTitle(i)}
            >
              {item.innerText}
            </ParagraphTitle>
          ))}
        </div>
      </TocWrapper>
    </RevealOnScroll>
  )
}

export default Toc

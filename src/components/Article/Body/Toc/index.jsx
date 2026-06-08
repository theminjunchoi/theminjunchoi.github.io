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

const TocLabel = styled.div`
  margin-bottom: ${props => props.theme.space[3]};
  padding-left: ${props => props.theme.space[4]};
  font-size: ${props => props.theme.font.xs};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${props => props.theme.colors.mutedText};
`

const TocList = styled.div`
  position: relative;
  border-left: 2px solid ${props => props.theme.colors.border};
`

const ParagraphTitle = styled.div`
  position: relative;
  margin-left: -2px;
  padding: ${props => props.theme.space[1]} 0;
  padding-left: ${props => (props.subtitle ? 28 : 16)}px;
  border-left: 2px solid transparent;
  font-size: ${props => (props.subtitle ? "13px" : "14px")};
  color: ${props => props.theme.colors.mutedText};
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color ${props => props.theme.transition.fast},
    border-color ${props => props.theme.transition.base};

  ${props =>
    props.reached &&
    css`
      border-left-color: ${props => props.theme.colors.accent};
    `}

  ${props =>
    props.active &&
    css`
      color: ${props => props.theme.colors.accentText};
      font-weight: 600;
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
          <TocLabel>목차</TocLabel>
          <TocList>
            {items.map((item, i) => (
              <ParagraphTitle
                key={i}
                data-clickable
                subtitle={item.tagName === "H3"}
                active={i === active}
                reached={i <= active}
                title={item.innerText}
                onClick={() => handleClickTitle(i)}
              >
                {item.innerText}
              </ParagraphTitle>
            ))}
          </TocList>
        </div>
      </TocWrapper>
    </RevealOnScroll>
  )
}

export default Toc

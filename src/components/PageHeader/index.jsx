import React from "react"
import styled from "styled-components"

/* Shared page header (eyebrow + title + optional counter).
   Used by /posts and /series. */

const PageHd = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: ${props => props.theme.space[16]} 0 ${props => props.theme.space[8]};
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-bottom: ${props => props.$mb || "0"};
`

const PageEyebrow = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.sm};
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const PageTitle = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: ${props => props.theme.font.titlePage};
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  margin-top: 2px;
`

const PageCounter = styled.p`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.tertiaryText};
  margin-top: ${props => props.theme.space[3]};
`

const PageHeader = ({ eyebrow, title, counter, mb }) => (
  <PageHd $mb={mb}>
    {eyebrow && <PageEyebrow>{eyebrow}</PageEyebrow>}
    <PageTitle>{title}</PageTitle>
    {counter != null && <PageCounter>{counter}</PageCounter>}
  </PageHd>
)

export default PageHeader

import React from "react"
import styled from "styled-components"

const PostHd = styled.div`
  padding: 64px 0 36px;
`

const PostEyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 16px;
`

const PostTitle = styled.h1`
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.028em;
  color: ${props => props.theme.colors.text};
  word-break: keep-all;
  margin-bottom: 24px;
`

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.tertiaryText};
  padding-bottom: 28px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const MetaLabel = styled.span`
  color: ${props => props.theme.colors.mutedText};
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10.5px;
`

const MetaValue = styled.span`
  color: ${props => props.theme.colors.secondaryText};
`

const Header = ({ title, date, tags, minToRead, updated }) => {
  return (
    <PostHd>
      {tags && tags.length > 0 && (
        <PostEyebrow>
          {tags.join(" · ")}
        </PostEyebrow>
      )}

      <PostTitle>{title}</PostTitle>

      <PostMeta>
        <MetaItem>
          <MetaLabel>date</MetaLabel>
          <MetaValue>{date}</MetaValue>
        </MetaItem>
        {updated && (
          <MetaItem>
            <MetaLabel>updated</MetaLabel>
            <MetaValue>{updated}</MetaValue>
          </MetaItem>
        )}
        {minToRead && (
          <MetaItem>
            <MetaLabel>read</MetaLabel>
            <MetaValue>{minToRead} min</MetaValue>
          </MetaItem>
        )}
      </PostMeta>
    </PostHd>
  )
}

export default Header

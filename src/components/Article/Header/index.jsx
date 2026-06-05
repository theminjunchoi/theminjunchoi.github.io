import React from "react"
import styled from "styled-components"

const PostHd = styled.div`
  padding: ${props => props.theme.space[16]} 0 ${props => props.theme.space[9]};
`

const PostEyebrow = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: ${props => props.theme.space[4]};
`

const PostTitle = styled.h1`
  font-size: ${props => props.theme.font.titlePost};
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.028em;
  color: ${props => props.theme.colors.text};
  word-break: keep-all;
  margin-bottom: ${props => props.theme.space[6]};
`

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.tertiaryText};
  padding-bottom: ${props => props.theme.space[7]};
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
  font-size: ${props => props.theme.font.xs};
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

import React from "react"
import _ from "lodash"
import styled from "styled-components"
import { Link } from "gatsby"
import { cardTitleHover } from "assets/theme/mixins"

/* Year-grouped archive rows. Shared between the home page and /posts. */

const YearBlock = styled.section`
  margin-bottom: ${props => props.theme.space[11]};

  &:last-child {
    margin-bottom: 0;
  }
`

const YearHead = styled.header`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: ${props => props.theme.space[3]};
  margin-bottom: 6px;
`

const YearNum = styled.span`
  font-family: "Inter Tight", "Noto Sans KR", sans-serif;
  font-size: ${props => props.theme.font.h2};
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.text};
`

const YearCount = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const YearLine = styled.span`
  height: 1px;
  background: ${props => props.theme.colors.divider};
`

const Row = styled(Link)`
  display: grid;
  grid-template-columns: 56px 1fr auto 20px;
  align-items: center;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  text-decoration: none;
  transition: all ${props => props.theme.transition.base};

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: ${props => props.theme.bp.md}) {
    grid-template-columns: 50px 1fr 16px;
    gap: 12px;
  }
`

const RowDate = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.04em;
`

const RowTitle = styled.span`
  font-size: ${props => props.theme.font.lg};
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  line-height: 1.45;
  letter-spacing: -0.005em;
  word-break: keep-all;
  ${cardTitleHover(Row)}
`

const RowTags = styled.span`
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  @media (max-width: ${props => props.theme.bp.md}) {
    display: none;
  }
`

const RowTag = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  font-weight: 500;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: lowercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: ${props => props.theme.radius.xs};
  background: ${props => props.theme.colors.background};
`

const RowArrow = styled.span`
  font-size: ${props => props.theme.font.md};
  color: ${props => props.theme.colors.mutedText};
  transition: all ${props => props.theme.transition.fast};

  ${Row}:hover & {
    color: ${props => props.theme.colors.accent};
    transform: translateX(4px);
  }
`

const toShortDate = dateStr => {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}.${day}`
}

const ArchiveList = ({ posts, getDate = post => post.frontmatter.date }) => {
  const postsByYear = _.groupBy(posts, post =>
    new Date(getDate(post)).getFullYear()
  )
  const years = Object.keys(postsByYear).sort((a, b) => b - a)

  return (
    <div>
      {years.map(year => {
        const yearPosts = postsByYear[year]
        return (
          <YearBlock key={year}>
            <YearHead>
              <YearNum>{year}</YearNum>
              <YearCount>{yearPosts.length} posts</YearCount>
              <YearLine />
            </YearHead>
            <div>
              {yearPosts.map(post => {
                const { title: postTitle, tags: postTags } = post.frontmatter
                const { slug } = post.fields
                return (
                  <Row key={slug} to={slug}>
                    <RowDate>{toShortDate(getDate(post))}</RowDate>
                    <RowTitle>{postTitle}</RowTitle>
                    <RowTags>
                      {(postTags || []).slice(0, 3).map(tag => (
                        <RowTag key={tag}>{tag}</RowTag>
                      ))}
                    </RowTags>
                    <RowArrow aria-hidden="true">→</RowArrow>
                  </Row>
                )
              })}
            </div>
          </YearBlock>
        )
      })}
    </div>
  )
}

export default ArchiveList

import React from "react"
import { graphql, Link } from "gatsby"

import styled from "styled-components"
import _ from "lodash"

import Layout from "components/Layout"
import SEO from "components/SEO"

import { description, siteUrl } from "../../gatsby-meta-config"

/* ── Page header ─────────────────────────────────────── */

const PageHd = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 64px 0 32px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-bottom: 36px;

  @media (max-width: 760px) {
    padding: 44px 0 24px;
  }
`

const PageEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11.5px;
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`


const PageTitle = styled.h1`
  font-family: "Noto Sans KR", sans-serif;
  font-size: clamp(32px, 4.2vw, 44px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  margin-top: 2px;
  word-break: keep-all;
`

const PageCounter = styled.p`
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.tertiaryText};
  margin-top: 12px;
  letter-spacing: 0.04em;
`

/* ── Year-grouped archive (same as posts page) ───────── */

const YearBlock = styled.section`
  margin-bottom: 44px;

  &:last-child {
    margin-bottom: 0;
  }
`

const YearHead = styled.header`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`

const YearNum = styled.span`
  font-family: "Noto Sans KR", sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.text};
`

const YearCount = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
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
  transition: all 0.22s;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 720px) {
    grid-template-columns: 50px 1fr 16px;
    gap: 12px;
  }
`

const RowDate = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 11.5px;
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.04em;
`

const RowTitle = styled.span`
  font-size: 14.5px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  line-height: 1.45;
  letter-spacing: -0.005em;
  word-break: keep-all;
  transition: color 0.18s;

  ${Row}:hover & {
    color: ${props => props.theme.colors.accent};
  }
`

const RowTags = styled.span`
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  @media (max-width: 720px) {
    display: none;
  }
`

const RowTag = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: lowercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 4px;
  background: ${props => props.theme.colors.background};
`

const RowArrow = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.mutedText};
  transition: all 0.18s;

  ${Row}:hover & {
    color: ${props => props.theme.colors.accent};
    transform: translateX(4px);
  }
`

/* ── Helpers ─────────────────────────────────────────── */

const toShortDate = dateStr => {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}.${day}`
}

const toYear = dateStr => new Date(dateStr).getFullYear()

/* ── Component ───────────────────────────────────────── */

const Series = ({ pageContext, data }) => {
  const seriesName = pageContext.series
  const posts = data.posts.nodes

  const postsByYear = _.groupBy(posts, post => toYear(post.frontmatter.rawDate))
  const years = Object.keys(postsByYear).sort((a, b) => b - a)

  return (
    <Layout maxWidth="1180px">
      <SEO
        title={`${seriesName} — Series`}
        description={description}
        url={siteUrl}
      />

      <PageHd>
<PageEyebrow>/ series · longform</PageEyebrow>
        <PageTitle>{seriesName}</PageTitle>
        <PageCounter>{posts.length} posts</PageCounter>
      </PageHd>

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
                  const { title: postTitle, rawDate, tags } = post.frontmatter
                  const { slug } = post.fields
                  return (
                    <Row key={slug} to={slug}>
                      <RowDate>{toShortDate(rawDate)}</RowDate>
                      <RowTitle>{postTitle}</RowTitle>
                      <RowTags>
                        {(tags || []).slice(0, 3).map(tag => (
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
    </Layout>
  )
}

export default Series

export const pageQuery = graphql`
  query BlogSeriesBySeriesName($series: String) {
    posts: allMarkdownRemark(
      sort: { order: ASC, fields: [frontmatter___date] }
      filter: { frontmatter: { series: { eq: $series } } }
    ) {
      nodes {
        excerpt(pruneLength: 200, truncate: true)
        fields {
          slug
        }
        frontmatter {
          rawDate: date(formatString: "MMMM DD, YYYY")
          date(formatString: "YYYY년 MM월 DD일")
          updated(formatString: "YYYY년 MM월 DD일")
          title
          tags
        }
      }
    }
  }
`

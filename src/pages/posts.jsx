import React from "react"
import _ from "lodash"
import styled from "styled-components"
import SEO from "components/SEO"
import { graphql, navigate } from "gatsby"
import queryString from "query-string"
import Layout from "components/Layout"
import { Link } from "gatsby"
import { title, description, siteUrl } from "../../gatsby-meta-config"

/* ── Page Header ─────────────────────────────────────── */

const PageHd = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 64px 0 32px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
`

const PageEyebrow = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const PageTitle = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: clamp(32px, 4.2vw, 44px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  margin-top: 2px;
`

const PageCounter = styled.p`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.tertiaryText};
  margin-top: 12px;
`

/* ── Filter Bar ──────────────────────────────────────── */

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 28px 0;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-bottom: 36px;
`

const FilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 8px;
  border: none;
  background: ${props =>
    props.$active ? props.theme.colors.text : props.theme.colors.background};
  color: ${props =>
    props.$active
      ? props.theme.colors.bodyBackground
      : props.theme.colors.secondaryText};
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;

  &:hover {
    background: ${props =>
      props.$active ? props.theme.colors.text : props.theme.colors.divider};
  }
`

/* ── Archive rows (same pattern as index page) ─────── */

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
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.text};
`

const YearCount = styled.span`
  font-family: 'JetBrains Mono', monospace;
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
  font-family: 'JetBrains Mono', monospace;
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
  font-family: 'JetBrains Mono', monospace;
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

/* ── Page ────────────────────────────────────────────── */

const PostsPage = ({ data, location }) => {
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const posts = data.allMarkdownRemark.nodes

  const parsed = queryString.parse(location?.search || "")
  const selectedTag = decodeURIComponent(parsed.q || "")

  const filteredPosts = selectedTag
    ? posts.filter(post => post.frontmatter.tags?.includes(selectedTag))
    : posts

  const postsByYear = _.groupBy(
    filteredPosts,
    post => new Date(post.frontmatter.date).getFullYear()
  )
  const years = Object.keys(postsByYear).sort((a, b) => b - a)

  const handleChip = tag => {
    if (tag) {
      navigate(`/posts?q=${encodeURIComponent(tag)}`)
    } else {
      navigate("/posts")
    }
  }

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />

      <PageHd>
        <PageEyebrow>/ posts · archive</PageEyebrow>
        <PageTitle>모든 글</PageTitle>
        <PageCounter>
          {selectedTag
            ? `#${selectedTag} — ${filteredPosts.length}개의 글`
            : `전체 ${filteredPosts.length}개의 글`}
        </PageCounter>
      </PageHd>

      <FilterBar>
        <FilterChip $active={!selectedTag} onClick={() => handleChip("")}>
          전체
        </FilterChip>
        {tags.map(tag => (
          <FilterChip
            key={tag.fieldValue}
            $active={selectedTag === tag.fieldValue}
            onClick={() => handleChip(tag.fieldValue)}
          >
            {tag.fieldValue}
            <span style={{ opacity: 0.6, fontSize: "11px" }}>
              {tag.totalCount}
            </span>
          </FilterChip>
        ))}
      </FilterBar>

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
                  const { title: postTitle, date, tags: postTags } =
                    post.frontmatter
                  const { slug } = post.fields
                  return (
                    <Row key={slug} to={slug}>
                      <RowDate>{toShortDate(date)}</RowDate>
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
    </Layout>
  )
}

export default PostsPage

export const pageQuery = graphql`
  query PostsPage {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: {frontmatter: {date: DESC}}
      filter: {frontmatter: {publish: {eq: true}}}
    ) {
      group(field: {frontmatter: {tags: SELECT}}) {
        fieldValue
        totalCount
      }
      nodes {
        excerpt(pruneLength: 150, truncate: true)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          updated(formatString: "MMM DD, YYYY")
          title
          description
          tags
        }
      }
    }
  }
`

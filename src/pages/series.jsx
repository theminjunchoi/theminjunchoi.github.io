import React from "react"
import { flow, map, groupBy, sortBy, filter, reverse } from "lodash/fp"
import styled from "styled-components"
import SEO from "components/SEO"
import { graphql, Link, navigate } from "gatsby"
import Layout from "components/Layout"
import PageHeader from "components/PageHeader"
import { title, description, siteUrl } from "../../gatsby-meta-config"
import {
  cardHover,
  cardTitleHover,
  linkHover,
  chipHoverSubtle,
} from "assets/theme/mixins"

/* ── Series List ─────────────────────────────────────── */

const SeriesListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space[5]};
`

/* ── Series Card ─────────────────────────────────────── */

const SeriesCardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: ${props => props.theme.space[8]};
  padding: ${props => props.theme.space[7]} ${props => props.theme.space[8]};
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xxl};
  background: radial-gradient(
      circle at 100% 0%,
      ${props => props.theme.colors.accent}0f,
      transparent 42%
    ),
    ${props => props.theme.colors.bodyBackground};
  position: relative;
  overflow: hidden;
  cursor: pointer;
  ${cardHover}

  @media (max-width: ${props => props.theme.bp.md}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.space[5]};
    padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]};
  }
`

const AccentBar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(
    180deg,
    ${props => props.theme.colors.accent},
    ${props => props.theme.colors.accentBg}
  );
`

const SeriesContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

const SeriesTop = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: ${props => props.theme.space[3]};
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const SeriesIndex = styled.span`
  font-weight: 700;
  color: ${props => props.theme.colors.accent};
`

const SeriesCount = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.colors.accentBg};
  color: ${props => props.theme.colors.accentText};
  font-weight: 600;
`

const SeriesRange = styled.span`
  letter-spacing: 0.06em;
`

const SeriesTitle = styled.h2`
  font-size: ${props => props.theme.font.h1Sm};
  font-weight: 700;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  line-height: 1.25;
  word-break: keep-all;
  margin-bottom: ${props => props.theme.space[3]};
  ${cardTitleHover(SeriesCardWrapper)}
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: ${props => props.theme.space[5]};
`

const Chip = styled(Link)`
  display: inline-block;
  padding: 3px 9px;
  border-radius: ${props => props.theme.radius.sm};
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  background: ${props => props.theme.colors.accentBg};
  letter-spacing: 0.02em;
  text-decoration: none;
  ${chipHoverSubtle}
`

const SeriesCta = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
  padding: 2px 0;
  border-bottom: 1px solid ${props => props.theme.colors.accent};
  margin-top: auto;
  align-self: flex-start;
  transition: opacity ${props => props.theme.transition.fast};

  ${SeriesCardWrapper}:hover & {
    opacity: 0.8;
  }
`

/* ── Series Preview Panel (mini table of contents) ───── */

const SeriesPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space[3]};
  padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]};
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.radius.lg};
  border: 1px solid ${props => props.theme.colors.divider};
`

const SeriesPreviewLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
`

const PreviewItem = styled(Link)`
  display: flex;
  gap: 10px;
  font-size: ${props => props.theme.font.base};
  color: ${props => props.theme.colors.secondaryText};
  text-decoration: none;
  line-height: 1.45;
  word-break: keep-all;
  ${linkHover}
`

const PreviewNum = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.accent};
  font-weight: 600;
  flex-shrink: 0;
  min-width: 20px;
`

const PreviewMore = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.04em;
  margin-top: 2px;
`

/* ── Helpers ─────────────────────────────────────────── */

const toYM = dateStr => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`
}

const rangeLabel = (start, end) => {
  if (!start) return ""
  const s = toYM(start)
  const e = toYM(end)
  return s === e ? s : `${s} – ${e}`
}

const PREVIEW_LIMIT = 3

/* ── Component ───────────────────────────────────────── */

const SeriesCard = ({ series, index }) => {
  const { name, ordered, count, rangeStart, rangeEnd, topTags } = series
  const path = `/series/${name.replace(/\s/g, "-")}`
  const previewPosts = ordered.slice(0, PREVIEW_LIMIT)
  const remaining = count - previewPosts.length

  const handleCardClick = e => {
    if (e.target.closest("a")) return
    navigate(path)
  }

  return (
    <SeriesCardWrapper data-clickable onClick={handleCardClick}>
      <AccentBar />
      <SeriesContent>
        <SeriesTop>
          <SeriesIndex>{String(index + 1).padStart(2, "0")}</SeriesIndex>
          <SeriesCount>{count}편</SeriesCount>
          {rangeStart && <SeriesRange>{rangeLabel(rangeStart, rangeEnd)}</SeriesRange>}
        </SeriesTop>

        <SeriesTitle>{name}</SeriesTitle>

        {topTags.length > 0 && (
          <TagRow>
            {topTags.map(tag => (
              <Chip key={tag} to={`/posts?q=${encodeURIComponent(tag)}`}>
                {tag}
              </Chip>
            ))}
          </TagRow>
        )}

        <SeriesCta>시리즈 보기 →</SeriesCta>
      </SeriesContent>

      <SeriesPreview>
        <SeriesPreviewLabel>글 목록 ({count})</SeriesPreviewLabel>
        {previewPosts.map((post, i) => (
          <PreviewItem key={post.slug} to={post.slug}>
            <PreviewNum>{String(i + 1).padStart(2, "0")}</PreviewNum>
            <span>{post.title}</span>
          </PreviewItem>
        ))}
        {remaining > 0 && <PreviewMore>+{remaining}편 더 →</PreviewMore>}
      </SeriesPreview>
    </SeriesCardWrapper>
  )
}

const SeriesPage = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const seriesList = flow(
    map(post => ({ ...post.frontmatter, slug: post.fields.slug })),
    groupBy("series"),
    map(seriesPosts => {
      const ordered = [...seriesPosts].sort(
        (a, b) => new Date(a.rawDate) - new Date(b.rawDate)
      )
      const dates = ordered.map(p => p.rawDate).filter(Boolean)
      const tagCounts = {}
      ordered.forEach(p =>
        (p.tags || []).forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + 1
        })
      )
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag)

      return {
        name: seriesPosts[0].series,
        ordered,
        count: seriesPosts.length,
        rangeStart: dates[0],
        rangeEnd: dates[dates.length - 1],
        topTags,
      }
    }),
    filter(s => s.name),
    sortBy(s => new Date(s.rangeEnd)),
    reverse
  )(posts)

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />

      <PageHeader
        eyebrow="/ series · longform"
        title="시리즈"
        counter={`${seriesList.length} series`}
        mb="40px"
      />

      <SeriesListWrapper>
        {seriesList.map((series, i) => (
          <SeriesCard key={series.name} series={series} index={i} />
        ))}
      </SeriesListWrapper>
    </Layout>
  )
}

export default SeriesPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
      nodes {
        excerpt(pruneLength: 150, truncate: true)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "YYYY년 MM월 DD일 HH:MM")
          rawDate: date(formatString: "YYYY-MM-DD")
          updated(formatString: "YYYY년 MM월 DD일 HH:MM")
          title
          tags
          series
        }
      }
    }
  }
`
